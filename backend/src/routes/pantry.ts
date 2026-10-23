import { Router } from 'express';
import { db, newId, now, persist } from '../db.js';
import { HttpError } from '../middleware.js';
import { parseReceipt } from '../receipt.js';
import { readReceiptPhoto, visionAvailable } from '../receipt-vision.js';
import { addRecord } from '../consent.js';
import type { PantryItem } from '../types.js';

export const pantryRouter = Router();

export const UNITS = ['pieces', 'g', 'kg', 'ml', 'L', 'bag', 'tub', 'bunch', 'btl', 'can', 'pack', 'bulb', 'jar'];

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function parseItem(body: unknown): { name: string; qty: number; unit: string; raw?: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const qty = Number(b.qty);
  const unit = typeof b.unit === 'string' ? b.unit.trim() : '';
  if (!name) throw new HttpError(400, 'invalid_name', 'Give the item a name.');
  if (!Number.isFinite(qty) || qty <= 0) throw new HttpError(400, 'invalid_qty', 'Quantity must be more than 0.');
  return { name: name.slice(0, 60), qty: Math.round(qty * 100) / 100, unit: unit.slice(0, 12), raw: typeof b.raw === 'string' ? b.raw : undefined };
}

export function userPantry(userId: string): PantryItem[] {
  return db.pantry
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt) || a.name.localeCompare(b.name));
}

/** Adds to an existing same-name, same-unit item instead of duplicating it. */
function addOrMerge(userId: string, item: ReturnType<typeof parseItem>, scannedAt: string, source: PantryItem['source']): PantryItem {
  const existing = db.pantry.find((p) => p.userId === userId && sameName(p.name, item.name) && p.unit === item.unit);
  if (existing) {
    existing.qty = Math.round((existing.qty + item.qty) * 100) / 100;
    existing.scannedAt = scannedAt;
    return existing;
  }
  const created: PantryItem = { id: newId(), userId, ...item, scannedAt, source };
  db.pantry.push(created);
  return created;
}

pantryRouter.get('/', (req, res) => {
  res.json({ items: userPantry(req.user!.id), units: UNITS });
});

pantryRouter.post('/', (req, res) => {
  const item = addOrMerge(req.user!.id, parseItem(req.body), now(), 'manual');
  persist();
  res.status(201).json({ item });
});

/** Commit the reviewed receipt lines; every item keeps the scan timestamp. */
pantryRouter.post('/bulk', (req, res) => {
  const { items, scannedAt } = req.body ?? {};
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'no_items', 'There are no items to add.');
  const at = typeof scannedAt === 'string' && !Number.isNaN(Date.parse(scannedAt)) ? scannedAt : now();
  const saved = items.map((i: unknown) => addOrMerge(req.user!.id, parseItem(i), at, 'scan'));
  persist();
  res.status(201).json({ items: saved });
});

pantryRouter.patch('/:id', (req, res) => {
  const item = db.pantry.find((p) => p.id === req.params.id && p.userId === req.user!.id);
  if (!item) throw new HttpError(404, 'not_found', 'That item is no longer in your pantry.');
  const next = parseItem({ name: req.body?.name ?? item.name, qty: req.body?.qty ?? item.qty, unit: req.body?.unit ?? item.unit });
  Object.assign(item, { name: next.name, qty: next.qty, unit: next.unit });
  persist();
  res.json({ item });
});

pantryRouter.delete('/:id', (req, res) => {
  const before = db.pantry.length;
  db.pantry = db.pantry.filter((p) => !(p.id === req.params.id && p.userId === req.user!.id));
  if (db.pantry.length === before) throw new HttpError(404, 'not_found', 'That item is no longer in your pantry.');
  persist();
  res.status(204).end();
});

// ── Receipt scan ───────────────────────────────────────────────────────────

export const scanRouter = Router();

/** Tells the scan screen whether the AI reader is configured. */
scanRouter.get('/capabilities', (_req, res) => {
  res.json({ vision: visionAvailable() });
});

/**
 * Two ways in:
 *  · `image`  — the photo goes to our AI service, which reads it and
 *               translates the item lines into English (any language).
 *  · `lines`  — the phone already read the text on-device (fallback when the
 *               AI reader is unavailable); only text is sent.
 * Either way the photo is never stored, and nothing but item lines is kept.
 */
scanRouter.post('/', async (req, res) => {
  const userId = req.user!.id;
  const { image, lines } = req.body ?? {};
  const pantry = userPantry(userId);
  const withHave = <T extends { name: string; unit: string }>(items: T[]) =>
    items.map((l) => ({ ...l, alreadyHave: pantry.some((p) => sameName(p.name, l.name) && p.unit === l.unit) }));

  if (typeof image === 'string' && image.length > 100) {
    if (!visionAvailable()) throw new HttpError(503, 'vision_unavailable', 'The AI reader is not configured on this server.');
    // PDPA: record that a photo was sent to the AI service, and when.
    addRecord(userId, 'ai_consent', 'granted', 'Receipt photo sent to AI service for reading');
    try {
      const out = await readReceiptPhoto(image);
      res.json({
        scannedAt: now(),
        items: withHave(out.lines),
        language: out.language,
        translated: out.translated,
        readBy: 'ai',
      });
      return;
    } catch (e) {
      console.warn(`Receipt vision failed: ${(e as Error).message.slice(0, 300)}`);
      throw new HttpError(503, 'vision_failed', "The AI reader couldn't read that photo. Try again, or use the on-device reader.");
    }
  }

  if (!Array.isArray(lines) || !lines.every((l) => typeof l === 'string')) {
    throw new HttpError(400, 'invalid_lines', 'Send the receipt as a photo, or as a list of text lines.');
  }
  res.json({ scannedAt: now(), items: withHave(parseReceipt(lines)), language: 'English', translated: false, readBy: 'device' });
});
