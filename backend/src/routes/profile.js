import { Router } from 'express';
import {
  completeOnboarding,
  getMe,
  setInterests,
  setSkill,
  setSkills,
  updateProfile
} from '../services/profile-service.js';
import { restoreSampleProfile } from '../services/demo-service.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  interestsSchema,
  onboardingSchema,
  paramsSkillSchema,
  profilePatchSchema,
  skillPatchSchema,
  skillsBulkSchema
} from '../validation/schemas.js';

export function profileRouter() {
  const router = Router();

  router.get('/me', async (req, res) => {
    res.json({ data: await getMe(req.app.locals.db, req.user.id, req.user) });
  });

  router.put('/me/onboarding', validateBody(onboardingSchema), async (req, res) => {
    const db = req.app.locals.db;
    await completeOnboarding(db, req.user.id, req.body);
    res.json({ data: await getMe(db, req.user.id, req.user) });
  });

  router.patch('/me/profile', validateBody(profilePatchSchema), async (req, res) => {
    res.json({ data: await updateProfile(req.app.locals.db, req.user.id, req.body) });
  });

  router.post('/me/profile/sample-reset', async (req, res) => {
    const db = req.app.locals.db;
    await restoreSampleProfile(db, req.user.id);
    res.json({ data: await getMe(db, req.user.id, req.user) });
  });

  router.put('/me/skills', validateBody(skillsBulkSchema), async (req, res) => {
    res.json({ data: await setSkills(req.app.locals.db, req.user.id, req.body.scores) });
  });

  router.patch('/me/skills/:skillId', validateParams(paramsSkillSchema), validateBody(skillPatchSchema), async (req, res) => {
    res.json({ data: await setSkill(req.app.locals.db, req.user.id, req.params.skillId, req.body.evidenceLevel) });
  });

  router.put('/me/interests', validateBody(interestsSchema), async (req, res) => {
    res.json({ data: await setInterests(req.app.locals.db, req.user.id, req.body.interests) });
  });

  return router;
}
