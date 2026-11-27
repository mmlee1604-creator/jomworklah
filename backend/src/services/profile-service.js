import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';
import {
  loadInterestIds,
  loadInterestList,
  loadProfileRow,
  toProfile
} from './catalogue.js';
import { getJourneyState, getRoadmap } from './journey-service.js';
import { profileView, roadmapSnapshotView } from '../api/serializers.js';

const profileColumns = {
  name: 'name',
  headline: 'headline',
  mbti: 'mbti',
  holland: 'holland_codes_json',
  qualification: 'qualification',
  fieldOfStudy: 'field_of_study',
  location: 'location',
  experience: 'experience',
  projects: 'projects',
  budget: 'budget',
  weeklyHours: 'weekly_hours',
  learningMode: 'learning_mode'
};

export async function getProfile(db, userId) {
  const row = await loadProfileRow(db, userId);
  if (!row) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  return toProfile(row);
}

export async function updateProfile(db, userId, patch) {
  const entries = Object.entries(patch).filter(([key]) => key in profileColumns);
  if (entries.length) {
    const assignments = entries.map(([key]) => `${profileColumns[key]} = ?`);
    const values = entries.map(([key, value]) => key === 'holland' ? JSON.stringify(value) : value);
    await db.prepare(`
      UPDATE profiles SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(...values, userId);
  }
  return getProfileState(db, userId);
}

export async function getSkills(db, userId) {
  return (await db.prepare(`
    SELECT s.id, s.name, s.category, s.description, COALESCE(ps.evidence_level, 0) AS "evidenceLevel"
    FROM skills s
    LEFT JOIN profile_skills ps ON ps.skill_id = s.id AND ps.user_id = ?
    ORDER BY s.name
  `).all(userId)).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    evidenceLevel: row.evidenceLevel
  }));
}

async function assertKnownSkills(db, skillIds) {
  const known = new Set((await db.prepare('SELECT id FROM skills').all()).map(row => row.id));
  const unknown = skillIds.filter(id => !known.has(id));
  if (unknown.length) {
    throw new AppError(400, 'VALIDATION_ERROR', `Unknown skill id(s): ${unknown.join(', ')}.`,
      unknown.map(id => ({ path: `scores.${id}`, message: 'Unknown skill id' })));
  }
}

const upsertSkill = db => db.prepare(`
  INSERT INTO profile_skills(user_id, skill_id, evidence_level) VALUES(?, ?, ?)
  ON CONFLICT(user_id, skill_id) DO UPDATE SET evidence_level = excluded.evidence_level,
    updated_at = CURRENT_TIMESTAMP
`);

export async function setSkills(db, userId, scores) {
  const entries = Object.entries(scores);
  await assertKnownSkills(db, entries.map(([skillId]) => skillId));

  await transaction(db, async tx => {
    const stmt = upsertSkill(tx);
    for (const [skillId, level] of entries) await stmt.run(userId, skillId, level);
  });

  return getSkills(db, userId);
}

export async function setSkill(db, userId, skillId, level) {
  await assertKnownSkills(db, [skillId]);
  await upsertSkill(db).run(userId, skillId, level);
  const skill = (await getSkills(db, userId)).find(item => item.id === skillId);
  return skill;
}

export async function getInterests(db, userId) {
  return loadInterestIds(db, userId);
}

export async function setInterests(db, userId, interestIds) {
  const known = new Set((await loadInterestList(db)).map(interest => interest.id));
  const unknown = interestIds.filter(id => !known.has(id));
  if (unknown.length) {
    throw new AppError(400, 'VALIDATION_ERROR', `Unknown interest id(s): ${unknown.join(', ')}.`,
      unknown.map(id => ({ path: 'interests', message: `Unknown interest '${id}'` })));
  }

  await transaction(db, async tx => {
    await tx.prepare('DELETE FROM profile_interests WHERE user_id = ?').run(userId);
    const stmt = tx.prepare('INSERT INTO profile_interests(user_id, interest_id) VALUES(?, ?) ON CONFLICT DO NOTHING');
    for (const interestId of [...new Set(interestIds)]) await stmt.run(userId, interestId);
  });

  return getInterests(db, userId);
}

export async function completeOnboarding(db, userId, { interests, scores, ...profilePatch }) {
  await transaction(db, async tx => {
    await updateProfile(tx, userId, profilePatch);
    if (interests) await setInterests(tx, userId, interests);
    if (scores) await setSkills(tx, userId, scores);
    await tx.prepare(`
      INSERT INTO journeys(user_id, started) VALUES(?, 1)
      ON CONFLICT(user_id) DO UPDATE SET started = 1, updated_at = CURRENT_TIMESTAMP
    `).run(userId);
  });
}

export async function getMe(db, userId, user) {
  const skills = await getSkills(db, userId);
  const roadmapState = await getRoadmap(db, userId);
  const profile = await getProfileState(db, userId, skills);
  const interests = await getInterests(db, userId);
  const journey = await getJourneyState(db, userId, roadmapState);
  return {
    user: { id: user.id, kind: user.kind, personaKey: user.personaKey ?? null },
    profile,
    interests,
    skills,
    journey,
    roadmap: roadmapState
      ? { ...roadmapSnapshotView(roadmapState.roadmap), progress: roadmapState.progress }
      : null
  };
}

export async function getProfileState(db, userId, skills) {
  const [profile, resolvedSkills, interests] = await Promise.all([
    getProfile(db, userId),
    skills ?? getSkills(db, userId),
    getInterests(db, userId)
  ]);
  return profileView(profile, {
    scores: Object.fromEntries(resolvedSkills.map(skill => [skill.id, skill.evidenceLevel])),
    interests
  });
}
