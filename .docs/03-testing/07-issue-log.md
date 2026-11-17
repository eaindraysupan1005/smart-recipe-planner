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

| ID | Issue | Task | Seen by (user · step · severity) | Max sev | Retest evidence from Round 2 (same task step) | Related change before UAT (git) | Round 2 status |
|---|---|---|---|---|---|---|---|
| ISS-01 | Receipt reader fails or stalls ("Try again" error / reading stalled up to 115 s) | T1 | U01 · T1 / step 3 · 3; U04 · T1 / step 2 · 3 | 3 | T1 steps 2–4 passed for 8/8 users in R2 (times 4.4–52 s); no error or stall recorded | Not recorded in git history | Not observed in Round 2 |
| ISS-02 | Scan-to-saved took 101 s; user needed 2 wrong taps to find the upload option | T1 | U03 · T1 / step 4 · 3 | 3 | T1 step 4 passed for 8/8 in R2 | Not recorded in git history | Not observed in Round 2 |
| ISS-03 | AI recipe generation slower than the 10 s target (12–55 s) | T2 | U01 · T2 / step 3 · 3; U02 · T2 / step 3 · 3; U04 · T2 / step 3 · 3; U07 · T2 / step 3 · 2; U08 · T2 / step 3 · 2 | 3 | T2 step 3 passed for 8/8 in R2 (7–9.6 s) | Not recorded in git history | Not observed in Round 2 |
| ISS-04 | AI recipe includes ingredients that are not in the pantry or staples (≥2 items to buy; heavy cream) | T2 | U01 · T2 / step 4 · 3; U06 · T2 / step 4 · 3 | 3 | T2 step 4 passed for 8/8 in R2 | `435e339` (7 Nov): invented recipes pinned to the picked items, one retry when an unpicked item appears, "ALLOWED INGREDIENTS" prompt | Not observed in Round 2 |
| ISS-05 | Leftover-confirm box shows wrong quantities | T3 | U01 · T3 / step 2 · 3; U02 · T3 / step 2 · 3 | 3 | T3 step 2 passed for 8/8 in R2 | `435e339` (7 Nov): cooking deducts the matching pantry row, in the pantry's own unit (new `units.ts`), with before/use/after per item | Not observed in Round 2 |
| ISS-06 | Confirming leftovers did not deduct items from the pantry | T3 | U01 · T3 / step 3 · 3 | 3 | T3 step 3 passed for 8/8 in R2 | `435e339` (7 Nov): same change — deduction matched to the right pantry row and unit | Not observed in Round 2 |
| ISS-07 | Grocery list took 5 s to render (target < 3 s) | T4 | U01 · T4 / step 1 · 2 | 2 | T4 step 1 passed for 8/8 in R2 (1–2 s) | Not recorded in git history | Not observed in Round 2 |
| ISS-08 | Chosen recipe's missing items not pooled into the grocery list automatically (manual "Add 2 missing items" tap, or only after manual refresh) | T5 | U03 · T5 / step 3 · 2; U07 · T5 / step 3 · 3 | 3 | T5 step 3 passed for 8/8 in R2 | Not recorded in git history | Not observed in Round 2 |
| ISS-09 | Grocery list includes already-stocked eggs (unit mismatch pcs vs pack) | T4 | U08 · T4 / step 2 · 3 | 3 | T4 step 2 passed for 8/8 in R2 | `435e339` (7 Nov): pantry check converts recipe amounts into the pantry unit (pieces/pack/g) before comparing | Not observed in Round 2 |
| ISS-10 | Edit control on receipt-review rows is not obvious | T1 | U05 · T1 / step 3 · 2 | 2 | No specific R2 observation recorded (T1 step 3 passed 8/8) | Not recorded in git history | No Round 2 observation recorded |
| ISS-11 | Blurred receipt photo gives no retake guidance | T1 | U05 · T1 / step 2 · 2 | 2 | No specific R2 observation recorded (T1 step 2 passed 8/8) | Not recorded in git history | No Round 2 observation recorded |
| ISS-12 | Saved-recipe search box not noticed; looks the same as the pantry search | T5 | U05 · T5 / step 1 · 2 | 2 | T5 step 1 passed 8/8 in R2; U10 noted "Found the search box on the Saved screen straight away" | Not recorded in git history | Not observed in Round 2 |
| ISS-13 | No confidence indicator on scanned lines | T1 | U06 · T1 / step 3 · 1 | 1 | No specific R2 observation recorded | Not recorded in git history | No Round 2 observation recorded |
| ISS-14 | Consent screen does not say receipt images are deleted after parsing | T1 / general | U07 · T1 / step 2 · 2 | 2 | No specific R2 observation recorded | Not recorded in git history | No Round 2 observation recorded |
| ISS-15 | Session stays signed in after closing the tab (no idle timeout) | General | U07 · General · 2 | 2 | No specific R2 observation recorded | Not recorded in git history | No Round 2 observation recorded |
| ISS-16 | Layout shift moves the "mark cooked" button while the page loads | T3 | U08 · T3 / step 1 · 1 | 1 | T3 step 1 passed for 8/8 in R2; no layout-shift comment recorded | Not recorded in git history | Not observed in Round 2 |

**Retest evidence column:** Round 2 re-ran the same five tasks with the same step-level pass/fail rules after the fixes; the entry states what the Round 2 records show for the same task step. It is evidence from the re-run, not a separate targeted retest. Where the Round 2 record does not mention the issue, it says so.

**Related change before UAT / Round 2 status:** the commit column lists changes found in the git history that address the same code area as the issue (relation judged from the diffs, not a recorded fix-for-issue link). All of those commits are dated 7 Nov 2026, which is before the first dated session records (8 Nov; the U01–U04 date is ambiguous), yet the issues were still observed in Round 1 — so either the Round 1 build did not yet contain them or they did not fully resolve the issue. The team should confirm which build each round tested. "Not recorded in git history" means no commit addresses that issue; no commit after 7 Nov 2026 changes `backend/src` or `frontend/src` on any branch. If a fix was made elsewhere (for example directly on the hosted deployment or in another repository), add it here.

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

## 3. Features and functions changed before the user testing (git history, 23 Oct – 7 Nov 2026)

Changes the team made to the app before the UAT sessions, from `git log` and the diffs. Tool checkpoint commits and documentation-only commits are left out.

| Date | Commit | Change |
|---|---|---|
| 23 Oct | `95e4058` | AI chef: recipe dataset, occasion (mood) step, loading animations |
| 23 Oct | `499d23e` | Chef uses Gemini; default to a current model |
| 23 Oct | `cb89a10` | Receipts read with Gemini vision, in any language |
| 23 Oct | `682710b` | Allergens produce warnings (three severity levels) instead of hiding recipes; free-text occasion |
| 25 Oct | `c9050ca` | Dummy login replaced by real sign-up/login with hashed passwords (scrypt) and Google sign-in |
| 27 Oct | `1048759` | Database layer: Supabase/Postgres persistence, schema, DB check |
| 27 Oct | `af4d7cf` | Google sign-in variables documented in `.env.example` |
| 27 Oct | `0399f06` | API hardening after a security pass: rate limiter, CORS allow-list, password and auth-route changes |
| 2 Nov | `dddedd9` | User and session tables extended (password hash, Google id, verified email, last login; session expiry and method) |
| 3 Nov | `d721c03` | Recipe dataset added; Supabase schema fixed |
| 7 Nov | `435e339` | Recipe handling and pantry checks: unit conversion (`units.ts`); invented recipes limited to the picked items with one retry; pantry check and cook-deduction done in the pantry's own units; seasonings hidden; "Needs" computed from the live pantry; a pantry-built recipe leads when every book recipe needs shopping |
| 7 Nov | `c4939ac` | Ingredient list update: wider seasoning and staple lists (staples never listed as "needed"; "garlic powder" no longer treated as Garlic) |
| 7 Nov | `850be4e` | Google sign-in records acceptance of the Terms and AI & Food Safety Disclaimer for new accounts and requires a verified email; server reads `PORT` so it can run on a host such as Render |

## 4. Round 2

All eight Round 2 records (U09–U16) list **None observed** under *Issues found*. No new issue was logged in Round 2.

## 5. Raw issue rows per user (verbatim)

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

