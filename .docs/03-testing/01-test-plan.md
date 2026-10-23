# Test Plan — Smart Recipe & Pantry Assistant

- Date: 2026-10-23
- Due: before Wed 28 Oct 2026, one per team
- Source spec: [20260902-01-pantry-meal-planning.md](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md)
- Backlog: [backlog.md](../01-requirements/backlog.md)
- Feature list: [01-feature-list.md](../02-design/01-feature-list.md)
- User journey: [02-user-journey.md](../02-design/02-user-journey.md)
- Legal source: [rule.md](../../rule.md)
- Field testing date: Wed 4 Nov 2026 (W12)
- **AI-use disclosure:** AI was used to draft the test case table and UAT task
  wording from the requirement spec and feature list below. The team reviewed
  and must confirm every case against the actual build before testing on 4 Nov,
  and record any edits made.

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

### Out of scope for this round
- Everything in the backlog's **Won't** tier (B18–B25): weekly-calendar
  planning, generation caps, nutrition/cost tracking, retailer integrations,
  shared pantries, native apps, a self-hosted model, certification claims.
- Load/stress testing beyond the stated NFR9 (200-item render) and NFR8
  (99.0% availability) thresholds — no dedicated performance rig this round.
- Security/penetration testing — covered separately by the 31 Oct guest
  lecture track, not by this Test Plan.
- Full localisation beyond the Thai/international receipt formats already
  covered by NFR3.

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
| TC1 | Receipt scan builds pantry | Integration | Upload a photographed receipt → confirm parsed items → save | ≥30 real receipts, Thai + international, incl. abbreviated store names | Pantry gets items+qty with no typing; scan-to-saved ≤ 1 min; ≥85% of line items read correctly; user must confirm before save | F1, NFR2, NFR3, FE1 |
| TC2 | Pantry view/edit at scale | E2E | Load a pantry with 200 items; edit one; delete one | Seeded 200-row pantry | List renders <3s; edit/delete persist correctly | NFR9, FE2 |
| TC3 | Dietary opt-in is never on by default | Integration | Create a fresh account; inspect dietary flags before any opt-in | New account | Zero dietary flags set until an explicit opt-in record exists | LR1, FE3-AC2 |
| TC4 | Terms + AI disclaimer gate blocks first generation | Integration | Attempt to generate a recipe before accepting Terms | New account, no acceptance record | Generation is blocked; accepting Terms creates a record (user id, timestamp, version) before generation proceeds | LR7, FE3-AC3/AC5 |
| TC5 | AI-transfer consent is separate from Terms | Integration | Accept Terms only, then attempt generation; then accept AI-transfer consent | Account with Terms accepted, no AI consent | Generation still blocked until the separate AI-transfer consent is recorded | LR2, FE3-AC4 |
| TC6 | Consent withdrawal is recorded | Integration | Withdraw dietary or AI-transfer consent | Account with prior consent | Withdrawal stored with user id, timestamp, version, same as acceptance | LR1, LR7 |
| TC7 | Recipe generation uses only selected pantry items + staples | Integration | Generate 50 recipes from varied pantry selections | 50-generation test set | ≥90% of recipes use only selected items + declared staples (salt, oil, water, pepper) | NFR5, FE4-AC1 |
| TC8 | Recipe generation never violates dietary filters | Integration | Generate recipes for accounts with each filter type (vegetarian, gluten-free, low-carb, allergy) | Same 50-generation test set, filtered subsets | 100% contain zero excluded ingredients; any violation is logged as a release blocker | NFR6, FE4-AC2 |
| TC9 | Generation latency | Integration | Time 50+ generation calls | Same test set | p90 < 10s; progress indicator shows within 1s of tap | NFR4, FE4-AC3 |
| TC10 | AI request payload is minimised | Integration | Capture the outbound request to the AI service | One generation call per filter type | Payload contains only selected ingredient names + dietary flags — no email, name, address, or household id | LR2, FE4-AC4 |
| TC11 | AI output is reproducible | Integration | Fetch a past generation by its id | Any saved recipe id | Returns exact text, model+version, pantry snapshot, filters, timestamp | LR8, FE4-AC5 |
| TC12 | AI outage degrades gracefully | Integration | Force the AI service to fail/rate-limit | Mocked outage | App shows a clear message, never a raw error; app availability tracked ≥99.0%/month | NFR8, FE4-AC6 |
| TC13 | Cook + leftover confirm deducts pantry | E2E | Mark a planned meal cooked; adjust the leftover confirm box; save | A planned meal with known pantry impact | Ingredients deducted correctly; confirm step ≤2 taps and <10s; skipping confirm leaves pantry unchanged | F2, NFR11, FE5 |
| TC14 | Save and reopen a recipe | E2E | Save a generated recipe; navigate away; reopen it | One generated recipe | Recipe reopens without regenerating; save event logged (account id, IP, timestamp) | F5, LR4, FE6-AC1/AC3 |
| TC15 | Search saved recipes by ingredient | E2E | Search saved recipes using an on-hand ingredient | ≥5 saved recipes, overlapping ingredients | Correct recipes returned | F7, FE6-AC2 |
| TC16 | Edit/delete of recipe is logged and retained | Integration | Edit then delete a saved recipe; attempt to retrieve internally at day 89 | One recipe | Log + original content retrievable ≥90 days post-deletion | LR5, FE6-AC4 |
| TC17 | Grocery list pools automatically, both entry points | Integration | (a) Generate a recipe; (b) separately, pick one from the library | Two sessions, one per entry point | Both join the pending pool with 0 extra taps | F4, NFR12, FE7-AC1 |
| TC18 | Grocery list excludes stocked items | Integration | Build a list from ≥3 pooled recipes against a pantry with partial overlap | ≥20 test grocery lists | 0 items already stocked in sufficient quantity appear on the list | NFR7, FE7-AC2/AC3 |
| TC19 | Grocery list generation is a retrievable record | Integration | Build a list; fetch the generation event later | One list build | Stored as a retrievable record, not a transient notice | LR8, FE7-AC4 |
| TC20 | Extended-retention hold doesn't alter content | Integration | Flag a record for hold; run the purge job | One recipe past normal retention | Content unchanged; purge job skips it | LR6, FE8-AC3 |
| TC21 | Account deletion removes user content, not logs | Integration | Delete a test account | Account with pantry, meals, recipes, dietary profile | All of those removed; CCA §26 logs still present per LR5/LR6 | LR3b, FE8-AC4 |
| TC22 | Login stores a token, never a credential | Integration | Inspect the stored record after social/email login | One login session | Only a verification token is stored | LR3c, FE8-AC5 |
| TC23 | No certification language in the UI | Manual UI scan | Scan all UI copy for "certified"/"nutritionist-approved"/CA-signature wording | Full UI copy | Zero matches | LR9, FE8-AC6 |

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

## 6. Schedule, owners, exit criteria

### Schedule
| Date | Activity |
|---|---|
| 21–27 Oct | Write/finalise this Test Plan; recruit and book real users for 4 Nov; decide on optional instruments (§4) |
| Before 28 Oct | Submit Test Plan |
| 28 Oct – 3 Nov | Finish Unit/Integration cases (TC1–TC23); run one internal E2E pass; run the pilot UAT session |
| 4 Nov | Field testing: round 1 (5 users) → triage/fix critical issues same day if feasible → round 2 (5 users) |
| 5–10 Nov | Score data, write up P3 (User Evidence Log) and P4 (Impact Metrics), prep final slides/demo |
| 11 or 18 Nov | Final presentation |

### Owners
_(fill in per team member before submission)_

| Area | Owner |
|---|---|
| Unit/Integration test cases (TC1–TC23) | `[name]` |
| E2E pass before 4 Nov | `[name]` |
| User recruitment & scheduling | `[name]` |
| Moderator (4 Nov) | `[name]` |
| Note-taker / data entry (4 Nov) | `[name]` |
| Write-up (P3/P4, this Test Plan's upkeep) | `[name]` |

### Exit criteria
- All TC1–TC23 pass at their stated threshold (no NFR/LR case left failing).
- Zero dietary-filter violations (NFR6) and zero certification-language hits
  (LR9) — both are release blockers, not "known issues."
- ≥10 real UAT sessions completed (pilot excluded), each logged U01…U10+.
- Every Severity-3/4 issue found in round 1 has an attempted fix verified in
  round 2, or is explicitly carried to the final write-up as unresolved.
- Raw evidence (consent forms, spreadsheet, photos/video if permitted) kept
  available for the instructor to verify — nothing fabricated.

---

## Submission

Submit via: `[add submission channel]`, one per team, before Wed 28 Oct 2026.
