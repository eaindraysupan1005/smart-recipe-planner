// Security / PDPA — passwords are hashed with scrypt, never stored in clear.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPassword, clearAttempts, hashPassword, noteFailure, tooManyAttempts, verifyPassword,
} from '../src/auth-password.js';

test('hash is salted scrypt and never contains the password', async () => {
  const pw = 'correct horse battery';
  const a = await hashPassword(pw);
  const b = await hashPassword(pw);
  assert.match(a, /^scrypt\$/);
  assert.ok(!a.includes(pw));
  assert.notEqual(a, b, 'same password must hash differently (random salt)');
});

test('verifyPassword accepts the right password and rejects wrong or malformed input', async () => {
  const h = await hashPassword('correct horse battery');
  assert.equal(await verifyPassword('correct horse battery', h), true);
  assert.equal(await verifyPassword('wrong horse battery', h), false);
  assert.equal(await verifyPassword('x', 'not-a-hash'), false);
  assert.equal(await verifyPassword('x', 'bcrypt$1$2$3$4$5'), false);
});

test('password rules: length, common, email-in-password, repeated char', () => {
  assert.equal(checkPassword('short').ok, false);
  assert.equal(checkPassword('password123').ok, false);
  assert.equal(checkPassword('a'.repeat(201)).ok, false);
  assert.equal(checkPassword('aaaaaaaaaa').ok, false);
  assert.equal(checkPassword('janedoe-secret-1', 'janedoe@example.com').ok, false);
  const good = checkPassword('Tr1cky-long-passphrase!');
  assert.equal(good.ok, true);
  assert.ok(good.score >= 3);
});

test('login attempts lock after 10 failures and can be cleared', () => {
  const key = 'test-ip:lock@example.com';
  clearAttempts(key);
  for (let i = 0; i < 9; i++) noteFailure(key);
  assert.equal(tooManyAttempts(key), false);
  noteFailure(key);
  assert.equal(tooManyAttempts(key), true);
  clearAttempts(key);
  assert.equal(tooManyAttempts(key), false);
});
