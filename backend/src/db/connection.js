import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function postgresPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export function createPostgresDatabase(queryable, { pool = null, isTransaction = false } = {}) {
  return {
    isPostgres: true,
    isTransaction,
    async query(sql, values = []) {
      return queryable.query(postgresPlaceholders(sql), values);
    },
    async exec(sql) {
      return queryable.query(sql);
    },
    prepare(sql) {
      return {
        async all(...values) {
          const result = await queryable.query(postgresPlaceholders(sql), values);
          return result.rows;
        },
        async get(...values) {
          const result = await queryable.query(postgresPlaceholders(sql), values);
          return result.rows[0];
        },
        async run(...values) {
          const result = await queryable.query(postgresPlaceholders(sql), values);
          return { changes: result.rowCount ?? 0 };
        }
      };
    },
    async transaction(callback) {
      if (isTransaction) return callback(this);
      const client = await pool.connect();
      const transactionDb = createPostgresDatabase(client, { pool, isTransaction: true });
      try {
        await client.query('BEGIN');
        const result = await callback(transactionDb);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // Preserve the original transaction error.
        }
        throw error;
      } finally {
        client.release();
      }
    },
    async close() {
      if (pool) await pool.end();
    }
  };
}

export function openDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA busy_timeout = 5000;');
  return db;
}

export async function openPostgresDatabase(connectionString) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to connect to the Supabase PostgreSQL database.');
  }
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    max: 10
  });
  pool.on('error', error => console.error('Unexpected PostgreSQL pool error:', error));

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    await pool.end();
    throw new Error(`Could not connect to Supabase PostgreSQL: ${error.message}`, { cause: error });
  }

  return createPostgresDatabase(pool, { pool });
}

export function transaction(db, fn) {
  if (db.isPostgres) return db.transaction(fn);
  // Nested calls join the outer transaction so composed service calls stay atomic.
  if (db.isTransaction) return fn(db);
  db.exec('BEGIN');
  try {
    const result = fn(db);
    if (result && typeof result.then === 'function') {
      return result.then(value => {
        db.exec('COMMIT');
        return value;
      }).catch(error => {
        try {
          db.exec('ROLLBACK');
        } catch {
          // Preserve the original transaction error.
        }
        throw error;
      });
    }
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // rollback is best-effort; surface the original error
    }
    throw error;
  }
}

export function closeDatabase(db) {
  if (!db) return;
  if (db.isPostgres) return db.close();
  try {
    db.close();
  } catch {
    // already closed
  }
}
