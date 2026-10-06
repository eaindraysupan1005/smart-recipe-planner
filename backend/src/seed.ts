/**
 * Demo data for Alpha Demo Day: `npm run seed`.
 *
 * Creates (or resets) one demo account that already has a pantry, a saved
 * recipe, an AI suggestion and a shopping list, so the demo never starts on an
 * empty screen. Sign in with the email below and ANY password (dummy auth).
 *
 * Run with --fresh to wipe the whole database first.
 */
import { db, newId, now, persist } from './db.js';
import { addRecord, VERSIONS } from './consent.js';
import { MODEL_VERSION } from './ai.js';
import type { GroceryItem, PantryItem, Recipe } from './types.js';

export const DEMO_EMAIL = 'demo@what2cook.app';
const DEMO_NAME = 'Susan';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const PANTRY: [string, number, string, number, PantryItem['source']][] = [
  // name, qty, unit, days ago, source
  ['Spinach', 200, 'g', 0, 'scan'],
  ['Eggs', 6, 'pieces', 0, 'scan'],
  ['Chicken thighs', 500, 'g', 0, 'scan'],
  ['Milk', 1, 'L', 0, 'scan'],
  ['Yoghurt', 500, 'g', 0, 'scan'],
  ['Rolled oats', 900, 'g', 0, 'scan'],
  ['Soy sauce', 500, 'ml', 0, 'scan'],
  ['Bananas', 1, 'bunch', 0, 'scan'],
  ['Olive oil', 750, 'ml', 0, 'scan'],
  ['Rice', 2, 'kg', 13, 'scan'],
  ['Garlic', 1, 'bulb', 13, 'scan'],
  ['Fish sauce', 1, 'btl', 28, 'manual'],
];

function wipeUser(userId: string) {
  const not = <T extends { userId: string }>(xs: T[]) => xs.filter((x) => x.userId !== userId);
  db.pantry = not(db.pantry);
  db.recipes = not(db.recipes);
  db.aiRecords = not(db.aiRecords);
  db.grocery = not(db.grocery);
  db.diets = not(db.diets);
  db.records = not(db.records);
}

export function seed(fresh = false): void {
  if (fresh) {
    db.users = [];
    db.sessions = [];
    db.records = [];
    db.diets = [];
    db.pantry = [];
    db.recipes = [];
    db.aiRecords = [];
    db.grocery = [];
    db.accessLogs = [];
  }

  let user = db.users.find((u) => u.email.toLowerCase() === DEMO_EMAIL);
  if (user) wipeUser(user.id);
  else {
    user = { id: newId(), email: DEMO_EMAIL, name: DEMO_NAME, createdAt: daysAgo(30) };
    db.users.push(user);
  }
  const userId = user.id;

  // Acceptance + consent records (ETA / PDPA), so Privacy screen is not empty.
  addRecord(userId, 'terms', 'granted', `Terms of Service ${VERSIONS.terms}`);
  addRecord(userId, 'disclaimer', 'granted', `AI & Food Safety Disclaimer ${VERSIONS.disclaimer}`);
  addRecord(userId, 'diet_filter', 'granted', 'Gluten-free');
  addRecord(userId, 'diet_filter', 'granted', 'Allergy: Peanuts');
  addRecord(userId, 'diet_consent', 'granted', 'Use my dietary filters');
  addRecord(userId, 'ai_consent', 'granted', 'Pantry data sent to AI service');

  db.diets.push({
    userId,
    vegetarian: false,
    glutenFree: true,
    lowCarb: false,
    allergies: ['Peanuts'],
    updatedAt: daysAgo(30),
  });

  const pantry: PantryItem[] = PANTRY.map(([name, qty, unit, ago, source]) => ({
    id: newId(),
    userId,
    name,
    qty,
    unit,
    scannedAt: daysAgo(ago),
    source,
  }));
  db.pantry.push(...pantry);
  const pick = (name: string) => pantry.find((p) => p.name === name)!;

  const generation = (minsAgo: number, variant: number, snapshot: PantryItem[]) => ({
    model: MODEL_VERSION,
    pantrySnapshot: snapshot.map((p) => ({ name: p.name, qty: p.qty, unit: p.unit })),
    filters: ['Gluten-free', 'No peanuts'],
    createdAt: new Date(Date.now() - minsAgo * 60_000).toISOString(),
    durationMs: 6200,
    variant,
  });

  // One saved recipe that is missing an ingredient — shows the shopping list.
  const savedPicks = [pick('Rice'), pick('Chicken thighs'), pick('Garlic'), pick('Soy sauce')];
  const saved: Recipe = {
    id: newId(),
    userId,
    name: 'Chicken & Garlic Rice Bowl',
    minutes: 35,
    tags: ['Gluten-free ✓', 'No peanuts ✓'],
    ingredients: [
      { name: 'Chicken thighs', qty: 250, unit: 'g' },
      { name: 'Rice', qty: 0.3, unit: 'kg' },
      { name: 'Garlic', qty: 0.5, unit: 'bulb' },
      { name: 'Ginger', qty: 1, unit: 'pieces' },
    ],
    staples: ['salt', 'oil', 'pepper'],
    steps: [
      'Rinse the rice until the water runs clear, then cook it with a pinch of salt.',
      'Brown the chicken thighs skin-side down in a little oil for 6 minutes.',
      'Add the garlic and ginger, and cook for another 2 minutes until fragrant.',
      'Slice the chicken, spoon over the pan juices and serve on the rice.',
    ],
    excluded: [],
    status: 'saved',
    pickedItemIds: savedPicks.map((p) => p.id),
    generation: generation(60 * 26, 0, savedPicks),
    savedAt: daysAgo(1),
  };

  // One fresh suggestion waiting on the Recipes tab.
  const genPicks = [pick('Spinach'), pick('Eggs'), pick('Olive oil')];
  const suggestion: Recipe = {
    id: newId(),
    userId,
    name: 'Spinach & Egg Skillet',
    minutes: 20,
    tags: ['Gluten-free ✓', 'No peanuts ✓'],
    ingredients: [
      { name: 'Eggs', qty: 2, unit: 'pieces' },
      { name: 'Spinach', qty: 200, unit: 'g' },
      { name: 'Olive oil', qty: 30, unit: 'ml' },
    ],
    staples: ['salt', 'oil', 'pepper'],
    steps: [
      'Heat the oil in a wide pan over medium heat.',
      'Add the spinach a handful at a time and let it wilt down, about 3 minutes.',
      'Push it to one side, crack in the eggs, and cook until the whites set.',
      'Season with salt and pepper and serve straight from the pan.',
    ],
    excluded: [],
    status: 'generated',
    pickedItemIds: genPicks.map((p) => p.id),
    generation: generation(12, 0, genPicks),
  };

  db.recipes.push(saved, suggestion);
  for (const r of [saved, suggestion]) {
    db.aiRecords.push({
      id: newId(),
      userId,
      recipeId: r.id,
      text: [r.name, ...r.ingredients.map((i) => `${i.name} ${i.qty} ${i.unit}`), ...r.steps].join('\n'),
      generation: r.generation,
    });
  }

  const grocery: GroceryItem[] = [
    { name: 'Ginger', qty: 1, unit: 'pieces', fromRecipe: saved.name },
    { name: 'Coriander', qty: 1, unit: 'bunch' },
    { name: 'Limes', qty: 3, unit: 'pieces' },
  ].map((g) => ({ id: newId(), userId, checked: false, addedAt: daysAgo(1), ...g }) as GroceryItem);
  db.grocery.push(...grocery);

  // A little access-log history (CCA §26) so the export is not empty.
  for (let i = 0; i < 5; i++) {
    db.accessLogs.push({
      id: newId(),
      userId,
      ip: '127.0.0.1',
      at: daysAgo(i),
      method: 'POST',
      path: '/api/pantry/bulk',
      status: 201,
    });
  }

  persist();
}

// Run directly: `npm run seed [-- --fresh]`
const fresh = process.argv.includes('--fresh');
seed(fresh);
setTimeout(() => {
  console.log(`Seeded demo data${fresh ? ' (fresh database)' : ''}.`);
  console.log(`  Sign in: ${DEMO_EMAIL}  ·  password: anything`);
  console.log(`  ${db.pantry.length} pantry items · ${db.recipes.length} recipes · ${db.grocery.length} shopping items`);
}, 100);
