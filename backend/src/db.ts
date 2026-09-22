import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { DB } from './types.js';

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const empty = (): DB => ({
  users: [],
  sessions: [],
  records: [],
  diets: [],
  pantry: [],
  recipes: [],
  aiRecords: [],
  grocery: [],
  accessLogs: [],
});

function load(): DB {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export const db: DB = load();

let pending: NodeJS.Timeout | null = null;

/** Debounced write-through to a JSON file so data survives restarts. */
export function persist(): void {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }, 50);
}

export const newId = (): string => crypto.randomUUID();
export const now = (): string => new Date().toISOString();
