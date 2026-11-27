import { getCourseCatalogue } from './course-catalogue.js';

export async function loadSkillList(db) {
  return (await db.prepare('SELECT id, name, category, description FROM skills ORDER BY name').all())
    .map(row => ({ id: row.id, name: row.name, category: row.category, description: row.description }));
}

export async function loadSkillMap(db) {
  return new Map((await loadSkillList(db)).map(skill => [skill.id, skill]));
}

export async function loadInterestList(db) {
  return (await db.prepare('SELECT id, label FROM interests ORDER BY label').all())
    .map(row => ({ id: row.id, label: row.label }));
}

export async function loadInterestIds(db, userId) {
  return (await db.prepare(`
    SELECT pi.interest_id FROM profile_interests pi
    JOIN interests i ON i.id = pi.interest_id
    WHERE pi.user_id = ?
    ORDER BY i.label
  `).all(userId)).map(row => row.interest_id);
}

export async function loadProfileRow(db, userId) {
  return (await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId)) ?? null;
}

export function toProfile(row) {
  if (!row) return null;
  return {
    name: row.name,
    headline: row.headline,
    mbti: row.mbti,
    holland: row.holland_codes_json === null || row.holland_codes_json === undefined
      ? null
      : JSON.parse(row.holland_codes_json),
    qualification: row.qualification,
    fieldOfStudy: row.field_of_study,
    location: row.location,
    experience: row.experience,
    projects: row.projects,
    budget: row.budget,
    weeklyHours: row.weekly_hours,
    learningMode: row.learning_mode,
    updatedAt: row.updated_at
  };
}

export async function loadScoreMap(db, userId) {
  const map = {};
  const rows = await db.prepare('SELECT skill_id, evidence_level FROM profile_skills WHERE user_id = ?').all(userId);
  for (const row of rows) map[row.skill_id] = row.evidence_level;
  return map;
}

const groupBy = (rows, key) => rows.reduce((acc, row) => {
  (acc[row[key]] ??= []).push(row);
  return acc;
}, {});

export async function loadJobs(db) {
  const [jobs, requirementRows, tagRows, responsibilityRows, progressionRows, projectRows] = await Promise.all([
    db.prepare('SELECT * FROM jobs ORDER BY title').all(),
    db.prepare('SELECT * FROM job_requirements').all(),
    db.prepare('SELECT * FROM job_tags').all(),
    db.prepare('SELECT * FROM job_responsibilities ORDER BY job_id, position').all(),
    db.prepare('SELECT * FROM job_progression ORDER BY job_id, position').all(),
    db.prepare('SELECT * FROM job_projects ORDER BY job_id, position').all()
  ]);
  const requirements = groupBy(requirementRows, 'job_id');
  const tags = groupBy(tagRows, 'job_id');
  const responsibilities = groupBy(responsibilityRows, 'job_id');
  const progression = groupBy(progressionRows, 'job_id');
  const projects = groupBy(projectRows, 'job_id');

  return jobs.map(job => ({
    id: job.id,
    title: job.title,
    category: job.category,
    sector: job.sector,
    icon: job.icon,
    summary: job.summary,
    qualification: job.qualification,
    requirements: (requirements[job.id] ?? []).map(row => ({
      skillId: row.skill_id,
      level: row.level,
      weight: row.weight
    })),
    tags: (tags[job.id] ?? []).map(row => row.interest_id),
    responsibilities: (responsibilities[job.id] ?? []).map(row => row.text),
    progression: (progression[job.id] ?? []).map(row => row.title),
    projects: (projects[job.id] ?? []).map(row => row.brief)
  }));
}

export async function loadJob(db, jobId) {
  const all = await loadJobs(db);
  return all.find(job => job.id === jobId) ?? null;
}

// Courses live in Supabase and are held in memory by course-catalogue.js (the `db` argument is
// kept so existing callers do not change).
export function loadCourses(_db) {
  return getCourseCatalogue().courses;
}

export function loadCourse(_db, courseId) {
  return getCourseCatalogue().courses.find(course => course.id === courseId) ?? null;
}

export function loadProviders(_db) {
  return [...getCourseCatalogue().providers].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
