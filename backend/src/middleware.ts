import type { NextFunction, Request, Response } from 'express';
import { db, newId, now, persist } from './db.js';
import type { User } from './types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Bearer token → session → user. Expired sessions are rejected and swept.
 * Only the opaque token is stored; passwords live as scrypt hashes on the user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = token ? db.sessions.find((s) => s.token === token) : undefined;
  if (session?.expiresAt && session.expiresAt <= now()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    persist();
    return next(new HttpError(401, 'session_expired', 'Your session has expired. Please sign in again.'));
  }
  const user = session && db.users.find((u) => u.id === session.userId);
  if (!user) return next(new HttpError(401, 'unauthenticated', 'Please sign in again.'));
  req.user = user;
  next();
}

/**
 * CCA §26 — log account id, IP and timestamp for every create/edit/delete,
 * stored apart from the content and kept even when the content is deleted.
 */
export function accessLog(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') return next();
  res.on('finish', () => {
    if (!req.user) return;
    db.accessLogs.push({
      id: newId(),
      userId: req.user.id,
      ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
      at: now(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    });
    persist();
  });
  next();
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side.' } });
}
