import { createHash } from 'node:crypto';
import { transaction } from './connection.js';

const text = value => value == null || String(value).trim() === '' ? null : String(value).trim();
const stateNames = { 'PULAU PINANG': 'Penang', 'W.P. KUALA LUMPUR': 'Kuala Lumpur', 'W.P. PUTRAJAYA': 'Putrajaya', 'W.P. LABUAN': 'Labuan' };
const location = value => stateNames[value.toUpperCase()] ?? value.toLowerCase().replace(/\b\w/g, x => x.toUpperCase());

function webUrl(value, required = false) {
  const raw = text(value);
  if (!raw && !required) return '';
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
    return raw;
  } catch {
    // Some scraped institution websites are not usable links. Preserve the
    // original cell in source_data_json, but never expose it as a clickable URL.
    if (!required) return '';
    throw new Error('Expected an HTTP(S) course or institution URL');
  }
}

export function normalizeTvetRow(row) {
  const sourceId = text(row['Course ID']);
  const title = text(row['Course Name']);
  const institution = text(row.Institution);
  const state = text(row.State);
  if (!sourceId || !/^\d+$/.test(sourceId) || !title || !institution || !state) {
    throw new Error('Course ID, Course Name, Institution and State are required; Course ID must be numeric');
  }
  if (row['Scrape Status'] !== 'success') throw new Error(`Course ${sourceId}: scrape was not successful`);
  const extra = text(row['Extra Attributes']);
  const attributes = extra ? JSON.parse(extra) : {};
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) throw new Error('Extra Attributes must be a JSON object');
  const duration = text(row.Duration);
  const match = /^(\d+(?:\.\d+)?)\s*(Bulan|Hari|Minggu|Jam|Months?|Days?|Weeks?|Hours?)$/i.exec(duration ?? '');
  const units = { bulan: 'month', hari: 'day', minggu: 'week', jam: 'hour' };
  const unit = match ? units[match[2].toLowerCase()] ?? match[2].toLowerCase().replace(/s$/, '') : null;
  const value = match ? Number(match[1]) : null;
  // Do not turn months, days or missing duration into invented whole-week ranges.
  const weeks = unit === 'week' && Number.isInteger(value) && value > 0 ? value : null;
  const rawMode = text(row['Delivery Method']);
  const modes = { online: 'Online', 'dalam talian': 'Online', 'in person': 'In person', 'bersemuka': 'In person', hybrid: 'Hybrid', hibrid: 'Hybrid' };
  const mode = rawMode ? modes[rawMode.toLowerCase()] ?? null : null;
  const institutionKey = institution.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase();
  const providerId = `tvet-institution-${createHash('sha256').update(institutionKey).digest('hex').slice(0, 24)}`;
  return {
    id: `tvet-${sourceId}`, title, providerId, institution,
    website: webUrl(row['Institution Website']), mode, location: location(state), weeks,
    sourceId, url: webUrl(row['Course URL'], true), duration, durationValue: value, durationUnit: unit,
    attributes: JSON.stringify(attributes), raw: JSON.stringify(row)
  };
}

export function importTvetCourses(db, rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('No course rows to import');
  // Validate the whole batch before writing any providers/courses.
  const courses = rows.map(normalizeTvetRow);
  if (new Set(courses.map(c => c.sourceId)).size !== courses.length) throw new Error('Duplicate Course ID in source');
  const fields = ['id', 'title', 'provider_id', 'mode', 'location', 'min_weeks', 'max_weeks', 'fee', 'is_illustrative',
    'source', 'source_course_id', 'source_url', 'course_code', 'description', 'category', 'qualification_level',
    'duration_text', 'duration_value', 'duration_unit', 'career_prospects', 'entry_requirements',
    'institution_sector', 'address', 'scraped_at', 'source_page', 'scrape_status', 'extra_attributes_json', 'source_data_json', 'imported_at'];
  const importedAt = new Date().toISOString();
  const counts = { inserted: 0, updated: 0, institutions: new Set(courses.map(c => c.providerId)).size, unmappedSkills: 0,
    unknownMode: courses.filter(c => !c.mode).length,
    missingOrInvalidInstitutionWebsite: courses.filter(c => !c.website).length };
  transaction(db, () => {
    const provider = db.prepare(`INSERT INTO providers(id,name,url) VALUES(?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,
        url=CASE WHEN excluded.url <> '' THEN excluded.url ELSE providers.url END`);
    const existing = db.prepare('SELECT id FROM courses WHERE id=?');
    const skills = db.prepare('SELECT COUNT(*) AS n FROM course_skills WHERE course_id=?');
    const upsert = db.prepare(`INSERT INTO courses(${fields.join(',')}) VALUES(${fields.map(() => '?').join(',')})
      ON CONFLICT(id) DO UPDATE SET ${fields.filter(f => f !== 'id').map(f => `${f}=excluded.${f}`).join(',')}`);
    for (let i = 0; i < courses.length; i += 1) {
      const c = courses[i], row = rows[i];
      provider.run(c.providerId, c.institution, c.website);
      counts[existing.get(c.id) ? 'updated' : 'inserted'] += 1;
      upsert.run(c.id, c.title, c.providerId, c.mode, c.location, c.weeks, c.weeks, null, 0,
        'tvet.gov.my', c.sourceId, c.url, text(row['Course Code']), text(row.Description), text(row.Category), text(row['Qualification Level']),
        c.duration, c.durationValue, c.durationUnit, text(row['Career Prospects']), text(row['Entry Requirements']),
        text(row.Sector), text(row.Address), text(row['Scraped At']), row['Source Page'] == null ? null : Number(row['Source Page']),
        text(row['Scrape Status']), c.attributes, c.raw, importedAt);
      if (!skills.get(c.id).n) counts.unmappedSkills += 1;
    }
  });
  return { ...counts, total: courses.length };
}
