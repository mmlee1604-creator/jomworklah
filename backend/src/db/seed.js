import { transaction } from './connection.js';
import { interests, jobs, personas, skills } from './seed-data.js';
import { validateSeedData } from './validate-seed.js';

const templateUserId = personaKey => `tpl_${personaKey}`;

const tables = [
  'task_completions', 'roadmaps', 'user_courses', 'journeys', 'profile_interests',
  'profile_skills', 'profiles', 'sessions', 'users', 'job_projects', 'job_progression', 'job_responsibilities', 'job_tags',
  'job_requirements', 'jobs', 'interests', 'skills'
];

export function wipeAll(db) {
  transaction(db, () => {
    for (const table of tables) db.exec(`DELETE FROM ${table};`);
  });
}

export function seed(db) {
  validateSeedData();

  transaction(db, () => {
    const insertSkill = db.prepare(`
      INSERT OR IGNORE INTO skills(id, name, category, description) VALUES(?, ?, ?, ?)
    `);
    for (const skill of skills) insertSkill.run(skill.id, skill.name, skill.category, skill.description);

    const insertInterest = db.prepare('INSERT OR IGNORE INTO interests(id, label) VALUES(?, ?)');
    for (const interest of interests) insertInterest.run(interest.id, interest.label);

    const insertJob = db.prepare(`
      INSERT OR IGNORE INTO jobs(id, title, category, sector, icon, summary, qualification)
      VALUES(?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRequirement = db.prepare(`
      INSERT OR IGNORE INTO job_requirements(job_id, skill_id, level, weight) VALUES(?, ?, ?, ?)
    `);
    const insertTag = db.prepare('INSERT OR IGNORE INTO job_tags(job_id, interest_id) VALUES(?, ?)');
    const insertResponsibility = db.prepare(`
      INSERT OR IGNORE INTO job_responsibilities(job_id, position, text) VALUES(?, ?, ?)
    `);
    const insertProgression = db.prepare(`
      INSERT OR IGNORE INTO job_progression(job_id, position, title) VALUES(?, ?, ?)
    `);
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO job_projects(job_id, position, brief) VALUES(?, ?, ?)
    `);

    for (const job of jobs) {
      insertJob.run(job.id, job.title, job.category, job.sector, job.icon, job.summary, job.qualification);
      job.requirements.forEach(req => insertRequirement.run(job.id, req.skillId, req.level, req.weight));
      job.tags.forEach(tag => insertTag.run(job.id, tag));
      job.responsibilities.forEach((text, position) => insertResponsibility.run(job.id, position, text));
      job.progression.forEach((title, position) => insertProgression.run(job.id, position, title));
      job.project.forEach((brief, position) => insertProject.run(job.id, position, brief));
    }

    seedPersonaTemplates(db);
  });

  return {
    skills: db.prepare('SELECT COUNT(*) AS n FROM skills').get().n,
    interests: db.prepare('SELECT COUNT(*) AS n FROM interests').get().n,
    jobs: db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n,
    personas: db.prepare("SELECT COUNT(*) AS n FROM users WHERE kind='demo_template'").get().n
  };
}

function seedPersonaTemplates(db) {
  const profileColumns = new Set(db.prepare('PRAGMA table_info(profiles)').all().map(column => column.name));
  const hasPersonalityColumns = profileColumns.has('mbti') && profileColumns.has('holland_codes_json');
  const upsertUser = db.prepare(`
    INSERT INTO users(id, kind, persona_key) VALUES(?, 'demo_template', ?)
    ON CONFLICT(id) DO UPDATE SET kind='demo_template', persona_key=excluded.persona_key, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `);
  const upsertProfile = hasPersonalityColumns ? db.prepare(`
    INSERT INTO profiles(user_id, name, headline, mbti, holland_codes_json, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      name=excluded.name, headline=excluded.headline, mbti=excluded.mbti,
      holland_codes_json=excluded.holland_codes_json, qualification=excluded.qualification,
      field_of_study=excluded.field_of_study, location=excluded.location, experience=excluded.experience,
      projects=excluded.projects, budget=excluded.budget, weekly_hours=excluded.weekly_hours,
      learning_mode=excluded.learning_mode, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `) : db.prepare(`
    INSERT INTO profiles(user_id, name, headline, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      name=excluded.name, headline=excluded.headline, qualification=excluded.qualification,
      field_of_study=excluded.field_of_study, location=excluded.location, experience=excluded.experience,
      projects=excluded.projects, budget=excluded.budget, weekly_hours=excluded.weekly_hours,
      learning_mode=excluded.learning_mode, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `);
  const upsertJourney = db.prepare(`
    INSERT INTO journeys(user_id, started, target_job_id) VALUES(?, 1, ?)
    ON CONFLICT(user_id) DO UPDATE SET started=excluded.started, target_job_id=excluded.target_job_id,
      updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `);
  const upsertSkill = db.prepare(`
    INSERT INTO profile_skills(user_id, skill_id, evidence_level) VALUES(?, ?, ?)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET evidence_level=excluded.evidence_level,
      updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `);
  const insertInterest = db.prepare('INSERT OR IGNORE INTO profile_interests(user_id, interest_id) VALUES(?, ?)');
  const deleteSkills = db.prepare('DELETE FROM profile_skills WHERE user_id=?');
  const deleteInterests = db.prepare('DELETE FROM profile_interests WHERE user_id=?');

  for (const persona of Object.values(personas)) {
    const userId = templateUserId(persona.key);
    upsertUser.run(userId, persona.key);
    if (hasPersonalityColumns) {
      upsertProfile.run(
        userId, persona.name, persona.headline, persona.mbti, JSON.stringify(persona.holland),
        persona.qualification, persona.fieldOfStudy, persona.location, persona.experience, persona.projects,
        persona.budget, persona.weeklyHours, persona.learningMode
      );
    } else {
      upsertProfile.run(
        userId, persona.name, persona.headline, persona.qualification, persona.fieldOfStudy,
        persona.location, persona.experience, persona.projects, persona.budget,
        persona.weeklyHours, persona.learningMode
      );
    }
    upsertJourney.run(userId, persona.targetJobId);
    deleteSkills.run(userId);
    deleteInterests.run(userId);
    for (const [skillId, level] of Object.entries(persona.scores)) upsertSkill.run(userId, skillId, level);
    for (const interestId of persona.interests) insertInterest.run(userId, interestId);
  }
}

export { templateUserId };
