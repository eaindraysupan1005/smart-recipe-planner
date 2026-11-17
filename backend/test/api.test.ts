// End-to-end API test of the one core workflow:
//   receipt scan -> pantry in -> AI recipe -> cook & confirm leftovers -> grocery list out
// plus the legal rules (consent, logs, delete). Starts the real server as a child
// process against a throwaway data folder, with AI keys and Supabase blanked so
// nothing external is called and no real data is touched.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKEND = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const PORT = 4300 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}/api`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'w2c-api-'));
let server: ChildProcess;
let serverLog = '';

type Json = Record<string, any>;
async function call(method: string, url: string, body?: unknown, token?: string, headers: Record<string, string> = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON body */ }
  return { status: res.status, json };
}

const PASSWORD = 'Tr1cky-long-passphrase!';
let seq = 0;
async function newUser(label = 'user') {
  const email = `${label}${Date.now()}${seq++}@example.com`;
  // The server trusts X-Forwarded-For, so each test user signs up from its own address
  // and does not trip the per-IP signup limiter (which has its own test below).
  const ip = `10.${(seq >> 8) & 255}.${seq & 255}.${(Date.now() % 250) + 1}`;
  const r = await call('POST', '/auth/signup', { email, password: PASSWORD, acceptTerms: true }, undefined, { 'x-forwarded-for': ip });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return { email, token: r.json.token as string, id: r.json.user.id as string };
}

before(async () => {
  server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: BACKEND,
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      API_PORT: String(PORT),
      GEMINI_API_KEY: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout!.on('data', (d) => (serverLog += d));
  server.stderr!.on('data', (d) => (serverLog += d));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Server did not start:\n${serverLog}`);
});

after(() => {
  server?.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('health & auth', () => {
  test('health endpoint answers', async () => {
    const r = await call('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test('unknown API route is a JSON 404', async () => {
    const r = await call('GET', '/nope');
    assert.equal(r.status, 404);
    assert.equal(r.json.error.code, 'not_found');
  });

  test('protected routes reject requests without a token', async () => {
    for (const url of ['/pantry', '/recipes', '/grocery', '/profile/diet']) {
      assert.equal((await call('GET', url)).status, 401, url);
    }
    assert.equal((await call('GET', '/pantry', undefined, 'bogus-token')).status, 401);
  });

  test('signup requires terms, a valid email and a strong password', async () => {
    const mail = `v${Date.now()}@example.com`;
    assert.equal((await call('POST', '/auth/signup', { email: mail, password: PASSWORD })).json.error.code, 'terms_required');
    assert.equal((await call('POST', '/auth/signup', { email: 'nope', password: PASSWORD, acceptTerms: true })).json.error.code, 'invalid_email');
    assert.equal((await call('POST', '/auth/signup', { email: mail, password: 'password123', acceptTerms: true })).json.error.code, 'weak_password');
  });

  test('signup, duplicate signup, login, wrong password, /me and logout', async () => {
    const u = await newUser('auth');
    assert.equal((await call('POST', '/auth/signup', { email: u.email, password: PASSWORD, acceptTerms: true })).json.error.code, 'email_taken');

    const bad = await call('POST', '/auth/login', { email: u.email, password: 'wrong-password-here' });
    assert.equal(bad.status, 401);
    const unknown = await call('POST', '/auth/login', { email: 'ghost@example.com', password: 'wrong-password-here' });
    assert.equal(unknown.json.error.message, bad.json.error.message, 'must not reveal which emails exist');

    const ok = await call('POST', '/auth/login', { email: u.email, password: PASSWORD });
    assert.equal(ok.status, 200);
    const me = await call('GET', '/auth/me', undefined, ok.json.token);
    assert.equal(me.status, 200);

    assert.equal((await call('POST', '/auth/logout', {}, ok.json.token)).status < 300, true);
    assert.equal((await call('GET', '/auth/me', undefined, ok.json.token)).status, 401);
  });

  test('signup is rate limited per IP (bulk account creation)', async () => {
    const h = { 'x-forwarded-for': '203.0.113.77' };
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await call('POST', '/auth/signup', { email: 'bad' }, undefined, h)).status;
    assert.equal(last, 429);
  });

  test('credentials are never returned or stored in clear', async () => {
    const u = await newUser('secret');
    const me = await call('GET', '/auth/me', undefined, u.token);
    const blob = JSON.stringify(me.json);
    assert.ok(!blob.includes('passwordHash'));
    assert.ok(!blob.includes(PASSWORD));
    await new Promise((r) => setTimeout(r, 1500)); // db writes are debounced
    const file = path.join(dataDir, 'db.json');
    if (fs.existsSync(file)) assert.ok(!fs.readFileSync(file, 'utf8').includes(PASSWORD));
  });
});

describe('F1 receipt scanner', () => {
  test('text lines from the on-device reader become pantry candidates', async () => {
    const u = await newUser('scan');
    const r = await call('POST', '/scan', { lines: ['CHKN THIGH FIL 500G 6.99', 'MLK 2L 2.50', 'TOTAL 9.49'] }, u.token);
    assert.equal(r.status, 200);
    const names = r.json.items.map((i: Json) => i.name);
    assert.deepEqual(names.sort(), ['Chicken thighs', 'Milk']);
    assert.equal(r.json.readBy, 'device');
  });

  test('rejects a malformed scan body', async () => {
    const u = await newUser('scanbad');
    assert.equal((await call('POST', '/scan', { lines: [1, 2] }, u.token)).status, 400);
    assert.equal((await call('POST', '/scan', {}, u.token)).status, 400);
  });
});

describe('F2 pantry tracker', () => {
  test('add, merge same item, edit, delete', async () => {
    const u = await newUser('pantry');
    const a = await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token);
    assert.equal(a.status, 201);
    const b = await call('POST', '/pantry', { name: 'rice', qty: 0.5, unit: 'kg' }, u.token);
    assert.equal(b.json.item.id, a.json.item.id, 'same name + unit merges');
    assert.equal(b.json.item.qty, 1.5);

    const patched = await call('PATCH', `/pantry/${a.json.item.id}`, { qty: 2 }, u.token);
    assert.equal(patched.json.item.qty, 2);

    assert.equal((await call('DELETE', `/pantry/${a.json.item.id}`, undefined, u.token)).status, 204);
    assert.equal((await call('GET', '/pantry', undefined, u.token)).json.items.length, 0);
    assert.equal((await call('DELETE', `/pantry/${a.json.item.id}`, undefined, u.token)).status, 404);
  });

  test('validates name and quantity', async () => {
    const u = await newUser('pantryval');
    assert.equal((await call('POST', '/pantry', { name: '', qty: 1, unit: 'g' }, u.token)).json.error.code, 'invalid_name');
    assert.equal((await call('POST', '/pantry', { name: 'Rice', qty: 0, unit: 'g' }, u.token)).json.error.code, 'invalid_qty');
    assert.equal((await call('POST', '/pantry', { name: 'Rice', qty: -3, unit: 'g' }, u.token)).json.error.code, 'invalid_qty');
  });

  test('bulk add from a reviewed receipt keeps the scan time', async () => {
    const u = await newUser('bulk');
    const at = '2026-09-01T10:00:00.000Z';
    const r = await call('POST', '/pantry/bulk', { scannedAt: at, items: [{ name: 'Milk', qty: 2, unit: 'L' }, { name: 'Eggs', qty: 6, unit: 'pieces' }] }, u.token);
    assert.equal(r.status, 201);
    assert.ok(r.json.items.every((i: Json) => i.scannedAt === at && i.source === 'scan'));
    assert.equal((await call('POST', '/pantry/bulk', { items: [] }, u.token)).status, 400);
  });

  test("one user can never see or change another user's pantry", async () => {
    const a = await newUser('ownerA');
    const b = await newUser('ownerB');
    const item = (await call('POST', '/pantry', { name: 'Saffron', qty: 1, unit: 'g' }, a.token)).json.item;
    assert.equal((await call('GET', '/pantry', undefined, b.token)).json.items.length, 0);
    assert.equal((await call('PATCH', `/pantry/${item.id}`, { qty: 99 }, b.token)).status, 404);
    assert.equal((await call('DELETE', `/pantry/${item.id}`, undefined, b.token)).status, 404);
  });
});

describe('core workflow: pantry -> AI recipe -> cook -> grocery list', () => {
  test('full flow with consent, leftovers deduction and a missing-items grocery list', async () => {
    const u = await newUser('flow');
    const rice = (await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token)).json.item;
    const chicken = (await call('POST', '/pantry', { name: 'Chicken thighs', qty: 500, unit: 'g' }, u.token)).json.item;
    const garlic = (await call('POST', '/pantry', { name: 'Garlic', qty: 1, unit: 'bulb' }, u.token)).json.item;
    const ids = [rice.id, chicken.id, garlic.id];

    // PDPA: no AI call without consent.
    const blocked = await call('POST', '/recipes/generate', { itemIds: ids }, u.token);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.json.error.code, 'consent_required');

    assert.equal((await call('POST', '/profile/consents/ai', { granted: true }, u.token)).json.aiConsent, true);

    assert.equal((await call('POST', '/recipes/generate', { itemIds: [] }, u.token)).status, 400);

    const gen = await call('POST', '/recipes/generate', { itemIds: ids }, u.token);
    assert.equal(gen.status, 201, JSON.stringify(gen.json));
    const recipe = gen.json.recipe;
    assert.ok(recipe.id && recipe.name && recipe.steps.length > 0);

    // Uses the selected pantry items and records what was sent (ETA reproducibility).
    assert.deepEqual(
      recipe.generation.pantrySnapshot.map((i: Json) => i.name).sort(),
      ['Chicken thighs', 'Garlic', 'Rice'],
    );
    assert.ok(recipe.generation.model);
    assert.ok(recipe.generation.createdAt);
    assert.ok(Array.isArray(recipe.generation.filters));

    // Cook: preview shows the deduction, confirm leftovers, pantry updates.
    const preview = await call('GET', `/recipes/${recipe.id}/cook-preview`, undefined, u.token);
    assert.equal(preview.status, 200);
    assert.ok(Array.isArray(preview.json.deductions));

    const before = (await call('GET', '/pantry', undefined, u.token)).json.items as Json[];
    const cooked = await call('POST', `/recipes/${recipe.id}/cook`, { leftovers: { [rice.id]: 0.25 } }, u.token);
    assert.equal(cooked.status, 200);
    const afterItems = cooked.json.pantry as Json[];
    assert.equal(afterItems.find((p) => p.id === rice.id)?.qty, 0.25, 'confirmed leftover is what the pantry keeps');
    assert.ok(afterItems.reduce((s, p) => s + p.qty, 0) < before.reduce((s, p) => s + p.qty, 0), 'cooking deducts stock');

    // Save, then a grocery list that holds only missing items.
    assert.equal((await call('POST', `/recipes/${recipe.id}/save`, {}, u.token)).json.recipe.status, 'saved');
    assert.equal((await call('GET', '/recipes?status=saved', undefined, u.token)).json.recipes.length, 1);
    const toList = await call('POST', `/recipes/${recipe.id}/missing-to-grocery`, {}, u.token);
    assert.equal(toList.status, 200);
    const list = (await call('GET', '/grocery', undefined, u.token)).json.items as Json[];
    assert.equal(list.length, toList.json.added);
    for (const g of list) {
      assert.ok(!['Rice', 'Chicken thighs'].includes(g.name) || g.qty > 0);
    }
  });

  test('simulated AI outage returns a friendly 503 and loses nothing', async () => {
    const u = await newUser('outage');
    const item = (await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token)).json.item;
    await call('POST', '/profile/consents/ai', { granted: true }, u.token);
    const r = await call('POST', '/recipes/generate', { itemIds: [item.id] }, u.token, { 'x-simulate-ai-failure': '1' });
    assert.equal(r.status, 503);
    assert.equal(r.json.error.code, 'ai_unavailable');
    assert.equal((await call('GET', '/pantry', undefined, u.token)).json.items.length, 1);
  });
});

describe('F3 grocery list', () => {
  test('add, check, clear checked, delete', async () => {
    const u = await newUser('grocery');
    const add = await call('POST', '/grocery', { name: 'Butter', qty: 250, unit: 'g' }, u.token);
    assert.equal(add.status, 201);
    const id = add.json.items[0].id;
    assert.equal((await call('PATCH', `/grocery/${id}`, { checked: true }, u.token)).json.items[0].checked, true);
    assert.equal((await call('DELETE', '/grocery/checked', undefined, u.token)).json.items.length, 0);
    await call('POST', '/grocery', { name: 'Salt', qty: 1, unit: '' }, u.token);
    const id2 = (await call('GET', '/grocery', undefined, u.token)).json.items[0].id;
    assert.equal((await call('DELETE', `/grocery/${id2}`, undefined, u.token)).json.items.length, 0);
    assert.equal((await call('POST', '/grocery', { name: '', qty: 1 }, u.token)).status, 400);
  });

  test('flags an item the pantry already has', async () => {
    const u = await newUser('grocerydup');
    await call('POST', '/pantry', { name: 'Milk', qty: 1, unit: 'L' }, u.token);
    assert.equal((await call('POST', '/grocery', { name: 'milk', qty: 1, unit: 'L' }, u.token)).json.inPantry, true);
  });
});

describe('F6 dietary filters & PDPA consent', () => {
  test('turning a filter on records an explicit opt-in, off records a withdrawal', async () => {
    const u = await newUser('diet');
    const on = await call('PUT', '/profile/diet', { vegetarian: true, allergies: ['Peanuts'] }, u.token);
    assert.equal(on.json.dietConsent, true);
    let records = (await call('GET', '/profile/consents', undefined, u.token)).json.records as Json[];
    assert.ok(records.some((r) => r.kind === 'diet_filter' && r.action === 'granted' && r.detail === 'Vegetarian'));
    assert.ok(records.some((r) => r.kind === 'diet_filter' && r.action === 'granted' && r.detail === 'Allergy: Peanuts'));

    await call('PUT', '/profile/diet', { vegetarian: false, allergies: [] }, u.token);
    records = (await call('GET', '/profile/consents', undefined, u.token)).json.records;
    assert.ok(records.some((r) => r.kind === 'diet_filter' && r.action === 'withdrawn' && r.detail === 'Vegetarian'));
  });

  test('unknown allergies are ignored', async () => {
    const u = await newUser('dietbad');
    const r = await call('PUT', '/profile/diet', { allergies: ['Peanuts', 'Moonrock'] }, u.token);
    assert.deepEqual(r.json.diet.allergies, ['Peanuts']);
  });

  test('a vegetarian filter is honoured by the generated recipe', async () => {
    const u = await newUser('veg');
    const items = [
      (await call('POST', '/pantry', { name: 'Rice', qty: 500, unit: 'g' }, u.token)).json.item,
      (await call('POST', '/pantry', { name: 'Tofu', qty: 1, unit: 'pack' }, u.token)).json.item,
      (await call('POST', '/pantry', { name: 'Spinach', qty: 1, unit: 'bag' }, u.token)).json.item,
    ];
    await call('PUT', '/profile/diet', { vegetarian: true }, u.token);
    await call('POST', '/profile/consents/ai', { granted: true }, u.token);
    const r = await call('POST', '/recipes/generate', { itemIds: items.map((i) => i.id) }, u.token);
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.ok(r.json.recipe.generation.filters.includes('Vegetarian'));
    assert.ok(!r.json.recipe.warnings.some((w: Json) => w.key === 'not-vegetarian'));
  });

  test('consent can be withdrawn and the AI is blocked again', async () => {
    const u = await newUser('withdraw');
    const item = (await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token)).json.item;
    await call('POST', '/profile/consents/ai', { granted: true }, u.token);
    await call('POST', '/profile/consents/ai', { granted: false }, u.token);
    assert.equal((await call('POST', '/recipes/generate', { itemIds: [item.id] }, u.token)).status, 403);
    const records = (await call('GET', '/profile/consents', undefined, u.token)).json.records as Json[];
    assert.ok(records.some((r) => r.kind === 'ai_consent' && r.action === 'withdrawn'));
    assert.ok(records.some((r) => r.kind === 'ai_consent' && r.action === 'granted'));
  });

  test('signup stores retrievable Terms + AI/Food-safety disclaimer acceptance with versions', async () => {
    const u = await newUser('terms');
    const records = (await call('GET', '/profile/consents', undefined, u.token)).json.records as Json[];
    for (const kind of ['terms', 'disclaimer']) {
      const rec = records.find((r) => r.kind === kind);
      assert.ok(rec, kind);
      assert.equal(rec.action, 'granted');
      assert.match(rec.version, /^v\d/);
      assert.ok(Date.parse(rec.at));
    }
  });
});

describe('Legal: access logs, export and full delete', () => {
  test('state-changing calls are logged with account, IP and time; GET is not', async () => {
    const u = await newUser('log');
    await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token);
    await call('GET', '/pantry', undefined, u.token);
    await new Promise((r) => setTimeout(r, 200));
    const data = (await call('GET', '/profile/export', undefined, u.token)).json;
    const logs = data.accessLog as Json[];
    const posts = logs.filter((l) => l.method === 'POST' && l.path.includes('/pantry'));
    assert.equal(posts.length, 1);
    assert.equal(posts[0].userId, u.id);
    assert.ok(posts[0].ip);
    assert.ok(Date.parse(posts[0].at));
    assert.ok(!logs.some((l) => l.method === 'GET'));
  });

  test('export returns everything held about the user', async () => {
    const u = await newUser('export');
    await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token);
    const data = (await call('GET', '/profile/export', undefined, u.token)).json;
    for (const key of ['account', 'pantry', 'recipes', 'aiGenerationRecords', 'groceryList', 'consentRecords', 'accessLog']) {
      assert.ok(key in data, key);
    }
    assert.equal(data.pantry.length, 1);
  });

  test('account deletion removes pantry/recipes/grocery/login but keeps logs and acceptance records', async () => {
    const u = await newUser('delete');
    const item = (await call('POST', '/pantry', { name: 'Rice', qty: 1, unit: 'kg' }, u.token)).json.item;
    await call('POST', '/grocery', { name: 'Milk', qty: 1, unit: 'L' }, u.token);
    await call('POST', '/profile/consents/ai', { granted: true }, u.token);
    const gen = await call('POST', '/recipes/generate', { itemIds: [item.id] }, u.token);
    assert.equal(gen.status, 201, JSON.stringify(gen.json));
    await new Promise((r) => setTimeout(r, 200));

    assert.equal((await call('DELETE', '/profile/account', undefined, u.token)).status, 204);
    assert.equal((await call('GET', '/auth/me', undefined, u.token)).status, 401, 'session is gone');
    assert.equal((await call('POST', '/auth/login', { email: u.email, password: PASSWORD })).status, 401, 'login is gone');

    // The deleted account's data must be gone from disk; the CCA/ETA evidence must remain.
    await new Promise((r) => setTimeout(r, 1500)); // debounced write
    const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'db.json'), 'utf8')) as Json;
    const mine = (xs: Json[]) => xs.filter((x) => x.userId === u.id);
    assert.equal(mine(raw.pantry).length, 0);
    assert.equal(mine(raw.recipes).length, 0);
    assert.equal(mine(raw.aiRecords).length, 0);
    assert.equal(mine(raw.grocery).length, 0);
    assert.equal(mine(raw.diets).length, 0);
    assert.equal(raw.users.filter((x: Json) => x.id === u.id).length, 0);
    assert.ok(mine(raw.accessLogs).length > 0, 'access logs kept (Computer Crime Act §26)');
    assert.ok(mine(raw.records).length > 0, 'acceptance records kept (ETA)');
  });
});
