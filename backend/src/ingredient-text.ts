/**
 * Turns free-text recipe ingredient lines ("2 cups all-purpose flour, sifted")
 * into {name, qty, unit}, and maps the name to a canonical pantry food so a
 * dataset recipe can be matched against what the user actually has.
 */
import type { Ingredient } from './types.js';

const UNITS: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', gm: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml',
  l: 'L', liter: 'L', liters: 'L', litre: 'L', litres: 'L',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  clove: 'cloves', cloves: 'cloves',
  can: 'can', cans: 'can', tin: 'can', tins: 'can',
  slice: 'slices', slices: 'slices',
  piece: 'pieces', pieces: 'pieces',
  bunch: 'bunch', bunches: 'bunch',
  pinch: 'pinch', pinches: 'pinch',
  package: 'pack', packages: 'pack', pack: 'pack', packet: 'pack',
};

const FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875, '⅙': 1 / 6, '⅕': 0.2,
};

/** Words that describe preparation, not the food itself. */
const NOISE = new Set([
  'fresh', 'freshly', 'chopped', 'minced', 'diced', 'sliced', 'grated', 'shredded', 'crushed',
  'ground', 'whole', 'large', 'small', 'medium', 'extra', 'virgin', 'ripe', 'raw', 'cooked',
  'boneless', 'skinless', 'peeled', 'seeded', 'drained', 'rinsed', 'optional', 'to', 'taste',
  'finely', 'roughly', 'thinly', 'cut', 'into', 'pieces', 'and', 'or', 'of', 'for', 'plus',
  'more', 'a', 'an', 'the', 'softened', 'melted', 'warm', 'cold', 'room', 'temperature',
  'packed', 'firmly', 'lightly', 'well', 'beaten', 'divided', 'unsalted', 'salted', 'low',
  'sodium', 'free', 'range', 'organic', 'canned', 'frozen', 'dried', 'dry', 'ok', 'about',
]);

/**
 * Canonical foods. Longest key wins, so "chicken breast" beats "chicken".
 * Kept deliberately broad: it only needs to be good enough to match a pantry.
 */
const CANON: [string, string[]][] = [
  ['Chicken breast', ['chicken breast']],
  ['Chicken thighs', ['chicken thigh', 'chicken drumstick']],
  ['Chicken', ['chicken']],
  ['Minced beef', ['ground beef', 'beef mince', 'minced beef', 'hamburger meat']],
  ['Beef', ['beef', 'steak', 'brisket', 'chuck']],
  ['Pork', ['pork', 'bacon', 'ham', 'sausage', 'chorizo']],
  ['Lamb', ['lamb', 'mutton']],
  ['Salmon', ['salmon']],
  ['Tuna', ['tuna']],
  ['Prawns', ['shrimp', 'prawn']],
  ['Fish', ['fish fillet', 'white fish', 'cod', 'tilapia', 'snapper']],
  ['Tofu', ['tofu', 'bean curd']],
  ['Eggs', ['egg']],
  ['Milk', ['milk']],
  ['Yoghurt', ['yogurt', 'yoghurt', 'curd']],
  ['Butter', ['butter']],
  ['Cheese', ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta']],
  ['Cream', ['cream', 'creme fraiche']],
  ['Coconut milk', ['coconut milk', 'coconut cream']],
  ['Spinach', ['spinach']],
  ['Lettuce', ['lettuce', 'romaine', 'iceberg']],
  ['Cabbage', ['cabbage', 'bok choy', 'pak choi']],
  ['Broccoli', ['broccoli']],
  ['Carrots', ['carrot']],
  ['Potatoes', ['potato']],
  ['Sweet potato', ['sweet potato', 'kumara']],
  ['Tomatoes', ['tomato']],
  ['Tomato paste', ['tomato paste', 'tomato puree']],
  ['Onions', ['onion', 'shallot']],
  ['Spring onion', ['spring onion', 'scallion', 'green onion']],
  ['Garlic', ['garlic']],
  ['Ginger', ['ginger']],
  ['Chillies', ['chili', 'chilli', 'chile', 'jalapeno', 'serrano']],
  ['Bell peppers', ['bell pepper', 'capsicum', 'red pepper', 'green pepper']],
  ['Mushrooms', ['mushroom']],
  ['Cucumber', ['cucumber']],
  ['Courgette', ['zucchini', 'courgette']],
  ['Aubergine', ['eggplant', 'aubergine']],
  ['Peas', ['pea', 'peas']],
  ['Corn', ['corn', 'sweetcorn']],
  ['Beans', ['black bean', 'kidney bean', 'white bean', 'cannellini']],
  ['Chickpeas', ['chickpea', 'garbanzo']],
  ['Lentils', ['lentil']],
  ['Coriander', ['cilantro', 'coriander']],
  ['Basil', ['basil']],
  ['Parsley', ['parsley']],
  ['Mint', ['mint']],
  ['Lemons', ['lemon']],
  ['Limes', ['lime']],
  ['Oranges', ['orange']],
  ['Apples', ['apple']],
  ['Bananas', ['banana']],
  ['Rice', ['rice']],
  ['Pasta', ['pasta', 'spaghetti', 'penne', 'macaroni', 'fusilli', 'linguine']],
  ['Noodles', ['noodle', 'ramen', 'udon', 'vermicelli']],
  ['Bread', ['bread', 'baguette', 'bun', 'tortilla', 'pita']],
  ['Flour', ['flour']],
  ['Sugar', ['sugar', 'honey', 'maple syrup']],
  ['Rolled oats', ['oats', 'oatmeal']],
  ['Olive oil', ['olive oil']],
  ['Vegetable oil', ['vegetable oil', 'canola oil', 'sunflower oil', 'cooking oil', 'sesame oil']],
  ['Soy sauce', ['soy sauce', 'soya sauce', 'tamari']],
  ['Fish sauce', ['fish sauce']],
  ['Oyster sauce', ['oyster sauce']],
  ['Vinegar', ['vinegar']],
  ['Peanut butter', ['peanut butter']],
  ['Peanuts', ['peanut', 'groundnut']],
  ['Salt', ['salt']],
  ['Pepper', ['black pepper', 'pepper']],
  ['Stock', ['stock', 'broth', 'bouillon']],
  ['Wine', ['wine']],
];
const CANON_KEYS = CANON.flatMap(([name, keys]) => keys.map((k) => ({ k, name }))).sort((a, b) => b.k.length - a.k.length);

/** Pantry staples we assume everyone has — never counted as "missing". */
export const STAPLES = new Set(['Salt', 'Pepper', 'Vegetable oil', 'Olive oil', 'Sugar', 'Flour', 'Stock', 'Vinegar', 'Water']);

export function canonicalName(text: string): string | null {
  const t = ` ${text.toLowerCase()} `;
  const hit = CANON_KEYS.find(({ k }) => t.includes(` ${k}`) || t.includes(`${k} `) || t.includes(k));
  return hit?.name ?? null;
}

function parseAmount(token: string): number | null {
  if (token in FRACTIONS) return FRACTIONS[token];
  const mixed = token.match(/^(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞⅙⅕])$/);
  if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = token.match(/^\d+(\.\d+)?$/);
  return num ? Number(token) : null;
}

/** "2 cups all-purpose flour, sifted" -> { name: 'Flour', qty: 2, unit: 'cup' } */
export function parseIngredientLine(line: string): (Ingredient & { canonical: string | null; raw: string }) | null {
  const raw = String(line).trim();
  if (!raw) return null;
  // Drop anything after a comma or bracket — that is preparation, not the food.
  const head = raw.split(/[,(]/)[0].trim();
  const words = head.replace(/[^A-Za-z0-9½⅓⅔¼¾⅛⅜⅝⅞⅙⅕./\- ]/g, ' ').split(/\s+/).filter(Boolean);

  let qty = 0;
  let unit = '';
  let i = 0;
  const first = words[0] ? parseAmount(words[0]) : null;
  if (first !== null) {
    qty = first;
    i = 1;
    const second = words[1] ? parseAmount(words[1]) : null;
    if (second !== null && second < 1) {
      qty += second; // "1 1/2"
      i = 2;
    }
    const maybeUnit = (words[i] ?? '').toLowerCase().replace(/\.$/, '');
    if (maybeUnit in UNITS) {
      unit = UNITS[maybeUnit];
      i += 1;
    }
  }

  const nameWords = words.slice(i).filter((w) => !NOISE.has(w.toLowerCase()) && !/^\d/.test(w));
  const name = nameWords.join(' ').trim();
  if (!name) return null;
  const canonical = canonicalName(head) ?? canonicalName(name);
  const pretty = canonical ?? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return { name: pretty, qty, unit, canonical, raw };
}
