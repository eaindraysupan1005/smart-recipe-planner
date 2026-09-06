# User Journey — the one core workflow

- Date: 2026-09-02 (W4, DISCOVER)
- Persona: **Nan**, works full time, shops once a week, throws out produce most
  weeks and orders takeout when she can't decide what to cook (P1, P2, P3).
- Workflow: **pantry in → AI recipe → meal calendar → grocery list out**

---

## Step-by-step

| # | Screen | Nan does | System does | Traces | Pain relieved |
|---|--------|----------|-------------|--------|---------------|
| J1 | Sign-up / Terms | Creates an account, accepts Terms + AI & Food Safety Disclaimer | Stores acceptance: user id, timestamp, version | F8, LR7 | — (trust) |
| J2 | Dietary profile | Opts in to "gluten-free" and an allergy (peanuts) | Stores as **sensitive data** under a separate explicit opt-in; not set by default | F4, LR1 | P2 |
| J3 | Add pantry item | Types "spinach, 1 bag, expires Sep 4" — 3 fields, ~12 seconds | Saves item; repeats for ~15 items in under 6 min | F1, NFR2 | **P1** |
| J4 | Pantry list | Opens the app Wednesday evening | Shows the pantry expiry-first: spinach and eggs flagged "expiring soon" | F2 | **P1** |
| J5 | Generate — consent | Taps "Cook something with this" for the first time | Asks consent to send ingredient names + dietary flags to the AI service; explains what is and isn't sent | F8, LR2 | — (trust) |
| J6 | Recipe result | Waits ~6 seconds | Returns a spinach-and-egg recipe using only pantry items + staples, with zero gluten and zero peanuts; stores text, model version, pantry snapshot, filters, timestamp | F3, NFR3, NFR4, NFR5, LR8 | **P1, P2** |
| J7 | Recipe result | Taps "Save" | Saves to the library; logs account id + IP + timestamp separately | F7, LR4 | P2, P3 |
| J8 | Weekly calendar | Drags the recipe onto Thursday; adds two more meals for Fri/Sat | Stores the plan; returns a retrievable "meal plan saved" record | F5, LR8 | **P2, P3** |
| J9 | Grocery list | Taps "Build my shopping list" | Returns 6 missing items — not the 20 in the recipes — because pantry stock is subtracted | F6, NFR6 | **P1, P3** |
| J10 | Cooked | Thursday night, marks the meal "cooked" | Deducts the used quantities so the pantry stays accurate for next week | F9 | P1 |

## Alternate & failure paths

| # | Trigger | System behaviour | Traces |
|---|---------|------------------|--------|
| A1 | AI service down or rate-limited at J6 | Shows a plain-language notice, never a raw error | NFR7 |
| A2 | Free-tier cap reached (30/month) | Blocks generation server-side, explains the cap, offers saved-recipe search | NFR8 |
| A3 | Pantry is empty at J5 | Prompts to add items first rather than generating from nothing | F1 |
| A4 | Nan withdraws AI consent later | Generation is disabled; the withdrawal is stored the same way the consent was | LR7 |
| A5 | Nan deletes her account | Pantry, plan, recipes, dietary profile deleted; access logs retained ≥90 days by law | LR3b, LR5 |
| A6 | A generated recipe contains an allergen | Release blocker — NFR5 is 100%, not a target | NFR5 |

## Drop-off risks

| Risk | Where | Mitigation | Traces |
|---|---|---|---|
| **Entry friction kills adoption in week 1** — the Charter's biggest stated risk | J3 | 3 fields only, 15-second target | NFR2 |
| Pantry goes stale, so recipes and lists become wrong | J10 | Deduct-on-cooked, so accuracy is a by-product of normal use | F9 |
| Consent prompt at J5 feels like a scary wall | J5 | Show exactly what is sent (ingredients + dietary flags, no identity) instead of a legal blob | LR2 |
| Trust breaks if one recipe ignores an allergy | J6 | NFR5 at 100%, plus the stored generation record so any failure is reproducible | NFR5, LR8 |

## Pain coverage check

- **P1** (forgotten pantry, expired food) → J3, J4, J6, J9, J10
- **P2** (cooking decision effort → takeout) → J2, J6, J8
- **P3** (unplanned over-buying) → J7, J8, J9
