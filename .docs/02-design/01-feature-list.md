# Feature List — Smart Recipe & Pantry Assistant

- Date: 2026-09-02 (W4, DISCOVER)
- Source spec: [20260902-01-pantry-meal-planning.md](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md)
- Backlog: [backlog.md](../01-requirements/backlog.md)
- Feature grouping matches the Project Proposal v1.1 (FE1–FE8).

Requirements say *what a user wants*; this list says *what gets built*. A
feature is Must if it contains any Must `F` item. Acceptance criteria are
written so a tester can pass/fail them.

---

## FE1 — Receipt Scanning & Pantry Intake · **Must**

Covers **F1** · relieves **P1**

| # | Acceptance criteria |
|---|---|
| AC1 | Scanning a grocery receipt adds its items and quantities to the pantry with no manual typing (F1) |
| AC2 | A full receipt is scanned and added to the pantry in under 1 minute (NFR2) |
| AC3 | ≥ 85% of line items are read correctly across a ≥ 30-receipt test set spanning Thai and international formats; the user confirms all items before saving (NFR3) |
| AC4 | The pantry list renders in under 3 seconds for 200 items (NFR9) |

## FE2 — Pantry Management · **Must**

Covers **F2** · relieves **P1**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can see current pantry items and quantities, and edit or delete any item |
| AC2 | The pantry list renders in under 3 seconds for 200 items (NFR9) |

## FE3 — Dietary Profile & Consent Gate · **Must**

Covers **F6** · implements **LR1, LR2, LR7** · relieves **P2**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can save dietary filters (vegetarian, gluten-free, low-carb, allergies) |
| AC2 | A new account has **no** dietary flag set until an explicit opt-in record exists (LR1) |
| AC3 | Terms + AI & Food Safety Disclaimer must be accepted before the first generation |
| AC4 | Consent for sending pantry data to the AI service is separate from Terms acceptance (LR2) |
| AC5 | Each acceptance and each withdrawal is stored with user id, timestamp, version (LR7) |
| AC6 | Dietary filters are editable and deletable by the user (LR1) |

## FE4 — AI Recipe Generation · **Must**

Covers **F3** · implements **LR2, LR8** · relieves **P1, P2**

| # | Acceptance criteria |
|---|---|
| AC1 | A generated recipe uses only the pantry items the user selected plus a declared staples list (salt, oil, water, pepper) in ≥ 90% of a 50-generation test set (NFR5) |
| AC2 | **100%** of generations contain zero ingredients excluded by the saved dietary filters — any violation blocks release (NFR6) |
| AC3 | A recipe returns in under 10 seconds at p90 (NFR4) |
| AC4 | The outbound request carries selected ingredients + dietary flags only — no email, name, or address (LR2) |
| AC5 | Every generation stores its text, model version, pantry snapshot, filters, timestamp, and can be deleted (LR8) |
| AC6 | The app stays available ≥ 99.0% of the month; when the AI service fails or is rate-limited, the app shows a clear message, never a raw error (NFR8) |

## FE5 — Cooked & Leftover Confirmation · **Must**

Covers **F2** · relieves **P1**

| # | Acceptance criteria |
|---|---|
| AC1 | Marking a planned meal "cooked" deducts its ingredient quantities from the pantry |
| AC2 | The removed items are shown in a confirmation box the user can adjust |
| AC3 | Confirming what's left over takes ≤ 2 taps and under 10 seconds (NFR11) |
| AC4 | If the user does not confirm, the pantry is left unchanged rather than guessed |

## FE6 — Recipe Library · **Must**

Covers **F5, F7** · implements **LR4, LR5** · relieves **P2, P3**

| # | Acceptance criteria |
|---|---|
| AC1 | A user can save an AI-generated recipe and reopen it later without regenerating (F5) |
| AC2 | A user can search saved recipes by an ingredient they have (F7) |
| AC3 | Saving logs account id + IP + timestamp separately from the content (LR4) |
| AC4 | Editing or deleting a recipe is logged and the original is kept ≥ 90 days (LR5) |

## FE7 — Auto Grocery List · **Must**

Covers **F4** · relieves **P3**

| # | Acceptance criteria |
|---|---|
| AC1 | Generating a recipe (Journey 1) or selecting one from the library/favourites (Journey 2) joins the pending grocery-list pool automatically — no separate "add" tap (F4, NFR12) |
| AC2 | Building the list combines ingredients across every not-yet-cooked recipe in the pool and compares the combined total against the pantry, adding only what's missing (F4) |
| AC3 | The list contains **0** items already stocked in sufficient quantity, across ≥ 20 test grocery lists (NFR7) |
| AC4 | Each list generation is stored as a retrievable record (LR8) |

## FE8 — Compliance & Audit Layer · **Must** *(cross-cutting)*

Implements **LR3, LR4, LR5, LR6, LR9** · no single screen — it sits behind every feature

| # | Acceptance criteria |
|---|---|
| AC1 | Create / edit / delete on any user content writes account id + IP + timestamp to a log store separate from the content (LR4, LR5) |
| AC2 | Logs are retained ≥ 90 days by explicit configuration, not cloud defaults (NFR10) |
| AC3 | A record can be flagged for extended retention up to 1 year without altering its content; the purge job skips it (LR6) |
| AC4 | Account deletion removes pantry, planned meals, recipes, and dietary profile — logs excepted (LR3b) |
| AC5 | Login stores a verification token only, never a provider credential (LR3c) |
| AC6 | No "certified" or "nutritionist-approved" copy appears anywhere in the UI (LR9) |

---

## Not built this phase

| Excluded | Source |
|---|---|
| Day-by-day / weekly-calendar meal assignment | Charter §5 — not a listed feature; planned meals stay a flat list |
| Any licensed Certification Authority integration | LR9 |

## Month-2 BUILD commitment

**FE1 → FE2 → FE3 → FE4 → FE5 → FE6(AC1) → FE7**, with FE8 running behind them.
That chain is the one core workflow. Everything else waits.
