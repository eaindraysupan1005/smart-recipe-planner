/**
 * Converts a recipe amount ("2 cups", "3 cloves", "1 lb") into the unit the
 * pantry tracks the item in ("g", "pieces", "can"), so cooking can deduct it.
 * Count-unit sizes and densities are rough averages — the cook confirms the
 * leftover anyway — and an unknown conversion returns null instead of guessing.
 */
import { canonicalName } from './ingredient-text.js';

const GRAMS: Record<string, number> = { g: 1, kg: 1000, oz: 28.35, lb: 453.6, pinch: 0.3 };
const MILLILITRES: Record<string, number> = { ml: 1, L: 1000, tsp: 5, tbsp: 15, cup: 240 };

/** Typical grams (or ml) in one pantry package. */
const PACKAGE_G: Record<string, number> = { can: 400, pack: 250, bag: 200, bunch: 100, jar: 300, btl: 500, tub: 150, bulb: 50 };

/** Typical grams of one whole item. */
const PIECE_G: Record<string, number> = {
  Eggs: 50, Onions: 150, Tomatoes: 120, Potatoes: 170, 'Sweet potato': 250, Carrots: 70, 'Bell peppers': 150,
  Cucumber: 300, Lemons: 60, Limes: 45, Oranges: 180, Apples: 180, Bananas: 120, Garlic: 5, Ginger: 30,
  Chillies: 10, Mushrooms: 20, Courgette: 200, Aubergine: 300, Broccoli: 300, Cabbage: 800, Lettuce: 300,
  Bread: 40, 'Spring onion': 15,
};

/** Grams per millilitre for foods that are not water-like. */
const DENSITY: Record<string, number> = {
  Flour: 0.53, Sugar: 0.85, Rice: 0.85, 'Rolled oats': 0.4, Butter: 0.95, Cheese: 0.45, Pasta: 0.4,
  'Olive oil': 0.92, 'Vegetable oil': 0.92, Honey: 1.4, 'Peanut butter': 1.1,
};

const COUNT_UNITS = new Set(['', 'pieces', 'piece', 'cloves', 'slices', 'bulb', 'can', 'pack', 'bag', 'tub', 'bunch', 'btl', 'jar']);

type Family = 'mass' | 'volume' | 'count';
const familyOf = (u: string): Family | null => (u in GRAMS ? 'mass' : u in MILLILITRES ? 'volume' : COUNT_UNITS.has(u) ? 'count' : null);

/** The amount in grams, or null when the unit has no weight we can infer. */
function toGrams(qty: number, unit: string, food: string | null): number | null {
  const fam = familyOf(unit);
  if (fam === 'mass') return qty * GRAMS[unit];
  if (fam === 'volume') return qty * MILLILITRES[unit] * ((food && DENSITY[food]) || 1);
  if (fam === 'count') {
    if (unit in PACKAGE_G) return qty * PACKAGE_G[unit];
    if (unit === 'cloves') return qty * 5;
    if (unit === 'slices') return qty * 30;
    if (food && PIECE_G[food]) return qty * PIECE_G[food];
  }
  return null;
}

export function convertQty(qty: number, from: string, to: string, name: string): number | null {
  if (from === to) return qty;
  const food = canonicalName(name);

  // Count to count: a recipe "3 cloves" against a pantry bulb, or "2" against pieces.
  if (familyOf(from) === 'count' && familyOf(to) === 'count') {
    if (from === 'cloves' && to === 'bulb') return qty / 10;
    // A bare "2" against any whole-item pantry unit: one per package is the best we can say.
    if (['', 'pieces', 'piece', 'slices'].includes(from)) return qty;
    if (from === 'cloves' && to === 'pieces') return qty;
  }

  const grams = toGrams(qty, from, food);
  if (grams === null) return null;
  const target = toGrams(1, to, food);
  return target ? grams / target : null;
}

/** Typical grams of a food one person eats in a meal, for recipes that give no amounts. */
const SERVING_G: Record<string, number> = {
  Chicken: 150, 'Chicken breast': 150, 'Chicken thighs': 150, Beef: 150, 'Minced beef': 120, Pork: 120, Lamb: 150,
  Salmon: 150, Tuna: 100, Prawns: 100, Fish: 150, Tofu: 100, Eggs: 100, Rice: 75, Pasta: 90, Noodles: 90,
  Potatoes: 200, 'Sweet potato': 200, Bread: 60, Cheese: 30, Butter: 15, Milk: 200, Cream: 50, Yoghurt: 100,
  Garlic: 5, Ginger: 5, Onions: 75, Tomatoes: 100, Flour: 40, Sugar: 15, 'Rolled oats': 50,
};

/**
 * Datasets such as RecipeNLG list ingredient names without amounts, so there is
 * nothing to convert. Estimate a per-serving portion instead; the cook corrects
 * it on the confirm screen.
 */
export function estimateQty(name: string, servings: number, to: string): number | null {
  const food = canonicalName(name);
  const perServing = (food && SERVING_G[food]) || 100;
  const grams = perServing * Math.max(1, servings);
  const target = toGrams(1, to, food);
  if (!target) return null;
  const qty = grams / target;
  // Whole items and packages are not used in tenths.
  return familyOf(to) === 'count' ? Math.max(1, Math.round(qty)) : qty;
}

const stem =(s: string) => s.trim().toLowerCase().replace(/(es|s)$/, '');

/** "Onion" matches "Onions", "Chicken thigh" matches "Chicken thighs". */
export function sameFood(a: string, b: string): boolean {
  if (a.trim().toLowerCase() === b.trim().toLowerCase() || stem(a) === stem(b)) return true;
  const ca = canonicalName(a);
  return ca !== null && ca === canonicalName(b);
}
