import { AppError } from './errors.js';
import { resolveSession } from '../services/session-service.js';

export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return next(new AppError(401, 'UNAUTHORIZED', 'Missing bearer token.'));

  const user = await resolveSession(req.app.locals.db, match[1].trim());
  if (!user) return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token.'));

  req.user = user;
  return next();
}
