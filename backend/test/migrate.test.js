import test from 'node:test';
import assert from 'node:assert/strict';
import { closeDatabase, openDatabase } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';

test('registered-user migration preserves existing users and dependent records', t => {
  const db = openDatabase(':memory:');
  t.after(() => closeDatabase(db));

  migrate(db);
  seed(db);
  db.prepare("INSERT INTO users(id, kind, source_persona) VALUES(?, 'demo_clone', 'aina')").run('legacy-user');
  db.prepare('INSERT INTO profiles(user_id, name) VALUES(?, ?)').run('legacy-user', 'Legacy Candidate');
  db.prepare('INSERT INTO journeys(user_id, started) VALUES(?, 1)').run('legacy-user');
  db.prepare('INSERT INTO sessions(token_hash, user_id) VALUES(?, ?)').run('legacy-token-hash', 'legacy-user');
  db.prepare('DELETE FROM schema_migrations WHERE version = 6').run();

  migrate(db);

  const legacyUser = db.prepare('SELECT id, kind, source_persona FROM users WHERE id = ?').get('legacy-user');
  assert.equal(legacyUser.id, 'legacy-user');
  assert.equal(legacyUser.kind, 'demo_clone');
  assert.equal(legacyUser.source_persona, 'aina');
  assert.equal(db.prepare('SELECT name FROM profiles WHERE user_id = ?').get('legacy-user').name, 'Legacy Candidate');
  assert.equal(db.prepare('SELECT started FROM journeys WHERE user_id = ?').get('legacy-user').started, 1);
  assert.equal(db.prepare('SELECT user_id FROM sessions WHERE token_hash = ?').get('legacy-token-hash').user_id, 'legacy-user');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);

  db.prepare("INSERT INTO users(id, kind) VALUES(?, 'registered')").run('registered-user');
  assert.throws(() => db.prepare("INSERT INTO users(id, kind) VALUES(?, 'unexpected')").run('invalid-user'));
});
