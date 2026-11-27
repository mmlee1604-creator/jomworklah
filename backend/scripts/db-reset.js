import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { closeDatabase, openPostgresDatabase } from '../src/db/connection.js';

const config = loadConfig();
if (config.nodeEnv === 'production' || process.env.CONFIRM_SUPABASE_RESET !== 'YES') {
  throw new Error('Refusing to reset Supabase. Use a non-production database and set CONFIRM_SUPABASE_RESET=YES.');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = await openPostgresDatabase(config.databaseUrl);

try {
  await db.exec(`
    TRUNCATE TABLE
      users, job_projects, job_progression, job_responsibilities, job_tags,
      job_requirements, jobs, interests, skills
    CASCADE
  `);
  const sql = await fs.readFile(path.join(root, 'supabase', 'seed.sql'), 'utf8');
  await db.exec(sql);
  console.log('Supabase application data reset and reference data reseeded.');
} finally {
  await closeDatabase(db);
}
