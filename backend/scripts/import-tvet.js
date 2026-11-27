import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { backup } from 'node:sqlite';
import { loadConfig } from '../src/config.js';
import { openDatabase, closeDatabase } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';
import { importTvetCourses, normalizeTvetRow } from '../src/db/import-tvet.js';

const args = process.argv.slice(2);
const input = args[0];
const pythonFlag = args.indexOf('--python');
if (!input || input.startsWith('--')) throw new Error('Usage: npm run db:import:tvet -- <courses.xlsx|courses.json> [--python <python-executable>]');
let rows;
if (path.extname(input).toLowerCase() === '.xlsx') {
  const reader = fileURLToPath(new URL('./read-tvet-xlsx.py', import.meta.url));
  const result = spawnSync(pythonFlag >= 0 ? args[pythonFlag + 1] : 'python', [reader, input], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`Cannot read workbook. Use --python with a working Python 3 executable. ${result.error?.message ?? result.stderr}`);
  rows = JSON.parse(result.stdout);
} else if (path.extname(input).toLowerCase() === '.json') {
  rows = JSON.parse(fs.readFileSync(input, 'utf8'));
} else throw new Error('Expected an .xlsx or .json file');
if (!Array.isArray(rows) || !rows.length) throw new Error('No rows found');
rows.forEach(normalizeTvetRow);
const config = loadConfig();
const existed = fs.existsSync(config.dbPath);
const db = openDatabase(config.dbPath);
try {
  if (existed) {
    const destination = `${config.dbPath}.before-tvet-${Date.now()}.bak`;
    await backup(db, destination);
    console.log(`Database backup: ${destination}`);
  }
  migrate(db);
  // Existing user/template data is left intact. Seed only a new catalogue.
  if (!db.prepare('SELECT COUNT(*) AS n FROM skills').get().n) seed(db);
  console.log(JSON.stringify(importTvetCourses(db, rows), null, 2));
} finally {
  closeDatabase(db);
}
