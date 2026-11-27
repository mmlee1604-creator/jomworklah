import test from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresDatabase } from '../src/db/connection.js';

test('Postgres adapter translates positional placeholders and returns rows/affected counts', async () => {
  const calls = [];
  const db = createPostgresDatabase({
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT')) return { rows: [{ id: 'skill-sql' }], rowCount: 1 };
      return { rows: [], rowCount: 2 };
    }
  }, { isTransaction: true });

  assert.deepEqual(await db.prepare('SELECT id FROM skills WHERE user_id = ? AND id = ?').get('u1', 'sql'), {
    id: 'skill-sql'
  });
  assert.deepEqual(await db.prepare('DELETE FROM profile_skills WHERE user_id = ?').run('u1'), { changes: 2 });
  assert.deepEqual(calls, [
    { sql: 'SELECT id FROM skills WHERE user_id = $1 AND id = $2', values: ['u1', 'sql'] },
    { sql: 'DELETE FROM profile_skills WHERE user_id = $1', values: ['u1'] }
  ]);
});

test('Postgres adapter commits successful transactions and rolls back failures', async () => {
  const statements = [];
  const pool = {
    async connect() {
      return {
        async query(sql) {
          statements.push(sql);
          if (sql === 'SELECT fail') throw new Error('query failed');
          return { rows: [], rowCount: 1 };
        },
        release() {
          statements.push('RELEASE');
        }
      };
    }
  };
  const db = createPostgresDatabase(pool, { pool });

  await db.transaction(async tx => {
    await tx.prepare('INSERT INTO users(id) VALUES(?)').run('u1');
  });
  await assert.rejects(db.transaction(async tx => {
    await tx.query('SELECT fail');
  }), /query failed/);

  assert.deepEqual(statements, [
    'BEGIN',
    'INSERT INTO users(id) VALUES($1)',
    'COMMIT',
    'RELEASE',
    'BEGIN',
    'SELECT fail',
    'ROLLBACK',
    'RELEASE'
  ]);
});
