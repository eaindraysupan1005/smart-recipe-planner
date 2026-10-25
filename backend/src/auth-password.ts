/**
 * Password hashing with scrypt from node:crypto — a real key-derivation
 * function, no native build step and no third-party dependency.
 *
 * We store `scrypt$N$r$p$salt$hash`. The plain password is never written
 * anywhere: not to the database, not to the logs (PDPA — we keep only what is
 * needed to verify a sign-in).
 */
import crypto from 'node:crypto';

const N = 16384; // CPU/memory cost
const r = 8;
const p = 1;
const KEY_LEN = 64;

const derive = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize('NFKC'), salt, KEY_LEN, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/** Constant-time check, so a wrong password takes as long as a right one. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, , , , saltB64, hashB64] = parts;
  try {
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const key = await derive(password, salt);
    return key.length === expected.length && crypto.timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

export interface PasswordCheck {
  ok: boolean;
  message?: string;
  /** 0–4, for the strength meter. */
  score: number;
}

/** Weak choices people actually make. */
const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123',
  'iloveyou', 'letmein1', 'welcome1', 'admin123', 'abc12345', 'football', 'baseball', 'sunshine',
  'princess', 'whatever', 'trustno1', 'starwars', 'passw0rd', 'qwertyuiop', 'what2cook',
]);

/**
 * Length first — it matters more than symbol soup — then a few obvious traps.
 * Deliberately not a maze of rules people work around with "Password1!".
 */
export function checkPassword(password: string, email = ''): PasswordCheck {
  const pw = password ?? '';
  if (pw.length < 8) return { ok: false, score: 0, message: 'Use at least 8 characters.' };
  if (pw.length > 200) return { ok: false, score: 0, message: 'That password is too long.' };

  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return { ok: false, score: 0, message: 'That password is too common — pick something else.' };
  const local = email.split('@')[0]?.toLowerCase();
  if (local && local.length > 2 && lower.includes(local)) {
    return { ok: false, score: 1, message: 'Do not use your email address in the password.' };
  }
  if (/^(.)\1+$/.test(pw)) return { ok: false, score: 0, message: 'That is the same character repeated.' };

  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { ok: true, score: Math.min(4, score) };
}

/** Simple per-key attempt limiter, enough for one server. */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 10;

export function tooManyAttempts(key: string): boolean {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

export function noteFailure(key: string): void {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else rec.count++;
}

export const clearAttempts = (key: string): void => void attempts.delete(key);
