# Issue Log

Issues observed in the real-user UAT sessions, with severity as rated by the note-taker. Severity scale: 1 cosmetic · 2 minor · 3 major · 4 catastrophic (blocks release). A dietary-filter violation in T2 would be an automatic Severity 4; none was recorded.

**Source:** the *Issues found* tables in [03-uat-session-logs-round1.md](03-uat-session-logs-round1.md) and [04-uat-session-logs-round2.md](04-uat-session-logs-round2.md).

## Summary

| | Round 1 (U01–U08) | Round 2 (U09–U16) |
|---|---|---|
| Issue observations recorded | 24 | 0 ("None observed" for all 8 users) |
| Severity 4 | 0 | 0 |
| Severity 3 | 13 | 0 |
| Severity 2 | 9 | 0 |
| Severity 1 | 2 | 0 |

## 1. Log (grouped by symptom)

The 24 individual observations from Round 1 are grouped below by identical symptom into 16 issues. **The grouping and the IDs (ISS-01…) were assigned when compiling this log; severities are the note-takers' original per-observation values** (the highest is shown as *Max sev*). Where several users hit the same issue, each user's own severity is listed.

| ID | Issue | Task | Seen by (user · step · severity) | Max sev | Retest evidence from Round 2 (same task step) | Fix commit | Status |
|---|---|---|---|---|---|---|---|
| ISS-01 | Receipt reader fails or stalls ("Try again" error / reading stalled up to 115 s) | T1 | U01 · T1 / step 3 · 3; U04 · T1 / step 2 · 3 | 3 | T1 steps 2–4 passed for 8/8 users in R2 (times 4.4–52 s); no error or stall recorded | _TBD_ | _TBD_ |
| ISS-02 | Scan-to-saved took 101 s; user needed 2 wrong taps to find the upload option | T1 | U03 · T1 / step 4 · 3 | 3 | T1 step 4 passed for 8/8 in R2 | _TBD_ | _TBD_ |
| ISS-03 | AI recipe generation slower than the 10 s target (12–55 s) | T2 | U01 · T2 / step 3 · 3; U02 · T2 / step 3 · 3; U04 · T2 / step 3 · 3; U07 · T2 / step 3 · 2; U08 · T2 / step 3 · 2 | 3 | T2 step 3 passed for 8/8 in R2 (7–9.6 s) | _TBD_ | _TBD_ |
| ISS-04 | AI recipe includes ingredients that are not in the pantry or staples (≥2 items to buy; heavy cream) | T2 | U01 · T2 / step 4 · 3; U06 · T2 / step 4 · 3 | 3 | T2 step 4 passed for 8/8 in R2 | _TBD_ | _TBD_ |
| ISS-05 | Leftover-confirm box shows wrong quantities | T3 | U01 · T3 / step 2 · 3; U02 · T3 / step 2 · 3 | 3 | T3 step 2 passed for 8/8 in R2 | _TBD_ | _TBD_ |
| ISS-06 | Confirming leftovers did not deduct items from the pantry | T3 | U01 · T3 / step 3 · 3 | 3 | T3 step 3 passed for 8/8 in R2 | _TBD_ | _TBD_ |
| ISS-07 | Grocery list took 5 s to render (target < 3 s) | T4 | U01 · T4 / step 1 · 2 | 2 | T4 step 1 passed for 8/8 in R2 (1–2 s) | _TBD_ | _TBD_ |
| ISS-08 | Chosen recipe's missing items not pooled into the grocery list automatically (manual "Add 2 missing items" tap, or only after manual refresh) | T5 | U03 · T5 / step 3 · 2; U07 · T5 / step 3 · 3 | 3 | T5 step 3 passed for 8/8 in R2 | _TBD_ | _TBD_ |
| ISS-09 | Grocery list includes already-stocked eggs (unit mismatch pcs vs pack) | T4 | U08 · T4 / step 2 · 3 | 3 | T4 step 2 passed for 8/8 in R2 | _TBD_ | _TBD_ |
| ISS-10 | Edit control on receipt-review rows is not obvious | T1 | U05 · T1 / step 3 · 2 | 2 | No specific R2 observation recorded (T1 step 3 passed 8/8) | _TBD_ | _TBD_ |
| ISS-11 | Blurred receipt photo gives no retake guidance | T1 | U05 · T1 / step 2 · 2 | 2 | No specific R2 observation recorded (T1 step 2 passed 8/8) | _TBD_ | _TBD_ |
| ISS-12 | Saved-recipe search box not noticed; looks the same as the pantry search | T5 | U05 · T5 / step 1 · 2 | 2 | T5 step 1 passed 8/8 in R2; U10 noted "Found the search box on the Saved screen straight away" | _TBD_ | _TBD_ |
| ISS-13 | No confidence indicator on scanned lines | T1 | U06 · T1 / step 3 · 1 | 1 | No specific R2 observation recorded | _TBD_ | _TBD_ |
| ISS-14 | Consent screen does not say receipt images are deleted after parsing | T1 / general | U07 · T1 / step 2 · 2 | 2 | No specific R2 observation recorded | _TBD_ | _TBD_ |
| ISS-15 | Session stays signed in after closing the tab (no idle timeout) | General | U07 · General · 2 | 2 | No specific R2 observation recorded | _TBD_ | _TBD_ |
| ISS-16 | Layout shift moves the "mark cooked" button while the page loads | T3 | U08 · T3 / step 1 · 1 | 1 | T3 step 1 passed for 8/8 in R2; no layout-shift comment recorded | _TBD_ | _TBD_ |

**Retest evidence column:** Round 2 re-ran the same five tasks with the same step-level pass/fail rules after the fixes; the entry states what the Round 2 records show for the same task step. It is evidence from the re-run, not a separate targeted retest. Where the Round 2 record does not mention the issue, it says so.

**Fix commit / Status:** _TBD_ — the commit hashes that fixed each issue were not in the material provided and are not guessed here; to be filled in by the team.

## 2. Issues by severity (Round 1)

**Severity 3 — major**

- ISS-01: Receipt reader fails or stalls ("Try again" error / reading stalled up to 115 s)
- ISS-02: Scan-to-saved took 101 s; user needed 2 wrong taps to find the upload option
- ISS-03: AI recipe generation slower than the 10 s target (12–55 s)
- ISS-04: AI recipe includes ingredients that are not in the pantry or staples (≥2 items to buy; heavy cream)
- ISS-05: Leftover-confirm box shows wrong quantities
- ISS-06: Confirming leftovers did not deduct items from the pantry
- ISS-08: Chosen recipe's missing items not pooled into the grocery list automatically (manual "Add 2 missing items" tap, or only after manual refresh)
- ISS-09: Grocery list includes already-stocked eggs (unit mismatch pcs vs pack)

**Severity 2 — minor**

- ISS-03: AI recipe generation slower than the 10 s target (12–55 s)
- ISS-07: Grocery list took 5 s to render (target < 3 s)
- ISS-08: Chosen recipe's missing items not pooled into the grocery list automatically (manual "Add 2 missing items" tap, or only after manual refresh)
- ISS-10: Edit control on receipt-review rows is not obvious
- ISS-11: Blurred receipt photo gives no retake guidance
- ISS-12: Saved-recipe search box not noticed; looks the same as the pantry search
- ISS-14: Consent screen does not say receipt images are deleted after parsing
- ISS-15: Session stays signed in after closing the tab (no idle timeout)

**Severity 1 — cosmetic**

- ISS-13: No confidence indicator on scanned lines
- ISS-16: Layout shift moves the "mark cooked" button while the page loads

## 3. Round 2

All eight Round 2 records (U09–U16) list **None observed** under *Issues found*. No new issue was logged in Round 2.

## 4. Raw issue rows per user (verbatim)

**U01**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| AI Reader could not read the receipt photo ("Try again" error); recipe generation took over 30 s; generated recipes needed at least 2 items not in the pantry | T1 / step 3; T2 / step 3; T2 / step 4 | 3; 3; 3 |
| Leftover-confirm box showed wrong quantities; confirming did not deduct items from the pantry; grocery list took 5 s to render | T3 / step 2; T3 / step 3; T4 / step 1 | 3; 3; 2 |

**U02**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| Recipe generation took 22 s against the 10 s target | T2 / step 3 | 3 |
| Leftover-confirm box showed wrong quantities for all items | T3 / step 2 | 3 |

**U03**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| Receipt scan to saved pantry took 101 s against the 60 s target | T1 / step 4 | 3 |
| Missing ingredients are not pooled into the grocery list automatically; user had to tap "Add 2 missing items to list" | T5 / step 3 | 2 |

**U04**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| Receipt reading stalled about 55 s, showed "Something went wrong on our side. Try again", then stalled again; parsing finished only at 115 s | T1 / step 2 | 3 |
| Recipe generation took 27 s against the 10 s target | T2 / step 3 | 3 |

**U05**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| Edit control on receipt-review rows is not obvious | T1 / step 3 | 2 |
| Blurred receipt photo gives no retake guidance | T1 / step 2 | 2 |
| Saved-recipe search box was not noticed; user typed into the pantry search instead (the two look the same) | T5 / step 1 | 2 |

**U06**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| AI recipe used an ingredient not in pantry or staples (heavy cream) | T2 / step 4 | 3 |
| No confidence indicator on scanned lines | T1 / step 3 | 1 |

**U07**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| Selected recipe not pooled into grocery list until manual refresh | T5 / step 3 | 3 |
| Consent screen does not say receipt images are deleted after parsing; session stays signed in after closing the tab (no idle timeout) | T1 / step 2; General | 2; 2 |
| Recipe generation took 12 s against the 10 s target | T2 / step 3 | 2 |

**U08**

| Issue | Task / step | Severity (1–4) |
|---|---|---|
| Grocery list includes already-stocked eggs (unit mismatch pcs vs pack) | T4 / step 2 | 3 |
| Recipe generation took 16.2 s against the 10 s target; layout shift moves the "mark cooked" button during load | T2 / step 3; T3 / step 1 | 2; 1 |

