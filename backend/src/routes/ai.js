import { Router } from 'express';
import { getCareer } from '../services/career-service.js';
import { loadInterestList, loadSkillList } from '../services/catalogue.js';
import { validateBody } from '../middleware/validate.js';
import { assessmentSchema, explainMatchSchema } from '../validation/schemas.js';

export function aiRouter() {
  const router = Router();

  router.post('/ai/assessment', validateBody(assessmentSchema), async (req, res) => {
    const db = req.app.locals.db;
    const result = await req.app.locals.ai.analyzeNarrative({
      narrative: req.body.narrative,
      skills: await loadSkillList(db),
      interests: await loadInterestList(db)
    });
    res.json({ data: result });
  });

  router.post('/ai/explain-match', validateBody(explainMatchSchema), async (req, res) => {
    const career = await getCareer(req.app.locals.db, req.user.id, req.body.jobId, req.app.locals.ai);
    res.json({
      data: {
        jobId: career.id,
        explanation: career.explanation,
        compatibility: career.compatibility
      }
    });
  });

  return router;
}
