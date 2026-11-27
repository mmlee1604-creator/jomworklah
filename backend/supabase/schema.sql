-- Jom Kerja Lah: TVET course catalogue (Supabase / Postgres)
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS).
--
-- Model: one `courses` row per programme (grouped by name + qualification),
--        many `course_offerings` rows (the same programme at different institutions).

-- ── Institutions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institutions (
  id          text PRIMARY KEY,                -- slug of the institution name
  name        text NOT NULL,
  sector      text,                            -- 'Awam' | 'Swasta'
  address     text,
  state       text,                            -- as published, e.g. 'W.PERSEKUTUAN (KL)'
  state_norm  text,                            -- app location, e.g. 'Kuala Lumpur'
  website     text
);

-- ── Programmes (what the user compares and saves) ───────────
CREATE TABLE IF NOT EXISTS courses (
  id                    text PRIMARY KEY,      -- stable slug: name + level
  code                  text,
  name_ms               text NOT NULL,         -- original Malay name
  name_en               text,                  -- English (machine translated)
  description_ms        text,
  description_en        text,
  career_prospects_ms   text,
  career_prospects_en   text,
  category              text,                  -- 'Sijil Penuh' | 'Micro Credential'
  qualification_level   text,                  -- as published
  level_group           text NOT NULL DEFAULT 'other'
    CHECK (level_group IN ('short_course','certificate','diploma','advanced_diploma','degree','professional','other')),
  min_weeks             integer,               -- derived from offerings, nullable
  max_weeks             integer,
  offering_count        integer NOT NULL DEFAULT 0,
  is_illustrative       boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_courses_level_group ON courses(level_group);

-- ── Offerings (a programme at one institution) ──────────────
CREATE TABLE IF NOT EXISTS course_offerings (
  id                  text PRIMARY KEY,        -- portal 'Course ID'
  course_id           text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  institution_id      text NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  duration_text       text,                    -- e.g. '27 Bulan'
  duration_weeks      integer,
  delivery_method     text,                    -- empty in the source export
  entry_requirements  text,
  fee_free            boolean,                 -- parsed from extra attributes, null = unknown
  extra_attributes    jsonb,
  course_url          text,
  scraped_at          timestamptz,
  source_page         integer
);
CREATE INDEX IF NOT EXISTS idx_offerings_course      ON course_offerings(course_id);
CREATE INDEX IF NOT EXISTS idx_offerings_institution ON course_offerings(institution_id);

-- ── Skills taught (feeds the recommendation engine) ─────────
-- skill_id refers to skills in the backend seed (no FK: skills live in the API database).
CREATE TABLE IF NOT EXISTS course_skills (
  course_id   text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id    text NOT NULL,
  matched_by  text NOT NULL DEFAULT 'keyword',
  PRIMARY KEY (course_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_course_skills_skill ON course_skills(skill_id);

-- ── Row Level Security ──────────────────────────────────────
-- Catalogue is public read-only. Writes happen only with the service key (bypasses RLS).
ALTER TABLE institutions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_skills     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read institutions" ON institutions;
DROP POLICY IF EXISTS "public read courses"      ON courses;
DROP POLICY IF EXISTS "public read offerings"    ON course_offerings;
DROP POLICY IF EXISTS "public read course_skills" ON course_skills;

CREATE POLICY "public read institutions"  ON institutions     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read courses"       ON courses          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read offerings"     ON course_offerings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read course_skills" ON course_skills    FOR SELECT TO anon, authenticated USING (true);

-- ── Table privileges ────────────────────────────────────────
-- New Supabase projects do not grant privileges on new tables automatically.
-- service_role (backend import / API) needs full access; anon/authenticated read only
-- (RLS policies above still apply to them).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON public.institutions, public.courses, public.course_offerings, public.course_skills
  TO service_role;
GRANT SELECT ON public.institutions, public.courses, public.course_offerings, public.course_skills
  TO anon, authenticated;
