/**
 * Tiny .env reader — avoids a dependency for one file. Import it for its side
 * effect before reading process.env. Real environment variables win over .env.
 */
import fs from 'node:fs';
import { ENV_FILE } from './paths.js';

if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
