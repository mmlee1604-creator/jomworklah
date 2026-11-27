// node scripts/map-course-skills.mjs           -> dry run: build mapping + report (data/course-skills.json)
// node --env-file=.env scripts/map-course-skills.mjs --write  -> save to Supabase course_skills
//
// Rule: a skill is linked to a course when a keyword appears in the course NAME,
// or when at least two different keywords for that skill appear in its description / career text.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { matchers, nameOnlySkills } from '../src/import/skill-keywords.js';
import { skills } from '../src/db/seed-data.js';

const { courses } = JSON.parse(readFileSync('data/tvet-clean.json', 'utf8'));
const translations = existsSync('data/translations.json') ? JSON.parse(readFileSync('data/translations.json', 'utf8')) : {};
const validSkills = new Set(skills.map(skill => skill.id));
for (const skillId of Object.keys(matchers)) if (!validSkills.has(skillId)) throw new Error(`Unknown skill id in keywords: ${skillId}`);

const rows = [];
const perCourse = new Map();
for (const course of courses) {
  const en = translations[course.id] ?? {};
  const name = `${course.name_ms} ${en.name_en ?? ''}`;
  const body = [course.description_ms, en.description_en, course.career_prospects_ms, en.career_prospects_en].filter(Boolean).join('\n');
  for (const [skillId, list] of Object.entries(matchers)) {
    const nameHit = list.find(m => m.pattern.test(name));
    const bodyHits = list.filter(m => m.pattern.test(body));
    // Keep word forms from different languages from counting twice: distinct stems only.
    const distinct = new Set(bodyHits.map(m => m.word));
    if (nameHit || (!nameOnlySkills.has(skillId) && distinct.size >= 2)) {
      rows.push({ course_id: course.id, skill_id: skillId, matched_by: nameHit ? 'keyword:name' : 'keyword:text' });
      if (!perCourse.has(course.id)) perCourse.set(course.id, []);
      perCourse.get(course.id).push(skillId);
    }
  }
}
writeFileSync('data/course-skills.json', JSON.stringify(rows, null, 2));

if (process.argv.includes('--write')) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), { auth: { persistSession: false } });
  const { error: delError } = await supabase.from('course_skills').delete().like('matched_by', 'keyword%');
  if (delError) throw new Error(delError.message);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('course_skills').insert(rows.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
  const { count } = await supabase.from('course_skills').select('*', { count: 'exact', head: true });
  console.log(`Wrote ${rows.length} links; table now has ${count}.`);
  process.exit(0);
}

console.log(`Courses: ${courses.length} | with ≥1 skill: ${perCourse.size} | with none: ${courses.length - perCourse.size} | links: ${rows.length}\n`);
console.log('Courses per skill:');
for (const skill of skills) {
  const n = rows.filter(r => r.skill_id === skill.id).length;
  const byName = rows.filter(r => r.skill_id === skill.id && r.matched_by === 'keyword:name').length;
  console.log(`  ${skill.id.padEnd(14)} ${String(n).padStart(4)}  (by name ${byName})  ${skill.name}`);
}
const dist = {};
for (const list of perCourse.values()) dist[list.length] = (dist[list.length] ?? 0) + 1;
console.log('\nSkills per matched course:', JSON.stringify(dist));

const byId = new Map(courses.map(c => [c.id, c]));
const sample = (label, ids) => {
  console.log(`\n${label}`);
  for (const id of ids) console.log(`  - ${translations[id]?.name_en ?? byId.get(id).name_ms}  =>  [${(perCourse.get(id) ?? []).join(', ')}]`);
};
const matched = [...perCourse.keys()];
sample('Sample matched courses:', matched.filter((_, i) => i % Math.ceil(matched.length / 10) === 0).slice(0, 10));
const unmatched = courses.filter(c => !perCourse.has(c.id)).map(c => c.id);
sample('Sample courses with NO skill match:', unmatched.filter((_, i) => i % Math.ceil(unmatched.length / 10) === 0).slice(0, 10));
