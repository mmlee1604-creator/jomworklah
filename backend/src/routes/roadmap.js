import { Router } from 'express';
import { AppError } from '../middleware/errors.js';
import {
  addCourse,
  clearJourney,
  deleteUser,
  generateRoadmap,
  getRoadmap,
  listSavedCourses,
  removeCourse,
  resetProgress,
  setTarget,
  setTaskCompletion
} from '../services/journey-service.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  courseSaveSchema,
  paramsCourseSchema,
  paramsTaskSchema,
  roadmapGenerateSchema,
  targetSchema,
  taskPatchSchema
} from '../validation/schemas.js';

export function roadmapRouter() {
  const router = Router();

  router.put('/me/target', validateBody(targetSchema), async (req, res) => {
    res.json({ data: await setTarget(req.app.locals.db, req.user.id, req.body.jobId) });
  });

  router.get('/me/courses', async (req, res) => {
    const courses = await listSavedCourses(req.app.locals.db, req.user.id);
    res.json({ data: courses, meta: { count: courses.length } });
  });

  router.post('/me/courses', validateBody(courseSaveSchema), async (req, res) => {
    res.status(201).json({ data: await addCourse(req.app.locals.db, req.user.id, req.body.courseId) });
  });

  router.delete('/me/courses/:courseId', validateParams(paramsCourseSchema), async (req, res) => {
    await removeCourse(req.app.locals.db, req.user.id, req.params.courseId);
    res.status(204).end();
  });

  router.get('/me/roadmap', async (req, res) => {
    res.json({ data: await getRoadmap(req.app.locals.db, req.user.id) });
  });

  router.post('/me/roadmap', validateBody(roadmapGenerateSchema), async (req, res) => {
    const state = await generateRoadmap(req.app.locals.db, req.user.id, req.body);
    res.status(201).json({ data: state });
  });

  router.patch('/me/roadmap/tasks/:taskId', validateParams(paramsTaskSchema), validateBody(taskPatchSchema), async (req, res) => {
    res.json({ data: await setTaskCompletion(req.app.locals.db, req.user.id, req.params.taskId, req.body.completed) });
  });

  router.post('/me/roadmap/reset-progress', async (req, res) => {
    res.json({ data: await resetProgress(req.app.locals.db, req.user.id) });
  });

  router.delete('/me/journey', async (req, res) => {
    await clearJourney(req.app.locals.db, req.user.id);
    res.status(204).end();
  });

  router.delete('/me', async (req, res) => {
    if (req.user.kind === 'registered') {
      throw new AppError(403, 'ACCOUNT_DELETION_UNSUPPORTED', 'Registered accounts cannot be deleted through this endpoint.');
    }
    await deleteUser(req.app.locals.db, req.user.id);
    res.status(204).end();
  });

  return router;
}
