import test from 'node:test';
import assert from 'node:assert/strict';
import { closeDatabase, openDatabase } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';
import { expectedCounts, jobs } from '../src/db/seed-data.js';
import { SeedValidationError, validateSeedData } from '../src/db/validate-seed.js';

test('seed data passes validation', () => {
  assert.equal(validateSeedData(), true);
});

test('seed validation rejects requirement weights that do not sum to one', () => {
  const broken = jobs.map((job, index) => (index === 0
    ? { ...job, requirements: job.requirements.map((req, reqIndex) => (reqIndex === 0 ? { ...req, weight: req.weight + 0.5 } : req)) }
    : job));
  assert.throws(() => validateSeedData({ jobs: broken }), SeedValidationError);
});

test('seeding is idempotent and catalogue counts match', () => {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const first = seed(db);
    const second = seed(db);
    assert.deepEqual(first, second);
    assert.deepEqual(second, {
      skills: expectedCounts.skills,
      interests: expectedCounts.interests,
      jobs: expectedCounts.jobs,
      personas: expectedCounts.personas
    });

    const orphanSkills = db.prepare(`
      SELECT COUNT(*) AS n FROM job_requirements jr
      LEFT JOIN skills s ON s.id = jr.skill_id WHERE s.id IS NULL
    `).get().n;
    assert.equal(orphanSkills, 0);

    for (const job of jobs) {
      const sum = db.prepare('SELECT SUM(weight) AS total FROM job_requirements WHERE job_id = ?').get(job.id).total;
      assert.ok(Math.abs(sum - 1) < 1e-6, `${job.id} weights sum to ${sum}`);
    }
  } finally {
    closeDatabase(db);
  }
});

test('demo templates target Aina and Amir roles', () => {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const rows = db.prepare(`
      SELECT u.persona_key, j.target_job_id FROM users u
      JOIN journeys j ON j.user_id = u.id
      WHERE u.kind = 'demo_template' ORDER BY u.persona_key
    `).all();
    assert.deepEqual(rows.map(row => [row.persona_key, row.target_job_id]), [
      ['aina', 'junior-data-analyst'],
      ['amir', 'automotive-technician']
    ]);
  } finally {
    closeDatabase(db);
  }
});
