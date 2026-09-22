import { Router } from 'express';
import { db, newId, now, persist } from '../db.js';
import { HttpError } from '../middleware.js';
import { consentState } from '../consent.js';
import { activeFilters, AiUnavailableError, generateRecipe, MODEL_VERSION } from '../ai.js';
import { getDiet } from './profile.js';
import { userPantry } from './pantry.js';
export const recipesRouter = Router();
const round = (n) => Math.round(n * 100) / 100;
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
function findRecipe(userId, id) {
    const r = db.recipes.find((x) => x.id === id && x.userId === userId);
    if (!r)
        throw new HttpError(404, 'not_found', 'That recipe is gone — it may have been deleted.');
    return r;
}
/** Local comparison against the pantry — nothing is sent to the AI service. */
function pantryCheck(recipe, pantry) {
    const have = [];
    const need = [];
    for (const ing of recipe.ingredients) {
        const p = pantry.find((x) => sameName(x.name, ing.name));
        if (!p)
            need.push(ing);
        else if (p.unit === ing.unit && p.qty < ing.qty)
            need.push({ ...ing, qty: round(ing.qty - p.qty) });
        else
            have.push({ ...ing, stock: `${p.qty} ${p.unit}`.trim() });
    }
    return { have, need };
}
function withCheck(recipe, pantry) {
    return { ...recipe, check: pantryCheck(recipe, pantry) };
}
recipesRouter.get('/', (req, res) => {
    const userId = req.user.id;
    const status = req.query.status === 'saved' ? 'saved' : 'generated';
    const pantry = userPantry(userId);
    const recipes = db.recipes
        .filter((r) => r.userId === userId && r.status === status)
        .sort((a, b) => (b.savedAt ?? b.generation.createdAt).localeCompare(a.savedAt ?? a.generation.createdAt))
        .map((r) => withCheck(r, pantry));
    res.json({ recipes });
});
async function runGeneration(userId, itemIds, variant, simulateFailure, regeneratedFrom) {
    const { aiConsent, dietConsent } = consentState(userId);
    if (!aiConsent) {
        throw new HttpError(403, 'consent_required', 'We need your consent before sending ingredients to the AI service.');
    }
    const pantry = userPantry(userId);
    const picked = pantry.filter((p) => itemIds.includes(p.id));
    if (!picked.length)
        throw new HttpError(400, 'nothing_picked', 'Pick at least one pantry item to cook with.');
    // Minimum fields only: name, qty, unit + dietary flags. No identity.
    const snapshot = picked.map((p) => ({ name: p.name, qty: p.qty, unit: p.unit }));
    const diet = dietConsent ? getDiet(userId) : undefined;
    let out;
    try {
        out = await generateRecipe(snapshot, diet, variant, { simulateFailure });
    }
    catch (e) {
        if (e instanceof AiUnavailableError) {
            throw new HttpError(503, 'ai_unavailable', "We couldn't reach the recipe service. Nothing was lost.");
        }
        throw e;
    }
    if (!out.ingredients.length) {
        const why = out.excluded.map((x) => `${x.name} (${x.reason})`).join(', ');
        throw new HttpError(422, 'all_excluded', `Your dietary filters rule out everything you picked: ${why}. Pick something else.`);
    }
    const recipe = {
        id: newId(),
        userId,
        name: out.name,
        minutes: out.minutes,
        tags: out.tags,
        ingredients: out.ingredients,
        staples: out.staples,
        steps: out.steps,
        excluded: out.excluded,
        status: 'generated',
        pickedItemIds: picked.map((p) => p.id),
        generation: {
            model: MODEL_VERSION,
            pantrySnapshot: snapshot,
            filters: diet ? activeFilters(diet) : [],
            createdAt: now(),
            durationMs: out.durationMs,
            variant,
            regeneratedFrom,
        },
    };
    db.recipes.push(recipe);
    // ETA — reproducible AI output record, stored apart from the suggestion itself.
    db.aiRecords.push({
        id: newId(),
        userId,
        recipeId: recipe.id,
        text: [recipe.name, ...recipe.ingredients.map((i) => `${i.name} ${i.qty} ${i.unit}`), ...recipe.steps].join('\n'),
        generation: recipe.generation,
    });
    persist();
    return recipe;
}
recipesRouter.post('/generate', async (req, res) => {
    const { itemIds } = req.body ?? {};
    if (!Array.isArray(itemIds))
        throw new HttpError(400, 'nothing_picked', 'Pick at least one pantry item to cook with.');
    const variant = Math.floor(Math.random() * 3);
    const recipe = await runGeneration(req.user.id, itemIds, variant, req.header('x-simulate-ai-failure') === '1');
    res.status(201).json({ recipe: withCheck(recipe, userPantry(req.user.id)) });
});
recipesRouter.post('/:id/regenerate', async (req, res) => {
    const userId = req.user.id;
    const from = findRecipe(userId, req.params.id);
    const recipe = await runGeneration(userId, from.pickedItemIds, from.generation.variant + 1, req.header('x-simulate-ai-failure') === '1', from.id);
    res.status(201).json({ recipe: withCheck(recipe, userPantry(userId)) });
});
recipesRouter.get('/:id', (req, res) => {
    const recipe = findRecipe(req.user.id, req.params.id);
    res.json({ recipe: withCheck(recipe, userPantry(req.user.id)) });
});
recipesRouter.post('/:id/save', (req, res) => {
    const recipe = findRecipe(req.user.id, req.params.id);
    recipe.status = 'saved';
    recipe.savedAt = now();
    persist();
    res.json({ recipe });
});
recipesRouter.delete('/:id', (req, res) => {
    const recipe = findRecipe(req.user.id, req.params.id);
    db.recipes = db.recipes.filter((r) => r.id !== recipe.id);
    persist();
    res.status(204).end();
});
// ── Cook & confirm leftovers ───────────────────────────────────────────────
function deductions(recipe, pantry) {
    return recipe.ingredients.map((ing) => {
        const p = pantry.find((x) => sameName(x.name, ing.name));
        if (!p)
            return { pantryItemId: null, name: ing.name, unit: ing.unit, before: 0, use: ing.qty, after: 0, tracked: false };
        const use = p.unit === ing.unit ? Math.min(ing.qty, p.qty) : 0;
        return { pantryItemId: p.id, name: p.name, unit: p.unit, before: p.qty, use: round(use), after: round(Math.max(0, p.qty - use)), tracked: true };
    });
}
recipesRouter.get('/:id/cook-preview', (req, res) => {
    const recipe = findRecipe(req.user.id, req.params.id);
    res.json({ deductions: deductions(recipe, userPantry(req.user.id)), staples: recipe.staples });
});
/**
 * Marks a recipe cooked. The client sends what the user confirmed is left
 * over for each item (defaults to the computed amount); 0 removes the item.
 */
recipesRouter.post('/:id/cook', (req, res) => {
    const userId = req.user.id;
    const recipe = findRecipe(userId, req.params.id);
    const leftovers = req.body?.leftovers ?? {};
    const pantry = userPantry(userId);
    const result = deductions(recipe, pantry).filter((d) => d.tracked);
    for (const d of result) {
        const override = Number(leftovers[d.pantryItemId]);
        const left = Number.isFinite(override) && override >= 0 ? round(override) : d.after;
        if (left <= 0)
            db.pantry = db.pantry.filter((p) => p.id !== d.pantryItemId);
        else {
            const item = db.pantry.find((p) => p.id === d.pantryItemId);
            if (item)
                item.qty = left;
        }
    }
    recipe.lastCookedAt = now();
    persist();
    res.json({ pantry: userPantry(userId) });
});
recipesRouter.post('/:id/missing-to-grocery', (req, res) => {
    const userId = req.user.id;
    const recipe = findRecipe(userId, req.params.id);
    const { need } = pantryCheck(recipe, userPantry(userId));
    let added = 0;
    for (const n of need) {
        const existing = db.grocery.find((g) => g.userId === userId && !g.checked && sameName(g.name, n.name) && g.unit === n.unit);
        if (existing)
            existing.qty = round(Math.max(existing.qty, n.qty));
        else {
            db.grocery.push({ id: newId(), userId, name: n.name, qty: n.qty, unit: n.unit, checked: false, fromRecipe: recipe.name, addedAt: now() });
            added++;
        }
    }
    persist();
    res.json({ added, total: need.length });
});
