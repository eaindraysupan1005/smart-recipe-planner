/**
 * Reads a receipt photo with Gemini vision and returns item lines in English,
 * whatever language the receipt is printed in (Thai, Japanese, Burmese…).
 *
 * PDPA: the photo is sent to the AI service, used only to read the item lines,
 * and never stored by us. The consent screen says this explicitly and the
 * transfer is recorded, so the user can see what left their phone and when.
 */
import { askJson, GeminiError, hasGeminiKey } from './gemini.js';

export interface VisionLine {
  name: string;
  qty: number;
  unit: string;
  /** The text as printed on the receipt, in the original language. */
  raw: string;
  confident: boolean;
}

export interface VisionResult {
  lines: VisionLine[];
  /** Language the receipt was printed in, as the model saw it. */
  language: string;
  translated: boolean;
  durationMs: number;
}

const PROMPT = `This photo is a grocery receipt. Read ONLY the purchased item lines.

For each food or drink item:
- "name": the item in English, as a normal shopping word (e.g. "Chicken thighs", "Milk").
  Expand shop abbreviations. If the receipt is in another language, translate the name.
- "qty": the quantity as a number. Use the pack size or weight when printed
  (e.g. "500g" -> 500, "6 PK" -> 6). If nothing is printed, use 1.
- "unit": one of g, kg, ml, L, pieces, bag, tub, bunch, btl, can, pack, bulb, jar — or "" if unclear.
- "raw": the line exactly as printed, in the original language and script.
- "confident": true only if you are sure this is a food or drink item.

Ignore and never return: the shop name, address, phone number, website, date,
time, cashier, receipt or invoice numbers, card or payment details, loyalty
points, discounts, subtotals, taxes and totals, and any non-food item.

Also report "language": the language the receipt is printed in (English name).

Reply with JSON only:
{"language":"Thai","items":[{"name":"","qty":0,"unit":"","raw":"","confident":true}]}`;

const UNITS = new Set(['g', 'kg', 'ml', 'L', 'pieces', 'bag', 'tub', 'bunch', 'btl', 'can', 'pack', 'bulb', 'jar']);

export const visionAvailable = (): boolean => hasGeminiKey();

export async function readReceiptPhoto(image: string): Promise<VisionResult> {
  if (!hasGeminiKey()) throw new GeminiError('GEMINI_API_KEY is not set');
  const started = Date.now();
  const res = await askJson<{ language?: string; items?: Record<string, unknown>[] }>(PROMPT, {
    image,
    temperature: 0.1,
    timeoutMs: 40_000,
    retries: 1,
  });

  const lines: VisionLine[] = (res.items ?? [])
    .map((i) => {
      const name = String(i.name ?? '').trim().slice(0, 60);
      const qtyRaw = Number(i.qty);
      const unit = String(i.unit ?? '').trim();
      return {
        name,
        qty: Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw * 100) / 100 : 1,
        unit: UNITS.has(unit) ? unit : '',
        raw: String(i.raw ?? name).trim().slice(0, 120),
        confident: i.confident !== false,
      };
    })
    .filter((i) => i.name.length > 1);

  const language = String(res.language ?? '').trim().slice(0, 30) || 'Unknown';
  return {
    lines,
    language,
    translated: !/^english$/i.test(language),
    durationMs: Date.now() - started,
  };
}
