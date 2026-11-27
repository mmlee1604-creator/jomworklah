import test from 'node:test';
import assert from 'node:assert/strict';
import { api, demoToken, makeTestApp } from './helpers.js';

test('health and public catalogue are available without auth', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const health = await api(ctx.base, 'GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.data.status, 'ok');
  assert.equal(health.body.data.db, 'ok');
  assert.equal(health.body.data.catalogue.source, 'fixture');
  assert.equal(health.body.data.catalogue.courses, 10);

  const skills = await api(ctx.base, 'GET', '/api/skills');
  assert.equal(skills.status, 200);
  assert.equal(skills.body.data.skills.length, 18);
  assert.equal(skills.body.data.legend.length, 6);

  const interests = await api(ctx.base, 'GET', '/api/interests');
  assert.equal(interests.body.meta.count, 7);
  assert.equal(interests.body.data.data, 'Data & analytics');

  const providers = await api(ctx.base, 'GET', '/api/providers');
  assert.equal(providers.status, 200);
  assert.deepEqual(providers.body.data.elatih, { name: 'HRD Corp e-LATiH', url: 'https://elatih.hrdcorp.gov.my/' });
  assert.equal(Object.keys(providers.body.data).length, 5);
});

test('session bootstrap creates a guest and requires auth elsewhere', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const unauthorized = await api(ctx.base, 'GET', '/api/me');
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.body.error.code, 'UNAUTHORIZED');

  const session = await api(ctx.base, 'POST', '/api/session');
  assert.equal(session.status, 201);
  assert.equal(session.body.data.user.kind, 'guest');
  assert.equal(session.body.data.profile.name, 'Guest');
  assert.equal(session.body.data.journey.started, false);

  const me = await api(ctx.base, 'GET', '/api/me', { token: session.body.data.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.kind, 'guest');
  assert.equal(me.body.data.skills.length, 18);
});

test('demo personas clone without touching templates', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const personas = await api(ctx.base, 'GET', '/api/demo/personas');
  assert.equal(personas.status, 200);
  assert.equal(personas.body.data.length, 2);
  assert.deepEqual(personas.body.data.map(persona => persona.personaKey), ['aina', 'amir']);

  const first = await api(ctx.base, 'POST', '/api/demo/session', { body: { personaKey: 'aina' } });
  assert.equal(first.status, 201);
  assert.equal(first.body.data.user.kind, 'demo_clone');
  assert.equal(first.body.data.user.personaKey, 'aina');
  assert.equal(first.body.data.profile.name, 'Aina Rahman');
  assert.equal(first.body.data.journey.started, false);
  assert.equal(first.body.data.journey.targetJobId, null);
  assert.equal(personas.body.data[0].targetJobId, 'junior-data-analyst');

  const update = await api(ctx.base, 'PATCH', '/api/me/profile', {
    token: first.body.data.token,
    body: { name: 'Aina Clone' }
  });
  assert.equal(update.body.data.name, 'Aina Clone');

  const second = await api(ctx.base, 'POST', '/api/demo/session', { body: { personaKey: 'aina' } });
  assert.equal(second.body.data.profile.name, 'Aina Rahman');

  const missing = await api(ctx.base, 'POST', '/api/demo/session', { body: { personaKey: 'nobody' } });
  assert.equal(missing.status, 404);
});

test('career ranking and detail match prototype parity', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina');

  const careers = await api(ctx.base, 'GET', '/api/careers?sort=match', { token });
  assert.equal(careers.status, 200);
  const dataAnalyst = careers.body.data.find(career => career.id === 'junior-data-analyst');
  assert.deepEqual(
    { fit: dataAnalyst.fit, skillsMatch: dataAnalyst.skillsMatch, interestMatch: dataAnalyst.interestMatch },
    { fit: 61, skillsMatch: 54, interestMatch: 100 }
  );

  const filtered = await api(ctx.base, 'GET', '/api/careers?query=automotive&category=Engineering', { token });
  assert.deepEqual(filtered.body.data.map(career => career.id), ['automotive-technician']);

  const detail = await api(ctx.base, 'GET', '/api/careers/junior-data-analyst', { token });
  assert.equal(detail.status, 200);
  assert.deepEqual(detail.body.data.compatibility, { skillsMatch: 54, interestMatch: 100, fit: 61 });
  assert.deepEqual(detail.body.data.requirements.map(requirement => requirement.skillId),
    ['excel', 'sql', 'python', 'data-viz', 'communication']);
  const positive = detail.body.data.gaps.filter(requirement => requirement.gap > 0);
  assert.deepEqual(positive.map(requirement => requirement.skillId), ['sql', 'data-viz', 'python']);
  assert.equal(typeof detail.body.data.explanation, 'string');
  assert.ok(detail.body.data.explanation.includes('54%'));

  const unknown = await api(ctx.base, 'GET', '/api/careers/flying-car-pilot', { token });
  assert.equal(unknown.status, 404);
});

test('training is filtered and ranked by relevance', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  const suggested = await api(ctx.base, 'GET', '/api/training?view=suggested', { token });
  assert.equal(suggested.status, 200);
  assert.ok(suggested.body.data.length > 0);
  assert.ok(suggested.body.data.every(course => course.relevance > 0));
  const suggestedIds = suggested.body.data.map(course => course.id);
  assert.ok(suggestedIds.includes('sql-foundations'));
  assert.ok(suggestedIds.includes('dashboard-design'));

  const all = await api(ctx.base, 'GET', '/api/training?view=all', { token });
  assert.equal(all.body.data.length, 10);

  const byMode = await api(ctx.base, 'GET', '/api/training?view=all&mode=In%20person', { token });
  assert.ok(byMode.body.data.every(course => course.mode === 'In person'));

  const detail = await api(ctx.base, 'GET', '/api/training/sql-foundations', { token });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.provider, 'elatih');
  assert.equal(detail.body.data.providerName, 'HRD Corp e-LATiH');

  const bySource = await api(ctx.base, 'GET', '/api/training?view=all&source=tvet', { token });
  assert.ok(bySource.body.data.length > 0);
  assert.ok(bySource.body.data.every(course => course.provider === 'tvet'));
  assert.equal(bySource.body.meta.providers.tvet.name, 'UP_TVET');
});

test('profile, skills and interests can be updated with validation', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina');

  const profile = await api(ctx.base, 'PATCH', '/api/me/profile', {
    token,
    body: { name: 'Aina Test', weeklyHours: 8, learningMode: 'In person' }
  });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.data.name, 'Aina Test');
  assert.equal(profile.body.data.weeklyHours, 8);

  const skills = await api(ctx.base, 'PUT', '/api/me/skills', {
    token,
    body: { scores: { sql: 5 } }
  });
  assert.equal(skills.status, 200);
  assert.equal(skills.body.data.find(skill => skill.id === 'sql').evidenceLevel, 5);

  const one = await api(ctx.base, 'PATCH', '/api/me/skills/python', {
    token,
    body: { evidenceLevel: 4 }
  });
  assert.equal(one.status, 200);
  assert.equal(one.body.data.evidenceLevel, 4);

  const interests = await api(ctx.base, 'PUT', '/api/me/interests', {
    token,
    body: { interests: ['business'] }
  });
  assert.deepEqual(interests.body.data, ['business']);

  const badHours = await api(ctx.base, 'PATCH', '/api/me/profile', { token, body: { weeklyHours: 99 } });
  assert.equal(badHours.status, 400);
  assert.equal(badHours.body.error.code, 'VALIDATION_ERROR');

  const badSkill = await api(ctx.base, 'PUT', '/api/me/skills', { token, body: { scores: { telepathy: 3 } } });
  assert.equal(badSkill.status, 400);

  const badInterest = await api(ctx.base, 'PUT', '/api/me/interests', { token, body: { interests: ['flying'] } });
  assert.equal(badInterest.status, 400);
});

test('roadmap generation, task toggles and regeneration preserve completions', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  const empty = await api(ctx.base, 'GET', '/api/me/roadmap', { token });
  assert.equal(empty.status, 200);
  assert.equal(empty.body.data, null);

  const generated = await api(ctx.base, 'POST', '/api/me/roadmap', {
    token,
    body: { weeklyHours: 5, startDate: '2026-11-20' }
  });
  assert.equal(generated.status, 201);
  assert.equal(generated.body.data.progress.total, 11);
  assert.deepEqual(generated.body.data.phases.map(phase => phase.weeks), [2, 3, 2, 1]);
  assert.equal(generated.body.data.roadmap.targetJobId, 'junior-data-analyst');

  const done = await api(ctx.base, 'PATCH', '/api/me/roadmap/tasks/skill-sql', {
    token,
    body: { completed: true }
  });
  assert.equal(done.status, 200);
  assert.equal(done.body.data.progress.done, 1);
  assert.equal(done.body.data.progress.percent, 9);

  const unknownTask = await api(ctx.base, 'PATCH', '/api/me/roadmap/tasks/skill-telepathy', {
    token,
    body: { completed: true }
  });
  assert.equal(unknownTask.status, 404);

  const regenerated = await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });
  assert.equal(regenerated.status, 201);
  assert.equal(regenerated.body.data.progress.done, 1);

  const reset = await api(ctx.base, 'POST', '/api/me/roadmap/reset-progress', { token });
  assert.equal(reset.status, 200);
  assert.equal(reset.body.data.done, 0);
});

test('changing target invalidates the roadmap and saved courses', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'campaign-measurement' } });
  await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });
  const target = await api(ctx.base, 'PUT', '/api/me/target', {
    token,
    body: { jobId: 'automotive-technician' }
  });
  assert.equal(target.status, 200);
  assert.equal(target.body.data.invalidated, true);
  assert.equal(target.body.data.journey.targetJobId, 'automotive-technician');
  assert.deepEqual(target.body.data.journey.added, []);

  const roadmap = await api(ctx.base, 'GET', '/api/me/roadmap', { token });
  assert.equal(roadmap.body.data, null);

  const courses = await api(ctx.base, 'GET', '/api/me/courses', { token });
  assert.deepEqual(courses.body.data, []);

  const same = await api(ctx.base, 'PUT', '/api/me/target', { token, body: { target: 'automotive-technician' } });
  assert.equal(same.body.data.invalidated, false);

  const unknown = await api(ctx.base, 'PUT', '/api/me/target', { token, body: { jobId: 'nope' } });
  assert.equal(unknown.status, 404);
});

test('saved courses appear in the roadmap training phase', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const untargeted = await demoToken(ctx.base, 'aina');
  const early = await api(ctx.base, 'POST', '/api/me/courses', { token: untargeted, body: { courseId: 'campaign-measurement' } });
  assert.equal(early.status, 409);
  assert.equal(early.body.error.code, 'TARGET_REQUIRED');

  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  const saved = await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'campaign-measurement' } });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.data.provider, 'mahir');

  const duplicate = await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'campaign-measurement' } });
  assert.equal(duplicate.status, 409);

  const list = await api(ctx.base, 'GET', '/api/me/courses', { token });
  assert.deepEqual(list.body.data.map(course => course.id), ['campaign-measurement']);

  const roadmap = await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });
  const trainingIds = roadmap.body.data.phases.find(phase => phase.id === 'training').tasks.map(task => task.id);
  assert.ok(trainingIds.includes('course-campaign-measurement'));

  const removed = await api(ctx.base, 'DELETE', '/api/me/courses/campaign-measurement', { token });
  assert.equal(removed.status, 204);

  const unknown = await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'nope' } });
  assert.equal(unknown.status, 404);
});

test('roadmap generation requires a target and a valid body', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const session = await api(ctx.base, 'POST', '/api/session');
  const token = session.body.data.token;

  const noTarget = await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });
  assert.equal(noTarget.status, 409);
  assert.equal(noTarget.body.error.code, 'TARGET_REQUIRED');

  const invalid = await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: {} });
  assert.equal(invalid.status, 400);
});

test('journey clear and user deletion remove derived data', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'sql-foundations' } });
  await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });

  const cleared = await api(ctx.base, 'DELETE', '/api/me/journey', { token });
  assert.equal(cleared.status, 204);

  const me = await api(ctx.base, 'GET', '/api/me', { token });
  assert.equal(me.body.data.journey.targetJobId, null);
  assert.equal(me.body.data.roadmap, null);

  const courses = await api(ctx.base, 'GET', '/api/me/courses', { token });
  assert.deepEqual(courses.body.data, []);

  const deleted = await api(ctx.base, 'DELETE', '/api/me', { token });
  assert.equal(deleted.status, 204);

  const gone = await api(ctx.base, 'GET', '/api/me', { token });
  assert.equal(gone.status, 401);
});

test('AI assessment extracts skills and interests from a narrative', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina');

  const result = await api(ctx.base, 'POST', '/api/ai/assessment', {
    token,
    body: { narrative: 'I used Excel to track stock and wrote SQL queries for a class project.' }
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.provider, 'rule');
  const skillIds = result.body.data.detectedSkills.map(skill => skill.skillId);
  assert.ok(skillIds.includes('excel'));
  assert.ok(skillIds.includes('sql'));
  assert.ok(result.body.data.suggestedInterests.includes('data'));

  const empty = await api(ctx.base, 'POST', '/api/ai/assessment', { token, body: { narrative: '' } });
  assert.equal(empty.status, 400);

  const explain = await api(ctx.base, 'POST', '/api/ai/explain-match', {
    token,
    body: { jobId: 'junior-data-analyst' }
  });
  assert.equal(explain.status, 200);
  assert.equal(explain.body.data.compatibility.fit, 61);
});

test('dev reset is blocked unless explicitly enabled', async t => {
  const disabled = await makeTestApp({ allowDevReset: false });
  t.after(() => disabled.close());
  const blocked = await api(disabled.base, 'POST', '/api/dev/reset');
  assert.equal(blocked.status, 403);

  const enabled = await makeTestApp({ allowDevReset: true });
  t.after(() => enabled.close());
  const reset = await api(enabled.base, 'POST', '/api/dev/reset');
  assert.equal(reset.status, 200);
  assert.equal(reset.body.data.reset, true);
  assert.equal(reset.body.data.counts.jobs, 8);
});

test('unknown routes and invalid JSON return structured errors', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const missing = await api(ctx.base, 'GET', '/api/does-not-exist');
  assert.equal(missing.status, 401);

  const token = await demoToken(ctx.base, 'aina');
  const missingAuthed = await api(ctx.base, 'GET', '/api/does-not-exist', { token });
  assert.equal(missingAuthed.status, 404);
  assert.equal(missingAuthed.body.error.code, 'NOT_FOUND');

  const response = await fetch(`${ctx.base}/api/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json'
  });
  assert.equal(response.status, 400);
  const parsed = await response.json();
  assert.equal(parsed.error.code, 'INVALID_JSON');
});
