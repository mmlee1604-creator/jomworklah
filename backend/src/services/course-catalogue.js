// Course catalogue held in memory. The source of truth is Supabase; this module loads it
// at startup and refreshes it on a timer, so reads stay synchronous for the rest of the API.
import { courses as fixtureCourses, providers as fixtureProviders } from '../db/seed-data.js';

// The TVET portal lists one programme at many institutions, so the old single "provider" is
// now the portal itself; the institutions live in `course.offerings`.
export const PORTAL_PROVIDER = Object.freeze({
  id: 'tvet-portal',
  name: 'TVET Malaysia Portal',
  url: 'https://www.tvet.gov.my/'
});

const PAGE = 1000; // PostgREST returns at most 1000 rows per request.

const countBy = values => values.reduce((acc, value) => acc.set(value, (acc.get(value) ?? 0) + 1), new Map());

// ── Offline fixture: the 10 illustrative courses from the seed (used by tests and as an
//    explicit, clearly-labelled fallback when Supabase is not configured) ──
export function fixtureCatalogue() {
  const providers = fixtureProviders.map(({ id, name, url }) => ({ id, name, url }));
  const providerById = new Map(providers.map(provider => [provider.id, provider]));
  const courses = fixtureCourses.map(course => ({
    id: course.id,
    title: course.title,
    titleMs: null,
    description: null,
    descriptionMs: null,
    careerProspects: null,
    careerProspectsMs: null,
    code: null,
    category: null,
    qualificationLevel: null,
    levelGroup: null,
    provider: providerById.get(course.providerId),
    skillIds: [...course.skillIds],
    mode: course.mode,
    modeAssumed: false,
    location: course.location,
    locations: [course.location],
    minWeeks: course.minWeeks,
    maxWeeks: course.maxWeeks,
    fee: course.fee,
    isIllustrative: true,
    offerings: []
  })).sort((a, b) => a.title.localeCompare(b.title, 'en'));
  return { source: 'fixture', loadedAt: new Date().toISOString(), courses, providers };
}

// ── Supabase → API course shape ──
export function buildCatalogue({ institutions, courses, offerings, courseSkills }) {
  const institutionById = new Map(institutions.map(row => [row.id, row]));
  const skillsByCourse = new Map();
  for (const link of courseSkills) {
    if (!skillsByCourse.has(link.course_id)) skillsByCourse.set(link.course_id, []);
    skillsByCourse.get(link.course_id).push(link.skill_id);
  }
  const offeringsByCourse = new Map();
  for (const row of offerings) {
    if (!offeringsByCourse.has(row.course_id)) offeringsByCourse.set(row.course_id, []);
    offeringsByCourse.get(row.course_id).push(row);
  }

  const shaped = courses.map(row => {
    const list = (offeringsByCourse.get(row.id) ?? []).map(offering => {
      const institution = institutionById.get(offering.institution_id);
      return {
        id: offering.id,
        institution: institution ? {
          id: institution.id,
          name: institution.name,
          sector: institution.sector,
          state: institution.state_norm ?? institution.state,
          address: institution.address,
          website: institution.website
        } : null,
        durationText: offering.duration_text,
        durationWeeks: offering.duration_weeks,
        courseUrl: offering.course_url,
        feeFree: offering.fee_free
      };
    }).sort((a, b) => String(a.institution?.name).localeCompare(String(b.institution?.name), 'en'));

    const states = list.map(offering => offering.institution?.state).filter(Boolean);
    const locations = [...new Set(states)].sort((a, b) => countBy(states).get(b) - countBy(states).get(a) || a.localeCompare(b));
    return {
      id: row.id,
      title: row.name_en || row.name_ms,
      titleMs: row.name_ms,
      description: row.description_en ?? null,
      descriptionMs: row.description_ms ?? null,
      careerProspects: row.career_prospects_en ?? null,
      careerProspectsMs: row.career_prospects_ms ?? null,
      code: row.code,
      category: row.category,
      qualificationLevel: row.qualification_level,
      levelGroup: row.level_group,
      provider: PORTAL_PROVIDER,
      skillIds: skillsByCourse.get(row.id) ?? [],
      // The portal export has no delivery method; TVET programmes are taught on campus.
      mode: 'In person',
      modeAssumed: true,
      location: locations[0] ?? null,
      locations,
      minWeeks: row.min_weeks,
      maxWeeks: row.max_weeks,
      fee: list.some(offering => offering.feeFree === true) ? 0 : null,
      isIllustrative: Boolean(row.is_illustrative),
      offerings: list
    };
  }).sort((a, b) => a.title.localeCompare(b.title, 'en'));

  return { source: 'supabase', loadedAt: new Date().toISOString(), courses: shaped, providers: [PORTAL_PROVIDER] };
}

async function fetchAll(client, table, columns = '*') {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select(columns).order('id').range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function loadCatalogueFromSupabase(client) {
  const [institutions, courses, offerings] = await Promise.all([
    fetchAll(client, 'institutions'),
    fetchAll(client, 'courses'),
    fetchAll(client, 'course_offerings',
      'id,course_id,institution_id,duration_text,duration_weeks,course_url,fee_free')
  ]);
  // course_skills has a composite key (no `id` column), so page it by course_id + skill_id.
  const courseSkills = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from('course_skills').select('course_id,skill_id')
      .order('course_id').order('skill_id').range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase course_skills: ${error.message}`);
    courseSkills.push(...data);
    if (data.length < PAGE) break;
  }
  return buildCatalogue({ institutions, courses, offerings, courseSkills });
}

// ── Store ──
let store = fixtureCatalogue();

export function setCourseCatalogue(next) {
  store = next;
}

export function getCourseCatalogue() {
  return store;
}

export function catalogueInfo() {
  return { source: store.source, courses: store.courses.length, loadedAt: store.loadedAt };
}

// Loads once (throws on failure) and then refreshes in the background; a failed refresh keeps
// the previous catalogue and logs the error.
export async function startCatalogue({ client, refreshMs = 10 * 60_000, logger = console } = {}) {
  setCourseCatalogue(await loadCatalogueFromSupabase(client));
  logger.log(`Course catalogue loaded from Supabase: ${store.courses.length} courses.`);
  if (!refreshMs) return { stop() {} };
  const timer = setInterval(async () => {
    try {
      setCourseCatalogue(await loadCatalogueFromSupabase(client));
    } catch (error) {
      logger.error('Course catalogue refresh failed; keeping previous data:', error.message);
    }
  }, refreshMs);
  timer.unref();
  return { stop: () => clearInterval(timer) };
}
