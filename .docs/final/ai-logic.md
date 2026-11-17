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

No formal evaluation set or eval log exists in the repo yet — this is an
honest gap, not a result. The automated-tests gap already flagged in the
repo audit (no `test` script, no test files) means none of the logic above
— `shortlist()`'s scoring, `excludedFor()`'s allergen matching, or the
cascade's fallback behaviour — currently has recorded proof it works beyond
manual use during the demo.

What *would* prove it, and is not yet done:
- A fixed test set of ~15–20 (pantry selection × dietary filter) combinations,
  run through `generateRecipe()` / `cook()`, checked for **zero** allergen
  leaks (NFR5 in the spec claims 100% allergen safety — currently unverified
  by any automated check).
- A small receipt-photo test set (different languages/formats) checked
  against `readReceiptPhoto()` output for name/qty/unit accuracy.
- Logging actual `usedAi` / `method` / `durationMs` values from real demo or
  UAT runs, rather than only the shape of the code.

## Measure

Also not yet done — no numbers exist in the repo to report honestly. Once
the "Prove" step above is run, the team should report at minimum:
- % of test combinations with zero allergen/diet violations (target: 100%,
  per NFR5).
- % of AI calls that succeeded vs. fell back locally, and typical
  `durationMs`, from real usage (ties to NFR8, AI availability).
- Receipt OCR accuracy (lines correctly read) across the test receipts.

**TODO for the team:** fill in this section with real figures once the test
set above is run — do not put placeholder numbers here.
