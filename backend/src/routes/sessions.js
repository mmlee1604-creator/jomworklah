import { Router } from 'express';
import { createGuestSession } from '../services/session-service.js';
import { createDemoSession, listPersonas } from '../services/demo-service.js';
import { getMe } from '../services/profile-service.js';
import { validateBody } from '../middleware/validate.js';
import { personaSchema } from '../validation/schemas.js';

export function sessionsRouter() {
  const router = Router();

  router.post('/session', async (req, res) => {
    const db = req.app.locals.db;
    const { token, user } = await createGuestSession(db);
    res.status(201).json({ data: { token, ...await getMe(db, user.id, user) } });
  });

  router.get('/demo/personas', async (req, res) => {
    const personas = await listPersonas(req.app.locals.db);
    res.json({ data: personas, meta: { count: personas.length } });
  });

  router.post('/demo/session', validateBody(personaSchema), async (req, res) => {
    const db = req.app.locals.db;
    const { token, userId, personaKey } = await createDemoSession(db, req.body.personaKey);
    const user = { id: userId, kind: 'demo_clone', personaKey };
    res.status(201).json({ data: { token, ...await getMe(db, userId, user) } });
  });

  return router;
}
