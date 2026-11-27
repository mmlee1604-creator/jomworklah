import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { Router } from 'express';
import { createAiAdapter } from './ai/index.js';
import { createDeepSeekOcrClient } from './ai/deepseek-ocr.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, AppError } from './middleware/errors.js';
import { notFound } from './middleware/not-found.js';
import { sessionsRouter } from './routes/sessions.js';
import { catalogueRouter } from './routes/catalogue.js';
import { devRouter } from './routes/dev.js';
import { profileRouter } from './routes/profile.js';
import { careersRouter } from './routes/careers.js';
import { trainingRouter } from './routes/training.js';
import { roadmapRouter } from './routes/roadmap.js';
import { aiRouter } from './routes/ai.js';
import { parseResumeRouter } from './routes/parse-resume.js';
import { catalogueInfo } from './services/course-catalogue.js';

function cors(config) {
  const allowed = String(config.frontendOrigin || '').split(',').map(origin => origin.trim()).filter(Boolean);
  return (req, res, next) => {
    const origin = req.get('origin');
    if (origin && allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    return next();
  };
}

function rateLimiter({ perMinute }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || now - entry.start > 60_000) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }
    entry.count += 1;
    if (entry.count > perMinute) {
      return next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again shortly.'));
    }
    return next();
  };
}

export function createApp({
  db,
  config,
  ai = createAiAdapter(config),
  deepseek = config.deepseek.apiKey ? createDeepSeekOcrClient(config.deepseek) : null
}) {
  const app = express();
  app.locals.db = db;
  app.locals.config = config;
  app.locals.ai = ai;
  app.locals.deepseek = deepseek;

  app.disable('x-powered-by');
  app.use((req, _res, next) => {
    req.id = crypto.randomUUID();
    next();
  });
  app.use(cors(config));
  app.use(express.json({ limit: config.payloadLimit }));

  if (config.rateLimit.enabled) app.use(rateLimiter(config.rateLimit));

  const health = (req, res, next) => {
    try {
      req.app.locals.db.prepare('SELECT 1 AS ok').get();
      res.json({ data: { status: 'ok', db: 'ok', catalogue: catalogueInfo() } });
    } catch (error) {
      next(error);
    }
  };
  app.get('/health', health);
  app.get('/api/health', health);

  app.use('/api', sessionsRouter());
  app.use('/api', catalogueRouter());
  app.use('/api', devRouter());

  const protectedRouter = Router();
  protectedRouter.use(requireAuth);
  protectedRouter.use(profileRouter());
  protectedRouter.use(careersRouter());
  protectedRouter.use(trainingRouter());
  protectedRouter.use(roadmapRouter());
  protectedRouter.use(aiRouter());
  protectedRouter.use(parseResumeRouter(config));
  app.use('/api', protectedRouter);

  if (config.staticDir && fs.existsSync(config.staticDir)) {
    app.use(express.static(config.staticDir));
    const indexFile = path.join(config.staticDir, 'index.html');
    if (fs.existsSync(indexFile)) {
      app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api') || !req.accepts('html')) return next();
        return res.sendFile(indexFile);
      });
    }
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
