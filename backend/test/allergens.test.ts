// F6 Dietary Filters — warnings must honour what the user declared.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { complianceTags, hasAllergyWarning, warningsFor } from '../src/allergens.js';
import type { DietProfile } from '../src/types.js';

const diet = (over: Partial<DietProfile> = {}): DietProfile => ({
  userId: 'u1', vegetarian: false, glutenFree: false, lowCarb: false, allergies: [], updatedAt: '', ...over,
});
const ing = (...names: string[]) => names.map((name) => ({ name, qty: 1, unit: 'pieces' }));

test('a declared allergy is flagged with allergy severity', () => {
  const w = warningsFor(ing('Peanut butter', 'Bread'), diet({ allergies: ['Peanuts'] }));
  assert.ok(hasAllergyWarning(w));
  assert.equal(w[0].severity, 'allergy');
});

test('the same allergen without a declared allergy is only informational', () => {
  const w = warningsFor(ing('Peanut butter'), diet());
  assert.ok(w.length > 0);
  assert.ok(w.every((x) => x.severity === 'info'));
  assert.ok(!hasAllergyWarning(w));
});

test('vegetarian filter flags meat', () => {
  const w = warningsFor(ing('Chicken thighs', 'Rice'), diet({ vegetarian: true }));
  assert.ok(w.some((x) => x.key === 'not-vegetarian' && x.severity === 'diet'));
});

test('vegetarian filter stays quiet for a vegetarian dish', () => {
  const w = warningsFor(ing('Tofu', 'Rice', 'Spinach'), diet({ vegetarian: true }));
  assert.ok(!w.some((x) => x.key === 'not-vegetarian'));
});

test('gluten-free filter flags gluten in the dish', () => {
  const w = warningsFor(ing('Pasta', 'Tomatoes'), diet({ glutenFree: true }));
  assert.ok(w.some((x) => x.key === 'gluten' && x.severity === 'diet'));
});

test('recipe name alone can reveal an allergen the ingredient list omits', () => {
  const w = warningsFor(ing('Banana'), diet({ glutenFree: true }), { name: 'Banana bread' });
  assert.ok(w.some((x) => x.key === 'gluten'));
});

test('warnings are ordered strongest first', () => {
  const w = warningsFor(ing('Peanut butter', 'Bread', 'Chicken'), diet({ allergies: ['Peanuts'], vegetarian: true }));
  const order = ['allergy', 'diet', 'info'];
  const ranks = w.map((x) => order.indexOf(x.severity));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test('a filter is only ticked when the dish really satisfies it', () => {
  const clash = warningsFor(ing('Pasta'), diet({ glutenFree: true }));
  assert.deepEqual(complianceTags(['Gluten-free'], clash), []);
  const clean = warningsFor(ing('Rice', 'Chicken'), diet({ glutenFree: true }));
  assert.deepEqual(complianceTags(['Gluten-free'], clean), ['Gluten-free ✓']);
});
