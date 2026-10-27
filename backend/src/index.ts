import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flush, initDb, watchDataFile } from './db.js';
import { accessLog, errorHandler, requireAuth } from './middleware.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { pantryRouter, scanRouter } from './routes/pantry.js';
import { recipesRouter } from './routes/recipes.js';
import { groceryRouter } from './routes/grocery.js';

await initDb();
watchDataFile();

const app = express();
app.set('trust proxy', true);
/**
 * In production the app and API share an origin, so no cross-origin access is
 * needed at all. Dev runs the Vite server on another port, so allow that one.
 * A wildcard would let any website call this API with a stolen token.
 */
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,https://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  }),
);
// Receipt photos are posted for AI reading, then discarded — never stored.
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', accessLog, authRouter);
app.use('/api/profile', requireAuth, accessLog, profileRouter);
app.use('/api/pantry', requireAuth, accessLog, pantryRouter);
app.use('/api/scan', requireAuth, scanRouter);
app.use('/api/recipes', requireAuth, accessLog, recipesRouter);
app.use('/api/grocery', requireAuth, accessLog, groceryRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Unknown endpoint.' } });
});

/**
 * Production / demo mode: serve the built frontend from this same server, so
 * the whole app is one process on one URL (no Vite, no proxy). In dev the
 * folder does not exist and Vite serves the frontend instead.
 */
const webRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../frontend/dist');
if (fs.existsSync(path.join(webRoot, 'index.html'))) {
  app.use(express.static(webRoot));
  // Client-side routes (/pantry, /recipes/:id …) all render index.html.
  app.get(/.*/, (_req, res) => res.sendFile(path.join(webRoot, 'index.html')));
}

app.use(errorHandler);

// API_PORT, not PORT — dev tooling often sets PORT for the web server.
const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => {
  const served = fs.existsSync(path.join(webRoot, 'index.html'));
  console.log(served ? `What2Cook running on http://localhost:${port}` : `What2Cook API listening on http://localhost:${port}`);
});

// Write anything still waiting in the debounce window before the process exits.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    flush()
      .catch((e: Error) => console.error(e.message))
      .finally(() => process.exit(0));
  });
}
