/**
 * Small in-memory rate limiter — one server, no extra dependency.
 *
 * It mainly protects the endpoints that cost money: every recipe generation
 * and every receipt scan is a paid AI call, so an authenticated user (or a
 * leaked token) could otherwise burn the whole quota in a minute.
 */
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './middleware.js';

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

/** Keeps the map from growing forever on a long-running server. */
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function take(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  b.count++;
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  return { allowed: b.count <= max, remaining: Math.max(0, max - b.count), retryAfterSec };
}

interface Options {
  max: number;
  windowMs: number;
  /** Per signed-in user (default) or per IP, for routes with no session yet. */
  by?: 'user' | 'ip';
  message: string;
  name: string;
}

export function rateLimit({ max, windowMs, by = 'user', message, name }: Options) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const who = by === 'user' ? (req.user?.id ?? req.ip ?? 'anon') : (req.ip ?? 'anon');
    const result = take(`${name}:${who}`, max, windowMs);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSec));
      return next(new HttpError(429, 'rate_limited', message));
    }
    next();
  };
}

/** Generating a recipe costs an AI call. */
export const aiLimit = rateLimit({
  name: 'ai',
  max: 30,
  windowMs: 60 * 60_000,
  message: "That's a lot of recipes in one hour. Take a break and try again shortly.",
});

/** Reading a receipt costs a vision call, the most expensive one. */
export const scanLimit = rateLimit({
  name: 'scan',
  max: 40,
  windowMs: 60 * 60_000,
  message: 'Too many scans in one hour. Try again a little later.',
});

/** Stops one machine creating accounts in bulk. */
export const signupLimit = rateLimit({
  name: 'signup',
  by: 'ip',
  max: 10,
  windowMs: 60 * 60_000,
  message: 'Too many accounts created from here. Try again later.',
});
