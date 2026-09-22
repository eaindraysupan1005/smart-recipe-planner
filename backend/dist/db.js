import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const empty = () => ({
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
function load() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return { ...empty(), ...JSON.parse(raw) };
    }
    catch {
        return empty();
    }
}
export const db = load();
let pending = null;
/** Debounced write-through to a JSON file so data survives restarts. */
export function persist() {
    if (pending)
        return;
    pending = setTimeout(() => {
        pending = null;
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    }, 50);
}
export const newId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
