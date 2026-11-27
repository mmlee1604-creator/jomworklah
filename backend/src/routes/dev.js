import { Router } from 'express';
import { AppError } from '../middleware/errors.js';
import { seed, wipeAll } from '../db/seed.js';

export function devRouter() {
  const router = Router();

  router.post('/dev/reset', async (req, res) => {
    const { allowDevReset, nodeEnv } = req.app.locals.config;
    if (!allowDevReset || nodeEnv === 'production') {
      throw new AppError(403, 'DEV_RESET_DISABLED', 'Dev reset is disabled.');
    }
    const db = req.app.locals.db;
    let counts;
    if (db.isPostgres) {
      await db.prepare("DELETE FROM users WHERE kind <> 'demo_template'").run();
      const [skills, interests, jobs, personas] = await Promise.all([
        db.prepare('SELECT COUNT(*) AS n FROM skills').get(),
        db.prepare('SELECT COUNT(*) AS n FROM interests').get(),
        db.prepare('SELECT COUNT(*) AS n FROM jobs').get(),
        db.prepare("SELECT COUNT(*) AS n FROM users WHERE kind = 'demo_template'").get()
      ]);
      counts = {
        skills: Number(skills.n),
        interests: Number(interests.n),
        jobs: Number(jobs.n),
        personas: Number(personas.n)
      };
    } else {
      wipeAll(db);
      counts = seed(db);
    }
    res.json({ data: { reset: true, counts } });
  });

  return router;
}
