import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { watchDataFile } from './db.js';
import { accessLog, errorHandler, requireAuth } from './middleware.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { pantryRouter, scanRouter } from './routes/pantry.js';
import { recipesRouter } from './routes/recipes.js';
import { groceryRouter } from './routes/grocery.js';

watchDataFile();

const app = express();
app.set('trust proxy', true);
app.use(cors());
// Receipt photos are read on the phone; only text lines are ever posted here.
app.use(express.json({ limit: '1mb' }));

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
