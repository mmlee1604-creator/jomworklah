// Pure transformation of the TVET portal export into catalogue rows.
// No network, no database: easy to inspect and test.

const text = value => (value === null || value === undefined ? '' : String(value)).trim();
const orNull = value => text(value) || null;

export function slugify(value) {
  return text(value)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ── Qualification level → coarse group used by the recommender ──
export function levelGroup(level) {
  const value = text(level).toLowerCase();
  if (/kursus pendek|micro|modular/.test(value)) return 'short_course';
  if (/diploma lanjutan/.test(value)) return 'advanced_diploma';
  if (/diploma/.test(value)) return 'diploma';
  if (/ijazah|sarjana/.test(value)) return 'degree';
  if (/profesional|professional/.test(value)) return 'professional';
  if (/sijil/.test(value)) return 'certificate';
  return 'other';
}

// ── State → the location names the app already uses ──
const STATE_MAP = {
  'W.PERSEKUTUAN (KL)': 'Kuala Lumpur',
  'W.PERSEKUTUAN (LABUAN)': 'Labuan',
  'PULAU PINANG': 'Penang'
};
export function normaliseState(state) {
  const value = text(state).toUpperCase();
  if (!value) return null;
  if (STATE_MAP[value]) return STATE_MAP[value];
  return value.toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase());
}

// ── Duration text ("27 Bulan", "14 Hari", "240 Jam") → whole weeks ──
// Assumptions (documented, adjustable): 1 month ≈ 4.345 weeks, 5 training days per week,
// 40 contact hours per week, 1 semester ≈ 18 weeks. Zero or unparseable → null.
export function durationWeeks(duration) {
  const match = text(duration).match(/^(\d+(?:[.,]\d+)?)\s*([A-Za-z]+)/);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!(amount > 0)) return null;
  const unit = match[2].toLowerCase();
  const weeks = {
    bulan: amount * 4.345,
    minggu: amount,
    hari: amount / 5,
    jam: amount / 40,
    semester: amount * 18
  }[unit];
  return weeks === undefined ? null : Math.max(1, Math.round(weeks));
}

// Tuition marked free only when the portal says so explicitly; otherwise unknown (null).
export function feeFree(extraAttributes) {
  const blob = typeof extraAttributes === 'string' ? extraAttributes : JSON.stringify(extraAttributes ?? '');
  return /percuma\s+yuran\s+pengajian|yuran\s+pengajian[^\n]{0,25}percuma/i.test(blob) ? true : null;
}

function parseJson(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count || (count === best.count && value.length > best.value.length)) best = { value, count };
  }
  return best?.value ?? null;
}

// The portal appends markers such as " #" to some course names.
const cleanName = value => text(value).replace(/[\s#*]+$/, '');

export function transform(rawRows) {
  const rows = rawRows
    .filter(row => text(row['Course Name']) && text(row['Scrape Status']).toLowerCase() === 'success')
    .map(row => ({ ...row, 'Course Name': cleanName(row['Course Name']) }));

  // Institutions
  const institutions = new Map();
  for (const row of rows) {
    const name = text(row.Institution);
    if (!name) continue;
    const id = slugify(name);
    if (!institutions.has(id)) {
      institutions.set(id, {
        id, name,
        sector: orNull(row.Sector),
        address: orNull(row.Address),
        state: orNull(row.State),
        state_norm: normaliseState(row.State),
        website: orNull(row['Institution Website'])
      });
    }
  }

  // Group offerings into programmes by name + qualification level
  const groups = new Map();
  for (const row of rows) {
    const key = `${text(row['Course Name']).toUpperCase()}||${text(row['Qualification Level'])}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const courses = [];
  const offerings = [];
  const usedIds = new Set();

  for (const list of groups.values()) {
    const first = list[0];
    const group = levelGroup(first['Qualification Level']);
    let id = slugify(`${first['Course Name']} ${group}`);
    for (let n = 2; usedIds.has(id); n += 1) id = `${slugify(`${first['Course Name']} ${group}`)}-${n}`;
    usedIds.add(id);

    const weeks = list.map(row => durationWeeks(row.Duration)).filter(value => value !== null);
    courses.push({
      id,
      code: mostCommon(list.map(row => orNull(row['Course Code']))),
      name_ms: text(first['Course Name']),
      name_en: null,
      description_ms: mostCommon(list.map(row => orNull(row.Description))),
      description_en: null,
      career_prospects_ms: mostCommon(list.map(row => orNull(row['Career Prospects']))),
      career_prospects_en: null,
      category: orNull(first.Category),
      qualification_level: orNull(first['Qualification Level']),
      level_group: group,
      min_weeks: weeks.length ? Math.min(...weeks) : null,
      max_weeks: weeks.length ? Math.max(...weeks) : null,
      offering_count: list.length,
      is_illustrative: false
    });

    for (const row of list) {
      const extra = parseJson(row['Extra Attributes']);
      offerings.push({
        id: text(row['Course ID']),
        course_id: id,
        institution_id: slugify(row.Institution),
        duration_text: orNull(row.Duration),
        duration_weeks: durationWeeks(row.Duration),
        delivery_method: orNull(row['Delivery Method']),
        entry_requirements: orNull(row['Entry Requirements']),
        fee_free: feeFree(row['Extra Attributes']),
        extra_attributes: extra,
        course_url: orNull(row['Course URL']),
        scraped_at: orNull(row['Scraped At']),
        source_page: Number.isFinite(Number(row['Source Page'])) ? Number(row['Source Page']) : null
      });
    }
  }

  return { institutions: [...institutions.values()], courses, offerings };
}
