import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';
import { buildRoadmap, computeProgress, deriveRoadmapInputs, flattenTasks, withCompletion } from '../domain/roadmap.js';
import { courseView, journeyView, phasesView, progressView } from '../api/serializers.js';
import {
  loadCourse,
  loadCourses,
  loadInterestIds,
  loadJob,
  loadProfileRow,
  loadScoreMap,
  loadSkillMap,
  toProfile
} from './catalogue.js';

export async function getJourney(db, userId) {
  const row = await db.prepare('SELECT * FROM journeys WHERE user_id = ?').get(userId);
  return { started: Boolean(row?.started), targetJobId: row?.target_job_id ?? null };
}

export async function setTarget(db, userId, jobId) {
  const job = await loadJob(db, jobId);
  if (!job) throw new AppError(404, 'CAREER_NOT_FOUND', `Unknown career '${jobId}'.`);

  const existing = await db.prepare('SELECT target_job_id FROM journeys WHERE user_id = ?').get(userId);
  const changed = !existing || existing.target_job_id !== jobId;

  await transaction(db, async tx => {
    await tx.prepare(`
      INSERT INTO journeys(user_id, started, target_job_id) VALUES(?, 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET started = 1, target_job_id = excluded.target_job_id,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, jobId);

    if (changed) {
      await tx.prepare('DELETE FROM roadmaps WHERE user_id = ?').run(userId);
      await tx.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
      await tx.prepare('DELETE FROM user_courses WHERE user_id = ?').run(userId);
    }
  });

  return { journey: await getJourneyState(db, userId), targetJobId: jobId, invalidated: changed, targetTitle: job.title };
}

export async function listSavedCourseIds(db, userId) {
  return (await db.prepare(`
    SELECT course_id FROM user_courses WHERE user_id = ? ORDER BY added_at
  `).all(userId)).map(row => row.course_id);
}

export async function listSavedCourses(db, userId) {
  const saved = new Set(await listSavedCourseIds(db, userId));
  return loadCourses(db).filter(course => saved.has(course.id)).map(courseView);
}

export async function addCourse(db, userId, courseId) {
  const course = await loadCourse(db, courseId);
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', `Unknown course '${courseId}'.`);
  if (!(await getJourney(db, userId)).targetJobId) {
    throw new AppError(409, 'TARGET_REQUIRED', 'Choose a target career before adding training pathways.');
  }
  const roadmapRow = await db.prepare('SELECT course_ids_json FROM roadmaps WHERE user_id = ?').get(userId);
  if (parseIds(roadmapRow?.course_ids_json)?.includes(courseId)) {
    throw new AppError(409, 'COURSE_ALREADY_SAVED', `Course '${courseId}' is already in your roadmap.`);
  }

  const result = await db.prepare('INSERT INTO user_courses(user_id, course_id) VALUES(?, ?) ON CONFLICT DO NOTHING')
    .run(userId, courseId);
  if (result.changes === 0) {
    throw new AppError(409, 'COURSE_ALREADY_SAVED', `Course '${courseId}' is already saved.`);
  }
  return courseView(course);
}

export async function removeCourse(db, userId, courseId) {
  if (!await loadCourse(db, courseId)) throw new AppError(404, 'COURSE_NOT_FOUND', `Unknown course '${courseId}'.`);
  await db.prepare('DELETE FROM user_courses WHERE user_id = ? AND course_id = ?').run(userId, courseId);
}

async function roadmapContext(db, userId, job) {
  const [scores, skillMap, profileRow, savedCourseIds] = await Promise.all([
    loadScoreMap(db, userId),
    loadSkillMap(db),
    loadProfileRow(db, userId),
    listSavedCourseIds(db, userId)
  ]);
  return {
    job,
    scoreFor: skillId => scores[skillId] ?? 0,
    skillNameFor: skillId => skillMap.get(skillId)?.name ?? skillId,
    profile: toProfile(profileRow),
    courses: loadCourses(db),
    savedCourseIds
  };
}

function parseIds(json) {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter(id => typeof id === 'string') : null;
  } catch {
    return null;
  }
}

async function storedSnapshot(db, userId, row, context) {
  const skillIds = parseIds(row.skill_ids_json);
  const courseIds = parseIds(row.course_ids_json);
  if (skillIds && courseIds) return { skillIds, courseIds };

  // Rows generated before snapshots existed are frozen on first read.
  const snapshot = deriveRoadmapInputs(context);
  await db.prepare('UPDATE roadmaps SET skill_ids_json = ?, course_ids_json = ? WHERE user_id = ?')
    .run(JSON.stringify(snapshot.skillIds), JSON.stringify(snapshot.courseIds), userId);
  return snapshot;
}

async function pruneCompletions(db, userId, taskIds) {
  if (!taskIds.length) {
    await db.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
    return;
  }
  const placeholders = taskIds.map(() => '?').join(',');
  await db.prepare(`DELETE FROM task_completions WHERE user_id = ? AND task_id NOT IN (${placeholders})`)
    .run(userId, ...taskIds);
}

export async function getRoadmap(db, userId) {
  const row = await db.prepare('SELECT * FROM roadmaps WHERE user_id = ?').get(userId);
  if (!row) return null;

  const job = await loadJob(db, row.target_job_id);
  if (!job) return null;

  const context = await roadmapContext(db, userId, job);
  const snapshot = await storedSnapshot(db, userId, row, context);
  const phases = buildRoadmap({ ...context, weeklyHours: row.weekly_hours, snapshot });
  const taskIds = flattenTasks(phases).map(task => task.id);
  await pruneCompletions(db, userId, taskIds);

  const completed = new Set(
    (await db.prepare('SELECT task_id FROM task_completions WHERE user_id = ?').all(userId)).map(task => task.task_id)
  );
  const courseById = new Map(context.courses.map(course => [course.id, course]));
  const shapedPhases = phasesView(withCompletion(phases, completed), courseById);

  return {
    roadmap: {
      targetJobId: row.target_job_id,
      targetTitle: job.title,
      weeklyHours: row.weekly_hours,
      startDate: row.start_date,
      generatedAt: row.generated_at,
      skillIds: snapshot.skillIds,
      courseIds: snapshot.courseIds
    },
    phases: shapedPhases,
    progress: progressView(computeProgress(phases, completed), shapedPhases)
  };
}

export async function getJourneyState(db, userId, roadmapState) {
  const resolvedRoadmap = roadmapState === undefined ? await getRoadmap(db, userId) : roadmapState;
  const [journey, profileRow, interests, added] = await Promise.all([
    getJourney(db, userId),
    loadProfileRow(db, userId),
    loadInterestIds(db, userId),
    listSavedCourseIds(db, userId)
  ]);
  return journeyView({
    journey,
    profile: toProfile(profileRow),
    interests,
    roadmap: resolvedRoadmap?.roadmap ?? null,
    added,
    completed: resolvedRoadmap ? flattenTasks(resolvedRoadmap.phases).filter(task => task.completed).map(task => task.id) : []
  });
}

export async function generateRoadmap(db, userId, { weeklyHours, startDate = null }) {
  const journey = await getJourney(db, userId);
  if (!journey.targetJobId) {
    throw new AppError(409, 'TARGET_REQUIRED', 'Choose a target career before generating a roadmap.');
  }

  const job = await loadJob(db, journey.targetJobId);
  if (!job) throw new AppError(409, 'TARGET_REQUIRED', 'Your target career is no longer available.');

  const context = await roadmapContext(db, userId, job);
  const snapshot = deriveRoadmapInputs(context);
  const phases = buildRoadmap({ ...context, weeklyHours, snapshot });
  const taskIds = flattenTasks(phases).map(task => task.id);

  await transaction(db, async tx => {
    await tx.prepare(`
      INSERT INTO roadmaps(user_id, target_job_id, weekly_hours, start_date, skill_ids_json, course_ids_json)
      VALUES(?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET target_job_id = excluded.target_job_id,
        weekly_hours = excluded.weekly_hours, start_date = excluded.start_date,
        skill_ids_json = excluded.skill_ids_json, course_ids_json = excluded.course_ids_json,
        generated_at = CURRENT_TIMESTAMP
    `).run(userId, job.id, weeklyHours, startDate, JSON.stringify(snapshot.skillIds), JSON.stringify(snapshot.courseIds));

    await tx.prepare('UPDATE profiles SET weekly_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(weeklyHours, userId);

    await pruneCompletions(tx, userId, taskIds);
  });

  return getRoadmap(db, userId);
}

export async function setTaskCompletion(db, userId, taskId, completed) {
  const state = await getRoadmap(db, userId);
  if (!state) {
    throw new AppError(409, 'ROADMAP_REQUIRED', 'Generate a roadmap before updating tasks.');
  }

  const validIds = new Set(flattenTasks(state.phases).map(task => task.id));
  if (!validIds.has(taskId)) {
    throw new AppError(404, 'TASK_NOT_FOUND', `Unknown task '${taskId}'.`);
  }

  if (completed) {
    await db.prepare('INSERT INTO task_completions(user_id, task_id) VALUES(?, ?) ON CONFLICT DO NOTHING')
      .run(userId, taskId);
  } else {
    await db.prepare('DELETE FROM task_completions WHERE user_id = ? AND task_id = ?').run(userId, taskId);
  }

  const refreshed = await getRoadmap(db, userId);
  return { taskId, completed, progress: refreshed.progress };
}

export async function resetProgress(db, userId) {
  const state = await getRoadmap(db, userId);
  if (!state) {
    throw new AppError(409, 'ROADMAP_REQUIRED', 'Generate a roadmap before resetting progress.');
  }
  await db.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
  return (await getRoadmap(db, userId)).progress;
}

export async function clearJourney(db, userId) {
  await transaction(db, async tx => {
    await tx.prepare('UPDATE journeys SET target_job_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(userId);
    await tx.prepare('DELETE FROM roadmaps WHERE user_id = ?').run(userId);
    await tx.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
    await tx.prepare('DELETE FROM user_courses WHERE user_id = ?').run(userId);
  });
  return getJourney(db, userId);
}

export async function deleteUser(db, userId) {
  const result = await db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  if (result.changes === 0) throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
}
