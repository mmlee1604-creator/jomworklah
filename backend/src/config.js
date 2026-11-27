import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  return {
    rootDir,
    nodeEnv,
    port: toInt(env.PORT, 8787),
    databaseUrl: env.DATABASE_URL || '',
    dbPath: env.DB_PATH || path.join(rootDir, 'data', 'jomworklah.db'),
    frontendOrigin: env.FRONTEND_ORIGIN || 'http://localhost:3000',
    staticDir: env.STATIC_DIR ? path.resolve(rootDir, env.STATIC_DIR) : null,
    ai: {
      provider: (env.AI_PROVIDER || 'rule').toLowerCase(),
      apiKey: env.AI_API_KEY || '',
      baseUrl: env.AI_BASE_URL || 'https://api.openai.com/v1',
      model: env.AI_MODEL || '',
      timeoutMs: toInt(env.AI_TIMEOUT_MS, 8000)
    },
    deepseek: {
      apiKey: env.DEEPSEEK_API_KEY || '',
      baseUrl: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: env.DEEPSEEK_MODEL || 'deepseek-flash',
      purpose: env.DEEPSEEK_OCR_PURPOSE || 'text_recognition',
      ocrTimeoutMs: toInt(env.DEEPSEEK_OCR_TIMEOUT_MS, 180000),
      timeoutMs: toInt(env.DEEPSEEK_TIMEOUT_MS, 60000),
      maxTextChars: toInt(env.DEEPSEEK_MAX_TEXT_CHARS, 120000)
    },
    resume: {
      maxFileBytes: toInt(env.RESUME_MAX_BYTES, 10 * 1024 * 1024)
    },
    // Course catalogue source. Server-side only: the service-role key must never reach the browser.
    supabase: {
      url: (env.SUPABASE_URL || '').trim(),
      serviceRoleKey: (env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
      refreshMs: toInt(env.CATALOGUE_REFRESH_MS, 10 * 60_000)
    },
    allowDevReset: toBool(env.ALLOW_DEV_RESET, false),
    rateLimit: {
      enabled: toBool(env.RATE_LIMIT, false),
      perMinute: toInt(env.RATE_LIMIT_PER_MINUTE, 120)
    },
    payloadLimit: env.PAYLOAD_LIMIT || '128kb'
  };
}
