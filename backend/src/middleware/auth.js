import { AppError } from './errors.js';
import { ensureRegisteredUser, resolveSession } from '../services/session-service.js';

export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return next(new AppError(401, 'UNAUTHORIZED', 'Missing bearer token.'));

  const token = match[1].trim();
  const user = await resolveSession(req.app.locals.db, token);
  if (user) {
    req.user = user;
    return next();
  }

  const supabaseAuth = req.app.locals.supabaseAuth;
  if (!supabaseAuth) return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token.'));

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error) {
    if ([400, 401, 403].includes(Number(error.status))) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token.'));
    }
    return next(new AppError(503, 'AUTH_UNAVAILABLE', 'Could not verify the account session. Try again shortly.'));
  }
  if (!data.user) return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token.'));

  req.user = await ensureRegisteredUser(req.app.locals.db, data.user);
  return next();
}
