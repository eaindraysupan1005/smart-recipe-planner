import { Router } from 'express';
import crypto from 'node:crypto';
import { db, newId, now, persist } from '../db.js';
import { HttpError, requireAuth } from '../middleware.js';
import { addRecord, consentState, VERSIONS } from '../consent.js';

export const authRouter = Router();

function issueSession(userId: string): string {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions.push({ token, userId, createdAt: now() });
  persist();
  return token;
}

function publicUser(userId: string) {
  const u = db.users.find((x) => x.id === userId)!;
  const terms = db.records.filter((r) => r.userId === userId && r.kind === 'terms').at(-1);
  return {
    ...u,
    ...consentState(userId),
    termsAcceptedAt: terms?.at ?? null,
    termsVersion: terms?.version ?? null,
  };
}

const validEmail = (e: unknown): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/**
 * Dummy sign-up. Any email + any non-empty password works. The password is
 * checked for presence only and is never stored — only a session token is.
 */
authRouter.post('/signup', (req, res) => {
  const { email, password, acceptTerms } = req.body ?? {};
  if (!validEmail(email)) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');
  if (!password) throw new HttpError(400, 'invalid_password', 'Enter a password.');
  if (!acceptTerms) throw new HttpError(400, 'terms_required', 'Please accept the Terms and the AI & Food Safety Disclaimer.');
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new HttpError(409, 'email_taken', 'That email already has an account — sign in instead.');
  }
  const local = email.split('@')[0];
  const user = { id: newId(), email, name: local.charAt(0).toUpperCase() + local.slice(1), createdAt: now() };
  db.users.push(user);
  addRecord(user.id, 'terms', 'granted', `Terms of Service ${VERSIONS.terms}`);
  addRecord(user.id, 'disclaimer', 'granted', `AI & Food Safety Disclaimer ${VERSIONS.disclaimer}`);
  const token = issueSession(user.id);
  res.status(201).json({ token, user: publicUser(user.id), isNew: true });
});

/** Dummy sign-in: any password works for an existing email. */
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!validEmail(email)) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');
  if (!password) throw new HttpError(400, 'invalid_password', 'Enter a password.');
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new HttpError(404, 'no_account', 'No account with that email — create one instead.');
  res.json({ token: issueSession(user.id), user: publicUser(user.id), isNew: false });
});

authRouter.post('/logout', requireAuth, (req, res) => {
  const token = req.header('authorization')!.slice(7);
  db.sessions = db.sessions.filter((s) => s.token !== token);
  persist();
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!.id) });
});

authRouter.patch('/me', requireAuth, (req, res) => {
  const { name } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'invalid_name', 'Name cannot be empty.');
  req.user!.name = name.trim().slice(0, 60);
  persist();
  res.json({ user: publicUser(req.user!.id) });
});
