# Test Plan — Smart Recipe & Pantry Assistant

- Source spec: [20260902-01-pantry-meal-planning.md](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md)
- Backlog: [backlog.md](../01-requirements/backlog.md)
- Feature list: [01-feature-list.md](../02-design/01-feature-list.md)
- User journey: [02-user-journey.md](../02-design/02-user-journey.md)
- Legal source: [rule.md](../../rule.md)

---

## 1. Scope

### In scope
The **one core workflow** (spec §5) end-to-end, and its two entry points:

> Scan a receipt → pantry built automatically → select pantry items → AI
> recipe generated, honouring dietary filters → meal marked cooked and
> leftovers confirmed → grocery list produced from everything still planned,
> minus pantry stock.
>
> Secondary entry: search saved recipes (F7) or pick one from the
> library/favourites → joins the same pending grocery-list pool.

All seven Must functional requirements (F1–F7 / FE1–FE7) and the
cross-cutting compliance layer (FE8 / LR1–LR9) are in scope, because every
Must item in the spec needs evidence it works, not just that it exists.

---

## 2. Test levels (Testing Pyramid + UAT)

| Level | What it covers | Who runs it | When |
|---|---|---|---|
| **Unit** | Receipt line-item normaliser, dietary-filter matcher, grocery-list diff (pantry vs. pooled recipes), SUS/score calculators, log-writer helper | Dev who owns the module | Continuous, before merge |
| **Integration** | Receipt-scan → pantry write; recipe-generation request → AI service → LR2 payload check; cook-confirm → pantry deduction; grocery-list build → pooling (NFR12); consent/Terms gate → acceptance record (LR7); creation/edit/delete → log row (LR4, LR5) | 2 devs (build + review) | Before 28 Oct, re-run before 4 Nov |
| **E2E** | The full core workflow in the running app, both entry points, on a real/emulated phone | 1 dev + 1 note-taker | W11 (4 Nov), before real users arrive |
| **UAT** | Real users performing the 5 tasks in §3.2 end-to-end, think-aloud, no help | Moderator + note-taker (rotating) | 4 Nov 2026 |

Exit from one level into the next requires: no open Severity-4 (catastrophic)
defects, and all NFR thresholds in §3.1 met at least once on the current
build.

---

## 3. Test cases and UAT scenarios

### 3.1 Functional / Integration / Unit test cases

Each case traces to an `F`, `NFR`, or `LR` id from the spec and an `FE`/`AC`
from the feature list. Pass/fail is the stated threshold, not "looks fine."

| # | Case | Level | Steps (summary) | Test data | Expected result | Traces |
|---|---|---|---|---|---|---|
| TC1 | Receipt scan builds pantry | Integration | Upload a photographed receipt → confirm parsed items → save | ≥10 real receipts, Thai + international, incl. abbreviated store names | Pantry gets items+qty with no typing; scan-to-saved ≤ 1 min; ≥85% of line items read correctly; user must confirm before save | F1, NFR2, NFR3, FE1 |
| TC2 | Pantry view/edit at scale | E2E | Load a pantry with 15 items; edit one; delete one | Seeded 15 pantry | List renders <3s; edit/delete persist correctly | NFR9, FE2 |
| TC3 | Dietary opt-in is never on by default | Integration | Create a fresh account; inspect dietary flags before any opt-in | New account | Zero dietary flags set until an explicit opt-in record exists | LR1, FE3-AC2 |
| TC4 | Terms + AI disclaimer gate blocks first generation | Integration | Attempt to generate a recipe before accepting Terms | New account, no acceptance record | Generation is blocked; accepting Terms creates a record (user id, timestamp, version) before generation proceeds | LR7, FE3-AC3/AC5 |
| TC5 | AI-transfer consent is separate from Terms | Integration | Accept Terms only, then attempt generation; then accept AI-transfer consent | Account with Terms accepted, no AI consent | Generation still blocked until the separate AI-transfer consent is recorded | LR2, FE3-AC4 |
| TC6 | Consent withdrawal is recorded | Integration | Withdraw dietary or AI-transfer consent | Account with prior consent | Withdrawal stored with user id, timestamp, version, same as acceptance | LR1, LR7 |
| TC7 | Recipe generation uses only selected pantry items + staples | Integration | Generate 15 recipes from varied pantry selections | 15-generation test set | ≥90% of recipes use only selected items + declared staples (salt, oil, water, pepper) | NFR5, FE4-AC1 |
| TC8 | Generation latency | Integration | Time 15+ generation calls | Same test set | p90 < 10s; progress indicator shows within 1s of tap | NFR4, FE4-AC3 |
| TC9 | AI request payload is minimised | Integration | Capture the outbound request to the AI service | One generation call per filter type | Payload contains only selected ingredient names + dietary flags — no email, name, address, or household id | LR2, FE4-AC4 |
| TC10 | AI outage degrades gracefully | Integration | Force the AI service to fail/rate-limit | Mocked outage | App shows a clear message, never a raw error; app availability tracked ≥99.0%/month | NFR8, FE4-AC6 |
| TC11 | Cook + leftover confirm deducts pantry | E2E | Mark a planned meal cooked; adjust the leftover confirm box; save | A planned meal with known pantry impact | Ingredients deducted correctly; confirm step ≤2 taps and <10s; skipping confirm leaves pantry unchanged | F2, NFR11, FE5 |
| TC12 | Search saved recipes by ingredient | E2E | Search saved recipes using an on-hand ingredient | ≥5 saved recipes, overlapping ingredients | Correct recipes returned | F7, FE6-AC2 |
| TC13 | Edit/delete of recipe is logged and retained | Integration | Edit then delete a saved recipe; attempt to retrieve internally at day 89 | One recipe | Log + original content retrievable ≥90 days post-deletion | LR5, FE6-AC4 |
| TC14 | Grocery list pools automatically, both entry points | Integration | (a) Generate a recipe; (b) separately, pick one from the library | Two sessions, one per entry point | Both join the pending pool with 0 extra taps | F4, NFR12, FE7-AC1 |
| TC15 | Grocery list excludes stocked items | Integration | Build a list from ≥3 pooled recipes against a pantry with partial overlap | ≥10 test grocery lists | 0 items already stocked in sufficient quantity appear on the list | NFR7, FE7-AC2/AC3 |



### 3.2 UAT — task-based sessions with real users

Written as scenarios the user has to solve, not button instructions — the
"trap" the course slide warns against. Same 5 tasks, same order, for every
participant; easy → hard.

| # | Task (as read to the user) | Success criterion | Journey / entry point |
|---|---|---|---|
| T1 | "You just got back from the store with a receipt. Get those items into the app." | Items + quantities appear in the pantry with no typing, in under 1 minute; user confirms before saving (F1, NFR2, NFR3) | Journey 1 start |
| T2 | "You have a few things sitting in your fridge you want to use up before they go bad. Get a recipe out of what you already have." | A recipe is generated from only the items selected (+staples), honouring any dietary filter set earlier (F3, F6) | Journey 1 |
| T3 | "You just finished cooking that meal. Let the app know what's left." | Marked cooked, pantry deducted, leftovers confirmed in ≤2 taps / <10s (F2, NFR11) | Journey 1 |
| T4 | "You're about to go shopping for what you're missing for the meals you've planned. Pull up what you need." | Grocery list shown; contains none of what's already stocked (F4, NFR7) | Journey 1 end |
| T5 | "You remember saving a recipe before that used something you have right now. Find it and get it ready to shop for." | Search by ingredient returns the right recipe; selecting it joins the grocery-list pool automatically, no scan or generation needed (F7, F4, NFR12) | Journey 2 (secondary entry) |

**Session structure** (~30 min/user), per the course's run-of-session guide:
Intro + consent (3') → baseline "old way" for T1/T4 (5') → T1–T5 with
think-aloud (10–15') → questionnaires if used (3–6') → 3-question interview
(5'). One pilot session is run first and is not counted toward the ≥10.

**Baseline ("before") capture:** T1's before-time is manual receipt
reading/typing into a notes app; T4's before-time is writing the grocery
list from memory with no pantry visibility. These feed the required
before/after task metric (§4).

---

## 4. Metrics (required + optional)

### Required — task performance (P4 Impact evidence)
For every task T1–T5, per user: **success (pass/fail against the criterion
above)**, **time on task**, **errors**, and **before vs. after time** where a
baseline exists (T1, T4). Entered into one spreadsheet row per user (U01…),
same day as the session.

### Optional — choose none, one, or several (team decision)
- **SUS** (System Usability Scale, 10 items) immediately after the tasks —
  gives a single 0–100 usability score per user, compared against the
  benchmark of 68.
- **TAM** (3 constructs: PU, PEOU, BI) — fits a workplace-style tool used by
  choice for a task.
- **UTAUT2** (pick relevant constructs, always include BI) — fits a
  consumer app adopted voluntarily.
- Pick **at most one** of TAM/UTAUT2, never both; report mean ± SD per
  construct, no causal claims.

**If the team uses none of SUS/TAM/UTAUT2**, this Test Plan substitutes the
required method/procedure/results/evidence write-up (per the course's
"no standard instrument" format) — the team must decide this before 4 Nov so
the questionnaire packet (if any) is printed/loaded in advance.

> **Team decision needed:** which of the three optional instruments (if any)
> to run. This Test Plan assumes **none selected yet** — fill in before 28
> Oct so sessions on 4 Nov include the right paperwork.

---

## 5. Real users

- **Who:** people who actually cook for themselves 4+ times a week (the
  spec's primary persona) and, if available, a budget-conscious
  student/secondary persona — not classmates standing in for users.
- **How many:** target **5 users per round**, run two rounds —
  **test 5 → fix the critical issues → test 5 more** — to reach **≥10
  sessions** total and get before/after-fix evidence, per Nielsen (2000).
- **Consent:** PDPA-informed consent obtained before each session; separate
  permission asked before any audio/video recording. Participants are coded
  **U01, U02…**, never named, in any record kept.
- **Roles per session:** one **Moderator** (runs the tasks, never helps or
  points) and one **Note-taker** (times, records, logs quotes/issues).

---


