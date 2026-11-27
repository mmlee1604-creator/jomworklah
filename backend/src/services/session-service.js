import crypto from 'node:crypto';
import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createUser(db, { kind = 'guest' } = {}) {
  const id = `usr_${crypto.randomUUID()}`;
  await transaction(db, async tx => {
    await tx.prepare('INSERT INTO users(id, kind) VALUES(?, ?)').run(id, kind);
    await tx.prepare('INSERT INTO profiles(user_id, name) VALUES(?, ?)').run(id, 'Guest');
    await tx.prepare('INSERT INTO journeys(user_id, started) VALUES(?, 0)').run(id);
  });
  return id;
}

export async function ensureRegisteredUser(db, authUser) {
  const name = String(authUser.user_metadata?.full_name ?? '').trim().slice(0, 70) || 'New User';

  await transaction(db, async tx => {
    await tx.prepare(`
      INSERT INTO users(id, kind) VALUES(?, 'registered')
      ON CONFLICT(id) DO NOTHING
    `).run(authUser.id);

    const user = await tx.prepare('SELECT kind FROM users WHERE id = ?').get(authUser.id);
    if (user?.kind !== 'registered') {
      throw new AppError(409, 'ACCOUNT_CONFLICT', 'This authentication account is already linked to a different profile.');
    }

    await tx.prepare(`
      INSERT INTO profiles(user_id, name) VALUES(?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).run(authUser.id, name);
    await tx.prepare(`
      INSERT INTO journeys(user_id, started) VALUES(?, 0)
      ON CONFLICT(user_id) DO NOTHING
    `).run(authUser.id);
  });

  return { id: authUser.id, kind: 'registered', personaKey: null };
}

export async function issueToken(db, userId, { expiresAt = null } = {}) {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?, ?, ?)')
    .run(hashToken(token), userId, expiresAt);
  return token;
}

export async function resolveSession(db, token) {
  if (!token) return null;
  const row = await db.prepare(`
    SELECT s.token_hash, s.expires_at, u.id, u.kind, COALESCE(u.persona_key, u.source_persona) AS persona_key
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(hashToken(token));

  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return null;

  await db.prepare('UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?')
    .run(row.token_hash);

  return { id: row.id, kind: row.kind, personaKey: row.persona_key };
}

export async function createGuestSession(db) {
  const userId = await createUser(db, { kind: 'guest' });
  const token = await issueToken(db, userId);
  return { token, user: { id: userId, kind: 'guest' } };
}
