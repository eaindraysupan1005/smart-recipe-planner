/**
 * Mock AI service — recipe generation. (Receipt OCR runs on-device with
 * Tesseract.js; see frontend/src/ocr.ts and ./receipt.ts.)
 *
 * This stands in for the third-party AI provider. It only ever receives the
 * minimum fields (ingredient name/qty/unit + dietary flags), never identity.
 * Swap `generateRecipe` for a real provider later; the
 * route layer does not need to change.
 */
import type { DietProfile, Ingredient } from './types.js';

export const MODEL_VERSION = 'what2cook-mock-chef-2026.09';

// ── Dietary rules ──────────────────────────────────────────────────────────

const ALLERGEN_WORDS: Record<string, string[]> = {
  Peanuts: ['peanut', 'groundnut', 'satay'],
  Dairy: ['milk', 'yoghurt', 'yogurt', 'cheese', 'butter', 'cream'],
  Shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'oyster', 'mussel'],
  Soy: ['soy', 'tofu', 'edamame', 'miso'],
  Eggs: ['egg'],
};
const MEAT_WORDS = ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'ham', 'fish', 'tuna', 'salmon', 'shrimp', 'prawn', 'sausage', 'mince'];
const GLUTEN_WORDS = ['flour', 'bread', 'pasta', 'noodle', 'soy sauce', 'wheat', 'barley', 'couscous', 'oats'];
const CARB_WORDS = ['rice', 'pasta', 'bread', 'potato', 'oats', 'noodle', 'sugar', 'banana', 'flour'];

const has = (name: string, words: string[]) => {
  const n = name.toLowerCase();
  return words.some((w) => n.includes(w));
};

export function activeFilters(diet: DietProfile | undefined): string[] {
  if (!diet) return [];
  const f: string[] = [];
  if (diet.vegetarian) f.push('Vegetarian');
  if (diet.glutenFree) f.push('Gluten-free');
  if (diet.lowCarb) f.push('Low-carb');
  for (const a of diet.allergies) f.push(`No ${a.toLowerCase()}`);
  return f;
}

function exclusionReason(name: string, diet: DietProfile | undefined): string | null {
  if (!diet) return null;
  for (const a of diet.allergies) if (has(name, ALLERGEN_WORDS[a] ?? [a.toLowerCase()])) return `${a} allergy`;
  if (diet.vegetarian && has(name, MEAT_WORDS)) return 'vegetarian';
  if (diet.glutenFree && has(name, GLUTEN_WORDS)) return 'gluten-free';
  if (diet.lowCarb && has(name, CARB_WORDS)) return 'low-carb';
  return null;
}

// ── Portions ───────────────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 100) / 100;

/** How much of a pantry item one recipe (two portions) uses. */
export function portion(item: Ingredient): number {
  const u = item.unit.toLowerCase();
  const cap: Record<string, number> = { g: 250, kg: 0.3, ml: 200, l: 0.3, pieces: 2, pcs: 2, '': 2 };
  if (has(item.name, ['oil']) && (u === 'ml' || u === 'l')) return round(Math.min(item.qty, u === 'l' ? 0.03 : 30));
  if (u in cap) return round(Math.min(item.qty, cap[u]));
  if (has(item.name, ['spinach', 'kale', 'lettuce'])) return round(Math.min(item.qty, 1));
  return round(Math.min(item.qty, 0.5));
}

// ── Recipe generation ──────────────────────────────────────────────────────

const STYLES = [
  { suffix: 'Skillet', minutes: 20 },
  { suffix: 'Fried Rice', minutes: 25, needs: 'rice' },
  { suffix: 'Traybake', minutes: 35 },
  { suffix: 'Soup', minutes: 30 },
  { suffix: 'Bowl', minutes: 15 },
  { suffix: 'Omelette', minutes: 12, needs: 'egg' },
  { suffix: 'Stir-fry', minutes: 18 },
  { suffix: 'Overnight Oats', minutes: 10, needs: 'oats' },
];

const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const lower = (s: string) => s.toLowerCase();

function listJoin(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

function stepsFor(style: string, names: string[]): string[] {
  const all = listJoin(names.map(lower));
  const first = lower(names[0]);
  const rest = names.slice(1).map(lower);
  switch (style) {
    case 'Fried Rice':
      return [
        'Cook the rice ahead and let it cool so the grains stay separate.',
        `Heat oil in a wok and fry ${rest.length ? listJoin(rest.filter((n) => !n.includes('rice'))) || 'the aromatics' : 'the aromatics'} for two minutes.`,
        'Push everything aside, add the rice and toss over high heat until it crackles.',
        'Season with salt and pepper off the heat and serve hot.',
      ];
    case 'Soup':
      return [
        `Warm a little oil in a pot and soften ${first} for 4 minutes.`,
        `Add ${rest.length ? listJoin(rest) : 'the rest'} and cover with about 1 litre of water.`,
        'Simmer gently for 20 minutes, until everything is tender.',
        'Season with salt and pepper; blend half of it if you like it thicker.',
      ];
    case 'Traybake':
      return [
        'Heat the oven to 200 °C.',
        `Toss ${all} with oil, salt and pepper on a large tray.`,
        'Roast for 25–30 minutes, turning once halfway.',
        'Rest for 3 minutes, then serve straight from the tray.',
      ];
    case 'Omelette':
      return [
        'Beat the eggs with a pinch of salt and pepper.',
        `Soften ${rest.filter((n) => !n.includes('egg')).length ? listJoin(rest.filter((n) => !n.includes('egg'))) : 'a little oil'} in a small pan over medium heat.`,
        'Pour in the eggs and let them set at the edges, pulling them to the centre.',
        'Fold in half when just set and slide onto a plate.',
      ];
    case 'Overnight Oats':
      return [
        `Stir together ${all} in a jar.`,
        'Add enough water or milk to just cover, and a pinch of salt.',
        'Cover and refrigerate overnight, or for at least 4 hours.',
        'Stir and loosen with a splash of liquid before eating.',
      ];
    case 'Bowl':
      return [
        `Prepare ${first}: slice, cook or warm it as needed.`,
        `Arrange with ${rest.length ? listJoin(rest) : 'any staples you have'} in two bowls.`,
        'Dress with oil, salt and pepper.',
        'Toss at the table and eat straight away.',
      ];
    case 'Stir-fry':
      return [
        `Cut ${all} into bite-size pieces.`,
        `Heat oil in a wok until shimmering and fry ${first} first for 3 minutes.`,
        'Add everything else and toss over high heat for another 3–4 minutes.',
        'Season with salt and pepper and serve.',
      ];
    default:
      return [
        'Heat the oil in a wide pan over medium heat.',
        `Add ${first} and cook for 3–4 minutes until it takes on colour.`,
        `Stir in ${rest.length ? listJoin(rest) : 'a pinch of salt'} and cook until everything is hot through.`,
        'Season with salt and pepper and serve straight from the pan.',
      ];
  }
}

export interface GeneratedRecipe {
  name: string;
  minutes: number;
  tags: string[];
  ingredients: Ingredient[];
  staples: string[];
  steps: string[];
  excluded: { name: string; reason: string }[];
  durationMs: number;
}

export class AiUnavailableError extends Error {}

/**
 * Builds a recipe from ONLY the picked pantry items plus basic staples, and
 * strips anything a dietary filter rules out (allergen safety is 100%, NFR5).
 */
export async function generateRecipe(
  picked: Ingredient[],
  diet: DietProfile | undefined,
  variant: number,
  opts: { simulateFailure?: boolean } = {},
): Promise<GeneratedRecipe> {
  const started = Date.now();
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
  if (opts.simulateFailure) throw new AiUnavailableError('AI service unavailable');

  const excluded: { name: string; reason: string }[] = [];
  const usable: Ingredient[] = [];
  for (const p of picked) {
    const why = exclusionReason(p.name, diet);
    if (why) excluded.push({ name: p.name, reason: why });
    else usable.push(p);
  }
  if (!usable.length) {
    return { name: '', minutes: 0, tags: [], ingredients: [], staples: [], steps: [], excluded, durationMs: 0 };
  }

  const names = usable.map((u) => u.name);
  const fits = STYLES.filter((s) => !s.needs || names.some((n) => lower(n).includes(s.needs!)));
  const style = fits[variant % fits.length];
  // Lead with the "main" ingredient: proteins first, then produce, then the rest.
  const ordered = [...usable].sort((a, b) => score(b.name) - score(a.name));
  const lead = ordered.slice(0, 2).map((i) => title(i.name.replace(/s$/, '')));
  const name = style.suffix === 'Fried Rice' && lead.some((l) => lower(l).includes('rice'))
    ? `${lead.find((l) => !lower(l).includes('rice')) ?? 'Garden'} Fried Rice`
    : `${lead.join(' & ')} ${style.suffix}`;

  const tags = activeFilters(diet).map((f) => `${f} ✓`);
  return {
    name,
    minutes: style.minutes + Math.min(10, usable.length * 2),
    tags,
    ingredients: ordered.map((i) => ({ name: i.name, qty: portion(i), unit: i.unit })),
    staples: ['salt', 'oil', 'pepper'],
    steps: stepsFor(style.suffix, ordered.map((i) => i.name)),
    excluded,
    durationMs: Date.now() - started,
  };
}

function score(name: string): number {
  if (has(name, MEAT_WORDS) || has(name, ['egg', 'tofu'])) return 3;
  if (has(name, ['spinach', 'tomato', 'carrot', 'onion', 'kale', 'pepper', 'mushroom', 'banana'])) return 2;
  if (has(name, ['rice', 'oats', 'pasta', 'noodle'])) return 1;
  return 0;
}
