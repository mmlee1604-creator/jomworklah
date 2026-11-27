export function loadSkillList(db) {
  return db.prepare('SELECT id, name, category, description FROM skills ORDER BY name').all()
    .map(row => ({ id: row.id, name: row.name, category: row.category, description: row.description }));
}

export function loadSkillMap(db) {
  return new Map(loadSkillList(db).map(skill => [skill.id, skill]));
}

export function loadInterestList(db) {
  return db.prepare('SELECT id, label FROM interests ORDER BY label').all()
    .map(row => ({ id: row.id, label: row.label }));
}

export function loadInterestIds(db, userId) {
  return db.prepare(`
    SELECT pi.interest_id FROM profile_interests pi
    JOIN interests i ON i.id = pi.interest_id
    WHERE pi.user_id = ?
    ORDER BY i.label
  `).all(userId).map(row => row.interest_id);
}

export function loadProfileRow(db, userId) {
  return db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) ?? null;
}

export function toProfile(row) {
  if (!row) return null;
  return {
    name: row.name,
    headline: row.headline,
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

export function loadScoreMap(db, userId) {
  const map = {};
  const rows = db.prepare('SELECT skill_id, evidence_level FROM profile_skills WHERE user_id = ?').all(userId);
  for (const row of rows) map[row.skill_id] = row.evidence_level;
  return map;
}

const groupBy = (rows, key) => rows.reduce((acc, row) => {
  (acc[row[key]] ??= []).push(row);
  return acc;
}, {});

export function loadJobs(db) {
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY title').all();
  const requirements = groupBy(db.prepare('SELECT * FROM job_requirements').all(), 'job_id');
  const tags = groupBy(db.prepare('SELECT * FROM job_tags').all(), 'job_id');
  const responsibilities = groupBy(db.prepare('SELECT * FROM job_responsibilities ORDER BY job_id, position').all(), 'job_id');
  const progression = groupBy(db.prepare('SELECT * FROM job_progression ORDER BY job_id, position').all(), 'job_id');
  const projects = groupBy(db.prepare('SELECT * FROM job_projects ORDER BY job_id, position').all(), 'job_id');

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

export function loadJob(db, jobId) {
  const all = loadJobs(db);
  return all.find(job => job.id === jobId) ?? null;
}

export function loadCourses(db) {
  const rows = db.prepare(`
    SELECT c.*, p.name AS provider_name, p.url AS provider_url
    FROM courses c JOIN providers p ON p.id = c.provider_id
    ORDER BY c.title
  `).all();
  const links = groupBy(db.prepare('SELECT * FROM course_skills').all(), 'course_id');

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    provider: { id: row.provider_id, name: row.provider_name, url: row.provider_url },
    source: row.source,
    sourceCourseId: row.source_course_id,
    courseUrl: row.source_url,
    courseCode: row.course_code,
    description: row.description,
    category: row.category,
    qualificationLevel: row.qualification_level,
    duration: row.duration_text,
    durationValue: row.duration_value,
    durationUnit: row.duration_unit,
    careerProspects: row.career_prospects,
    entryRequirements: row.entry_requirements,
    sector: row.institution_sector,
    address: row.address,
    scrapedAt: row.scraped_at,
    sourcePage: row.source_page,
    scrapeStatus: row.scrape_status,
    extraAttributes: row.extra_attributes_json ? JSON.parse(row.extra_attributes_json) : {},
    skillIds: (links[row.id] ?? []).map(link => link.skill_id),
    mode: row.mode,
    location: row.location,
    minWeeks: row.min_weeks,
    maxWeeks: row.max_weeks,
    fee: row.fee,
    isIllustrative: Boolean(row.is_illustrative)
  }));
}

export function loadCourse(db, courseId) {
  return loadCourses(db).find(course => course.id === courseId) ?? null;
}

export function loadProviders(db) {
  return db.prepare('SELECT id, name, url FROM providers ORDER BY name').all()
    .map(row => ({ id: row.id, name: row.name, url: row.url }));
}
