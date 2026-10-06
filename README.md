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

Data lives in `backend/data/db.json` (git-ignored). Delete the file to reset.

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

## Receipt scanner (real camera + on-device OCR)

1. **S1** opens the rear camera live (`getUserMedia`) inside the yellow frame;
   the shutter captures exactly what is in the frame. No camera / permission
   denied → the shutter opens the phone's native camera or photo picker.
   Flash toggle appears when the device supports it.
2. **S2** reads the photo **on the phone** with Tesseract.js
   ([frontend/src/ocr.ts](frontend/src/ocr.ts)) — greyscale + contrast boost,
   single-column page mode. The receipt header (shop, address, phone, date),
   the footer (totals, payment, card) and any private line in between are
   removed on the phone. **The photo is never uploaded.**
3. Only the remaining item text lines go to `POST /api/scan`, where
   [backend/src/receipt.ts](backend/src/receipt.ts) expands receipt
   abbreviations (`CHKN THIGH FIL 500G` → Chicken thighs · 500 g), reads sizes,
   pack counts, multi-buys and weighed produce, and merges duplicates. Lines it
   can't match to a known food are flagged "check this" on the review screen.

Test the camera on a phone (browsers only allow cameras on HTTPS or localhost):

```bash
npm run dev:phone
```

Open the `https://<your-LAN-IP>:5173` address it prints on the phone (same
Wi-Fi) and accept the self-signed certificate warning. The first scan
downloads the OCR engine + English model (a few MB) from the jsDelivr CDN; it is
cached after that.

## AI service

`backend/src/ai.ts` is a **mock** of the third-party AI recipe
generation. It is deterministic, respects dietary filters (allergens are
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
