// Usage:
//   node scripts/import-courses.mjs            -> dry run: clean + report, writes data/tvet-clean.json
// (database writing is added in the next step)
import ExcelJS from 'exceljs';
import { writeFileSync } from 'node:fs';
import { transform } from '../src/import/tvet-transform.js';

const FILE = process.env.TVET_XLSX ?? 'data/tvet_courses_first_1000.xlsx';
const cell = value => (value && typeof value === 'object' ? (value.text ?? value.result ?? JSON.stringify(value)) : value);

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(FILE);
const sheet = workbook.getWorksheet('Courses');
const header = sheet.getRow(1).values.slice(1);
const raw = [];
sheet.eachRow((row, index) => {
  if (index === 1) return;
  const record = {};
  row.values.slice(1).forEach((value, i) => { record[header[i]] = cell(value); });
  raw.push(record);
});

const result = transform(raw);
writeFileSync('data/tvet-clean.json', JSON.stringify(result, null, 2));

const count = (items, pick) => items.reduce((acc, item) => { const k = pick(item) ?? '(none)'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});
const pct = (n, total) => `${n}/${total} (${Math.round((n / total) * 100)}%)`;

console.log('Input rows           :', raw.length);
console.log('Institutions         :', result.institutions.length);
console.log('Courses (merged)     :', result.courses.length);
console.log('Offerings            :', result.offerings.length);
console.log('\nLevel groups         :', JSON.stringify(count(result.courses, c => c.level_group)));
console.log('Offerings per course :', JSON.stringify(count(result.courses, c => (c.offering_count >= 5 ? '5+' : String(c.offering_count)))));
console.log('Locations (norm)     :', JSON.stringify(count(result.institutions, i => i.state_norm)));
console.log('\nWith description     :', pct(result.courses.filter(c => c.description_ms).length, result.courses.length));
console.log('With career prospects:', pct(result.courses.filter(c => c.career_prospects_ms).length, result.courses.length));
console.log('Duration parsed      :', pct(result.offerings.filter(o => o.duration_weeks !== null).length, result.offerings.length));
console.log('Fee marked free      :', pct(result.offerings.filter(o => o.fee_free).length, result.offerings.length));
console.log('Courses with weeks   :', pct(result.courses.filter(c => c.min_weeks !== null).length, result.courses.length));

// integrity checks
const courseIds = new Set(result.courses.map(c => c.id));
const instIds = new Set(result.institutions.map(i => i.id));
const dupOfferings = result.offerings.length - new Set(result.offerings.map(o => o.id)).size;
const orphanCourse = result.offerings.filter(o => !courseIds.has(o.course_id)).length;
const orphanInst = result.offerings.filter(o => !instIds.has(o.institution_id)).length;
console.log('\nIntegrity -> duplicate offering ids:', dupOfferings, '| orphan course refs:', orphanCourse, '| orphan institution refs:', orphanInst);

if (process.argv.includes('--write')) {
  if (dupOfferings || orphanCourse || orphanInst) throw new Error('Integrity check failed; nothing written.');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), { auth: { persistSession: false } });

  // Upsert is idempotent. English columns are left out so a re-import never wipes translations.
  const withoutEnglish = ({ name_en, description_en, career_prospects_en, ...rest }) => rest;
  const upsert = async (table, rows) => {
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from(table).upsert(rows.slice(i, i + 200), { onConflict: 'id' });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table.padEnd(17)} upserted ${rows.length}, table now has ${count}`);
  };

  console.log('\nWriting to Supabase...');
  await upsert('institutions', result.institutions);
  await upsert('courses', result.courses.map(withoutEnglish));
  await upsert('course_offerings', result.offerings);
  console.log('Done.');
} else {
  console.log('\n(dry run: add --write to save to Supabase)');
}

console.log('\nSample courses:');
for (const c of result.courses.slice(0, 4)) {
  console.log(` - [${c.level_group}] ${c.id} | ${c.name_ms} | ${c.min_weeks ?? '?'}-${c.max_weeks ?? '?'} wks | ${c.offering_count} offerings`);
}
