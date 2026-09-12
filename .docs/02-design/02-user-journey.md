# User Journey — the one core workflow, two entry points

- Date: 2026-09-02 (W4, DISCOVER)
- Persona: **Nan**, cooks for herself 4+ times a week, throws out small
  leftovers most weeks and orders takeout when she can't decide what to cook
  (P1, P2, P3).
- The app has **two ways in** to the same underlying system, not two separate
  workflows: **Journey 1 (Cook now)** goes from an empty/updated pantry all
  the way to a fresh recipe and pantry deduction; **Journey 2 (Grocery list
  from an existing recipe)** skips scanning and generating entirely and goes
  straight from a saved recipe to a shopping list. Both feed the same pooled
  grocery list (F4, NFR12) — a recipe joins that pool automatically the
  moment it's generated (Journey 1) or selected (Journey 2); there is no
  separate "add to plan" tap in either journey.

## One-time setup (before either journey, first use only)

| # | Screen | Nan does | System does | Traces |
|---|--------|----------|-------------|--------|
| S1 | Sign-up / Terms | Creates an account, accepts Terms + AI & Food Safety Disclaimer | Stores acceptance: user id, timestamp, version | LR7 |
| S2 | Dietary profile | Opts in to "gluten-free" and an allergy (peanuts) | Stores as **sensitive data** under a separate explicit opt-in; not set by default | F6, LR1 |

---

## Journey 1 — Cook now

| # | Screen | Nan does | System does | Traces | Pain relieved |
|---|--------|----------|-------------|--------|---------------|
| J1 | Pantry (home) | Opens the app | Shows current pantry items and quantities | F2 | **P1** |
| J2 | Scan receipt | Photographs her grocery receipt | — | F1 | **P1** |
| J3 | Generate pantry list | (system step) | Parses items and quantities into the pantry in under a minute, flagging low-confidence lines | F1, NFR2 | **P1** |
| J4 | Edit / confirm pantry | Fixes one misread line ("spinach" scanned as "spmach"), confirms the rest | Saves the corrected pantry | F1, F2, NFR3 | **P1** |
| J5 | Select pantry items | Selects spinach, eggs, and rice; taps "Cook something with this" | First time only: asks consent to send the selected ingredient names + dietary flags to the AI service, before continuing | F3, LR2 | — (trust) |
| J6 | Generate recipe | Waits ~6 seconds | Returns a spinach-and-egg recipe using only the selected items + staples, zero gluten, zero peanuts; stores text, model version, pantry snapshot, filters, timestamp; **the recipe joins the pending grocery-list pool automatically** | F3, F6, F4, NFR4, NFR5, NFR6, NFR12, LR8 | **P1, P2** |
| J7 | Recipe result | Decides: **mark as cooked**, or **regenerate** | Regenerate → back to J6 with a new recipe from the same selection. Mark as cooked → J8 | F3 | P2 |
| J8 | Cooked confirmation | — | Deducts the used quantities from the pantry and shows what was removed | F2 | **P1** |
| J9 | Confirm deduction | Confirms what's left over, in ≤ 2 taps | Saves the corrected pantry quantities | F2, NFR11 | **P1** |

## Journey 2 — Grocery list from an existing recipe

| # | Screen | Nan does | System does | Traces | Pain relieved |
|---|--------|----------|-------------|--------|---------------|
| K1 | Recipe list / Favourites | Opens the app, goes straight to her saved recipes (all AI-generated) or her favourites — no scan, no pantry step | Shows the saved recipes, searchable by ingredient | F5, F7 | **P2, P3** |
| K2 | Select a recipe | Picks "Chicken Rice" | The recipe (re)joins the pending grocery-list pool automatically — no "add" tap; pantry stock is **not** checked yet | F4, NFR12 | P3 |
| K3 | Build grocery list | Taps "Build my shopping list" | Compares the pool's combined ingredients (this recipe, plus anything else still pending from Journey 1) against current pantry stock | F4 | **P3** |
| K4 | Grocery list | — | Returns only what's missing. If the pantry is empty or was never scanned, that's the recipe's full ingredient list | F4, NFR7 | **P1, P3** |

---

## Alternate & failure paths (apply to either journey)

| # | Trigger | System behaviour | Traces |
|---|---------|------------------|--------|
| A1 | AI service down or rate-limited at J6 | Shows a plain-language notice, never a raw error | NFR8 |
| A2 | Pantry has nothing to select at J5 | Prompts to scan a receipt first — this gate applies only to J5 (Journey 1 needs pantry items to select from); it does not block Journey 2 | F1 |
| A3 | The receipt scan misreads more than a couple of lines | J4 lets Nan add or fix items manually before saving | F1, F2 |
| A4 | Nan withdraws AI consent later | Generation is disabled; the withdrawal is stored the same way the consent was | LR7 |
| A5 | Nan deletes her account | Pantry, pooled recipes, saved recipes, dietary profile deleted; access logs retained ≥90 days by law | LR3b, LR5 |
| A6 | A generated recipe contains an allergen | Release blocker — NFR6 is 100%, not a target | NFR6 |

## Drop-off risks

| Risk | Where | Mitigation | Traces |
|---|---|---|---|
| **Receipt scan misreads items** — the Charter's stated risk (abbreviated, store-specific names, print quality) | J2–J4 | Low-confidence lines flagged for a quick correction, tested early against real Thai and international receipts | NFR2, NFR3 |
| Pantry goes stale if a cooked meal is never confirmed | J8–J9 | Deduct-on-cooked with a ≤2-tap confirm, so accuracy is a by-product of normal use, not a chore | F2, NFR11 |
| Consent prompt at J5 feels like a scary wall | J5 | Show exactly what is sent (selected ingredients + dietary flags, no identity) instead of a legal blob | LR2 |
| Trust breaks if one recipe ignores an allergy | J6 | NFR6 at 100%, plus the stored generation record so any failure is reproducible | NFR6, LR8 |

## Pain coverage check

- **P1** (forgotten leftovers) → J1, J2, J3, J4, J6, J8, J9, K4
- **P2** (decision fatigue → takeout) → J5, J6, J7, K1
- **P3** (disconnected planning & shopping) → K1, K2, K3, K4
