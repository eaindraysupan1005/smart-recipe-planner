// Security — paid AI endpoints are rate limited.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// rate-limit imports the db module; point it at an empty throwaway folder first.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'w2c-rl-'));
const { take } = await import('../src/rate-limit.js');

test('allows up to max, then blocks with a retry time', () => {
  const key = `t:${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(take(key, 3, 60_000).allowed, true);
  const blocked = take(key, 3, 60_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSec >= 1);
});

test('keys are independent', () => {
  const a = `a:${Math.random()}`;
  const b = `b:${Math.random()}`;
  take(a, 1, 60_000);
  assert.equal(take(a, 1, 60_000).allowed, false);
  assert.equal(take(b, 1, 60_000).allowed, true);
});
