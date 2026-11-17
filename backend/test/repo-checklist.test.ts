// Repo hygiene from the BUILD checklist:
//   · README has setup instructions, mentions .env.example and a demo/test account
//   · .env.example exists and holds no real secrets
//   · no secrets are committed and .env is git-ignored
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let tracked: string[] = [];
try {
  tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
} catch { /* not a git checkout (e.g. a zip download): git-based tests are skipped */ }
const inGit = tracked.length > 0;

describe('README', () => {
  const readme = read('README.md');

  test('explains install and run', () => {
    assert.match(readme, /npm install/);
    assert.match(readme, /npm run (dev|demo)/);
  });

  test('documents the demo / test account', () => {
    assert.match(readme, /demo@what2cook\.app/);
  });

  test('explains the environment file and keys', () => {
    assert.match(readme, /\.env/);
    assert.match(readme, /GEMINI_API_KEY/);
  });
});

describe('.env.example', () => {
  test('exists, lists the keys the backend reads, and has no values filled in', () => {
    const example = read('backend/.env.example');
    for (const key of ['GEMINI_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
      assert.match(example, new RegExp(`^${key}=\\s*$`, 'm'), `${key} should be present and blank`);
    }
  });
});

describe('no secrets committed', { skip: !inGit && 'not a git checkout' }, () => {
  test('.env files are git-ignored and not tracked', () => {
    assert.match(read('.gitignore'), /^\.env$/m);
    const envFiles = tracked.filter((f) => /(^|\/)\.env(\.[^/]+)?$/.test(f) && !f.endsWith('.env.example'));
    assert.deepEqual(envFiles, []);
  });

  test('the local database file is git-ignored and not tracked', () => {
    assert.ok(!tracked.includes('backend/data/db.json'));
  });

  test('no API keys, tokens or private keys appear in tracked source/docs', () => {
    const patterns: [string, RegExp][] = [
      ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
      ['Google OAuth client secret', /GOCSPX-[0-9A-Za-z_-]{20,}/],
      ['OpenAI/Anthropic-style key', /\bsk-[A-Za-z0-9_-]{20,}/],
      ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
      ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
      ['Private key block', /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/],
      ['Supabase/JWT service key', /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/],
    ];
    const textFile = /\.(ts|tsx|js|mjs|json|md|html|css|sql|txt|yml|yaml|example)$/i;
    const hits: string[] = [];
    for (const f of tracked) {
      if (!textFile.test(f) || f.endsWith('package-lock.json')) continue;
      const full = path.join(ROOT, f);
      if (!fs.existsSync(full) || fs.statSync(full).size > 2_000_000) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const [label, re] of patterns) if (re.test(text)) hits.push(`${f}: ${label}`);
    }
    assert.deepEqual(hits, []);
  });

  test('secrets are read from the environment, not hard-coded', () => {
    for (const f of ['backend/src/gemini.ts', 'backend/src/oauth-google.ts', 'backend/src/db.ts']) {
      assert.match(read(f), /process\.env\./, f);
    }
  });
});
