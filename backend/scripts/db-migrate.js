import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { closeDatabase, openPostgresDatabase } from '../src/db/connection.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig();
const db = await openPostgresDatabase(config.databaseUrl);

try {
  for (const file of ['schema.sql', 'app-schema.sql']) {
    const sql = await fs.readFile(path.join(root, 'supabase', file), 'utf8');
    await db.exec(sql);
    console.log(`Applied Supabase SQL: ${file}`);
  }
} finally {
  await closeDatabase(db);
}
