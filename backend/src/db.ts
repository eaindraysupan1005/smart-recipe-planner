import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import './env.js';
import { DATA_DIR, dataFile } from './paths.js';
import type { DB } from './types.js';

/**
 * Storage. Routes read and write the in-memory `db` object and call
 * `persist()`; where the data lands depends on the environment:
 *
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set → Postgres on Supabase.
 *     `initDb()` loads every table at startup, `persist()` writes only the rows
 *     that changed (upserts) or vanished (deletes).
 *   neither set                                  → backend/data/db.json.
 */

const DATA_FILE = dataFile('db.json');

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

function loadFile(): DB {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

function connect(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url && !key) return null;
  if (!url || !key) {
    throw new Error('Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env (or neither, to use db.json).');
  }
  // Server-side only: the key bypasses Row Level Security and must never reach the browser.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const supabase = connect();

export const usingSupabase = (): boolean => supabase !== null;

export const db: DB = supabase ? empty() : loadFile();

// ── Supabase mapping ───────────────────────────────────────────────────────

interface TableDef {
  key: keyof DB;
  table: string;
  /** Primary-key column, and the matching property on the record. */
  pk: string;
  idField: string;
  /** Rows are never edited after insert, so they are inserted once and not diffed. */
  appendOnly?: boolean;
  /** Column to load in order — `.at(-1)` on records means "the latest". */
  order?: string;
}

// Parents first: upserts run in this order, deletes in reverse.
const TABLES: TableDef[] = [
  { key: 'users', table: 'users', pk: 'id', idField: 'id' },
  { key: 'sessions', table: 'sessions', pk: 'token', idField: 'token' },
  { key: 'diets', table: 'diet_profiles', pk: 'user_id', idField: 'userId' },
  { key: 'pantry', table: 'pantry_items', pk: 'id', idField: 'id' },
  { key: 'recipes', table: 'recipes', pk: 'id', idField: 'id' },
  { key: 'aiRecords', table: 'ai_records', pk: 'id', idField: 'id' },
  { key: 'grocery', table: 'grocery_items', pk: 'id', idField: 'id' },
  { key: 'records', table: 'acceptance_records', pk: 'id', idField: 'id', appendOnly: true, order: 'at' },
  { key: 'accessLogs', table: 'access_logs', pk: 'id', idField: 'id', appendOnly: true, order: 'at' },
];

type Row = Record<string, unknown>;

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Top-level keys become columns; nested arrays/objects are stored as jsonb. */
function toRow(obj: object): Row {
  const row: Row = {};
  for (const [k, v] of Object.entries(obj)) row[snake(k)] = v === undefined ? null : v;
  return row;
}

// Postgres returns timestamptz in the database's timezone ("…+00:00", "…+07:00");
// the app works in UTC with toISOString() ("…Z"), so convert on the way in.
const PG_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T[\d:.]+[+-]\d{2}(?::?\d{2})?$/;

function fromRow<T>(row: Row): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null) continue; // optional fields are absent, not null
    out[camel(k)] = typeof v === 'string' && PG_TIMESTAMP.test(v) ? new Date(v).toISOString() : v;
  }
  return out as T;
}

/** Key-order independent, because jsonb does not preserve the order we wrote. */
function canon(v: unknown): string {
  const sort = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(sort)
      : x && typeof x === 'object'
        ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, val]) => [k, sort(val)]))
        : x;
  return JSON.stringify(sort(v));
}

const idOf = (def: TableDef, obj: object): string => String((obj as Row)[def.idField]);

/** What Supabase is known to hold: id → canonical form of the row last written/read. */
const synced = new Map<keyof DB, Map<string, string>>(TABLES.map((t) => [t.key, new Map()]));

const chunks = <T>(xs: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(xs.length / size) }, (_, i) => xs.slice(i * size, (i + 1) * size));

function fail(action: string, table: string, error: { message: string }): never {
  throw new Error(`Supabase ${action} on "${table}" failed: ${error.message}`);
}

/** Loads every table into `db`. Call once before serving requests. */
export async function initDb(): Promise<void> {
  if (!supabase) return;
  for (const def of TABLES) {
    const rows: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from(def.table)
        .select('*')
        .order(def.order ?? def.pk)
        .order(def.pk)
        .range(from, from + 999);
      if (error) fail('read', def.table, error);
      rows.push(...(data as Row[]));
      if (data.length < 1000) break;
    }
    const list = rows.map((r) => fromRow<object>(r));
    (db as unknown as Record<string, object[]>)[def.key] = list;
    const state = synced.get(def.key)!;
    state.clear();
    for (const obj of list) state.set(idOf(def, obj), def.appendOnly ? '' : canon(toRow(obj)));
  }
  console.log(`Storage: Supabase (${new URL(process.env.SUPABASE_URL!).host})`);
}

async function syncToSupabase(sb: SupabaseClient): Promise<void> {
  // Deletes first, children before parents.
  for (const def of [...TABLES].reverse()) {
    const state = synced.get(def.key)!;
    const present = new Set((db[def.key] as object[]).map((o) => idOf(def, o)));
    const gone = [...state.keys()].filter((id) => !present.has(id));
    for (const ids of chunks(gone, 200)) {
      const { error } = await sb.from(def.table).delete().in(def.pk, ids);
      if (error) fail('delete', def.table, error);
      for (const id of ids) state.delete(id);
    }
  }
  // Then changed or new rows, parents before children.
  for (const def of TABLES) {
    const state = synced.get(def.key)!;
    const dirty: { id: string; row: Row; sig: string }[] = [];
    for (const obj of db[def.key] as object[]) {
      const id = idOf(def, obj);
      if (def.appendOnly && state.has(id)) continue;
      const row = toRow(obj);
      const sig = def.appendOnly ? '' : canon(row);
      if (!def.appendOnly && state.get(id) === sig) continue;
      dirty.push({ id, row, sig });
    }
    for (const batch of chunks(dirty, 500)) {
      const { error } = await sb.from(def.table).upsert(
        batch.map((d) => d.row),
        { onConflict: def.pk },
      );
      if (error) fail('write', def.table, error);
      for (const d of batch) state.set(d.id, d.sig);
    }
  }
}

// ── Persistence ────────────────────────────────────────────────────────────

let pending: NodeJS.Timeout | null = null;
let lastWrite = 0;
let queue: Promise<void> = Promise.resolve();

function writeFile(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  lastWrite = Date.now();
}

/** Writes pending changes now and resolves when they are stored. Rejects if the write failed. */
export function flush(): Promise<void> {
  if (pending) {
    clearTimeout(pending);
    pending = null;
  }
  if (!supabase) {
    writeFile();
    return Promise.resolve();
  }
  const run = queue.then(() => syncToSupabase(supabase));
  queue = run.catch(() => undefined); // one failed write must not wedge the queue
  return run;
}

/** Debounced write-through, so a burst of changes becomes one write. */
export function persist(): void {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    flush().catch((e: Error) => {
      console.error(`${e.message} — retrying in 5s`);
      setTimeout(persist, 5000);
    });
  }, 50);
}

/**
 * db.json mode only: picks up changes written by another process — e.g.
 * `npm run seed` while the server is running — instead of overwriting them
 * from memory. With Supabase, restart the server after seeding.
 */
export function watchDataFile(): void {
  if (supabase) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.watch(DATA_DIR, (_event, file) => {
      if (file !== 'db.json' || Date.now() - lastWrite < 500) return;
      try {
        Object.assign(db, loadFile());
        console.log('Reloaded db.json (changed on disk)');
      } catch {
        /* half-written file: the next event will catch the complete one */
      }
    });
  } catch {
    /* watching is a convenience; the server works fine without it */
  }
}

export const newId = (): string => crypto.randomUUID();
export const now = (): string => new Date().toISOString();
