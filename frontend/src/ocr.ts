/**
 * On-device receipt reading with Tesseract.js. The photo never leaves the
 * phone: we OCR it here, strip store/payment/total lines, and send only the
 * remaining item text lines to the API (PDPA minimisation).
 */
import { createWorker, PSM } from 'tesseract.js';

export interface OcrProgress {
  stage: 'loading' | 'reading';
  progress: number; // 0..1
}

export interface OcrResult {
  /** Item-candidate lines that are safe to send. */
  lines: string[];
  /** All text lines Tesseract found. */
  textLines: number;
  /** Lines removed on the phone (store, payment, totals, dates…). */
  removed: number;
  confidence: number;
}

/** Scales to a width Tesseract likes and boosts contrast in greyscale. */
function prepare(img: HTMLImageElement): HTMLCanvasElement {
  const target = 1800;
  const scale = Math.min(2.5, target / Math.max(img.naturalWidth, 1));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);

  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  // Greyscale + histogram stretch (ignore the darkest/brightest 1%).
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
    px[i] = g;
    hist[g]++;
  }
  const total = px.length / 4;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < total * 0.01; lo++);
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < total * 0.01; hi--);
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < px.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((px[i] - lo) * 255) / range));
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not open that photo.'));
    img.src = src;
  });
}

// Lines that identify the shop, the shopper or the payment — never sent.
const PRIVATE =
  /\b(SUB ?TOTAL|TOTAL|TAX|VAT|GST|CHANGE|CASH|CARD|VISA|MASTER ?CARD|AMEX|DEBIT|CREDIT|BALANCE|TENDER|PAYMENT|PAID|DISCOUNT|SAVINGS?|MEMBER|POINTS|REWARDS?|RECEIPT|INVOICE|THANK|CASHIER|OPERATOR|TERMINAL|TERM|AUTH|APPROVED|APPROVAL|REF|TRANS|TXN|TEL|PHONE|FAX|WWW|HTTP|EMAIL|STORE|BRANCH|STREET|ROAD|RD|AVE|DATE|TIME|ITEMS? SOLD|NO\. OF ITEMS|QTY|ROUNDING|REFUND|VOID|TAX ID|ABN|VAT NO)\b/i;
const CARD_DIGITS = /(\*{2,}|X{3,})\s*\d{2,}|\b\d{4}[ -]\d{4}[ -]\d{4}/i;
const DATE_TIME = /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{1,2}:\d{2}(:\d{2})?\b/;
const PRICE_AT_END = /\d+[.,]\d{2}\s*[A-Z*]?\s*$/i;
const HAS_SIZE = /\d+(\.\d+)?\s*(KG|G|GM|ML|CL|L|LTR|PK|PACK|PCS)\b/i;

const FOOTER = /\b(SUB ?TOTAL|TOTAL|AMOUNT DUE|BALANCE DUE)\b/i;

/**
 * Keeps only the item block of a receipt:
 *  - header (shop name, address, phone, date) = everything before the first
 *    line that looks like an item (has a price or a pack size);
 *  - footer (totals, payment, card, thanks) = everything from SUBTOTAL/TOTAL on;
 *  - and, in between, any line with private keywords, card digits or dates.
 */
export function stripPrivate(all: string[]): { kept: string[]; removed: number } {
  const clean = all
    .map((l) => l.replace(/^[^A-Za-z0-9]+/, '').replace(/\s+/g, ' ').trim())
    .filter((l) => /[A-Za-z]{3,}/.test(l));
  const itemLike = (l: string) => PRICE_AT_END.test(l) || HAS_SIZE.test(l);
  let start = clean.findIndex(itemLike);
  if (start < 0) start = Math.min(2, clean.length);
  let end = clean.findIndex((l, i) => i >= start && FOOTER.test(l));
  if (end < 0) end = clean.length;
  const kept = clean.slice(start, end).filter((l) => !PRIVATE.test(l) && !CARD_DIGITS.test(l) && !DATE_TIME.test(l));
  return { kept, removed: all.length - kept.length };
}

export async function readReceipt(imageSrc: string, onProgress: (p: OcrProgress) => void): Promise<OcrResult> {
  const img = await loadImage(imageSrc);
  const canvas = prepare(img);
  onProgress({ stage: 'loading', progress: 0 });
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress({ stage: 'reading', progress: m.progress });
      else onProgress({ stage: 'loading', progress: m.progress });
    },
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      preserve_interword_spaces: '1',
    });
    const { data } = await worker.recognize(canvas);
    const all = data.text.split('\n').map((l) => l.trim()).filter(Boolean);
    const { kept, removed } = stripPrivate(all);
    return { lines: kept, textLines: all.length, removed, confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
}

/** A realistic receipt for demos without a camera — goes through the same parser. */
export const SAMPLE_RECEIPT = [
  'FRESHMART SUPERSTORE',
  '123 SUKHUMVIT RD BANGKOK',
  'TEL 02-555-0100',
  '09/09/2026 19:38',
  'BABY SPINACH 200G 2.50',
  'EGGS LGE 6PK 3.20',
  'CHKN THIGH FIL 500G 6.99',
  'YOG NATURAL 500G 2.10',
  'MLK FULL CRM 1L 1.80',
  'OATS ROLLED 900G 2.49',
  'SOY SCE LT 500ML 3.10',
  'BANANA CAVENDISH 1.23KG @ 2.99/KG 3.68',
  'OLIVE OIL XV 750ML 8.99',
  'SUBTOTAL 32.85',
  'VISA ************4821 32.85',
  'THANK YOU FOR SHOPPING',
];
