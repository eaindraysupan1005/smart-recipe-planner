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

Each task below is written as a test case using the team's test case
template (Scenario ID / Case ID / Description / Priority / Pre-Requisite /
Post-Requisite, then step-by-step Action / Inputs / Expected Output / Actual
Output / Test Device / Test Result / Test Comments). The **moderator reads
only the scenario line** to the user — never the Action/Inputs steps —
and never helps or points; the note-taker fills in **Actual Output**, **Test
Result** (Pass/Fail) and **Test Comments** live during the session, per task,
per user (duplicate each block once per participant, U01…).

#### T1 — Receipt scan builds the pantry

| Test Scenario ID | Test Case ID | Test Case Description | Test Priority | Pre-Requisite | Post-Requisite | Target Completion Time |
|---|---|---|---|---|---|---|
| UAT-T1 | UAT-T1A | "You just got back from the store with a receipt. Get those items into the app." | High | Logged-in account; a real/photographed grocery receipt | Pantry holds the scanned items, ready for T2 | ≤ 1 min (scan to saved) |

| S.No | Action | Inputs | Expected Output | Actual Output | Test Device | Test Result | Test Comments |
|---|---|---|---|---|---|---|---|
| 1 | Open the receipt scanner | Logged-in account | Scanner camera/upload screen opens | | | | |
| 2 | Photograph or upload the receipt | Receipt (Thai or international format, incl. abbreviated names) | Items + quantities are parsed and listed for review | | | | |
| 3 | Review the parsed list and correct any misread item | User corrections, if any | List accurately reflects the receipt; ≥85% of line items read correctly before any correction | | | | |
| 4 | Confirm and save | Confirm tap | Pantry shows all items + quantities with **zero manual typing**, total time ≤ 1 min (F1, NFR2, NFR3) | | | | |

**Pass:** all 4 steps succeed as expected above. **Fail:** any item typed in manually instead of corrected from the scan; save completes with no confirm step; total time > 1 min; <85% of line items read correctly.

#### T2 — AI recipe generation from selected pantry items

| Test Scenario ID | Test Case ID | Test Case Description | Test Priority | Pre-Requisite | Post-Requisite | Target Completion Time |
|---|---|---|---|---|---|---|
| UAT-T2 | UAT-T2A | "You have a few things sitting in your fridge you want to use up before they go bad. Get a recipe out of what you already have." | High | Pantry has items from T1; Terms + AI consent already accepted; dietary filter (if any) already saved | Recipe available for T3 | ≤ 10 s generation (p90); progress shown ≤ 1 s after tap |

| S.No | Action | Inputs | Expected Output | Actual Output | Test Device | Test Result | Test Comments |
|---|---|---|---|---|---|---|---|
| 1 | Select 2–4 pantry items to use | Pantry item selection | Selection is reflected on screen | | | | |
| 2 | Tap generate | Generate tap | Progress indicator appears within 1 s | | | | |
| 3 | Wait for the result | — | Recipe returned within 10 s (p90) (NFR4) | | | | |
| 4 | Read the generated recipe's ingredient list | — | Uses only the selected items + declared staples (salt, oil, water, pepper) (NFR5); zero ingredients violate the saved dietary filter (NFR6) (F3, F6) | | | | |

**Pass:** all 4 steps succeed as expected above. **Fail:** recipe contains an item not selected and not a staple; recipe contains a dietary-filter violation (automatic fail, release blocker); no progress shown within 1 s; generation takes > 10 s.

#### T3 — Cook & leftover confirmation

| Test Scenario ID | Test Case ID | Test Case Description | Test Priority | Pre-Requisite | Post-Requisite | Target Completion Time |
|---|---|---|---|---|---|---|
| UAT-T3 | UAT-T3A | "You just finished cooking that meal. Let the app know what's left." | High | A planned meal exists (from T2) with known pantry impact | Pantry reflects actual leftovers, ready for T4 | ≤ 2 taps, < 10 s |

| S.No | Action | Inputs | Expected Output | Actual Output | Test Device | Test Result | Test Comments |
|---|---|---|---|---|---|---|---|
| 1 | Tap "mark cooked" on the planned meal | Mark-cooked tap | Leftover-confirm box opens | | | | |
| 2 | Review the box and adjust quantities if needed | Leftover quantities | Box reflects the user's actual leftovers | | | | |
| 3 | Confirm | Confirm tap | Pantry quantities deducted correctly; done in ≤2 taps and <10s total (F2, NFR11) | | | | |

**Pass:** all 3 steps succeed as expected above. **Fail:** pantry deducts the wrong amount; confirm takes >2 taps or ≥10s; pantry is changed without the user confirming.

#### T4 — Auto grocery list

| Test Scenario ID | Test Case ID | Test Case Description | Test Priority | Pre-Requisite | Post-Requisite | Target Completion Time |
|---|---|---|---|---|---|---|
| UAT-T4 | UAT-T4A | "You're about to go shopping for what you're missing for the meals you've planned. Pull up what you need." | High | At least one not-yet-cooked recipe pooled; pantry reflects T1/T3 state | — | List renders < 3 s |

| S.No | Action | Inputs | Expected Output | Actual Output | Test Device | Test Result | Test Comments |
|---|---|---|---|---|---|---|---|
| 1 | Open the grocery list | — | List renders in < 3 s (NFR9) | | | | |
| 2 | Scan the list against known pantry stock | — | List contains **zero** items already stocked in sufficient quantity (F4, NFR7) | | | | |

**Pass:** both steps succeed as expected above. **Fail:** list takes ≥3s to render; list includes ≥1 item already adequately stocked.

#### T5 — Search saved recipes (secondary entry point)

| Test Scenario ID | Test Case ID | Test Case Description | Test Priority | Pre-Requisite | Post-Requisite | Target Completion Time |
|---|---|---|---|---|---|---|
| UAT-T5 | UAT-T5A | "You remember saving a recipe before that used something you have right now. Find it and get it ready to shop for." | Medium | ≥1 recipe already saved from a prior session, using a known ingredient | Recipe joins the pending grocery-list pool | No fixed ceiling — record actual time; pooling itself must be 0 extra taps |

| S.No | Action | Inputs | Expected Output | Actual Output | Test Device | Test Result | Test Comments |
|---|---|---|---|---|---|---|---|
| 1 | Search saved recipes by a named ingredient | Ingredient name | Correct matching recipe(s) returned (F7) | | | | |
| 2 | Open and select the matching recipe | Selection tap | Recipe opens; no further "add to plan" tap needed | | | | |
| 3 | Check the grocery-list pool | — | Pool now includes this recipe automatically, 0 extra taps (F4, NFR12) | | | | |

**Pass:** all 3 steps succeed as expected above. **Fail:** search misses the correct recipe or returns wrong matches; an extra manual step is needed to pool it.

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

### System Usability Scale (SUS)
The team is using **SUS** as the usability
instrument. SUS is not selected to "prove" the task-performance evidence
above — it answers a different question (*how easy did it feel?* vs. *did it
actually work?*) and gives us a standard, comparable number for the final
write-up.

**When it's given:** immediately after the 5 tasks (T1–T5), before the
3-question interview — per the session structure in §3.2.

**The 10 items** (Likert 1–5, strongly disagree → strongly agree; "system"
replaced with the product name):
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to
   use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very
   quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this
    system.

Items are read/given exactly as above — no dropping, no rewording beyond the
product name.

**Scoring (per user):**
- Odd items (1, 3, 5, 7, 9): score − 1
- Even items (2, 4, 6, 8, 10): 5 − score
- Sum all 10, × 2.5 → a 0–100 score for that user

**Reporting (across users):**
- Report the **mean and SD** across all ≥10 sessions — not a per-item
  breakdown, not a percentage.
- Compare the mean against the **benchmark of 68** (Sauro & Lewis):
  ≥80.8 = A (excellent), 68 = average (C), <51.7 = F (needs fixing).
- Plot per-user scores as a bar chart with a line at the 68 benchmark and a
  line at the team's mean, for the final presentation (P4 Impact Metrics).

**Analysis note:** a low SUS score next to a specific task's failures (e.g.,
T3's leftover-confirm step) is the evidence that links a usability problem to
a fix, per the course's "insight → fix" format — not the SUS number alone.

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


