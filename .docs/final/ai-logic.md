# AI Logic — Smart Recipe & Pantry Assistant (What2Cook)

## Where

AI is used in exactly two places in the product, both on the backend only
(the API key never reaches the browser — see [backend/src/gemini.ts](../../backend/src/gemini.ts)):

1. **Receipt reading** — [backend/src/receipt-vision.ts](../../backend/src/receipt-vision.ts).
   A photo of a grocery receipt is sent to Gemini's vision endpoint, which
   returns the purchased item lines (name, quantity, unit), translated into
   English regardless of the receipt's printed language.
2. **Recipe generation ("the chef")** — [backend/src/chef.ts](../../backend/src/chef.ts).
   Turns the pantry items the user ticked, their dietary profile, and an
   optional mood/occasion into a recipe.

## How

**Model:** Gemini (`gemini-3.5-flash` by default, overridable via
`GEMINI_MODEL`), called through a single minimal client
([backend/src/gemini.ts](../../backend/src/gemini.ts)) that every AI feature
shares. It retries once or twice on overload (HTTP 429/503) before giving up,
and always asks for `responseMimeType: application/json` so replies parse
cleanly.

**What is sent (LR2 — minimum fields only):** only the ticked ingredient
names/quantities/units and the active dietary filters (e.g. "Vegetarian",
"No peanuts"). No account ID, name, email or address is ever included in a
prompt — see [backend/src/chef.ts](../../backend/src/chef.ts) `pantryBlock()`.
For receipt reading, only the photo itself is sent, and it is never stored.

**Recipe generation is a three-step cascade, not a single prompt call**
(`cook()` in `chef.ts`):

1. **PICK** — a local scoring function (`shortlist()`) first ranks a recipe
   dataset ([backend/data/recipes.json](../../backend/data/recipes.json), or a
   built-in sample set) by how much of the picked pantry it covers. Gemini
   then chooses the best 1–3 of that shortlist for the stated occasion and
   gives a one-sentence reason ("why").
2. **ADAPT** — if nothing on the shortlist covers enough of the pantry,
   Gemini rewrites the single closest dataset recipe around what the user
   actually has (swapping/dropping what they lack).
3. **INVENT** — if the dataset has nothing usable at all, Gemini writes an
   original recipe using *only* the picked ingredients plus basic staples
   (salt, oil, pepper, condiments). The code re-prompts once if Gemini tries
   to sneak in an ingredient the user doesn't have (`pinToPicked()`).

**System prompt** (`SYSTEM` constant in `chef.ts`) hard-codes the safety
rules the model must follow: respect allergies/diet filters, never hide an
unsafe ingredient (flag it in "why" instead of pretending it's absent), only
assume pantry staples/condiments are available, and reply with JSON only.

**Local fallback, by design, not an afterthought:** if there is no Gemini key
configured, or Gemini fails/times out/returns bad JSON, `cook()` falls back
to `localFallback()` — matching against the same dataset with pure scoring,
or a rule-based generator in [backend/src/ai.ts](../../backend/src/ai.ts) that
builds a recipe directly from the picked items with no AI call at all. The
app therefore always returns a recipe, and the response always says which
path produced it (`method: 'picked' | 'adapted' | 'invented' | 'local'`,
`usedAi: boolean`).

**Allergen/dietary safety is enforced twice, not trusted to the model once:**
after Gemini (or the fallback) returns a dish, `withWarnings()` independently
re-checks every ingredient against the user's diet profile
([backend/src/allergens.ts](../../backend/src/allergens.ts)) and attaches
warning badges. Nothing is silently dropped — a clash is shown to the cook,
not hidden, which is also the UX decision the Designer's role statement
documents (three-level warning hierarchy).

**Reproducibility (ETA §26/28):** every result records the model name/version,
which dataset recipe (if any) it came from, and which of the four methods
produced it, so an AI-generated recipe can be explained after the fact.

## Prove

Two kinds of evidence exist: automated tests of the logic around the AI, and
real-user results on the AI tasks. A dedicated allergen-leak evaluation of the
live model has **not** been run (see "Not yet done" below).

**1. Automated tests** — `npm test` (run on 17 Nov 2026): **62 tests, 62 pass,
0 fail**, in [backend/test](../../backend/test). The API tests run with an empty
`GEMINI_API_KEY`, so they exercise the local (non-Gemini) path and the
fallback behaviour, not the live model. Relevant tests:
- `allergens.test.ts` — declared allergies/diets raise the right warnings (F6).
- `api.test.ts` — the full pantry → recipe → cook → grocery-list flow with
  consent and leftover deduction; a simulated AI outage returns a friendly
  503 and loses nothing (NFR8); a vegetarian filter is honoured by the
  generated recipe; consent can be withdrawn and the AI is blocked again.
- `receipt.test.ts`, `units.test.ts` — receipt parsing and unit conversion
  used before pantry quantities reach the AI.

**2. Real-user evaluation** — UAT task T2 (AI recipe), 8 users before fixes
and 8 different users after ([logs](../03-testing/03-uat-session-logs-round1.md),
[Round 2](../03-testing/04-uat-session-logs-round2.md),
[before/after](../03-testing/05-before-after.md)). Pass criteria per step:
progress shown ≤ 1 s, recipe ≤ 10 s, only selected items + declared staples,
0 dietary violations.
- **Baseline (Round 1):** 2 of 8 users passed. Two users were shown a recipe
  with ingredients that were not in their pantry or staples (one needed ≥ 2
  items to buy; one got heavy cream). Five recipes arrived after 12–55 s.
- **After fixes (Round 2):** 8 of 8 passed; all recipes arrived in 7–9.6 s
  and used only selected items + staples.
- **Dietary filters in the sessions:** 0 violations recorded in either round,
  with no-pork, vegetarian and peanut-allergy filters among those used.

**3. Receipt reading** (Gemini vision with Tesseract fallback), UAT T1: four
Round 1 records give lines read correctly before correction — 12/14, 13/15,
11/12 and 16/18 (52 of 59 lines, 88.1%; each above the 85% target). Round 1
also had two sessions where the reader failed or stalled (U01: a "Try again"
error; U04: a stall of about 55 s with an error shown).

**Not yet done:**
- A fixed test set of ~15–20 (pantry selection × dietary filter) combinations
  run through the live model and checked for zero allergen leaks (NFR5 claims
  100% allergen safety; the sessions above are 16 users, not an exhaustive
  check).
- A receipt-photo test set across languages and formats scored against
  `readReceiptPhoto()` output.
- Logged `usedAi` / `method` / `durationMs` values from live runs.

## Measure

| Measure | Before (Round 1) | After (Round 2) | Source |
|---|---|---|---|
| T2 AI recipe task passed | 2/8 | 8/8 | [05-before-after.md](../03-testing/05-before-after.md) |
| Median generation time (target ≤ 10 s) | 14.1 s | 8.4 s | same |
| Recipes within 10 s | 3/8 | 8/8 | same |
| Users shown ingredients outside pantry + staples | 2/8 | 0/8 | session logs (T2 step 4) |
| Dietary-filter violations recorded | 0 | 0 | session logs |
| Automated tests passing | — | 62/62 | `npm test`, 17 Nov 2026 |

Not measured: the share of AI calls that succeeded versus fell back locally,
and the live-model allergen-leak rate. No figure is claimed for either.
