import { once } from 'node:events';
import { createAiAdapter } from '../src/ai/index.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { closeDatabase, openDatabase } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';
import { fixtureCatalogue, setCourseCatalogue } from '../src/services/course-catalogue.js';

export async function makeTestApp(overrides = {}, appDependencies = {}) {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);
  // Tests never touch Supabase: they run against the 10-course fixture.
  setCourseCatalogue(fixtureCatalogue());

  const config = {
    ...loadConfig({}),
    nodeEnv: 'test',
    staticDir: null,
    rateLimit: { enabled: false, perMinute: 120 },
    ...overrides
  };

  const app = createApp({ db, config, ai: createAiAdapter(config), ...appDependencies });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  return {
    db,
    app,
    config,
    base: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise(resolve => server.close(resolve));
      closeDatabase(db);
    }
  };
}

export async function api(base, method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

export async function demoToken(base, personaKey = 'aina', { target = null } = {}) {
  const result = await api(base, 'POST', '/api/demo/session', { body: { personaKey } });
  if (result.status !== 201) throw new Error(`demo session failed: ${JSON.stringify(result.body)}`);
  const { token } = result.body.data;
  if (target) {
    const selected = await api(base, 'PUT', '/api/me/target', { token, body: { jobId: target } });
    if (selected.status !== 200) throw new Error(`target failed: ${JSON.stringify(selected.body)}`);
  }
  return token;
}
