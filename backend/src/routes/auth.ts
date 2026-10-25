import { Router } from 'express';
import crypto from 'node:crypto';
import { db, newId, now, persist } from '../db.js';
import { HttpError, requireAuth } from '../middleware.js';
import { addRecord, consentState, VERSIONS } from '../consent.js';
import { checkPassword, clearAttempts, hashPassword, noteFailure, tooManyAttempts, verifyPassword } from '../auth-password.js';
import { finish, googleConfigured, OAuthError, publicUrl, startUrl } from '../oauth-google.js';
import type { Session, User } from '../types.js';

export const authRouter = Router();

const SESSION_DAYS = 30;

function issueSession(userId: string, method: Session['method']): string {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  db.sessions.push({ token, userId, createdAt: now(), expiresAt, method });
  // Drop expired sessions while we are here.
  const t = now();
  db.sessions = db.sessions.filter((s) => !s.expiresAt || s.expiresAt > t);
  const user = db.users.find((u) => u.id === userId);
  if (user) user.lastLoginAt = now();
  persist();
  return token;
}

function publicUser(userId: string) {
  const u = db.users.find((x) => x.id === userId)!;
  const terms = db.records.filter((r) => r.userId === userId && r.kind === 'terms').at(-1);
  const { passwordHash, googleId, ...safe } = u;
  return {
    ...safe,
    ...consentState(userId),
    hasPassword: !!passwordHash,
    signInMethods: [passwordHash ? 'password' : null, googleId ? 'google' : null].filter(Boolean),
    termsAcceptedAt: terms?.at ?? null,
    termsVersion: terms?.version ?? null,
  };
}

const normalEmail = (e: unknown): string | null => {
  if (typeof e !== 'string') return null;
  const v = e.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 160 ? v : null;
};

const findByEmail = (email: string): User | undefined => db.users.find((u) => u.email.toLowerCase() === email);

function nameFromEmail(email: string): string {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function acceptTermsFor(userId: string): void {
  addRecord(userId, 'terms', 'granted', `Terms of Service ${VERSIONS.terms}`);
  addRecord(userId, 'disclaimer', 'granted', `AI & Food Safety Disclaimer ${VERSIONS.disclaimer}`);
}

// ── Email + password ───────────────────────────────────────────────────────

authRouter.post('/signup', async (req, res) => {
  const { email, password, acceptTerms } = req.body ?? {};
  const mail = normalEmail(email);
  if (!mail) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');
  if (!acceptTerms) throw new HttpError(400, 'terms_required', 'Please accept the Terms and the AI & Food Safety Disclaimer.');

  const strength = checkPassword(String(password ?? ''), mail);
  if (!strength.ok) throw new HttpError(400, 'weak_password', strength.message ?? 'Choose a stronger password.');

  const existing = findByEmail(mail);
  if (existing) {
    // Someone who signed up with Google can add a password to the same account.
    if (!existing.passwordHash) {
      throw new HttpError(409, 'use_google', 'That email already signs in with Google. Use the Google button, or set a password from your profile afterwards.');
    }
    throw new HttpError(409, 'email_taken', 'That email already has an account — sign in instead.');
  }

  const user: User = {
    id: newId(),
    email: mail,
    name: nameFromEmail(mail),
    createdAt: now(),
    passwordHash: await hashPassword(String(password)),
    emailVerified: false,
  };
  db.users.push(user);
  acceptTermsFor(user.id);
  res.status(201).json({ token: issueSession(user.id, 'password'), user: publicUser(user.id), isNew: true });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const mail = normalEmail(email);
  if (!mail) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');

  const key = `${req.ip ?? 'ip'}:${mail}`;
  if (tooManyAttempts(key)) {
    throw new HttpError(429, 'too_many_attempts', 'Too many attempts. Wait 15 minutes and try again.');
  }

  const user = findByEmail(mail);
  // Same reply either way, so this cannot be used to discover who has an account.
  const ok = user?.passwordHash ? await verifyPassword(String(password ?? ''), user.passwordHash) : false;
  if (!user || !ok) {
    noteFailure(key);
    if (user && !user.passwordHash) {
      throw new HttpError(401, 'use_google', 'That account signs in with Google. Use the Google button.');
    }
    throw new HttpError(401, 'bad_credentials', 'That email and password do not match.');
  }

  clearAttempts(key);
  res.json({ token: issueSession(user.id, 'password'), user: publicUser(user.id), isNew: false });
});

/** Lets a Google-only account add a password, or an existing user change one. */
authRouter.post('/password', requireAuth, async (req, res) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body ?? {};
  if (user.passwordHash) {
    const ok = await verifyPassword(String(currentPassword ?? ''), user.passwordHash);
    if (!ok) throw new HttpError(401, 'bad_credentials', 'Your current password is not right.');
  }
  const strength = checkPassword(String(newPassword ?? ''), user.email);
  if (!strength.ok) throw new HttpError(400, 'weak_password', strength.message ?? 'Choose a stronger password.');
  user.passwordHash = await hashPassword(String(newPassword));
  persist();
  res.json({ user: publicUser(user.id) });
});

// ── Google ─────────────────────────────────────────────────────────────────

authRouter.get('/providers', (_req, res) => {
  res.json({ google: googleConfigured() });
});

authRouter.get('/google', (req, res) => {
  if (!googleConfigured()) throw new HttpError(503, 'google_unconfigured', 'Google sign-in is not set up on this server.');
  const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('/') ? req.query.returnTo : '/';
  res.redirect(startUrl(returnTo));
});

/**
 * One-time handoff codes. The browser comes back from Google, we hand it a
 * short-lived code in the URL, and the app swaps that for the real session
 * token over POST — so the token itself never lands in a URL or browser history.
 */
const handoffs = new Map<string, { token: string; isNew: boolean; createdAt: number }>();
const HANDOFF_TTL = 60_000;

authRouter.get('/google/callback', async (req, res, next) => {
  const { code, state, error } = req.query;
  const fail = (reason: string) => res.redirect(`${publicUrl()}/signin?error=${encodeURIComponent(reason)}`);
  if (typeof error === 'string') return fail(error === 'access_denied' ? 'You cancelled the Google sign-in.' : 'Google sign-in failed.');
  if (typeof code !== 'string' || typeof state !== 'string') return fail('Google sign-in failed.');

  try {
    const { profile, returnTo } = await finish(code, state);
    let user = db.users.find((u) => u.googleId === profile.googleId) ?? findByEmail(profile.email);
    let isNew = false;

    if (!user) {
      user = {
        id: newId(),
        email: profile.email,
        name: profile.name,
        createdAt: now(),
        googleId: profile.googleId,
        picture: profile.picture,
        emailVerified: profile.emailVerified,
      };
      db.users.push(user);
      acceptTermsFor(user.id);
      addRecord(user.id, 'terms', 'granted', 'Signed up with Google');
      isNew = true;
    } else if (!user.googleId) {
      // Same email, existing password account: link the two.
      user.googleId = profile.googleId;
      user.picture ??= profile.picture;
      user.emailVerified ||= profile.emailVerified;
      addRecord(user.id, 'terms', 'granted', 'Linked Google sign-in to this account');
    }
    persist();

    const handoff = crypto.randomBytes(24).toString('base64url');
    handoffs.set(handoff, { token: issueSession(user.id, 'google'), isNew, createdAt: Date.now() });
    for (const [k, v] of handoffs) if (Date.now() - v.createdAt > HANDOFF_TTL) handoffs.delete(k);

    const target = new URL(`${publicUrl()}/auth/callback`);
    target.searchParams.set('c', handoff);
    if (returnTo !== '/') target.searchParams.set('returnTo', returnTo);
    res.redirect(target.toString());
  } catch (e) {
    if (e instanceof OAuthError) return fail(e.message);
    next(e);
  }
});

/** Swaps the one-time code for the session token. */
authRouter.post('/exchange', (req, res) => {
  const { code } = req.body ?? {};
  const entry = typeof code === 'string' ? handoffs.get(code) : undefined;
  if (!entry || Date.now() - entry.createdAt > HANDOFF_TTL) {
    throw new HttpError(400, 'expired_handoff', 'That sign-in has expired. Please try again.');
  }
  handoffs.delete(code);
  const session = db.sessions.find((s) => s.token === entry.token);
  if (!session) throw new HttpError(400, 'expired_handoff', 'That sign-in has expired. Please try again.');
  res.json({ token: entry.token, user: publicUser(session.userId), isNew: entry.isNew });
});

// ── Session ────────────────────────────────────────────────────────────────

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
