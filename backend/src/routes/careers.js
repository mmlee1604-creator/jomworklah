import { Router } from 'express';
import { getCareer, listCareers } from '../services/career-service.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { careersQuerySchema, paramsIdSchema } from '../validation/schemas.js';

export function careersRouter() {
  const router = Router();

  router.get('/careers', validateQuery(careersQuerySchema), async (req, res) => {
    const careers = await listCareers(req.app.locals.db, req.user.id, req.validatedQuery);
    res.json({ data: careers, meta: { count: careers.length } });
  });

  router.get('/careers/:id', validateParams(paramsIdSchema), async (req, res) => {
    const career = await getCareer(req.app.locals.db, req.user.id, req.params.id, req.app.locals.ai);
    res.json({ data: career });
  });

  return router;
}
