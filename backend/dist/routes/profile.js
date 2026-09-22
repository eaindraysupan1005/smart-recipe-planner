import { Router } from 'express';
import { db, now, persist } from '../db.js';
import { HttpError } from '../middleware.js';
import { addRecord, consentState } from '../consent.js';
export const profileRouter = Router();
const ALLERGIES = ['Peanuts', 'Dairy', 'Shellfish', 'Soy', 'Eggs'];
const FILTERS = [
    ['vegetarian', 'Vegetarian'],
    ['glutenFree', 'Gluten-free'],
    ['lowCarb', 'Low-carb'],
];
export function getDiet(userId) {
    return (db.diets.find((d) => d.userId === userId) ?? {
        userId,
        vegetarian: false,
        glutenFree: false,
        lowCarb: false,
        allergies: [],
        updatedAt: now(),
    });
}
profileRouter.get('/diet', (req, res) => {
    res.json({ diet: getDiet(req.user.id), allergyOptions: ALLERGIES });
});
/**
 * PDPA sensitive data: each filter switched on is its own explicit opt-in
 * record, and each one switched off is recorded as a withdrawal.
 */
profileRouter.put('/diet', (req, res) => {
    const userId = req.user.id;
    const body = req.body ?? {};
    const prev = getDiet(userId);
    const allergies = Array.isArray(body.allergies)
        ? body.allergies.filter((a) => typeof a === 'string' && ALLERGIES.includes(a))
        : [];
    const next = {
        userId,
        vegetarian: !!body.vegetarian,
        glutenFree: !!body.glutenFree,
        lowCarb: !!body.lowCarb,
        allergies,
        updatedAt: now(),
    };
    for (const [key, label] of FILTERS) {
        if (next[key] !== prev[key])
            addRecord(userId, 'diet_filter', next[key] ? 'granted' : 'withdrawn', label);
    }
    for (const a of ALLERGIES) {
        const was = prev.allergies.includes(a);
        const is = next.allergies.includes(a);
        if (was !== is)
            addRecord(userId, 'diet_filter', is ? 'granted' : 'withdrawn', `Allergy: ${a}`);
    }
    const anyOn = next.vegetarian || next.glutenFree || next.lowCarb || next.allergies.length > 0;
    const { dietConsent } = consentState(userId);
    if (anyOn && !dietConsent)
        addRecord(userId, 'diet_consent', 'granted', 'Use my dietary filters');
    db.diets = db.diets.filter((d) => d.userId !== userId);
    db.diets.push(next);
    persist();
    res.json({ diet: next, ...consentState(userId) });
});
profileRouter.get('/consents', (req, res) => {
    const userId = req.user.id;
    const records = db.records.filter((r) => r.userId === userId).reverse();
    res.json({ ...consentState(userId), records });
});
profileRouter.post('/consents/:kind', (req, res) => {
    const userId = req.user.id;
    const kind = req.params.kind;
    const { granted } = req.body ?? {};
    if (kind !== 'ai' && kind !== 'diet')
        throw new HttpError(404, 'unknown_consent', 'Unknown consent type.');
    const recKind = kind === 'ai' ? 'ai_consent' : 'diet_consent';
    const state = consentState(userId);
    const current = kind === 'ai' ? state.aiConsent : state.dietConsent;
    if (!!granted !== current) {
        addRecord(userId, recKind, granted ? 'granted' : 'withdrawn', kind === 'ai' ? 'Pantry data sent to AI service' : 'Use my dietary filters');
    }
    res.json(consentState(userId));
});
/** PDPA right of access: everything we hold about the user, as JSON. */
profileRouter.get('/export', (req, res) => {
    const userId = req.user.id;
    const mine = (xs) => xs.filter((x) => x.userId === userId);
    const data = {
        exportedAt: now(),
        account: req.user,
        dietProfile: db.diets.find((d) => d.userId === userId) ?? null,
        pantry: mine(db.pantry),
        recipes: mine(db.recipes),
        aiGenerationRecords: mine(db.aiRecords),
        groceryList: mine(db.grocery),
        consentRecords: mine(db.records),
        accessLog: mine(db.accessLogs),
    };
    res.setHeader('Content-Disposition', 'attachment; filename="what2cook-my-data.json"');
    res.json(data);
});
/**
 * PDPA full delete. Pantry, recipes, AI records, grocery list and dietary
 * profile go. Access logs stay (CCA §26, ≥90 days) and acceptance records stay
 * as legal evidence (ETA) — neither holds pantry or health content.
 */
profileRouter.delete('/account', (req, res) => {
    const userId = req.user.id;
    const not = (xs) => xs.filter((x) => x.userId !== userId);
    db.pantry = not(db.pantry);
    db.recipes = not(db.recipes);
    db.aiRecords = not(db.aiRecords);
    db.grocery = not(db.grocery);
    db.diets = not(db.diets);
    db.sessions = not(db.sessions);
    db.users = db.users.filter((u) => u.id !== userId);
    persist();
    res.status(204).end();
});
