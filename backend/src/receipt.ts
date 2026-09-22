/**
 * Receipt line parser. Turns OCR'd item lines such as
 *   "CHKN THIGH FIL 500G 6.99"  ->  { name: 'Chicken thighs', qty: 500, unit: 'g' }
 * The client has already dropped the store name, totals and card lines before
 * sending, so this only ever sees item-ish text (PDPA minimisation).
 */
import type { Ingredient } from './types.js';

export interface ParsedLine extends Ingredient {
  raw: string;
  confident: boolean;
}

interface Food {
  name: string;
  keys: string[];
  unit: string;
}

/** Canonical foods, matched by keyword after abbreviations are expanded. */
const FOODS: Food[] = [
  { name: 'Chicken thighs', keys: ['CHICKEN THIGH'], unit: 'g' },
  { name: 'Chicken breast', keys: ['CHICKEN BREAST'], unit: 'g' },
  { name: 'Chicken wings', keys: ['CHICKEN WING'], unit: 'g' },
  { name: 'Chicken', keys: ['CHICKEN'], unit: 'g' },
  { name: 'Minced beef', keys: ['BEEF MINCE', 'MINCED BEEF', 'GROUND BEEF'], unit: 'g' },
  { name: 'Beef', keys: ['BEEF', 'STEAK'], unit: 'g' },
  { name: 'Pork', keys: ['PORK'], unit: 'g' },
  { name: 'Bacon', keys: ['BACON'], unit: 'pack' },
  { name: 'Ham', keys: ['HAM'], unit: 'pack' },
  { name: 'Sausages', keys: ['SAUSAGE'], unit: 'pack' },
  { name: 'Salmon', keys: ['SALMON'], unit: 'g' },
  { name: 'Tuna', keys: ['TUNA'], unit: 'can' },
  { name: 'Prawns', keys: ['PRAWN', 'SHRIMP'], unit: 'g' },
  { name: 'Tofu', keys: ['TOFU'], unit: 'pack' },
  { name: 'Eggs', keys: ['EGG'], unit: 'pieces' },
  { name: 'Milk', keys: ['MILK'], unit: 'L' },
  { name: 'Yoghurt', keys: ['YOGHURT', 'YOGURT'], unit: 'tub' },
  { name: 'Butter', keys: ['BUTTER'], unit: 'g' },
  { name: 'Cheese', keys: ['CHEESE', 'CHEDDAR', 'MOZZARELLA'], unit: 'g' },
  { name: 'Cream', keys: ['CREAM'], unit: 'ml' },
  { name: 'Coconut milk', keys: ['COCONUT MILK', 'COCONUT CREAM'], unit: 'can' },
  { name: 'Spinach', keys: ['SPINACH'], unit: 'bag' },
  { name: 'Lettuce', keys: ['LETTUCE'], unit: 'pieces' },
  { name: 'Tomatoes', keys: ['TOMATO'], unit: 'pieces' },
  { name: 'Onions', keys: ['ONION'], unit: 'pieces' },
  { name: 'Spring onion', keys: ['SPRING ONION', 'SCALLION', 'GREEN ONION'], unit: 'bunch' },
  { name: 'Garlic', keys: ['GARLIC'], unit: 'bulb' },
  { name: 'Ginger', keys: ['GINGER'], unit: 'pieces' },
  { name: 'Potatoes', keys: ['POTATO'], unit: 'kg' },
  { name: 'Carrots', keys: ['CARROT'], unit: 'g' },
  { name: 'Broccoli', keys: ['BROCCOLI'], unit: 'pieces' },
  { name: 'Cabbage', keys: ['CABBAGE'], unit: 'pieces' },
  { name: 'Cucumber', keys: ['CUCUMBER'], unit: 'pieces' },
  { name: 'Bell peppers', keys: ['CAPSICUM', 'BELL PEPPER'], unit: 'pieces' },
  { name: 'Chillies', keys: ['CHILLI', 'CHILI'], unit: 'g' },
  { name: 'Mushrooms', keys: ['MUSHROOM'], unit: 'g' },
  { name: 'Coriander', keys: ['CORIANDER', 'CILANTRO'], unit: 'bunch' },
  { name: 'Basil', keys: ['BASIL'], unit: 'bunch' },
  { name: 'Lemons', keys: ['LEMON'], unit: 'pieces' },
  { name: 'Limes', keys: ['LIME'], unit: 'pieces' },
  { name: 'Bananas', keys: ['BANANA'], unit: 'bunch' },
  { name: 'Apples', keys: ['APPLE'], unit: 'pieces' },
  { name: 'Oranges', keys: ['ORANGE'], unit: 'pieces' },
  { name: 'Avocados', keys: ['AVOCADO'], unit: 'pieces' },
  { name: 'Rice', keys: ['RICE'], unit: 'kg' },
  { name: 'Pasta', keys: ['PASTA', 'SPAGHETTI', 'PENNE', 'FUSILLI'], unit: 'g' },
  { name: 'Noodles', keys: ['NOODLE', 'RAMEN', 'UDON'], unit: 'pack' },
  { name: 'Bread', keys: ['BREAD', 'LOAF', 'BAGUETTE'], unit: 'pieces' },
  { name: 'Flour', keys: ['FLOUR'], unit: 'kg' },
  { name: 'Sugar', keys: ['SUGAR'], unit: 'kg' },
  { name: 'Rolled oats', keys: ['OATS', 'OAT'], unit: 'g' },
  { name: 'Olive oil', keys: ['OLIVE OIL'], unit: 'ml' },
  { name: 'Vegetable oil', keys: ['VEGETABLE OIL', 'VEG OIL', 'SUNFLOWER OIL', 'CANOLA OIL'], unit: 'ml' },
  { name: 'Soy sauce', keys: ['SOY SAUCE'], unit: 'btl' },
  { name: 'Fish sauce', keys: ['FISH SAUCE'], unit: 'btl' },
  { name: 'Oyster sauce', keys: ['OYSTER SAUCE'], unit: 'btl' },
  { name: 'Tomato paste', keys: ['TOMATO PASTE', 'TOMATO PUREE'], unit: 'can' },
  { name: 'Chopped tomatoes', keys: ['CHOPPED TOMATO', 'TINNED TOMATO', 'CANNED TOMATO'], unit: 'can' },
  { name: 'Beans', keys: ['BEANS'], unit: 'can' },
  { name: 'Chickpeas', keys: ['CHICKPEA'], unit: 'can' },
  { name: 'Peanut butter', keys: ['PEANUT BUTTER'], unit: 'jar' },
  { name: 'Honey', keys: ['HONEY'], unit: 'jar' },
];
// Longest keys first so "OLIVE OIL" beats "OIL" and "CHICKEN THIGH" beats "CHICKEN".
const FOOD_KEYS = FOODS.flatMap((f) => f.keys.map((k) => ({ key: k, food: f }))).sort((a, b) => b.key.length - a.key.length);

/** Receipt abbreviations, whole-word only. Empty string = drop the word. */
const ABBREV: Record<string, string> = {
  CHKN: 'CHICKEN', CHK: 'CHICKEN', CKN: 'CHICKEN', BRST: 'BREAST', BRS: 'BREAST', THGH: 'THIGH', THIGHS: 'THIGH',
  MLK: 'MILK', YOG: 'YOGHURT', YGT: 'YOGHURT', YOGT: 'YOGHURT', BTR: 'BUTTER', CHS: 'CHEESE', CHSE: 'CHEESE',
  SCE: 'SAUCE', SAU: 'SAUCE', TOM: 'TOMATO', TOMS: 'TOMATO', TOMATOES: 'TOMATO', ONI: 'ONION', ONIONS: 'ONION',
  POT: 'POTATO', POTS: 'POTATO', POTATOES: 'POTATO', CRT: 'CARROT', CARR: 'CARROT', CARROTS: 'CARROT',
  MUSH: 'MUSHROOM', MSHRM: 'MUSHROOM', MUSHROOMS: 'MUSHROOM', SPIN: 'SPINACH', SPNCH: 'SPINACH',
  BAN: 'BANANA', BANANAS: 'BANANA', APPL: 'APPLE', APPLES: 'APPLE', LEMONS: 'LEMON', LIMES: 'LIME',
  GRLC: 'GARLIC', GING: 'GINGER', CORIAND: 'CORIANDER', BRD: 'BREAD', WHT: 'WHITE', WHL: 'WHOLE',
  VEG: 'VEGETABLE', VEGE: 'VEGETABLE', OLV: 'OLIVE', OIL: 'OIL', EGGS: 'EGG', MINCE: 'MINCE', MNC: 'MINCE',
  // Marketing / grading noise
  FIL: '', FILLET: '', FLT: '', LGE: '', LRG: '', LARGE: '', MED: '', SML: '', SMALL: '', ORG: '', ORGANIC: '',
  FF: '', FR: '', FRESH: '', XV: '', EV: '', EXTRA: '', VIRGIN: '', NATURAL: '', NAT: '', PREM: '', PREMIUM: '',
  BABY: '', CAVENDISH: '', FULL: '', CRM: '', LT: '', LITE: '', LIGHT: '', RED: '', BRN: '', BROWN: '',
  LOOSE: '', TRUSS: '', BNLS: '', BONELESS: '', SKLS: '', SKINLESS: '', FREE: '', RANGE: '', KG: '', EA: '', EACH: '',
  PK: '', PACK: '', PCS: '', PC: '', CT: '', X: '',
};

/** Lines that are never food, even if they reach the server. */
const NOT_FOOD = /\b(SUB ?TOTAL|TOTAL|TAX|VAT|GST|CHANGE|CASH|CARD|VISA|MASTERCARD|AMEX|DEBIT|CREDIT|BALANCE|TENDER|PAYMENT|DISCOUNT|SAVING|SAVINGS|MEMBER|POINTS|REWARD|RECEIPT|INVOICE|THANK|CASHIER|TERMINAL|AUTH|APPROVED|REF|TEL|PHONE|WWW|HTTP|DATE|TIME|ITEMS?\s*SOLD|QTY|BAG FEE|CARRIER BAG|ROUNDING|REFUND|VOID)\b/;

const UNIT_MAP: Record<string, { unit: string; factor: number }> = {
  KG: { unit: 'kg', factor: 1 }, KGS: { unit: 'kg', factor: 1 },
  G: { unit: 'g', factor: 1 }, GM: { unit: 'g', factor: 1 }, GR: { unit: 'g', factor: 1 }, GRM: { unit: 'g', factor: 1 },
  ML: { unit: 'ml', factor: 1 }, CL: { unit: 'ml', factor: 10 },
  L: { unit: 'L', factor: 1 }, LT: { unit: 'L', factor: 1 }, LTR: { unit: 'L', factor: 1 }, LTRS: { unit: 'L', factor: 1 },
};

const round = (n: number) => Math.round(n * 100) / 100;
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase());

/** Fixes common OCR slips inside number tokens ("5OO" → 500, "1I.99" → 11.99) and comma decimals. */
function fixDigits(s: string): string {
  return s
    .replace(/\b(?:\d[\dOI.,]*|O[\dOI.,]*\d[\dOI.,]*)/g, (tok) => tok.replace(/O/g, '0').replace(/I/g, '1'))
    .replace(/(\d),(\d{2})\b/g, '$1.$2');
}

export function parseReceiptLine(input: string): ParsedLine | null {
  // OCR often leaves "| " or "~ " from the receipt edge at the start of a line.
  const raw = input.trim().replace(/^[^A-Za-z0-9]+/, '').replace(/\s+/g, ' ');
  let s = fixDigits(raw.toUpperCase());
  if (NOT_FOOD.test(s)) return null;

  // Trailing price(s) and VAT codes: "... 6.99", "... $6.99 A", "... 2 @ 1.50 3.00"
  s = s.replace(/(\s+[-$£€฿]?\d+\.\d{2}\s*[A-Z*]?)+\s*$/, '');
  // Weighed produce: "1.23KG @ 2.99/KG" -> keep the weight
  const weighed = s.match(/(\d+(?:\.\d+)?)\s*(KG|G)\s*@\s*[$£€฿]?\d+(?:\.\d+)?\s*\/\s*(KG|G)/);
  s = s.replace(/@\s*[$£€฿]?\d+(?:\.\d+)?\s*(\/\s*[A-Z]+)?/, ' ');

  // Multi-buy prefix/suffix: "2 X MILK", "MILK X2", "2 @"
  let count = 1;
  const pre = s.match(/^(\d{1,2})\s*[X*]\s+/);
  if (pre) {
    count = Number(pre[1]);
    s = s.slice(pre[0].length);
  }
  const post = s.match(/\s+[X*]\s?(\d{1,2})\s*$/);
  if (post) {
    count = Number(post[1]);
    s = s.slice(0, -post[0].length);
  }

  // Size: "500G", "1.5 L", "6PK"
  let qty: number | null = null;
  let unit = '';
  const size = weighed ?? s.match(/(\d+(?:\.\d+)?)\s*(KGS?|GRM|GR|GM|G|ML|CL|LTRS?|LT|L)\b/);
  if (size) {
    const u = UNIT_MAP[size[2]];
    qty = Number(size[1]) * u.factor;
    unit = u.unit;
  }
  const pack = s.match(/(\d{1,3})\s*(PK|PACK|PCS|PC|CT|EGGS?)\b/);
  if (!size && pack) {
    qty = Number(pack[1]);
    unit = 'pieces';
  }

  // Name: drop sizes, numbers and codes, expand abbreviations.
  const words = s
    .replace(/(\d+(?:\.\d+)?)\s*(KGS?|GRM|GR|GM|G|ML|CL|LTRS?|LT|L|PK|PACK|PCS|PC|CT)\b/g, ' ')
    .replace(/[^A-Z ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => (w in ABBREV ? ABBREV[w] : w))
    .filter((w) => w && w.length > 1);
  const cleaned = words.join(' ');
  if (!cleaned || cleaned.replace(/ /g, '').length < 3) return null;

  const hit = FOOD_KEYS.find(({ key }) => ` ${cleaned} `.includes(` ${key}`));
  const food = hit?.food;
  const name = food?.name ?? titleCase(cleaned);
  if (qty === null) {
    qty = 1;
    unit = food?.unit ?? 'pieces';
  }
  // Pieces multiply by the multi-buy count; a size stays per-item x count.
  qty = round(qty * count);
  // Tidy big gram/ml values into kg/L only when they are whole.
  if (unit === 'g' && qty >= 1000 && qty % 1000 === 0) {
    qty /= 1000;
    unit = 'kg';
  }
  return { name, qty, unit, raw, confident: !!food };
}

/** Parses all lines and merges duplicates (same name + unit). */
export function parseReceipt(lines: string[]): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const line of lines.slice(0, 120)) {
    const p = parseReceiptLine(String(line).slice(0, 120));
    if (!p) continue;
    const dup = out.find((o) => o.name === p.name && o.unit === p.unit);
    if (dup) dup.qty = round(dup.qty + p.qty);
    else out.push(p);
  }
  return out;
}
