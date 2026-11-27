-- Application data schema for JomWorkLah.
-- Apply after schema.sql (the TVET catalogue schema) in Supabase SQL Editor.
-- The API connects with a server-only PostgreSQL connection string. These tables
-- intentionally have no public RLS policies.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  kind          text NOT NULL DEFAULT 'guest'
                CHECK (kind IN ('guest', 'demo_template', 'demo_clone')),
  persona_key   text UNIQUE,
  source_persona text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash    text PRIMARY KEY,
  user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz,
  expires_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id         text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name            text NOT NULL DEFAULT 'Guest',
  headline        text NOT NULL DEFAULT '',
  qualification   text NOT NULL DEFAULT '',
  field_of_study  text NOT NULL DEFAULT '',
  location        text NOT NULL DEFAULT '',
  experience      text NOT NULL DEFAULT '',
  projects        text NOT NULL DEFAULT '',
  budget          text NOT NULL DEFAULT 'Flexible'
                  CHECK (budget IN ('RM0–RM500', 'RM501–RM1,500', 'Flexible')),
  weekly_hours    integer NOT NULL DEFAULT 5 CHECK (weekly_hours BETWEEN 1 AND 60),
  learning_mode   text NOT NULL DEFAULT 'Online'
                  CHECK (learning_mode IN ('Online', 'In person', 'Hybrid')),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id          text PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  category    text NOT NULL,
  description text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS profile_skills (
  user_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id       text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  evidence_level integer NOT NULL DEFAULT 0 CHECK (evidence_level BETWEEN 0 AND 5),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill ON profile_skills(skill_id);

CREATE TABLE IF NOT EXISTS interests (
  id    text PRIMARY KEY,
  label text NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_interests (
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id text NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id            text PRIMARY KEY,
  title         text NOT NULL,
  category      text NOT NULL,
  sector        text NOT NULL,
  icon          text NOT NULL DEFAULT '',
  summary       text NOT NULL,
  qualification text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS job_requirements (
  job_id   text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  level    integer NOT NULL CHECK (level BETWEEN 1 AND 5),
  weight   double precision NOT NULL CHECK (weight > 0 AND weight <= 1),
  PRIMARY KEY (job_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_job_req_skill ON job_requirements(skill_id);

CREATE TABLE IF NOT EXISTS job_tags (
  job_id      text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interest_id text NOT NULL REFERENCES interests(id) ON DELETE RESTRICT,
  PRIMARY KEY (job_id, interest_id)
);

CREATE TABLE IF NOT EXISTS job_responsibilities (
  job_id   text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  text     text NOT NULL,
  PRIMARY KEY (job_id, position)
);

CREATE TABLE IF NOT EXISTS job_progression (
  job_id   text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  title    text NOT NULL,
  PRIMARY KEY (job_id, position)
);

CREATE TABLE IF NOT EXISTS job_projects (
  job_id   text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  brief    text NOT NULL,
  PRIMARY KEY (job_id, position)
);

CREATE TABLE IF NOT EXISTS journeys (
  user_id       text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  started       smallint NOT NULL DEFAULT 0 CHECK (started IN (0, 1)),
  target_job_id text REFERENCES jobs(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Course IDs are owned by the separate TVET catalogue schema and are deliberately
-- not foreign-keyed here; roadmap snapshots may refer to a catalogue revision.
CREATE TABLE IF NOT EXISTS user_courses (
  user_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  added_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS roadmaps (
  user_id        text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  target_job_id  text NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  weekly_hours   integer NOT NULL CHECK (weekly_hours BETWEEN 1 AND 60),
  start_date     text,
  generated_at   timestamptz NOT NULL DEFAULT now(),
  skill_ids_json text,
  course_ids_json text
);

CREATE TABLE IF NOT EXISTS task_completions (
  user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id      text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, task_id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE users, sessions, profiles, skills, profile_skills, interests,
  profile_interests, jobs, job_requirements, job_tags, job_responsibilities,
  job_progression, job_projects, journeys, user_courses, roadmaps, task_completions
  FROM anon, authenticated;
GRANT ALL ON TABLE users, sessions, profiles, skills, profile_skills, interests,
  profile_interests, jobs, job_requirements, job_tags, job_responsibilities,
  job_progression, job_projects, journeys, user_courses, roadmaps, task_completions
  TO service_role;

COMMIT;
