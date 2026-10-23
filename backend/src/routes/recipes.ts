import { Router } from 'express';
import { db, newId, now, persist } from '../db.js';
import { HttpError } from '../middleware.js';
import { consentState } from '../consent.js';
import { activeFilters, AiUnavailableError } from '../ai.js';
import { cook, type ChefResult } from '../chef.js';
import { MOODS } from '../moods.js';
import { getDiet } from './profile.js';
import { userPantry } from './pantry.js';
import type { Ingredient, PantryItem, Recipe } from '../types.js';

export const recipesRouter = Router();

const round = (n: number) => Math.round(n * 100) / 100;
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function findRecipe(userId: string, id: string): Recipe {
  const r = db.recipes.find((x) => x.id === id && x.userId === userId);
  if (!r) throw new HttpError(404, 'not_found', 'That recipe is gone — it may have been deleted.');
  return r;
}

/** Local comparison against the pantry — nothing is sent to the AI service. */
function pantryCheck(recipe: Recipe, pantry: PantryItem[]) {
  const have: (Ingredient & { stock: string })[] = [];
  const need: Ingredient[] = [];
  for (const ing of recipe.ingredients) {
    const p = pantry.find((x) => sameName(x.name, ing.name));
    if (!p) need.push(ing);
    else if (p.unit === ing.unit && p.qty < ing.qty) need.push({ ...ing, qty: round(ing.qty - p.qty) });
    else have.push({ ...ing, stock: `${p.qty} ${p.unit}`.trim() });
  }
  return { have, need };
}

function withCheck(recipe: Recipe, pantry: PantryItem[]) {
  return { ...recipe, check: pantryCheck(recipe, pantry) };
}

recipesRouter.get('/', (req, res) => {
  const userId = req.user!.id;
  const status = req.query.status === 'saved' ? 'saved' : 'generated';
  const pantry = userPantry(userId);
  const recipes = db.recipes
    .filter((r) => r.userId === userId && r.status === status)
    .sort((a, b) => (b.savedAt ?? b.generation.createdAt).localeCompare(a.savedAt ?? a.generation.createdAt))
    .map((r) => withCheck(r, pantry));
  res.json({ recipes });
});

async function runGeneration(
  userId: string,
  itemIds: string[],
  moodId: string | null,
  variant: number,
  simulateFailure: boolean,
  regeneratedFrom?: string,
): Promise<Recipe[]> {
  const { aiConsent, dietConsent } = consentState(userId);
  if (!aiConsent) {
    throw new HttpError(403, 'consent_required', 'We need your consent before sending ingredients to the AI service.');
  }
  const pantry = userPantry(userId);
  const picked = pantry.filter((p) => itemIds.includes(p.id));
  if (!picked.length) throw new HttpError(400, 'nothing_picked', 'Pick at least one pantry item to cook with.');
  if (simulateFailure) {
    throw new HttpError(503, 'ai_unavailable', "We couldn't reach the recipe service. Nothing was lost.");
  }

  // Minimum fields only: name, qty, unit + dietary flags. No identity.
  const snapshot: Ingredient[] = picked.map((p) => ({ name: p.name, qty: p.qty, unit: p.unit }));
  const diet = dietConsent ? getDiet(userId) : undefined;

  let outcome;
  try {
    outcome = await cook({ picked: snapshot, diet, moodId, variant });
  } catch (e) {
    if (e instanceof AiUnavailableError) {
      throw new HttpError(503, 'ai_unavailable', "We couldn't reach the recipe service. Nothing was lost.");
    }
    throw e;
  }
  if (!outcome.results.length) {
    throw new HttpError(422, 'nothing_fits', 'Nothing we can cook safely from those items with your filters. Try picking something else.');
  }

  // Suggestions are transient: a new run replaces the unsaved ones. The AI
  // records they produced are kept (ETA), only the suggestion rows go.
  if (!regeneratedFrom) {
    db.recipes = db.recipes.filter((r) => !(r.userId === userId && r.status === 'generated'));
  }

  const filters = diet ? activeFilters(diet) : [];
  const made: Recipe[] = outcome.results.map((r: ChefResult) => {
    const recipe: Recipe = {
      id: newId(),
      userId,
      name: r.name,
      minutes: r.minutes,
      servings: r.servings,
      tags: filters.map((f) => `${f} ✓`),
      ingredients: r.ingredients,
      staples: r.staples,
      steps: r.steps,
      excluded: r.excluded,
      why: r.why,
      missing: r.missing,
      status: 'generated',
      pickedItemIds: picked.map((p) => p.id),
      generation: {
        model: outcome.model,
        pantrySnapshot: snapshot,
        filters,
        createdAt: now(),
        durationMs: outcome.durationMs,
        variant,
        regeneratedFrom,
        mood: moodId ?? undefined,
        method: r.method,
        sourceRecipeId: r.sourceRecipeId,
        sourceRecipeName: r.sourceRecipeName,
        datasetSource: outcome.datasetSource,
        usedAi: outcome.usedAi,
      },
    };
    db.recipes.push(recipe);
    // ETA — reproducible AI output record, stored apart from the suggestion.
    db.aiRecords.push({
      id: newId(),
      userId,
      recipeId: recipe.id,
      text: [recipe.name, r.why, ...recipe.ingredients.map((i) => `${i.name} ${i.qty} ${i.unit}`), ...recipe.steps].filter(Boolean).join('\n'),
      generation: recipe.generation,
    });
    return recipe;
  });
  persist();
  return made;
}

/** The occasions the mood picker offers. */
recipesRouter.get('/moods', (_req, res) => {
  res.json({ moods: MOODS.map(({ id, label, blurb, emoji }) => ({ id, label, blurb, emoji })) });
});

recipesRouter.post('/generate', async (req, res) => {
  const { itemIds, mood } = req.body ?? {};
  if (!Array.isArray(itemIds)) throw new HttpError(400, 'nothing_picked', 'Pick at least one pantry item to cook with.');
  const moodId = typeof mood === 'string' && MOODS.some((m) => m.id === mood) ? mood : null;
  const variant = Math.floor(Math.random() * 3);
  const made = await runGeneration(req.user!.id, itemIds, moodId, variant, req.header('x-simulate-ai-failure') === '1');
  const pantry = userPantry(req.user!.id);
  res.status(201).json({ recipes: made.map((r) => withCheck(r, pantry)), recipe: withCheck(made[0], pantry) });
});

recipesRouter.post('/:id/regenerate', async (req, res) => {
  const userId = req.user!.id;
  const from = findRecipe(userId, req.params.id);
  const made = await runGeneration(
    userId,
    from.pickedItemIds,
    from.generation.mood ?? null,
    from.generation.variant + 1,
    req.header('x-simulate-ai-failure') === '1',
    from.id,
  );
  res.status(201).json({ recipe: withCheck(made[0], userPantry(userId)) });
});

recipesRouter.get('/:id', (req, res) => {
  const recipe = findRecipe(req.user!.id, req.params.id);
  res.json({ recipe: withCheck(recipe, userPantry(req.user!.id)) });
});

recipesRouter.post('/:id/save', (req, res) => {
  const recipe = findRecipe(req.user!.id, req.params.id);
  recipe.status = 'saved';
  recipe.savedAt = now();
  persist();
  res.json({ recipe });
});

recipesRouter.delete('/:id', (req, res) => {
  const recipe = findRecipe(req.user!.id, req.params.id);
  db.recipes = db.recipes.filter((r) => r.id !== recipe.id);
  persist();
  res.status(204).end();
});

// ── Cook & confirm leftovers ───────────────────────────────────────────────

function deductions(recipe: Recipe, pantry: PantryItem[]) {
  return recipe.ingredients.map((ing) => {
    const p = pantry.find((x) => sameName(x.name, ing.name));
    if (!p) return { pantryItemId: null, name: ing.name, unit: ing.unit, before: 0, use: ing.qty, after: 0, tracked: false };
    const use = p.unit === ing.unit ? Math.min(ing.qty, p.qty) : 0;
    return { pantryItemId: p.id, name: p.name, unit: p.unit, before: p.qty, use: round(use), after: round(Math.max(0, p.qty - use)), tracked: true };
  });
}

recipesRouter.get('/:id/cook-preview', (req, res) => {
  const recipe = findRecipe(req.user!.id, req.params.id);
  res.json({ deductions: deductions(recipe, userPantry(req.user!.id)), staples: recipe.staples });
});

/**
 * Marks a recipe cooked. The client sends what the user confirmed is left
 * over for each item (defaults to the computed amount); 0 removes the item.
 */
recipesRouter.post('/:id/cook', (req, res) => {
  const userId = req.user!.id;
  const recipe = findRecipe(userId, req.params.id);
  const leftovers: Record<string, unknown> = req.body?.leftovers ?? {};
  const pantry = userPantry(userId);
  const result = deductions(recipe, pantry).filter((d) => d.tracked);
  for (const d of result) {
    const override = Number(leftovers[d.pantryItemId!]);
    const left = Number.isFinite(override) && override >= 0 ? round(override) : d.after;
    if (left <= 0) db.pantry = db.pantry.filter((p) => p.id !== d.pantryItemId);
    else {
      const item = db.pantry.find((p) => p.id === d.pantryItemId);
      if (item) item.qty = left;
    }
  }
  recipe.lastCookedAt = now();
  persist();
  res.json({ pantry: userPantry(userId) });
});

recipesRouter.post('/:id/missing-to-grocery', (req, res) => {
  const userId = req.user!.id;
  const recipe = findRecipe(userId, req.params.id);
  const { need } = pantryCheck(recipe, userPantry(userId));
  let added = 0;
  for (const n of need) {
    const existing = db.grocery.find((g) => g.userId === userId && !g.checked && sameName(g.name, n.name) && g.unit === n.unit);
    if (existing) existing.qty = round(Math.max(existing.qty, n.qty));
    else {
      db.grocery.push({ id: newId(), userId, name: n.name, qty: n.qty, unit: n.unit, checked: false, fromRecipe: recipe.name, addedAt: now() });
      added++;
    }
  }
  persist();
  res.json({ added, total: need.length });
});
