# Feature List — Smart Recipe Planner & Pantry Manager

- Date: 2026-09-02 (W4, DISCOVER)
- Source spec: [20260902-01-pantry-meal-planning.md](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md)
- Backlog: [backlog.md](../01-requirements/backlog.md)

Requirements say *what a user wants*; this list says *what gets built*. A
feature is Must if it contains any Must `F` item. Acceptance criteria are
written so a tester can pass/fail them.

---

## FE1 — Pantry Management · **Must**

Covers **F1, F2, F12** (+ F9 in FE5) · relieves **P1**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can save a pantry item with name, quantity, and expiry date in ≤ 3 fields (NFR2) |
| AC2 | Adding one item takes under 15 seconds; 20 items under 6 minutes (NFR2) |
| AC3 | The pantry list is sorted with the nearest expiry date first, by default |
| AC4 | Items expiring within 3 days are visually marked as "expiring soon" |
| AC5 | A user can edit or delete any pantry item (F12) |
| AC6 | The pantry list renders in under 3 seconds for 200 items (NFR9) |

## FE2 — Dietary Profile & Consent Gate · **Must**

Covers **F4, F8** · implements **LR1, LR2, LR7** · relieves **P2**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can save dietary filters (vegetarian, gluten-free, low-carb, allergies) |
| AC2 | A new account has **no** dietary flag set until an explicit opt-in record exists (LR1) |
| AC3 | Terms + AI & Food Safety Disclaimer must be accepted before the first generation (F8) |
| AC4 | Consent for sending pantry data to the AI service is separate from Terms acceptance (LR2) |
| AC5 | Each acceptance and each withdrawal is stored with user id, timestamp, version (LR7) |
| AC6 | Dietary filters are editable and deletable by the user (LR1) |

## FE3 — AI Recipe Generation · **Must**

Covers **F3** · implements **LR2, LR8** · relieves **P1, P2**

| # | Acceptance criteria |
|---|---|
| AC1 | A generated recipe uses only pantry items plus a declared staples list (salt, oil, water, pepper) in ≥ 90% of a 50-generation test set (NFR4) |
| AC2 | ≥ 80% of generations include an item expiring within 3 days when one exists (NFR4) |
| AC3 | **100%** of generations contain zero ingredients excluded by the saved dietary filters — any violation blocks release (NFR5) |
| AC4 | A recipe returns in under 10 seconds at p90; progress shows within 1 second (NFR3) |
| AC5 | The outbound request carries ingredients + dietary flags only — no email, name, or address (LR2) |
| AC6 | Every generation stores its text, model version, pantry snapshot, filters, timestamp (LR8) |
| AC7 | Generation is capped server-side at 30 per user per month on the free tier (NFR8) |

## FE4 — Recipe Library · **Must**

Covers **F7** (Must) + **F10, F11** (Should) · implements **LR4, LR5** · relieves **P2, P3**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can save an AI-generated recipe and reopen it later without regenerating (F7) |
| AC2 | A user can write a recipe manually into a form (F11) |
| AC3 | A user can search saved recipes by an ingredient they have (F10) |
| AC4 | Saving logs account id + IP + timestamp separately from the content (LR4) |
| AC5 | Editing or deleting a recipe is logged and the original is kept ≥ 90 days (LR5) |

## FE5 — Weekly Meal Planner · **Must**

Covers **F5** (Must) + **F9, F12** (Should) · relieves **P2, P3**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can assign a saved or generated recipe to a specific day of the week (F5) |
| AC2 | The weekly plan renders in under 3 seconds (NFR9) |
| AC3 | Marking a planned meal "cooked" deducts its ingredient quantities from the pantry (F9) |
| AC4 | A user can change or remove any planned meal (F12) |
| AC5 | "Meal plan saved" is stored as a retrievable confirmation record, not a transient toast (LR8) |

## FE6 — Auto Grocery List · **Must**

Covers **F6** · relieves **P1, P3**

| # | Acceptance criteria |
|---|---|
| AC1 | The list is generated from the planned week minus current pantry stock (F6) |
| AC2 | The list contains **0** items already stocked in sufficient quantity, across ≥ 20 test plans (NFR6) |
| AC3 | "Grocery list generated" is stored as a retrievable record (LR8) |

## FE7 — Compliance & Audit Layer · **Must** *(cross-cutting)*

Implements **LR3, LR4, LR5, LR6, LR9** · no single screen — it sits behind every feature

| # | Acceptance criteria |
|---|---|
| AC1 | Create / edit / delete on any user content writes account id + IP + timestamp to a log store separate from the content (LR4, LR5) |
| AC2 | Logs are retained ≥ 90 days by explicit configuration, not cloud defaults (NFR10) |
| AC3 | A record can be flagged for extended retention up to 1 year without altering its content; the purge job skips it (LR6) |
| AC4 | Account deletion removes pantry, plan, recipes, and dietary profile — logs excepted (LR3b) |
| AC5 | Login stores a verification token only, never a provider credential (LR3c) |
| AC6 | No "certified" or "nutritionist-approved" copy appears anywhere in the UI (LR9) |

---

## Not built this phase

| Excluded | Source |
|---|---|
| Any licensed Certification Authority integration | LR9 |

## Month-2 BUILD commitment

**FE1 → FE2 → FE3 → FE4(AC1) → FE5(AC1) → FE6**, with FE7 running behind them.
That chain is the one core workflow. Everything else waits.
