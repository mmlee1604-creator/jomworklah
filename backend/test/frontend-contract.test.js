import test from 'node:test';
import assert from 'node:assert/strict';
import { api, demoToken, makeTestApp } from './helpers.js';

test('demo session returns the prototype profile and journey shape', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const session = await api(ctx.base, 'POST', '/api/demo/session', { body: { personaKey: 'aina' } });
  assert.equal(session.status, 201);
  const { token, profile, journey, roadmap } = session.body.data;
  assert.ok(token);

  assert.equal(profile.field, 'Information Technology');
  assert.equal(profile.hours, 5);
  assert.equal(profile.mode, 'Online');
  assert.equal(profile.mbti, 'INFJ');
  assert.deepEqual(profile.holland, []);
  assert.deepEqual(profile.interests, ['data', 'technology']);
  assert.equal(profile.scores.excel, 4);
  assert.equal(profile.scores.networking, 0);
  assert.equal(Object.keys(profile.scores).length, 18);

  assert.deepEqual(journey, {
    started: false,
    target: null,
    targetJobId: null,
    preferences: { location: 'Selangor', budget: 'RM0–RM500', mode: 'Online', hours: 5, interests: ['data', 'technology'] },
    roadmap: null,
    added: [],
    completed: []
  });
  assert.equal(roadmap, null);
});

test('onboarding saves the whole profile form and starts the journey', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'amir');

  const saved = await api(ctx.base, 'PUT', '/api/me/onboarding', {
    token,
    body: {
      name: 'Amir H', qualification: 'Certificate', field: 'Automotive', experience: 'Workshop', projects: 'Checklist',
      location: 'Johor', budget: 'Flexible', mode: 'Hybrid', hours: 12,
      interests: ['automotive'], scores: { tools: 5, sql: 2 },
      mbti: 'ENTP', holland: ['I', 'R', 'C']
    }
  });
  assert.equal(saved.status, 200);
  const { profile, journey } = saved.body.data;
  assert.equal(journey.started, true);
  assert.equal(journey.target, null);
  assert.deepEqual(journey.preferences, { location: 'Johor', budget: 'Flexible', mode: 'Hybrid', hours: 12, interests: ['automotive'] });
  assert.equal(profile.field, 'Automotive');
  assert.equal(profile.fieldOfStudy, 'Automotive');
  assert.equal(profile.mbti, 'ENTP');
  assert.deepEqual(profile.holland, ['I', 'R', 'C']);
  assert.equal(profile.scores.tools, 5);
  assert.equal(profile.scores.sql, 2);

  const blankName = await api(ctx.base, 'PUT', '/api/me/onboarding', { token, body: { name: '   ' } });
  assert.equal(blankName.status, 400);

  const unknownSkill = await api(ctx.base, 'PUT', '/api/me/onboarding', {
    token, body: { name: 'Changed', scores: { telepathy: 3 } }
  });
  assert.equal(unknownSkill.status, 400);
  const me = await api(ctx.base, 'GET', '/api/me', { token });
  assert.equal(me.body.data.profile.name, 'Amir H', 'failed onboarding must roll back');
});

test('profile patch accepts frontend aliases', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina');

  const patched = await api(ctx.base, 'PATCH', '/api/me/profile', {
    token, body: { field: 'Data Science', hours: 8, mode: 'In person', mbti: 'INTP', holland: ['S', 'A'] }
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.data.fieldOfStudy, 'Data Science');
  assert.equal(patched.body.data.hours, 8);
  assert.equal(patched.body.data.learningMode, 'In person');
  assert.equal(patched.body.data.mbti, 'INTP');
  assert.deepEqual(patched.body.data.holland, ['S', 'A']);

  const invalidHolland = await api(ctx.base, 'PATCH', '/api/me/profile', {
    token, body: { holland: ['R', 'R'] }
  });
  assert.equal(invalidHolland.status, 400);
});

test('career list carries everything the cards and role modal render', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina');

  const careers = await api(ctx.base, 'GET', '/api/careers', { token });
  const jda = careers.body.data.find(career => career.id === 'junior-data-analyst');
  assert.equal(jda.fit, 61);
  assert.deepEqual(jda.tags, ['data', 'technology']);
  assert.equal(jda.requirements.length, 5);
  assert.deepEqual(Object.keys(jda.requirements[0]).sort(), ['level', 'skillId', 'weight']);
  assert.equal(jda.project.length, 2);
  assert.deepEqual(jda.project, jda.projects);
  assert.equal(jda.responsibilities.length, 3);
  assert.deepEqual(jda.progression, ['Junior Data Analyst', 'Data Analyst', 'Analytics Lead']);
});

test('roadmap freezes skills and suggested courses at generation', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  const generated = await api(ctx.base, 'POST', '/api/me/roadmap', {
    token, body: { hours: '5', 'start-date': '' }
  });
  assert.equal(generated.status, 201);
  const state = generated.body.data;
  assert.deepEqual(state.roadmap.skillIds, ['sql', 'data-viz', 'python']);
  assert.deepEqual(state.roadmap.courseIds, ['dashboard-design', 'sql-foundations']);
  assert.equal(state.roadmap.startDate, null);
  assert.equal(state.progress.next.id, 'skill-sql');
  assert.equal(state.progress.next.title, 'Study the fundamentals of SQL and document a practice example.');

  const courseTask = state.phases.find(phase => phase.id === 'training').tasks[0];
  assert.equal(courseTask.course.id, courseTask.courseId);
  assert.equal(courseTask.course.provider, 'mahir');
  assert.equal(courseTask.course.providerUrl, 'https://www.mymahir.my/');

  const duplicate = await api(ctx.base, 'POST', '/api/me/courses', { token, body: { id: 'sql-foundations' } });
  assert.equal(duplicate.status, 409);

  await api(ctx.base, 'PUT', '/api/me/skills', { token, body: { scores: { sql: 5, 'data-viz': 5, python: 5 } } });
  const frozen = (await api(ctx.base, 'GET', '/api/me/roadmap', { token })).body.data;
  assert.deepEqual(frozen.phases[0].tasks.map(task => task.id), ['skill-sql', 'skill-data-viz', 'skill-python']);

  await api(ctx.base, 'POST', '/api/me/courses', { token, body: { courseId: 'campaign-measurement' } });
  const withSaved = (await api(ctx.base, 'GET', '/api/me/roadmap', { token })).body.data;
  assert.deepEqual(withSaved.phases.find(phase => phase.id === 'training').tasks.map(task => task.id), [
    'course-dashboard-design', 'course-sql-foundations', 'course-campaign-measurement', 'training-schedule'
  ]);

  await api(ctx.base, 'PATCH', '/api/me/roadmap/tasks/skill-sql', { token, body: { completed: true } });
  const me = (await api(ctx.base, 'GET', '/api/me', { token })).body.data;
  assert.deepEqual(me.journey.added, ['campaign-measurement']);
  assert.deepEqual(me.journey.completed, ['skill-sql']);
  assert.equal(me.journey.roadmap.hours, 5);
  assert.deepEqual(me.journey.roadmap.courseIds, ['dashboard-design', 'sql-foundations']);
  assert.equal(me.roadmap.progress.next.id, 'skill-data-viz');

  const regenerated = (await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } })).body.data;
  assert.deepEqual(regenerated.roadmap.skillIds, []);
  assert.deepEqual(regenerated.phases[0].tasks.map(task => task.id), ['foundation-inventory', 'foundation-review']);
});

test('roadmaps generated before snapshots are frozen on first read', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 5 } });
  ctx.db.prepare('UPDATE roadmaps SET skill_ids_json = NULL, course_ids_json = NULL').run();

  const read = (await api(ctx.base, 'GET', '/api/me/roadmap', { token })).body.data;
  assert.deepEqual(read.roadmap.skillIds, ['sql', 'data-viz', 'python']);
  const row = ctx.db.prepare('SELECT skill_ids_json FROM roadmaps').get();
  assert.equal(row.skill_ids_json, JSON.stringify(['sql', 'data-viz', 'python']));
});

test('sample reset restores the persona profile but keeps the journey', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await demoToken(ctx.base, 'aina', { target: 'junior-data-analyst' });

  await api(ctx.base, 'PUT', '/api/me/onboarding', {
    token, body: {
      name: 'Edited', hours: 12, interests: ['creative'], scores: { excel: 0 },
      mbti: 'ENTJ', holland: ['E', 'C']
    }
  });
  await api(ctx.base, 'POST', '/api/me/roadmap', { token, body: { weeklyHours: 12 } });

  const reset = await api(ctx.base, 'POST', '/api/me/profile/sample-reset', { token });
  assert.equal(reset.status, 200);
  const { profile, journey } = reset.body.data;
  assert.equal(profile.name, 'Aina Rahman');
  assert.equal(profile.hours, 5);
  assert.equal(profile.mbti, 'INFJ');
  assert.deepEqual(profile.holland, []);
  assert.deepEqual(profile.interests, ['data', 'technology']);
  assert.equal(profile.scores.excel, 4);
  assert.equal(journey.started, true);
  assert.equal(journey.target, 'junior-data-analyst');
  assert.equal(journey.roadmap.hours, 12);

  const guest = await api(ctx.base, 'POST', '/api/session');
  const refused = await api(ctx.base, 'POST', '/api/me/profile/sample-reset', { token: guest.body.data.token });
  assert.equal(refused.status, 409);
  assert.equal(refused.body.error.code, 'NOT_A_DEMO_CLONE');
});
