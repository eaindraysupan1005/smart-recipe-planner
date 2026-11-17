# Comparison Table — Smart Recipe & Pantry Assistant (What2Cook)

**Before** = Round 1 real-user UAT (U01–U08). **After** = Round 2 real-user UAT (U09–U16), run after the Round 1 fixes. Same five tasks, same step-level pass/fail rules, same targets, 8 different users per round. Full detail: [05-before-after.md](../03-testing/05-before-after.md).

> Small samples (8 users per round): read the changes as indicative, not statistically proven. Different people took part in each round.

## 1. Must tasks (user-measured)

| Item | Before | After | Change | Measured with | Evidence |
|---|---|---|---|---|---|
| T1 Receipt scan → pantry (F1) — pass rate | 4/8 (50%) | 8/8 (100%) | +50 pts | UAT task T1, stopwatch + step pass/fail | [R1 log](../03-testing/03-uat-session-logs-round1.md) · [R2 log](../03-testing/04-uat-session-logs-round2.md) |
| T1 — median time to saved pantry (target ≤ 60 s) | 54.5 s | 12.4 s | −77% | Stopwatch, started at task prompt | [05-before-after.md](../03-testing/05-before-after.md) §2 |
| T3 Cook & confirm leftovers (F2) — pass rate | 6/8 (75%) | 8/8 (100%) | +25 pts | UAT task T3 | R1 / R2 logs |
| T3 — median time (target ≤ 2 taps, < 10 s) | 8.9 s | 3.1 s | −65% | Stopwatch + tap count | [05-before-after.md](../03-testing/05-before-after.md) §2 |
| T4 Auto grocery list (F4) — pass rate | 6/8 (75%) | 8/8 (100%) | +25 pts | UAT task T4 | R1 / R2 logs |
| T4 — median render time (target < 3 s) | 2 s | 1.1 s | −45% | Stopwatch | [05-before-after.md](../03-testing/05-before-after.md) §2 |
| T5 Search saved recipe + pooling (F7) — pass rate | 5/8 (62.5%) | 8/8 (100%) | +37.5 pts | UAT task T5 | R1 / R2 logs |
| T5 — median time (no ceiling, actual recorded) | 7.5 s | 2.4 s | −68% | Stopwatch | [05-before-after.md](../03-testing/05-before-after.md) §2 |

## 2. AI row (F3 AI recipe, F6 dietary filters; receipt reading also uses AI vision)

| Item | Before | After | Change | Measured with | Evidence |
|---|---|---|---|---|---|
| **T2 AI recipe — pass rate** | 2/8 (25%) | 8/8 (100%) | +75 pts | UAT task T2: progress ≤ 1 s, recipe ≤ 10 s, only selected items + staples, 0 dietary violations | R1 / R2 logs |
| AI recipe generation — median time (target ≤ 10 s) | 14.1 s | 8.4 s | −40% | Stopwatch on the real app | [05-before-after.md](../03-testing/05-before-after.md) §2 |
| Users whose recipe arrived within 10 s | 3/8 | 8/8 | +5 users | Derived from recorded times | [05-before-after.md](../03-testing/05-before-after.md) §2 |
| Users shown a recipe with ingredients outside pantry + staples | 2/8 (U01, U06) | 0/8 | −2 users | T2 step 4 | [R1 log U01](../03-testing/03-uat-session-logs-round1.md) · [R1 log U06](../03-testing/03-uat-session-logs-round1.md) · [R2 log](../03-testing/04-uat-session-logs-round2.md) |
| Dietary-filter violations observed | 0 recorded | 0 recorded | no change | T2 step 4 ("0 dietary violations"; filters used incl. no-pork, vegetarian, peanut allergy) | R1 U05–U07 · R2 step tables |

Notes on the AI row: U03's Round 1 T2 step table is missing from the record (its T2 task passed). The dietary-filter result is a count of violations seen in 16 sessions, not an exhaustive safety evaluation — see [ai-logic.md](ai-logic.md) for what is and is not proven.

## 3. Quality and satisfaction

| Item | Before | After | Change | Measured with | Evidence |
|---|---|---|---|---|---|
| Task attempts passed (5 tasks × 8 users) | 23/40 (57.5%) | 40/40 (100%) | +42.5 pts | UAT pass/fail | [05-before-after.md](../03-testing/05-before-after.md) §1 |
| Users who passed all 5 tasks | 0/8 | 8/8 | +8 users | UAT pass/fail | R1 / R2 logs |
| Issues observed (all severities) | 24 | 0 | −24 | Note-taker issue tables | [07-issue-log.md](../03-testing/07-issue-log.md) |
| Severity-3 (major) issues | 13 | 0 | −13 | Note-taker severity ratings | [07-issue-log.md](../03-testing/07-issue-log.md) |
| Severity-4 (catastrophic) issues | 0 | 0 | no change | Note-taker severity ratings | [07-issue-log.md](../03-testing/07-issue-log.md) |
| Usability (SUS, 0–100) | — (measured once, no before score) | 71.3 mean, 72.5 median, n = 16 | +3.3 above the 68 benchmark | SUS questionnaire (10 items) | [06-sus.md](../03-testing/06-sus.md) |

## 4. Not measured

| Item | Status |
|---|---|
| Household food waste reduction (Charter goal ≥ 20%) | **Not measured.** The UAT tested task performance, not weeks of real cooking at home. No number is claimed. |
| Weekly grocery cost reduction (Charter goal ≥ 10%) | **Not measured.** Same reason. |

These two Charter metrics would need a multi-week before/after study with real households; none was run.
