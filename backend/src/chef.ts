/**
 * The chef: turns "here is my pantry, my diet and my mood" into recipes.
 *
 * Three steps, in order:
 *   1. PICK    — shortlist dataset recipes that match the pantry, then let
 *                Gemini choose the best ones for the occasion and say why.
 *   2. ADAPT   — if nothing matches well, Gemini rewrites the closest dataset
 *                recipe around what the user actually has.
 *   3. INVENT  — if the dataset has nothing usable, Gemini writes an original
 *                recipe from the selected items alone.
 * If Gemini is unavailable at any point we fall back to local scoring, so the
 * app always returns something.
 *
 * Every result records which step produced it and which dataset recipe it came
 * from, so the output stays reproducible (ETA §26/28).
 */
import fs from 'node:fs';
import { dataFile } from './paths.js';
import { askJson, geminiModel, GeminiError, hasGeminiKey } from './gemini.js';
import { MOODS, findMood, type Mood } from './moods.js';
import { SAMPLE_RECIPES } from './sample-recipes.js';
import { STAPLES } from './ingredient-text.js';
import { activeFilters, excludedFor, generateRecipe } from './ai.js';
import type { DatasetRecipe, RecipeDataset } from './dataset-types.js';
import type { DietProfile, Ingredient } from './types.js';

// ── Dataset loading ────────────────────────────────────────────────────────

let cached: { recipes: DatasetRecipe[]; source: string; count: number } | null = null;

export function dataset(): { recipes: DatasetRecipe[]; source: string; count: number } {
  if (cached) return cached;
  const file = dataFile('recipes.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as RecipeDataset;
    if (parsed.recipes?.length) {
      cached = { recipes: parsed.recipes, source: parsed.stats?.source ?? 'recipes.json', count: parsed.recipes.length };
      console.log(`Recipe dataset: ${cached.count} recipes from ${cached.source}`);
      return cached;
    }
  } catch {
    /* no imported dataset yet */
  }
  cached = { recipes: SAMPLE_RECIPES, source: 'built-in sample', count: SAMPLE_RECIPES.length };
  console.log('Recipe dataset: using the built-in sample (run `npm run import:recipes -- <csv>` for the full set)');
  return cached;
}

export const reloadDataset = (): void => {
  cached = null;
};

// ── Local scoring ──────────────────────────────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase();

function dietOk(r: DatasetRecipe, diet: DietProfile | undefined): boolean {
  if (!diet) return true;
  if (diet.vegetarian && !r.vegetarian) return false;
  if (diet.glutenFree && !r.glutenFree) return false;
  // Allergens are checked per-ingredient, never "reduced" (NFR5).
  const names = r.ingredients.map((i) => i.name);
  return !names.some((n) => excludedFor(n, diet));
}

export interface Candidate {
  recipe: DatasetRecipe;
  have: string[];
  missing: string[];
  score: number;
}

/** Ranks dataset recipes by how much of the selected pantry they use. */
export function shortlist(picked: Ingredient[], diet: DietProfile | undefined, mood: Mood | undefined, limit = 24): Candidate[] {
  const pickedKeys = new Set(picked.map((p) => norm(p.name)));
  const out: Candidate[] = [];

  for (const r of dataset().recipes) {
    if (!dietOk(r, diet)) continue;
    const have: string[] = [];
    const missing: string[] = [];
    for (const k of r.keys) {
      if (pickedKeys.has(k) || STAPLES.has(k)) have.push(k);
      else missing.push(k);
    }
    if (!have.length) continue;

    const coverage = have.length / Math.max(1, r.keys.length);
    let score = have.length * 10 + coverage * 20 - missing.length * 4;
    if (mood) {
      if (r.moods.includes(mood.id)) score += 18;
      if (mood.maxMinutes && r.minutes <= mood.maxMinutes) score += 6;
      if (mood.maxMinutes && r.minutes > mood.maxMinutes * 2) score -= 8;
      if (Math.abs(r.servings - mood.serves) <= 1) score += 4;
    }
    out.push({ recipe: r, have, missing, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── Result shape ───────────────────────────────────────────────────────────

export type ChefMethod = 'picked' | 'adapted' | 'invented' | 'local';

export interface ChefResult {
  name: string;
  minutes: number;
  servings: number;
  ingredients: Ingredient[];
  staples: string[];
  steps: string[];
  /** One sentence on why this suits the occasion — shown in the UI. */
  why: string;
  missing: string[];
  excluded: { name: string; reason: string }[];
  method: ChefMethod;
  sourceRecipeId?: string;
  sourceRecipeName?: string;
}

const SYSTEM = `You are a professional chef with 20 years in restaurant and home kitchens.
You choose dishes for the occasion, not just for the ingredients.
Rules you never break:
- Allergies and dietary filters are absolute. Never include an excluded ingredient, in any amount, and never suggest it as an option.
- Prefer what the cook already has. Basic staples (salt, pepper, oil, water, sugar, flour, stock, vinegar) can be assumed.
- Be honest about anything they would need to buy.
- Keep steps short, practical and in the order a cook would do them.
Reply with JSON only, no prose outside the JSON.`;

function pantryBlock(picked: Ingredient[], diet: DietProfile | undefined, mood: Mood | undefined): string {
  const lines = [
    `PANTRY THEY PICKED: ${picked.map((p) => `${p.name} (${p.qty}${p.unit ? ' ' + p.unit : ''})`).join(', ')}`,
  ];
  const filters = activeFilters(diet);
  lines.push(`DIETARY RULES (absolute): ${filters.length ? filters.join(', ') : 'none'}`);
  lines.push(mood ? `OCCASION: ${mood.label} — ${mood.hint} Cooking for about ${mood.serves}.` : 'OCCASION: not specified; assume an ordinary meal for 2.');
  return lines.join('\n');
}

interface AiRecipeShape {
  name?: string;
  minutes?: number;
  servings?: number;
  why?: string;
  ingredients?: { name?: string; qty?: number; unit?: string }[];
  steps?: string[];
  missing?: string[];
  sourceId?: string;
}

function cleanIngredients(list: AiRecipeShape['ingredients']): Ingredient[] {
  return (list ?? [])
    .map((i) => ({ name: String(i?.name ?? '').trim().slice(0, 60), qty: Number(i?.qty) || 0, unit: String(i?.unit ?? '').trim().slice(0, 12) }))
    .filter((i) => i.name);
}

/** Final safety net: never return a dish containing an excluded ingredient. */
function assertDietSafe(result: ChefResult, diet: DietProfile | undefined): ChefResult {
  if (!diet) return result;
  const bad = result.ingredients.filter((i) => excludedFor(i.name, diet));
  if (!bad.length) return result;
  return {
    ...result,
    ingredients: result.ingredients.filter((i) => !bad.includes(i)),
    excluded: [...result.excluded, ...bad.map((b) => ({ name: b.name, reason: excludedFor(b.name, diet) ?? 'dietary filter' }))],
  };
}

// ── The three steps ────────────────────────────────────────────────────────

async function pickFromDataset(picked: Ingredient[], diet: DietProfile | undefined, mood: Mood | undefined, candidates: Candidate[], count: number): Promise<ChefResult[]> {
  const menu = candidates
    .map((c, i) => `${i + 1}. [${c.recipe.id}] ${c.recipe.name} — ${c.recipe.minutes} min, serves ${c.recipe.servings}, uses: ${c.recipe.keys.join(', ')}${c.missing.length ? ` | they lack: ${c.missing.join(', ')}` : ' | they have everything'}`)
    .join('\n');

  const prompt = `${pantryBlock(picked, diet, mood)}

SHORTLIST FROM OUR RECIPE DATABASE:
${menu}

Choose the ${count} dishes that best suit the occasion. Prefer ones they can cook tonight with little or no shopping.
Reply as JSON: {"choices":[{"sourceId":"<id from the list>","why":"<one sentence, max 20 words, why this suits the occasion>"}]}`;

  const res = await askJson<{ choices?: { sourceId?: string; why?: string }[] }>(prompt, { system: SYSTEM, temperature: 0.5 });
  const out: ChefResult[] = [];
  for (const choice of res.choices ?? []) {
    const c = candidates.find((x) => x.recipe.id === choice.sourceId);
    if (!c) continue;
    out.push({
      name: c.recipe.name,
      minutes: c.recipe.minutes,
      servings: c.recipe.servings,
      ingredients: c.recipe.ingredients,
      staples: ['salt', 'oil', 'pepper'],
      steps: c.recipe.steps,
      why: String(choice.why ?? '').slice(0, 160),
      missing: c.missing,
      excluded: [],
      method: 'picked',
      sourceRecipeId: c.recipe.id,
      sourceRecipeName: c.recipe.name,
    });
  }
  return out;
}

async function adaptRecipe(picked: Ingredient[], diet: DietProfile | undefined, mood: Mood | undefined, base: Candidate): Promise<ChefResult> {
  const prompt = `${pantryBlock(picked, diet, mood)}

CLOSEST RECIPE IN OUR DATABASE (id ${base.recipe.id}):
Name: ${base.recipe.name}
Time: ${base.recipe.minutes} min, serves ${base.recipe.servings}
Ingredients: ${base.recipe.ingredients.map((i) => `${i.qty || ''}${i.unit ? ' ' + i.unit : ''} ${i.name}`.trim()).join('; ')}
Steps: ${base.recipe.steps.join(' ')}

Rewrite this dish around what they actually have: swap or drop what they lack, scale it for the occasion, keep it recognisable.
Reply as JSON: {"name":"","minutes":0,"servings":0,"why":"<max 20 words>","ingredients":[{"name":"","qty":0,"unit":""}],"steps":["",""],"missing":["anything they must still buy"]}`;

  const r = await askJson<AiRecipeShape>(prompt, { system: SYSTEM, temperature: 0.6 });
  return {
    name: String(r.name ?? base.recipe.name).slice(0, 80),
    minutes: Number(r.minutes) || base.recipe.minutes,
    servings: Number(r.servings) || mood?.serves || 2,
    ingredients: cleanIngredients(r.ingredients),
    staples: ['salt', 'oil', 'pepper'],
    steps: (r.steps ?? []).map((s) => String(s)).filter(Boolean).slice(0, 12),
    why: String(r.why ?? '').slice(0, 160),
    missing: (r.missing ?? []).map(String).slice(0, 8),
    excluded: [],
    method: 'adapted',
    sourceRecipeId: base.recipe.id,
    sourceRecipeName: base.recipe.name,
  };
}

async function inventRecipe(picked: Ingredient[], diet: DietProfile | undefined, mood: Mood | undefined): Promise<ChefResult> {
  const prompt = `${pantryBlock(picked, diet, mood)}

Nothing in our database fits. Write one original dish using only what they picked plus basic staples.
Reply as JSON: {"name":"","minutes":0,"servings":0,"why":"<max 20 words>","ingredients":[{"name":"","qty":0,"unit":""}],"steps":["",""],"missing":[]}`;

  const r = await askJson<AiRecipeShape>(prompt, { system: SYSTEM, temperature: 0.8 });
  return {
    name: String(r.name ?? 'Chef’s improvisation').slice(0, 80),
    minutes: Number(r.minutes) || 30,
    servings: Number(r.servings) || mood?.serves || 2,
    ingredients: cleanIngredients(r.ingredients),
    staples: ['salt', 'oil', 'pepper'],
    steps: (r.steps ?? []).map((s) => String(s)).filter(Boolean).slice(0, 12),
    why: String(r.why ?? '').slice(0, 160),
    missing: (r.missing ?? []).map(String).slice(0, 8),
    excluded: [],
    method: 'invented',
    sourceRecipeId: undefined,
  };
}

/** Honest one-liner for locally matched recipes — no claims we cannot back. */
function localWhy(c: Candidate, mood: Mood | undefined): string {
  const uses = `uses ${c.have.length} of the items you picked`;
  if (!mood) return `Matched locally: ${uses}.`;
  if (c.recipe.moods.includes(mood.id)) return `Tagged for ${mood.label.toLowerCase()} and ${uses}.`;
  return `Closest match for ${mood.label.toLowerCase()}: ${uses}.`;
}

/** No key, or Gemini failed: best local candidate, else the built-in generator. */
async function localFallback(picked: Ingredient[], diet: DietProfile | undefined, mood: Mood | undefined, candidates: Candidate[], variant: number): Promise<ChefResult[]> {
  const usable = candidates.filter((c) => c.missing.length <= 2).slice(0, 3);
  if (usable.length) {
    return usable.map((c) => ({
      name: c.recipe.name,
      minutes: c.recipe.minutes,
      servings: c.recipe.servings,
      ingredients: c.recipe.ingredients,
      staples: ['salt', 'oil', 'pepper'],
      steps: c.recipe.steps,
      why: localWhy(c, mood),
      missing: c.missing,
      excluded: [],
      method: 'local' as const,
      sourceRecipeId: c.recipe.id,
      sourceRecipeName: c.recipe.name,
    }));
  }
  const made = await generateRecipe(picked, diet, variant);
  return [{
    name: made.name,
    minutes: made.minutes,
    servings: mood?.serves ?? 2,
    ingredients: made.ingredients,
    staples: made.staples,
    steps: made.steps,
    why: 'Built from your ingredients while the chef service is unavailable.',
    missing: [],
    excluded: made.excluded,
    method: 'local',
  }];
}

export interface CookOptions {
  picked: Ingredient[];
  diet: DietProfile | undefined;
  moodId?: string | null;
  count?: number;
  variant?: number;
}

export interface CookOutcome {
  results: ChefResult[];
  model: string;
  usedAi: boolean;
  datasetSource: string;
  datasetSize: number;
  shortlisted: number;
  durationMs: number;
  note?: string;
}

/** Runs the cascade and always returns at least one recipe. */
export async function cook(opts: CookOptions): Promise<CookOutcome> {
  const started = Date.now();
  const mood = findMood(opts.moodId);
  const count = opts.count ?? 3;
  const candidates = shortlist(opts.picked, opts.diet, mood);
  const ds = dataset();
  const base = {
    model: hasGeminiKey() ? geminiModel() : 'local-fallback',
    datasetSource: ds.source,
    datasetSize: ds.count,
    shortlisted: candidates.length,
  };

  const finish = (results: ChefResult[], usedAi: boolean, note?: string): CookOutcome => ({
    ...base,
    results: results.map((r) => assertDietSafe(r, opts.diet)).filter((r) => r.ingredients.length),
    usedAi,
    durationMs: Date.now() - started,
    ...(note ? { note } : {}),
  });

  if (!hasGeminiKey()) {
    return finish(await localFallback(opts.picked, opts.diet, mood, candidates, opts.variant ?? 0), false, 'No AI key configured — using local matching.');
  }

  try {
    // 1 · PICK — only worth asking if something actually matches.
    const strong = candidates.filter((c) => c.missing.length <= 2);
    if (strong.length >= 2) {
      const picked = await pickFromDataset(opts.picked, opts.diet, mood, strong.slice(0, 18), count);
      if (picked.length) return finish(picked, true);
    }
    // 2 · ADAPT — closest recipe, rewritten around the pantry.
    if (candidates.length) {
      return finish([await adaptRecipe(opts.picked, opts.diet, mood, candidates[0])], true);
    }
    // 3 · INVENT — nothing in the dataset to anchor to.
    return finish([await inventRecipe(opts.picked, opts.diet, mood)], true);
  } catch (e) {
    const why = e instanceof GeminiError ? e.message : 'AI chef unavailable';
    console.warn(`Chef fell back to local matching: ${why}`);
    return finish(await localFallback(opts.picked, opts.diet, mood, candidates, opts.variant ?? 0), false, 'The AI chef was unavailable, so these were matched locally.');
  }
}

export { MOODS };
