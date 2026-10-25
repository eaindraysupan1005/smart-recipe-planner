/**
 * Google sign-in: OAuth 2.0 authorization-code flow with PKCE.
 *
 *   1. /api/auth/google          → redirect to Google with state + code_challenge
 *   2. Google                    → user approves
 *   3. /api/auth/google/callback → we swap the code for tokens, read the
 *                                  profile, then drop Google's tokens
 *
 * PDPA: we keep the Google account id (to recognise them next time), the email
 * and the display name. Google's access and refresh tokens are used once and
 * discarded — never stored, which is what rule.md requires of a social login.
 *
 * Setup (backend/.env):
 *   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
 *   GOOGLE_CLIENT_SECRET=...
 *   PUBLIC_URL=http://localhost:4000      (optional; only if not localhost:4000)
 */
import crypto from 'node:crypto';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export const googleConfigured = (): boolean => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const publicUrl = (): string => (process.env.PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`).replace(/\/$/, '');
export const redirectUri = (): string => `${publicUrl()}/api/auth/google/callback`;

/** Pending sign-ins, waiting for the user to come back from Google. */
interface Pending {
  verifier: string;
  createdAt: number;
  /** Where to send the browser afterwards. */
  returnTo: string;
}
const pending = new Map<string, Pending>();
const STATE_TTL = 10 * 60_000;

function sweep(): void {
  const cutoff = Date.now() - STATE_TTL;
  for (const [k, v] of pending) if (v.createdAt < cutoff) pending.delete(k);
}

const b64url = (b: Buffer) => b.toString('base64url');

/** Step 1 — the URL to send the browser to. */
export function startUrl(returnTo = '/'): string {
  sweep();
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  pending.set(state, { verifier, createdAt: Date.now(), returnTo });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    // Always show the chooser: handy when demoing with more than one account.
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params}`;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export class OAuthError extends Error {}

/** Step 3 — verify the state, swap the code, read the profile. */
export async function finish(code: string, state: string): Promise<{ profile: GoogleProfile; returnTo: string }> {
  sweep();
  const entry = pending.get(state);
  if (!entry) throw new OAuthError('That sign-in link has expired. Please try again.');
  pending.delete(state); // one use only

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
      code_verifier: entry.verifier,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new OAuthError(`Google rejected the sign-in (${res.status}): ${detail.slice(0, 160)}`);
  }
  const tokens = (await res.json()) as { access_token?: string };
  if (!tokens.access_token) throw new OAuthError('Google did not return an access token.');

  const me = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!me.ok) throw new OAuthError('Could not read your Google profile.');
  const info = (await me.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string; given_name?: string; picture?: string };
  if (!info.sub || !info.email) throw new OAuthError('Google did not return an email address.');

  // tokens go out of scope here and are never persisted.
  return {
    profile: {
      googleId: info.sub,
      email: info.email,
      emailVerified: info.email_verified !== false,
      name: (info.given_name || info.name || info.email.split('@')[0]).slice(0, 60),
      picture: info.picture,
    },
    returnTo: entry.returnTo,
  };
}
