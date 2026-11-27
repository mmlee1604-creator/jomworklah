import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/connection.js';
import { migrate, migrations } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';
import { importTvetCourses } from '../src/db/import-tvet.js';
import { loadSqliteCourse as loadCourse, loadSqliteCourses, seedSqliteCatalogue } from '../src/db/sqlite-catalogue.js';
import { fixtureCatalogue, setCourseCatalogue } from '../src/services/course-catalogue.js';
import { api, demoToken, makeTestApp } from './helpers.js';

const row = overrides => ({
  'Course ID': '7111', 'Course Name': 'SIJIL TEKNOLOGI AUTOMOTIF SERVIS', 'Course Code': 'STAS03',
  Description: 'Servis kenderaan bermotor', Category: 'Sijil Penuh', 'Qualification Level': 'Sijil Tahap 3',
  Duration: '27 Bulan', 'Delivery Method': null, 'Career Prospects': 'Mekanik Automotif',
  'Entry Requirements': 'Warganegara Malaysia\nBerumur 17 hingga 35 tahun', Institution: 'ILP PASIR GUDANG',
  Sector: 'Awam', Address: 'Pasir Gudang, Johor', State: 'JOHOR',
  'Institution Website': 'https://www.ilppg.gov.my',
  'Course URL': 'https://www.tvet.gov.my/awam-kursus/kursus?id_kursus=7111',
  'Scraped At': '2026-11-26T09:29:46+00:00', 'Source Page': 1, 'Scrape Status': 'success',
  'Extra Attributes': '{"pelaksanaan kursus":"ST"}', ...overrides
});

function database(t) {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  migrate(db);
  seed(db);
  seedSqliteCatalogue(db);
  return db;
}

test('migration preserves existing course links, user saves and roadmap records', t => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  db.exec('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)');
  for (const migration of migrations.filter(m => m.version < 3)) {
    db.exec(migration.sql);
    db.prepare('INSERT INTO schema_migrations VALUES(?)').run(migration.version);
  }
  seed(db);
  seedSqliteCatalogue(db);
  const links = db.prepare('SELECT * FROM course_skills ORDER BY course_id,skill_id').all();
  db.prepare('INSERT INTO user_courses(user_id,course_id) VALUES(?,?)').run('tpl_aina', 'sql-foundations');
  db.prepare('INSERT INTO roadmaps(user_id,target_job_id,weekly_hours,course_ids_json) VALUES(?,?,?,?)')
    .run('tpl_aina', 'junior-data-analyst', 5, '["sql-foundations"]');
  migrate(db);
  migrate(db);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM courses').get().n, 10);
  assert.deepEqual(db.prepare('SELECT * FROM course_skills ORDER BY course_id,skill_id').all(), links);
  assert.equal(db.prepare('SELECT course_id FROM user_courses').get().course_id, 'sql-foundations');
  assert.equal(db.prepare('SELECT course_ids_json FROM roadmaps').get().course_ids_json, '["sql-foundations"]');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
});

test('TVET import preserves source metadata without inventing mode, price or weeks', t => {
  const db = database(t);
  const result = importTvetCourses(db, [row()]);
  assert.equal(result.inserted, 1);
  assert.equal(result.unmappedSkills, 1);
  const course = loadCourse(db, 'tvet-7111');
  assert.equal(course.provider.name, 'ILP PASIR GUDANG');
  assert.equal(course.location, 'Johor');
  assert.equal(course.duration, '27 Bulan');
  assert.equal(course.durationValue, 27);
  assert.equal(course.durationUnit, 'month');
  assert.equal(course.mode, null);
  assert.equal(course.fee, null);
  assert.equal(course.minWeeks, null);
  assert.equal(course.maxWeeks, null);
  assert.equal(course.isIllustrative, false);
  assert.equal(course.sourceCourseId, '7111');
  assert.equal(course.entryRequirements, row()['Entry Requirements']);
  assert.deepEqual(course.extraAttributes, { 'pelaksanaan kursus': 'ST' });
  assert.deepEqual(course.skillIds, []);
  assert.deepEqual(JSON.parse(db.prepare('SELECT source_data_json FROM courses WHERE id=?').get(course.id).source_data_json), row());
});

test('upgrading local migration 3 retains saved data and allows Supabase course IDs', t => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  db.exec('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)');
  db.exec('PRAGMA foreign_keys = OFF');
  for (const migration of migrations.filter(m => m.version <= 3)) {
    db.exec(migration.sql);
    db.prepare('INSERT INTO schema_migrations VALUES(?)').run(migration.version);
  }
  db.exec('PRAGMA foreign_keys = ON');
  seed(db);
  seedSqliteCatalogue(db);
  importTvetCourses(db, [row()]);
  db.prepare('INSERT INTO user_courses(user_id,course_id) VALUES(?,?)').run('tpl_aina', 'tvet-7111');
  migrate(db);
  migrate(db);
  assert.equal(db.prepare('SELECT course_id FROM user_courses').get().course_id, 'tvet-7111');
  assert.equal(loadCourse(db, 'tvet-7111').sourceCourseId, '7111');
  db.prepare('INSERT INTO user_courses(user_id,course_id) VALUES(?,?)').run('tpl_aina', 'supabase-only-course');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('upgrading the incoming Supabase migration 3 is also repeatable', t => {
  const db = database(t);
  // The incoming branch used version 3 for removing the local catalogue.
  db.exec(`DELETE FROM schema_migrations WHERE version = 4;
    DROP TABLE course_skills; DROP TABLE courses; DROP TABLE providers;`);
  db.prepare('INSERT INTO user_courses(user_id,course_id) VALUES(?,?)').run('tpl_aina', 'supabase-only-course');
  migrate(db);
  migrate(db);
  assert.equal(db.prepare('SELECT course_id FROM user_courses').get().course_id, 'supabase-only-course');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('repeat imports update records, deduplicate institutions and preserve saved courses and skills', t => {
  const db = database(t);
  importTvetCourses(db, [row(), row({ 'Course ID': '7112', 'Course Name': 'SECOND COURSE' })]);
  db.prepare('INSERT INTO user_courses VALUES(?,?,?)').run('tpl_aina', 'tvet-7111', '2026-11-27');
  db.prepare('INSERT INTO course_skills VALUES(?,?)').run('tvet-7111', 'auto');
  const result = importTvetCourses(db, [row({ 'Course Name': 'UPDATED' })]);
  assert.equal(result.updated, 1);
  assert.equal(result.inserted, 0);
  assert.equal(result.unmappedSkills, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM providers WHERE id LIKE 'tvet-institution-%'").get().n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM courses').get().n, 12);
  assert.equal(loadCourse(db, 'tvet-7111').title, 'UPDATED');
  assert.deepEqual(loadCourse(db, 'tvet-7111').skillIds, ['auto']);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM user_courses').get().n, 1);
});

test('invalid or duplicate rows reject the entire import before writing', t => {
  const db = database(t);
  assert.throws(() => importTvetCourses(db, [row(), row({ 'Course ID': 'bad' })]));
  assert.throws(() => importTvetCourses(db, [row(), row()]), /Duplicate/);
  assert.throws(() => importTvetCourses(db, [row({ 'Extra Attributes': 'bad JSON' })]));
  assert.throws(() => importTvetCourses(db, [row({ 'Course URL': 'javascript:bad' })]));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM courses').get().n, 10);
});

test('short and zero source durations remain raw; invalid institution links are not exposed', t => {
  const db = database(t);
  importTvetCourses(db, [row({ Duration: '5 Hari', 'Institution Website': 'not a link' }), row({ 'Course ID': '7112', Duration: '0 Bulan' })]);
  const short = loadCourse(db, 'tvet-7111');
  assert.equal(short.durationValue, 5);
  assert.equal(short.durationUnit, 'day');
  assert.equal(short.minWeeks, null);
  assert.equal(short.provider.url, 'https://www.ilppg.gov.my'); // second row supplies the institution website
  assert.equal(loadCourse(db, 'tvet-7112').durationValue, 0);
  assert.equal(loadCourse(db, 'tvet-7112').minWeeks, null);
});

test('training API lists imported courses and supports saving them into a roadmap', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  // Explicitly inject an offline import into the test cache. Production reads Supabase.
  const local = database(t);
  importTvetCourses(local, [row()]);
  const fixture = fixtureCatalogue();
  setCourseCatalogue({ ...fixture, courses: loadSqliteCourses(local) });
  t.after(() => setCourseCatalogue(fixtureCatalogue()));
  const token = await demoToken(ctx.base, 'amir', { target: 'automotive-technician' });
  const all = await api(ctx.base, 'GET', '/api/training?view=all', { token });
  assert.equal(all.status, 200);
  assert.ok(all.body.data.some(c => c.id === 'tvet-7111'));
  const detail = await api(ctx.base, 'GET', '/api/training/tvet-7111', { token });
  assert.equal(detail.body.data.duration, '27 Bulan');
  assert.equal(detail.body.data.courseUrl, row()['Course URL']);
  const saved = await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'tvet-7111' } });
  assert.equal(saved.status, 201);
  const roadmap = await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });
  assert.equal(roadmap.status, 201);
  const task = roadmap.body.data.phases.flatMap(p => p.tasks).find(t => t.courseId === 'tvet-7111');
  assert.ok(task);
  assert.equal(task.course.durationUnit, 'month');
  assert.doesNotMatch(task.title, /example pathway/);
});
