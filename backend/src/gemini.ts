/**
 * Minimal Gemini client. The API key lives in backend/.env (never in the
 * frontend, never in git) and every call goes through this server, so the key
 * is never exposed to the browser.
 *
 *   GEMINI_API_KEY=...            required for AI features
 *   GEMINI_MODEL=gemini-2.5-flash override the model if needed
 */
import fs from 'node:fs';
import { ENV_FILE } from './paths.js';

/** Tiny .env reader — avoids a dependency for one file. */
function loadEnv(): void {
  if (!fs.existsSync(ENV_FILE)) return;
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
loadEnv();

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export const geminiModel = (): string => MODEL;
export const hasGeminiKey = (): boolean => !!process.env.GEMINI_API_KEY;

export class GeminiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

interface Part {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface AskOptions {
  system?: string;
  /** A data: URL or raw base64 image to send alongside the prompt. */
  image?: string;
  temperature?: number;
  timeoutMs?: number;
}

/** Sends one prompt and returns the model's raw text reply. */
export async function ask(prompt: string, opts: AskOptions = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError('GEMINI_API_KEY is not set');

  const parts: Part[] = [{ text: prompt }];
  if (opts.image) {
    const m = opts.image.match(/^data:([^;]+);base64,(.*)$/);
    parts.unshift({ inline_data: { mime_type: m ? m[1] : 'image/jpeg', data: m ? m[2] : opts.image } });
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: opts.temperature ?? 0.4, responseMimeType: 'application/json' },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25_000);
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    throw new GeminiError((e as Error).name === 'AbortError' ? 'Gemini timed out' : 'Could not reach Gemini');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Never log the key, and keep the upstream message short.
    throw new GeminiError(`Gemini ${res.status}: ${detail.slice(0, 200)}`, res.status);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new GeminiError('Gemini returned an empty reply');
  return text;
}

/** Asks for JSON and parses it, tolerating ```json fences. */
export async function askJson<T>(prompt: string, opts: AskOptions = {}): Promise<T> {
  const raw = await ask(prompt, opts);
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new GeminiError('Gemini returned text that was not valid JSON');
  }
}
