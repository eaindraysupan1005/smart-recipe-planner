/**
 * Works out what a recipe contains and how that sits with the user's dietary
 * profile. Nothing is removed — the UI shows a warning instead, so the cook
 * decides. Allergies are flagged at the highest severity.
 */
import type { DietProfile, Ingredient } from './types.js';

export type WarningSeverity = 'allergy' | 'diet' | 'info';

export interface Warning {
  /** Stable id, e.g. "peanuts" or "not-vegetarian". */
  key: string;
  label: string;
  severity: WarningSeverity;
  /** The ingredients that triggered it. */
  ingredients: string[];
}

/** The common allergens, with the words that give them away. */
const ALLERGENS: { key: string; label: string; profile?: string; words: string[]; not?: string[] }[] = [
  { key: 'peanuts', label: 'peanuts', profile: 'Peanuts', words: ['peanut', 'groundnut', 'satay', 'arachis'] },
  {
    key: 'tree-nuts', label: 'tree nuts',
    words: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'nutella', 'praline', 'marzipan', 'nut', 'nuts'],
    // "nutmeg", "coconut" and "butternut" are not tree nuts; peanuts have their own entry.
    not: ['nutmeg', 'coconut', 'butternut', 'peanut', 'water chestnut', 'nutrition', 'donut', 'doughnut'],
  },
  {
    key: 'dairy', label: 'milk', profile: 'Dairy',
    words: ['milk', 'cream', 'butter', 'cheese', 'yoghurt', 'yogurt', 'ghee', 'custard', 'mascarpone', 'ricotta', 'parmesan', 'cheddar', 'mozzarella', 'feta', 'buttermilk', 'condensed milk', 'evaporated milk'],
    // "peanut butter" and "coconut milk" are not dairy.
    not: ['peanut butter', 'nut butter', 'cocoa butter', 'shea butter', 'apple butter', 'coconut milk', 'coconut cream', 'soy milk', 'almond milk', 'oat milk', 'rice milk', 'creamer', 'cream of tartar'],
  },
  { key: 'eggs', label: 'eggs', profile: 'Eggs', words: ['egg', 'mayonnaise', 'meringue', 'aioli'] },
  { key: 'shellfish', label: 'shellfish', profile: 'Shellfish', words: ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'squid', 'calamari', 'shellfish'] },
  { key: 'fish', label: 'fish', words: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'mackerel', 'tilapia', 'snapper', 'fish sauce', 'worcestershire'] },
  { key: 'soy', label: 'soy', profile: 'Soy', words: ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh', 'tamari'] },
  {
    key: 'gluten', label: 'gluten',
    words: ['flour', 'bread', 'pasta', 'noodle', 'wheat', 'barley', 'rye', 'couscous', 'semolina', 'breadcrumb', 'cracker', 'tortilla', 'bun', 'pastry', 'soy sauce', 'beer', 'oats', 'bulgur', 'farro',
      'wafer', 'crumb', 'biscuit', 'cookie', 'cake mix', 'brownie mix', 'batter', 'dough', 'macaroni', 'spaghetti', 'penne', 'panko', 'crouton', 'graham', 'pie crust', 'puff pastry', 'cereal', 'pretzel', 'bagel', 'pita', 'naan', 'muffin', 'pancake', 'waffle', 'pie', 'tart', 'crust', 'pizza', 'pasty', 'cake', 'bread', 'brownie', 'dumpling', 'donut', 'doughnut', 'scone', 'croissant', 'lasagna', 'lasagne', 'ravioli', 'gnocchi', 'tempura', 'breaded', 'empanada'],
    not: ['gluten-free', 'gluten free', 'rice noodle', 'glass noodle', 'corn tortilla', 'almond flour', 'coconut flour', 'rice flour'],
  },
  { key: 'sesame', label: 'sesame', words: ['sesame', 'tahini'] },
];

const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'mutton', 'bacon', 'ham', 'sausage', 'chorizo', 'turkey', 'duck', 'veal', 'prosciutto', 'salami', 'pepperoni', 'mince', 'gelatin', 'lard', 'anchovy', 'fish', 'tuna', 'salmon', 'prawn', 'shrimp', 'crab', 'oyster sauce'];
const HIGH_CARB = ['rice', 'pasta', 'noodle', 'bread', 'potato', 'flour', 'sugar', 'oats', 'couscous', 'tortilla', 'syrup', 'honey', 'banana', 'corn'];

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole-word matching. Substrings cause nonsense — "15 minutes" is not a nut
 * and "a piece of" is not a pie — so every term is matched on word boundaries,
 * allowing a trailing plural.
 */
const cache = new Map<string, RegExp>();
function wordRe(words: string[]): RegExp {
  const key = words.join('|');
  let re = cache.get(key);
  if (!re) {
    re = new RegExp(`\\b(?:${words.map(escape).join('|')})(?:e?s)?\\b`, 'i');
    cache.set(key, re);
  }
  return re;
}

const hits = (names: string[], words: string[], not: string[] = []): string[] => {
  const re = wordRe(words);
  const noRe = not.length ? wordRe(not) : null;
  return names.filter((n) => {
    if (noRe?.test(n)) return false;
    return re.test(n);
  });
};

/** The word that triggered a match, for short, readable evidence. */
const matchedWord = (texts: string[], words: string[], not: string[] = []): string | null => {
  const re = wordRe(words);
  const noRe = not.length ? wordRe(not) : null;
  for (const t of texts) {
    if (noRe?.test(t)) continue;
    const m = re.exec(t);
    if (m) return m[0].toLowerCase();
  }
  return null;
};

export interface WarningContext {
  /** Recipe name and steps — dataset ingredient lists are often incomplete,
   *  so "banana bread" tells us about gluten even when flour is not listed. */
  name?: string;
  steps?: string[];
}

/**
 * Builds the warning list for a recipe.
 * - Allergies the user declared → severity "allergy".
 * - Dietary filters they switched on → severity "diet".
 * - Other common allergens present → severity "info", so a guest with a
 *   different allergy is still visible to the cook.
 */
export function warningsFor(ingredients: Ingredient[], diet: DietProfile | undefined, context: WarningContext = {}): Warning[] {
  const names = ingredients.map((i) => i.name);
  // The name is worth a lot: a "pie" or "bread" has flour whether or not the
  // dataset bothered to list it.
  const extra = [context.name ?? '', ...(context.steps ?? []).slice(0, 4)].filter(Boolean);
  const out: Warning[] = [];
  const declared = new Set(diet?.allergies ?? []);

  for (const a of ALLERGENS) {
    const found = hits(names, a.words, a.not);
    const fromText = found.length ? null : matchedWord(extra, a.words, a.not);
    if (!found.length && !fromText) continue;
    const isDeclaredAllergy = !!a.profile && declared.has(a.profile);
    const breaksGlutenFree = a.key === 'gluten' && !!diet?.glutenFree;
    out.push({
      key: a.key,
      label: isDeclaredAllergy
        ? `Contains ${a.label} — you listed this as an allergy`
        : breaksGlutenFree
          ? 'Contains gluten — you asked for gluten-free'
          : `Contains ${a.label}`,
      severity: isDeclaredAllergy ? 'allergy' : breaksGlutenFree ? 'diet' : 'info',
      // Evidence: the ingredients, or the recipe itself when that is all we have.
      ingredients: found.length ? found : [`"${fromText}" in the recipe`],
    });
  }

  if (diet?.vegetarian) {
    const meat = [...hits(names, MEAT), ...hits([context.name ?? ''], MEAT)];
    if (meat.length) out.push({ key: 'not-vegetarian', label: 'Not vegetarian — you asked for vegetarian', severity: 'diet', ingredients: meat });
  }
  if (diet?.lowCarb) {
    const carbs = hits(names, HIGH_CARB);
    if (carbs.length >= 2) out.push({ key: 'high-carb', label: 'Carb-heavy — you asked for low-carb', severity: 'diet', ingredients: carbs });
  }

  // Strongest first, so the UI can lead with the one that matters.
  const rank = { allergy: 0, diet: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Which warning each dietary filter maps to, for honest "✓" tags. */
const FILTER_WARNING: [RegExp, string][] = [
  [/^vegetarian$/i, 'not-vegetarian'],
  [/^gluten-free$/i, 'gluten'],
  [/^low-carb$/i, 'high-carb'],
  [/^no peanuts$/i, 'peanuts'],
  [/^no dairy$/i, 'dairy'],
  [/^no eggs$/i, 'eggs'],
  [/^no soy$/i, 'soy'],
  [/^no shellfish$/i, 'shellfish'],
];

/**
 * A "Gluten-free ✓" tag may only appear when the dish really is gluten-free.
 * Anything that clashes is left to the warning instead of being ticked off.
 */
export function complianceTags(filters: string[], warnings: Warning[]): string[] {
  const flagged = new Set(warnings.map((w) => w.key));
  return filters
    .filter((f) => {
      const hit = FILTER_WARNING.find(([re]) => re.test(f));
      return hit ? !flagged.has(hit[1]) : true;
    })
    .map((f) => `${f} ✓`);
}

/** True when the recipe clashes with something the user actually asked for. */
export const conflicts = (w: Warning[]): Warning[] => w.filter((x) => x.severity !== 'info');
export const hasAllergyWarning = (w: Warning[]): boolean => w.some((x) => x.severity === 'allergy');
