import { courses, providers } from './seed-data.js';
import { transaction } from './connection.js';

// Only the offline import tool uses these tables; API reads use course-catalogue.js.
export function seedSqliteCatalogue(db) {
  transaction(db, () => {
    const provider = db.prepare('INSERT OR IGNORE INTO providers(id,name,url) VALUES(?,?,?)');
    for (const p of providers) provider.run(p.id, p.name, p.url);
    const course = db.prepare(`INSERT OR IGNORE INTO courses
      (id,title,provider_id,mode,location,min_weeks,max_weeks,fee,is_illustrative)
      VALUES(?,?,?,?,?,?,?,?,?)`);
    const link = db.prepare('INSERT OR IGNORE INTO course_skills(course_id,skill_id) VALUES(?,?)');
    for (const c of courses) {
      course.run(c.id, c.title, c.providerId, c.mode, c.location, c.minWeeks, c.maxWeeks, c.fee, 1);
      for (const skillId of c.skillIds) link.run(c.id, skillId);
    }
  });
}

const groupBy = (rows, key) => Object.groupBy(rows, row => row[key]);

export function loadSqliteCourses(db) {
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

export function loadSqliteCourse(db, courseId) {
  return loadSqliteCourses(db).find(course => course.id === courseId) ?? null;
}
