import { transaction } from './connection.js';

const migrations = [
  {
    version: 1,
    name: 'initial-schema',
    sql: `
      CREATE TABLE users (
        id          TEXT PRIMARY KEY,
        kind        TEXT NOT NULL DEFAULT 'guest'
                    CHECK (kind IN ('guest','demo_template','demo_clone')),
        persona_key TEXT UNIQUE,
        created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE sessions (
        token_hash   TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        last_seen_at TEXT,
        expires_at   TEXT
      );
      CREATE INDEX idx_sessions_user ON sessions(user_id);

      CREATE TABLE profiles (
        user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name           TEXT NOT NULL DEFAULT 'Guest',
        headline       TEXT NOT NULL DEFAULT '',
        qualification  TEXT NOT NULL DEFAULT '',
        field_of_study TEXT NOT NULL DEFAULT '',
        location       TEXT NOT NULL DEFAULT '',
        experience     TEXT NOT NULL DEFAULT '',
        projects       TEXT NOT NULL DEFAULT '',
        budget         TEXT NOT NULL DEFAULT 'Flexible'
                       CHECK (budget IN ('RM0–RM500','RM501–RM1,500','Flexible')),
        weekly_hours   INTEGER NOT NULL DEFAULT 5 CHECK (weekly_hours BETWEEN 1 AND 60),
        learning_mode  TEXT NOT NULL DEFAULT 'Online'
                       CHECK (learning_mode IN ('Online','In person','Hybrid')),
        updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE skills (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        category    TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE profile_skills (
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_id       TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        evidence_level INTEGER NOT NULL DEFAULT 0 CHECK (evidence_level BETWEEN 0 AND 5),
        updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        PRIMARY KEY (user_id, skill_id)
      );
      CREATE INDEX idx_profile_skills_skill ON profile_skills(skill_id);

      CREATE TABLE interests (
        id    TEXT PRIMARY KEY,
        label TEXT NOT NULL
      );

      CREATE TABLE profile_interests (
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, interest_id)
      );

      CREATE TABLE jobs (
        id            TEXT PRIMARY KEY,
        title         TEXT NOT NULL,
        category      TEXT NOT NULL,
        sector        TEXT NOT NULL,
        icon          TEXT NOT NULL DEFAULT '',
        summary       TEXT NOT NULL,
        qualification TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE job_requirements (
        job_id   TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
        level    INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
        weight   REAL NOT NULL CHECK (weight > 0 AND weight <= 1),
        PRIMARY KEY (job_id, skill_id)
      );
      CREATE INDEX idx_job_req_skill ON job_requirements(skill_id);

      CREATE TABLE job_tags (
        job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE RESTRICT,
        PRIMARY KEY (job_id, interest_id)
      );

      CREATE TABLE job_responsibilities (
        job_id   TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        position INTEGER NOT NULL CHECK (position >= 0),
        text     TEXT NOT NULL,
        PRIMARY KEY (job_id, position)
      );

      CREATE TABLE job_progression (
        job_id   TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        position INTEGER NOT NULL CHECK (position >= 0),
        title    TEXT NOT NULL,
        PRIMARY KEY (job_id, position)
      );

      CREATE TABLE job_projects (
        job_id   TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        position INTEGER NOT NULL CHECK (position >= 0),
        brief    TEXT NOT NULL,
        PRIMARY KEY (job_id, position)
      );

      CREATE TABLE providers (
        id   TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url  TEXT NOT NULL
      );

      CREATE TABLE courses (
        id              TEXT PRIMARY KEY,
        title           TEXT NOT NULL,
        provider_id     TEXT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
        mode            TEXT NOT NULL CHECK (mode IN ('Online','In person','Hybrid')),
        location        TEXT NOT NULL,
        min_weeks       INTEGER NOT NULL CHECK (min_weeks > 0),
        max_weeks       INTEGER NOT NULL CHECK (max_weeks >= min_weeks),
        fee             REAL,
        is_illustrative INTEGER NOT NULL DEFAULT 1 CHECK (is_illustrative IN (0,1))
      );
      CREATE INDEX idx_courses_provider ON courses(provider_id);
      CREATE INDEX idx_courses_mode ON courses(mode);
      CREATE INDEX idx_courses_location ON courses(location);

      CREATE TABLE course_skills (
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        skill_id  TEXT NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
        PRIMARY KEY (course_id, skill_id)
      );
      CREATE INDEX idx_course_skills_skill ON course_skills(skill_id);

      CREATE TABLE journeys (
        user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        started       INTEGER NOT NULL DEFAULT 0 CHECK (started IN (0,1)),
        target_job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
        created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE user_courses (
        user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        added_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        PRIMARY KEY (user_id, course_id)
      );

      CREATE TABLE roadmaps (
        user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        target_job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
        weekly_hours  INTEGER NOT NULL CHECK (weekly_hours BETWEEN 1 AND 60),
        start_date    TEXT,
        generated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE task_completions (
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id      TEXT NOT NULL,
        completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        PRIMARY KEY (user_id, task_id)
      );
    `
  },
  {
    version: 2,
    name: 'frontend-alignment',
    sql: `
      ALTER TABLE users ADD COLUMN source_persona TEXT;
      ALTER TABLE roadmaps ADD COLUMN skill_ids_json TEXT;
      ALTER TABLE roadmaps ADD COLUMN course_ids_json TEXT;
    `
  },
  {
    version: 3,
    name: 'tvet-course-catalogue',
    rebuildCourses: true,
    sql: `
      CREATE TABLE courses_new (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
        mode TEXT CHECK (mode IN ('Online','In person','Hybrid')),
        location TEXT NOT NULL,
        min_weeks INTEGER CHECK (min_weeks > 0),
        max_weeks INTEGER CHECK (max_weeks > 0 AND max_weeks >= min_weeks),
        fee REAL,
        is_illustrative INTEGER NOT NULL DEFAULT 1 CHECK (is_illustrative IN (0,1)),
        source TEXT,
        source_course_id TEXT,
        source_url TEXT,
        course_code TEXT,
        description TEXT,
        category TEXT,
        qualification_level TEXT,
        duration_text TEXT,
        duration_value REAL,
        duration_unit TEXT,
        career_prospects TEXT,
        entry_requirements TEXT,
        institution_sector TEXT,
        address TEXT,
        scraped_at TEXT,
        source_page INTEGER,
        scrape_status TEXT,
        extra_attributes_json TEXT,
        source_data_json TEXT,
        imported_at TEXT,
        UNIQUE(source, source_course_id)
      );
      INSERT INTO courses_new(id,title,provider_id,mode,location,min_weeks,max_weeks,fee,is_illustrative)
        SELECT id,title,provider_id,mode,location,min_weeks,max_weeks,fee,is_illustrative FROM courses;
      DROP TABLE courses;
      ALTER TABLE courses_new RENAME TO courses;
      CREATE INDEX idx_courses_provider ON courses(provider_id);
      CREATE INDEX idx_courses_mode ON courses(mode);
      CREATE INDEX idx_courses_location ON courses(location);
    `
  },
  {
    version: 4,
    name: 'supabase-course-references',
    sql: `
      CREATE TABLE user_courses_new (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        PRIMARY KEY (user_id, course_id)
      );
      INSERT INTO user_courses_new SELECT user_id, course_id, added_at FROM user_courses;
      DROP TABLE user_courses;
      ALTER TABLE user_courses_new RENAME TO user_courses;
    `
  }
];

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map(row => row.version));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    // SQLite table rebuild: disable FK enforcement outside the transaction,
    // preserve referencing tables, then check integrity before committing.
    const foreignKeys = db.prepare('PRAGMA foreign_keys').get().foreign_keys;
    if (migration.rebuildCourses) db.exec('PRAGMA foreign_keys = OFF');
    try {
      transaction(db, () => {
        db.exec(migration.sql);
        if (db.prepare('PRAGMA foreign_key_check').all().length) {
          throw new Error(`Foreign key violations in migration ${migration.version}`);
        }
        db.prepare('INSERT INTO schema_migrations(version) VALUES(?)').run(migration.version);
      });
    } finally {
      if (migration.rebuildCourses && foreignKeys) db.exec('PRAGMA foreign_keys = ON');
    }
  }

  return migrations.length;
}

export { migrations };
