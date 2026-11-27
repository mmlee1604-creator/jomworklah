import { createAiAdapter } from './ai/index.js';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { closeDatabase, openPostgresDatabase } from './db/connection.js';
import { startCatalogue } from './services/course-catalogue.js';

const config = loadConfig();

let db;
try {
  db = await openPostgresDatabase(config.databaseUrl);
  const { count } = await db.prepare('SELECT COUNT(*) AS count FROM skills').get();
  if (Number(count) === 0) {
    throw new Error('Supabase application tables are empty. Apply app-schema.sql and seed.sql before starting the API.');
  }
} catch (error) {
  console.error('Failed to prepare the Supabase database:', error);
  await closeDatabase(db);
  process.exit(1);
}

// Courses come from Supabase. Without credentials the API still starts, but only with the
// 10 illustrative sample courses, and says so in the log and on /health.
let catalogue = { stop() {} };
if (config.supabase.url && config.supabase.serviceRoleKey) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(config.supabase.url, config.supabase.serviceRoleKey, { auth: { persistSession: false } });
    catalogue = await startCatalogue({ client, refreshMs: config.supabase.refreshMs });
  } catch (error) {
    console.error('Failed to load the course catalogue from Supabase:', error.message);
    await closeDatabase(db);
    process.exit(1);
  }
} else {
  if (config.nodeEnv === 'production') {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production for the course catalogue.');
    await closeDatabase(db);
    process.exit(1);
  }
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set: serving only the 10 illustrative sample courses.');
}

const app = createApp({ db, config, ai: createAiAdapter(config) });

const server = app.listen(config.port, () => {
  console.log(`Jom Kerja Lah API listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  catalogue.stop();
  server.close(() => {
    closeDatabase(db).then(() => process.exit(0), error => {
      console.error('Failed to close the Supabase database:', error);
      process.exit(1);
    });
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
