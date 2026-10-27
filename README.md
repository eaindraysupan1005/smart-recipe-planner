# What2Cook — Smart Recipe & Pantry Assistant

Team Apex. React + TypeScript frontend, Node + Express + TypeScript backend.
Built from the Claude Design prototype `What2Cook.dc.html`.

## Alpha Demo Day (one-command run)

```bash
npm install
npm run demo
```

That builds both apps, loads the demo data and starts **one** server:
**http://localhost:4000** — app and API together, no Vite, no proxy.

Sign in with **demo@what2cook.app** and **any password** (auth is a dummy).

Reset the demo data at any time, even while the server is running — it reloads
the file automatically:

```bash
npm run seed          # reset the demo account only
npm run seed:fresh    # wipe everything and reseed
```

The demo account starts with 12 pantry items, 1 saved recipe (missing one
ingredient, so the shopping list has something to show), 1 AI suggestion
waiting, a 3-item shopping list, and its consent records already on file.

### The 4-minute demo path

1. **Pantry** — 12 items, newest scan first.
2. **Scan** → "Use a sample receipt" (or a real receipt with the camera) →
   review the read items → **Add to pantry**.
3. **Pantry** — tick 2–3 items → **Cook with N selected**.
4. **Recipe** — uses only the ticked items, dietary filters applied →
   **Mark as cooked** → confirm what is left over.
5. **Pantry** — amounts are deducted; anything used up is gone.
6. **Saved** → a recipe → **Add missing items to list** → **List**.

### Checks the markers will run

- **Refresh test:** add an item, reload the page — it is still there (data is
  written to `backend/data/db.json`, and the session token survives a reload).
- **Hands-off test:** every step above is reachable by tapping; nothing needs
  the console or a URL typed by hand.

### If something goes wrong on the day

| Problem | Fix |
|---|---|
| Port 4000 busy | `API_PORT=4100 npm run start -w backend`, then open that port |
| Data looks wrong mid-demo | `npm run seed` in a second terminal — no restart needed |
| Camera blocked on the laptop | Use "No receipt handy? Use a sample receipt" |
| Starting from scratch | `npm install && npm run demo` |

Dev mode (two servers, hot reload) is still `npm run dev` — see below.

## Run it (development)

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173 (Vite, proxies `/api` to the backend)
- API: http://localhost:4000 (`API_PORT` to change)

Auth is a **dummy**: any email and any password work. No password is ever
stored — only an opaque session token (PDPA rule).

Data lives in `backend/data/db.json` (git-ignored) unless Supabase is configured
— see below. Delete the file to reset.

## Database (Supabase)

With no Supabase settings the app keeps using `backend/data/db.json`. To store
data in Supabase Postgres instead:

1. Create a project at https://supabase.com/dashboard (free tier is fine).
2. **SQL Editor** → paste all of `backend/supabase/schema.sql` → **Run**.
3. **Project Settings → API**: copy the project URL and the **secret** key
   (`service_role`, or `sb_secret_…`).
4. `cp backend/.env.example backend/.env`, then fill in `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`. The key stays on the server; `.env` is git-ignored.
5. `npm run db:check -w backend` — prints a row count per table when connected.
6. `npm run seed`, then `npm run dev`. The server logs `Storage: Supabase (…)`.

How it works: the server loads every table into memory at startup, routes work
on that as before, and each change is written through to Postgres (only the
rows that changed). RLS is on with no policies, so the public anon key can read
nothing. Access logs and acceptance records have no foreign key to `users`, so
they survive account deletion (CCA §26 / ETA).

Limits: one server instance only, and after `npm run seed` **restart the
server** — in Supabase mode it does not reload from outside like it does for
`db.json`.

## Core workflow

receipt scan → pantry in → AI recipe → cook & confirm leftovers → grocery list out

| Screen (design id) | Route |
|---|---|
| M0 User manual | `/welcome`, `/profile/manual` |
| J1 Sign-up & Terms | `/signup` (`?mode=login` to sign in) |
| J2 Dietary profile | `/onboarding/diet`, `/profile/diet` |
| A3 / J4 Pantry, E1 edit, J5 consent | `/pantry` |
| S1 Scan, S2 Reading, S3/S4 Review | `/scan`, `/scan/reading`, `/scan/review` |
| S5 Add by hand | `/pantry/add` |
| J6 Recipe, C1 Mark as cooked | `/recipes/:id` |
| A1 Service unavailable | `/recipes/unavailable` (or `/recipes/generate?fail=1`) |
| J7 Generated recipes | `/recipes` |
| R2 Saved, R3 Cook-again check | `/saved`, `/saved/:id` |
| J9 Shopping list | `/list` |
| P1 Profile, P2/P3 Privacy & consent | `/profile`, `/profile/privacy` |

## Receipt scanner (camera + AI reading, any language)

1. **S1** opens the rear camera live; the shutter captures what is in the frame.
   No camera / permission denied → it falls back to the phone's own camera or
   photo picker. Flash toggle appears when the device supports it.
2. **S2** sends the photo to Gemini, which reads the item lines **and
   translates them into English** — Thai, Japanese, Burmese, whatever the
   receipt is printed in. The shop name, address, phone, date, card digits and
   totals are never returned. The photo is not stored by us.
   With no `GEMINI_API_KEY`, it falls back to on-device OCR (Tesseract.js) and
   only text lines are sent.
3. **S3** shows what it read, with a `Thai → English` badge when it translated,
   and every line editable before it lands in the pantry.

Tested on a Thai receipt: 7 of 7 items read, translated, with correct
quantities and units, in about 8 seconds.

## The AI chef (recipe dataset + occasion)

```bash
npm run import:recipes -- ~/Downloads/archive/RAW_recipes.csv --limit 40000
```

Imports a Kaggle recipe CSV (Food.com, RecipeNLG or a generic layout — detected
automatically) into `backend/data/recipes.json`: ingredients parsed into
`{name, qty, unit}`, mapped to pantry foods, tagged with diet flags and the
occasions each dish suits. The current import holds **40,000 recipes**.

After picking ingredients the app asks **"What's the occasion?"** — Just me
quickly ⚡ · Friends coming over 🎉 · Drinks & snacks 🍻 · Romantic dinner 🕯️ ·
Comfort food 🍜 · Light & healthy 🥗 · Family meal 🍲. It is optional; Skip
behaves as before.

The chef then works in three steps:

| Step | What happens | When |
|---|---|---|
| **Pick** | Gemini chooses the best dishes from the shortlist and says why each suits the occasion | the pantry covers a dataset recipe |
| **Adapt** | Gemini rewrites the closest recipe around what you actually have | nothing matches well |
| **Invent** | Gemini writes an original dish from your items | the dataset has nothing usable |
| *(fallback)* | local scoring picks the best dataset match, and the screen says so | Gemini is unavailable |

The same four ingredients give a completely different menu per occasion — that
is the point of the feature. Every recipe records which step produced it, which
dataset recipe it came from, the occasion and the model, so the output stays
reproducible (ETA §26/28).

### Gemini setup

```bash
cp backend/.env.example backend/.env   # then paste your key into it
```

`GEMINI_API_KEY` is read only by the backend, so the browser never sees it, and
`.env` is git-ignored. Get a key at https://aistudio.google.com/apikey.
The default model is `gemini-3.5-flash` (~2.5s); override with `GEMINI_MODEL`.
Overloaded requests (429/503) retry twice, then fall back to local matching.

## Local fallback generator

`backend/src/ai.ts` builds a simple recipe from the picked items when there is
no API key and the dataset has no match. It is deterministic, respects dietary filters (allergens are
removed, never "reduced"), and only ever receives ingredient name/qty/unit plus
dietary flags. Swap `extractReceipt` / `generateRecipe` for a real provider
without touching the routes.

## Legal rules implemented (see `rule.md`)

- **PDPA** — each dietary filter is its own opt-in record; AI consent gate
  before the first send, showing exactly what is sent; minimum fields only;
  receipt image is read and discarded; "Download my data" export; account
  deletion removes pantry, recipes, AI records, list and dietary profile.
- **CCA §26** — every create/edit/delete logs account id, IP and timestamp in
  `accessLogs`, kept separately and retained after the content is deleted.
- **ETA** — Terms / Disclaimer / consent / withdrawal records with version and
  time (visible in Privacy & AI consent); each generated recipe keeps model
  version, pantry snapshot, filters and timestamp in `aiRecords`.

## API overview

```
POST   /api/auth/signup | /login | /logout     GET/PATCH /api/auth/me
GET/PUT /api/profile/diet                      GET /api/profile/consents
POST   /api/profile/consents/:ai|diet          GET /api/profile/export
DELETE /api/profile/account
GET/POST /api/pantry   POST /api/pantry/bulk   PATCH/DELETE /api/pantry/:id
POST   /api/scan
GET    /api/recipes?status=generated|saved     POST /api/recipes/generate
GET/DELETE /api/recipes/:id                    POST /api/recipes/:id/regenerate
POST   /api/recipes/:id/save                   GET  /api/recipes/:id/cook-preview
POST   /api/recipes/:id/cook                   POST /api/recipes/:id/missing-to-grocery
GET/POST /api/grocery   PATCH/DELETE /api/grocery/:id   DELETE /api/grocery/checked
```
