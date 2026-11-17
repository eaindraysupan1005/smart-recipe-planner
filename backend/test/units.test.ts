// F2 Pantry Tracker — unit conversion used to deduct cooked ingredients.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertQty, estimateQty, sameFood } from '../src/units.js';

const near = (a: number | null, b: number, eps = 0.01) => {
  assert.ok(a !== null, 'expected a number, got null');
  assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);
};

test('same unit is returned unchanged', () => assert.equal(convertQty(250, 'g', 'g', 'Rice'), 250));

test('kg <-> g', () => {
  near(convertQty(0.3, 'kg', 'g', 'Rice'), 300);
  near(convertQty(500, 'g', 'kg', 'Rice'), 0.5);
});

test('cloves of garlic against a pantry bulb', () => near(convertQty(5, 'cloves', 'bulb', 'Garlic'), 0.5));

test('volume to mass uses the food density', () => near(convertQty(1, 'cup', 'g', 'Flour'), 240 * 0.53, 0.5));

test('unknown conversions return null instead of guessing', () => {
  assert.equal(convertQty(2, 'furlongs', 'g', 'Rice'), null);
});

test('estimateQty scales the per-serving portion by servings', () => {
  const one = estimateQty('Chicken', 1, 'g')!;
  const four = estimateQty('Chicken', 4, 'g')!;
  near(four, one * 4);
});

test('sameFood matches singular/plural and case', () => {
  assert.ok(sameFood('Onion', 'onions'));
  assert.ok(sameFood('Chicken thigh', 'Chicken thighs'));
  assert.ok(!sameFood('Rice', 'Pasta'));
});
