import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Paths are resolved against the backend package, not the working directory,
 * so `node backend/dist/index.js` works from anywhere.
 * src/paths.ts -> backend/ · dist/paths.js -> backend/
 */
export const BACKEND_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
export const DATA_DIR = process.env.DATA_DIR ?? path.join(BACKEND_ROOT, 'data');
export const dataFile = (name: string): string => path.join(DATA_DIR, name);
export const ENV_FILE = path.join(BACKEND_ROOT, '.env');
