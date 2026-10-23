/**
 * Imports a Kaggle recipe CSV into backend/data/recipes.json.
 *
 *   npm run import:recipes -- <path-to.csv> [--limit 20000]
 *
 * Auto-detects the common layouts:
 *   · Food.com  (RAW_recipes.csv)      name, minutes, tags, steps, ingredients
 *   · RecipeNLG (full_dataset.csv)     title, ingredients, directions, NER
 *   · Epicurious / generic             title, ingredients, directions
 *
 * Recipes are cleaned, their ingredients parsed into {name, qty, unit}, and
 * each one tagged with the moods and diet flags it fits, so the chef can
 * shortlist locally before asking the AI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, dataFile } from './paths.js';
import { parseIngredientLine, STAPLES } from './ingredient-text.js';
import { MOODS } from './moods.js';
import type { DatasetRecipe, RecipeDataset } from './dataset-types.js';

// ── CSV reading (quote-aware, streaming by line) ───────────────────────────

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/** Yields complete CSV records, re-joining rows split across newlines. */
function* csvRecords(file: string): Generator<string[]> {
  const text = fs.readFileSync(file, 'utf8');
  let buf = '';
  let quotes = 0;
  for (const line of text.split(/\r?\n/)) {
    buf = buf ? `${buf}\n${line}` : line;
    quotes += (line.match(/"/g) ?? []).length;
    if (quotes % 2 === 0) {
      if (buf.trim()) yield splitCsvLine(buf);
      buf = '';
      quotes = 0;
    }
  }
  if (buf.trim()) yield splitCsvLine(buf);
}

/** Parses the python/JSON-ish list strings these datasets use. */
function parseList(value: string): string[] {
  const v = (value ?? '').trim();
  if (!v) return [];
  if (v.startsWith('[')) {
    try {
      const parsed = JSON.parse(v.replace(/'/g, '"').replace(/\\"/g, "'"));
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      return v.slice(1, -1).split(/','|", "/).map((s) => s.replace(/^['"]|['"]$/g, '').trim()).filter(Boolean);
    }
  }
  return v.split(/\r?\n|;|\|/).map((s) => s.trim()).filter(Boolean);
}

// ── Tagging ────────────────────────────────────────────────────────────────

const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'ham', 'fish', 'tuna', 'salmon', 'prawn', 'shrimp', 'sausage', 'anchovy', 'gelatin', 'turkey', 'duck'];
const GLUTEN = ['flour', 'bread', 'pasta', 'noodle', 'soy sauce', 'wheat', 'barley', 'couscous', 'cracker', 'beer', 'oats', 'tortilla', 'bun'];

const has = (hay: string, needles: string[]) => needles.some((n) => hay.includes(n));

function scoreMoods(name: string, tags: string[], minutes: number, blob: string): string[] {
  const out: string[] = [];
  const tagText = tags.join(' ');
  for (const mood of MOODS) {
    let score = 0;
    for (const t of mood.tags) if (tagText.includes(t) || blob.includes(t)) score += 2;
    if (mood.maxMinutes && minutes > 0 && minutes <= mood.maxMinutes) score += 1;
    if (mood.maxMinutes && minutes > mood.maxMinutes * 2) score -= 2;
    // A few targeted nudges the tags alone miss.
    if (mood.id === 'drinks' && has(blob, ['dip', 'wings', 'fries', 'nachos', 'skewer', 'crisp', 'nuts', 'popcorn'])) score += 3;
    if (mood.id === 'romantic' && has(blob, ['steak', 'scallop', 'risotto', 'wine', 'truffle', 'salmon'])) score += 2;
    if (mood.id === 'comfort' && has(blob, ['soup', 'stew', 'curry', 'pie', 'noodle', 'mac and cheese', 'porridge'])) score += 3;
    if (mood.id === 'light' && has(blob, ['salad', 'steamed', 'grilled', 'fresh'])) score += 2;
    if (mood.id === 'family' && has(blob, ['casserole', 'roast', 'meatball', 'spaghetti', 'rice'])) score += 2;
    if (mood.id === 'friends' && has(blob, ['platter', 'sharing', 'board', 'tray', 'bbq', 'taco'])) score += 2;
    if (mood.id === 'quick' && minutes > 0 && minutes <= 20) score += 2;
    if (score >= 3) out.push(mood.id);
  }
  return out;
}

// ── Row mapping ────────────────────────────────────────────────────────────

interface Layout {
  name: string;
  title: number;
  ingredients: number;
  steps: number;
  minutes?: number;
  tags?: number;
  servings?: number;
  ner?: number;
  source?: number;
}

function detectLayout(header: string[]): Layout {
  const idx = (...names: string[]) => header.findIndex((h) => names.includes(h.trim().toLowerCase()));
  const title = idx('name', 'title', 'recipe_name');
  const ingredients = idx('ingredients', 'ingredient');
  const steps = idx('steps', 'directions', 'instructions', 'method');
  if (title < 0 || ingredients < 0) {
    throw new Error(`Unrecognised CSV: need a title and ingredients column, found: ${header.slice(0, 12).join(', ')}`);
  }
  const layout: Layout = {
    name: idx('ner') >= 0 ? 'RecipeNLG' : idx('minutes') >= 0 ? 'Food.com' : 'generic',
    title,
    ingredients,
    steps: steps < 0 ? -1 : steps,
  };
  const minutes = idx('minutes', 'time', 'total_time');
  if (minutes >= 0) layout.minutes = minutes;
  const tags = idx('tags', 'keywords', 'categories');
  if (tags >= 0) layout.tags = tags;
  const servings = idx('servings', 'yield', 'n_servings');
  if (servings >= 0) layout.servings = servings;
  const ner = idx('ner');
  if (ner >= 0) layout.ner = ner;
  const source = idx('source', 'link', 'url');
  if (source >= 0) layout.source = source;
  return layout;
}

function toRecipe(row: string[], layout: Layout, id: number): DatasetRecipe | null {
  const name = (row[layout.title] ?? '').trim();
  if (!name || name.length > 90) return null;

  const rawIngredients = parseList(row[layout.ingredients] ?? '');
  if (rawIngredients.length < 2 || rawIngredients.length > 25) return null;

  const steps = layout.steps >= 0 ? parseList(row[layout.steps] ?? '') : [];
  if (steps.length < 2) return null;

  const parsed = rawIngredients.map(parseIngredientLine).filter((x): x is NonNullable<typeof x> => !!x);
  if (parsed.length < 2) return null;

  const keys = [...new Set(parsed.map((p) => p.canonical).filter((c): c is string => !!c && !STAPLES.has(c)))];
  if (keys.length < 2) return null; // too vague to match a pantry

  const tags = layout.tags !== undefined ? parseList(row[layout.tags] ?? '').map((t) => t.toLowerCase()) : [];
  const minutesRaw = layout.minutes !== undefined ? Number(String(row[layout.minutes]).replace(/\D/g, '')) : NaN;
  const minutes = Number.isFinite(minutesRaw) && minutesRaw > 0 && minutesRaw <= 240 ? minutesRaw : Math.min(90, 10 + steps.length * 5);
  const servingsRaw = layout.servings !== undefined ? Number(String(row[layout.servings]).replace(/\D/g, '')) : NaN;
  const servings = Number.isFinite(servingsRaw) && servingsRaw > 0 && servingsRaw <= 12 ? servingsRaw : 4;

  const blob = `${name} ${tags.join(' ')} ${rawIngredients.join(' ')} ${steps.join(' ')}`.toLowerCase();
  const ingredientText = parsed.map((p) => p.name.toLowerCase()).join(' ');

  const recipe: DatasetRecipe = {
    id: `ds-${id}`,
    name: name.replace(/\s+/g, ' '),
    minutes,
    ingredients: parsed.map((p) => ({ name: p.name, qty: p.qty, unit: p.unit })),
    keys: keys.map((k) => k.toLowerCase()),
    steps: steps.map((s) => s.trim()).filter((s) => s.length > 3).slice(0, 14),
    tags: tags.slice(0, 20),
    servings,
    vegetarian: !has(ingredientText, MEAT) && !has(tags.join(' '), ['meat', 'chicken', 'beef', 'pork', 'seafood']),
    glutenFree: !has(ingredientText, GLUTEN),
    moods: scoreMoods(name, tags, minutes, blob),
  };
  const src = layout.source !== undefined ? (row[layout.source] ?? '').trim() : '';
  if (src) recipe.source = src.slice(0, 200);
  return recipe;
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const limitArg = args.find((a) => a.startsWith('--limit'));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? args[args.indexOf(limitArg) + 1]) : 20000;
  if (!file) {
    console.error('Usage: npm run import:recipes -- <path-to.csv> [--limit 20000]');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`No such file: ${file}`);
    process.exit(1);
  }

  const rows = csvRecords(file);
  const header = rows.next().value as string[] | undefined;
  if (!header) throw new Error('Empty CSV');
  const layout = detectLayout(header.map((h) => h.toLowerCase()));
  console.log(`Detected layout: ${layout.name}`);

  const recipes: DatasetRecipe[] = [];
  const seen = new Set<string>();
  let read = 0;
  for (const row of rows) {
    read++;
    const r = toRecipe(row, layout, recipes.length);
    if (!r) continue;
    const key = r.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipes.push(r);
    if (recipes.length >= limit) break;
  }

  const moodCounts: Record<string, number> = {};
  for (const m of MOODS) moodCounts[m.id] = recipes.filter((r) => r.moods.includes(m.id)).length;

  const dataset: RecipeDataset = {
    stats: { count: recipes.length, importedAt: new Date().toISOString(), source: path.basename(file), moods: moodCounts },
    recipes,
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = dataFile('recipes.json');
  fs.writeFileSync(out, JSON.stringify(dataset));
  const mb = (fs.statSync(out).size / 1_048_576).toFixed(1);

  console.log(`Read ${read} rows -> kept ${recipes.length} recipes (${mb} MB) -> ${out}`);
  console.log('Mood coverage:', Object.entries(moodCounts).map(([k, v]) => `${k}=${v}`).join('  '));
  const noMood = recipes.filter((r) => r.moods.length === 0).length;
  console.log(`Vegetarian: ${recipes.filter((r) => r.vegetarian).length} · gluten-free: ${recipes.filter((r) => r.glutenFree).length} · no mood tag: ${noMood}`);
}

main();
