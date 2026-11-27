import crypto from 'node:crypto';
import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';
import { issueToken } from './session-service.js';

export async function listPersonas(db) {
  const templates = await db.prepare(`
    SELECT u.persona_key, p.name, p.headline, p.location, p.budget, p.weekly_hours,
           p.learning_mode, j.target_job_id, jt.title AS target_title
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    LEFT JOIN journeys j ON j.user_id = u.id
    LEFT JOIN jobs jt ON jt.id = j.target_job_id
    WHERE u.kind = 'demo_template'
    ORDER BY p.name
  `).all();

  const topSkills = await Promise.all(templates.map(row => db.prepare(`
    SELECT ps.skill_id AS id, s.name, ps.evidence_level AS "evidenceLevel"
    FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id
    JOIN users u ON u.id = ps.user_id
    WHERE u.persona_key = ?
    ORDER BY ps.evidence_level DESC, s.name
    LIMIT 2
  `).all(row.persona_key)));

  return templates.map((row, index) => ({
    personaKey: row.persona_key,
    name: row.name,
    headline: row.headline,
    location: row.location,
    budget: row.budget,
    weeklyHours: row.weekly_hours,
    learningMode: row.learning_mode,
    targetJobId: row.target_job_id,
    targetTitle: row.target_title,
    topSkills: topSkills[index]
  }));
}

export async function createDemoSession(db, personaKey) {
  const template = await db.prepare("SELECT id FROM users WHERE persona_key = ? AND kind = 'demo_template'").get(personaKey);
  if (!template) throw new AppError(404, 'PERSONA_NOT_FOUND', `Unknown demo persona '${personaKey}'.`);

  const userId = `usr_${crypto.randomUUID()}`;

  await transaction(db, async tx => {
    await tx.prepare("INSERT INTO users(id, kind, source_persona) VALUES(?, 'demo_clone', ?)").run(userId, personaKey);

    await tx.prepare(`
      INSERT INTO profiles(user_id, name, headline, mbti, holland_codes_json, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode)
      SELECT ?, name, headline, mbti, holland_codes_json, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode
      FROM profiles WHERE user_id = ?
    `).run(userId, template.id);

    await copyTemplateSkillsAndInterests(tx, userId, template.id);

    // Clones begin onboarding like the prototype; the template target stays as persona metadata.
    await tx.prepare('INSERT INTO journeys(user_id, started, target_job_id) VALUES(?, 0, NULL)').run(userId);
  });

  const token = await issueToken(db, userId);
  return { token, userId, personaKey };
}

async function copyTemplateSkillsAndInterests(db, userId, templateId) {
  await db.prepare('DELETE FROM profile_skills WHERE user_id = ?').run(userId);
  await db.prepare('DELETE FROM profile_interests WHERE user_id = ?').run(userId);
  await db.prepare(`
    INSERT INTO profile_skills(user_id, skill_id, evidence_level)
    SELECT ?, skill_id, evidence_level FROM profile_skills WHERE user_id = ?
  `).run(userId, templateId);
  await db.prepare(`
    INSERT INTO profile_interests(user_id, interest_id)
    SELECT ?, interest_id FROM profile_interests WHERE user_id = ?
  `).run(userId, templateId);
}

export async function restoreSampleProfile(db, userId) {
  const user = await db.prepare('SELECT kind, source_persona FROM users WHERE id = ?').get(userId);
  if (user?.kind !== 'demo_clone' || !user.source_persona) {
    throw new AppError(409, 'NOT_A_DEMO_CLONE', 'Only demo persona sessions can restore a sample profile.');
  }
  const template = await db.prepare("SELECT id FROM users WHERE persona_key = ? AND kind = 'demo_template'").get(user.source_persona);
  if (!template) throw new AppError(404, 'PERSONA_NOT_FOUND', `Unknown demo persona '${user.source_persona}'.`);

  await transaction(db, async tx => {
    await tx.prepare(`
      UPDATE profiles SET
        (name, headline, mbti, holland_codes_json, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode) =
        (SELECT name, headline, mbti, holland_codes_json, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode
         FROM profiles WHERE user_id = ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(template.id, userId);
    await copyTemplateSkillsAndInterests(tx, userId, template.id);
  });
}
