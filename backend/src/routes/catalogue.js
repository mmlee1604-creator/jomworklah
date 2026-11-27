import { Router } from 'express';
import { evidenceLegend } from '../db/seed-data.js';
import { AppError } from '../middleware/errors.js';
import { validateParams } from '../middleware/validate.js';
import { paramsIdSchema } from '../validation/schemas.js';
import { loadCourse, loadCourses, loadInterestList, loadProviders, loadSkillList } from '../services/catalogue.js';
import { catalogueInfo } from '../services/course-catalogue.js';
import { courseView, interestsMapView, providersMapView } from '../api/serializers.js';

export function catalogueRouter() {
  const router = Router();

  router.get('/skills', async (req, res) => {
    const skills = await loadSkillList(req.app.locals.db);
    res.json({ data: { legend: evidenceLegend, skills }, meta: { count: skills.length } });
  });

  router.get('/interests', async (req, res) => {
    const interests = await loadInterestList(req.app.locals.db);
    res.json({ data: interestsMapView(interests), meta: { count: interests.length } });
  });

  // Public course catalogue (no personalisation): the frontend ranks courses against the user's gaps.
  router.get('/courses', (req, res) => {
    const db = req.app.locals.db;
    const courses = loadCourses(db);
    const states = [...new Set(courses.flatMap(course => course.locations ?? [course.location]).filter(Boolean))].sort();
    res.json({
      data: courses.map(course => courseView(course)),
      meta: {
        count: courses.length,
        source: catalogueInfo().source,
        states,
        providers: providersMapView(loadProviders(db))
      }
    });
  });

  router.get('/courses/:id', validateParams(paramsIdSchema), (req, res) => {
    const course = loadCourse(req.app.locals.db, req.params.id);
    if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', `Unknown course '${req.params.id}'.`);
    res.json({ data: courseView(course, { detail: true }) });
  });

  router.get('/providers', (req, res) => {
    const providers = loadProviders(req.app.locals.db);
    res.json({ data: providersMapView(providers), meta: { count: providers.length } });
  });

  return router;
}
