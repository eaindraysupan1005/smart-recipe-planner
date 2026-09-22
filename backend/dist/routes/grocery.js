import { Router } from 'express';
import { db, newId, now, persist } from '../db.js';
import { HttpError } from '../middleware.js';
export const groceryRouter = Router();
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
function list(userId) {
    const items = db.grocery
        .filter((g) => g.userId === userId)
        .sort((a, b) => Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name));
    const sources = [...new Set(items.filter((i) => i.fromRecipe).map((i) => i.fromRecipe))];
    return { items, sources };
}
groceryRouter.get('/', (req, res) => {
    res.json(list(req.user.id));
});
groceryRouter.post('/', (req, res) => {
    const userId = req.user.id;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const qty = Number(req.body?.qty ?? 1);
    const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
    if (!name)
        throw new HttpError(400, 'invalid_name', 'Give the item a name.');
    if (!Number.isFinite(qty) || qty <= 0)
        throw new HttpError(400, 'invalid_qty', 'Quantity must be more than 0.');
    // Only missing items belong here — flag anything the pantry already has.
    const inPantry = db.pantry.some((p) => p.userId === userId && sameName(p.name, name));
    db.grocery.push({ id: newId(), userId, name: name.slice(0, 60), qty, unit, checked: false, addedAt: now() });
    persist();
    res.status(201).json({ ...list(userId), inPantry });
});
groceryRouter.patch('/:id', (req, res) => {
    const item = db.grocery.find((g) => g.id === req.params.id && g.userId === req.user.id);
    if (!item)
        throw new HttpError(404, 'not_found', 'That item is no longer on your list.');
    if (typeof req.body?.checked === 'boolean')
        item.checked = req.body.checked;
    persist();
    res.json(list(req.user.id));
});
groceryRouter.delete('/checked', (req, res) => {
    db.grocery = db.grocery.filter((g) => !(g.userId === req.user.id && g.checked));
    persist();
    res.json(list(req.user.id));
});
groceryRouter.delete('/:id', (req, res) => {
    db.grocery = db.grocery.filter((g) => !(g.id === req.params.id && g.userId === req.user.id));
    persist();
    res.json(list(req.user.id));
});
