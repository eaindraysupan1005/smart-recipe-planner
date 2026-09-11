# User Journey — the one core workflow

- Date: 2026-09-02 (W4, DISCOVER)
- Persona: **Nan**, cooks for herself 4+ times a week, throws out small
  leftovers most weeks and orders takeout when she can't decide what to cook
  (P1, P2, P3).
- Workflow: **receipt scan → pantry in → AI recipe → cook & confirm leftovers
  → grocery list out**

---

## Step-by-step

| # | Screen | Nan does | System does | Traces | Pain relieved |
|---|--------|----------|-------------|--------|---------------|
| J1 | Sign-up / Terms | Creates an account, accepts Terms + AI & Food Safety Disclaimer | Stores acceptance: user id, timestamp, version | LR7 | — (trust) |
| J2 | Dietary profile | Opts in to "gluten-free" and an allergy (peanuts) | Stores as **sensitive data** under a separate explicit opt-in; not set by default | F6, LR1 | P2 |
| J3 | Scan receipt | Photographs her grocery receipt | Parses items and quantities into the pantry in under a minute, flagging low-confidence lines | F1, NFR2 | **P1** |
| J4 | Review & correct | Fixes one misread line ("spinach" scanned as "spmach") | Saves the corrected pantry; the rest of the ~15 items needed no edits | F1, F2, NFR3 | **P1** |
| J5 | Pantry list | Opens the app Wednesday evening | Shows current pantry items and quantities | F2 | **P1** |
| J6 | Select items — consent | Selects spinach, eggs, and rice; taps "Cook something with this" for the first time | Asks consent to send the selected ingredient names + dietary flags to the AI service; explains what is and isn't sent | F3, LR2 | — (trust) |
| J7 | Recipe result | Waits ~6 seconds | Returns a spinach-and-egg recipe using only the selected items + staples, with zero gluten and zero peanuts; stores text, model version, pantry snapshot, filters, timestamp | F3, F6, NFR4, NFR5, NFR6, LR8 | **P1, P2** |
| J8 | Recipe result | Taps "Save" and "Add to my plan" | Saves to the library; adds it to the flat list of planned meals; logs account id + IP + timestamp | F5, LR4 | P2, P3 |
| J9 | Cooked & confirm | Thursday night, cooks it and marks it "cooked" | Deducts the used quantities and prompts a quick confirm of what's left, in ≤ 2 taps | F2, NFR11 | **P1** |
| J10 | Grocery list | Taps "Build my shopping list" | Returns the missing items across her remaining planned meals — not everything the recipes need — because pantry stock is subtracted | F4, NFR7 | **P1, P3** |

## Alternate & failure paths

| # | Trigger | System behaviour | Traces |
|---|---------|------------------|--------|
| A1 | AI service down or rate-limited at J7 | Shows a plain-language notice, never a raw error | NFR8 |
| A2 | Pantry is empty at J6 | Prompts to scan a receipt first rather than generating from nothing | F1 |
| A3 | The receipt scan misreads more than a couple of lines | Review screen (J4) lets Nan add or fix items manually before saving | F1, F2 |
| A4 | Nan withdraws AI consent later | Generation is disabled; the withdrawal is stored the same way the consent was | LR7 |
| A5 | Nan deletes her account | Pantry, planned meals, recipes, dietary profile deleted; access logs retained ≥90 days by law | LR3b, LR5 |
| A6 | A generated recipe contains an allergen | Release blocker — NFR6 is 100%, not a target | NFR6 |

## Drop-off risks

| Risk | Where | Mitigation | Traces |
|---|---|---|---|
| **Receipt scan misreads items** — the Charter's stated risk (abbreviated, store-specific names, print quality) | J3–J4 | Low-confidence lines flagged for a quick correction, tested early against real Thai and international receipts | NFR2, NFR3 |
| Pantry goes stale if a cooked meal is never confirmed | J9 | Deduct-on-cooked with a ≤2-tap confirm, so accuracy is a by-product of normal use, not a chore | F2, NFR11 |
| Consent prompt at J6 feels like a scary wall | J6 | Show exactly what is sent (selected ingredients + dietary flags, no identity) instead of a legal blob | LR2 |
| Trust breaks if one recipe ignores an allergy | J7 | NFR6 at 100%, plus the stored generation record so any failure is reproducible | NFR6, LR8 |

## Pain coverage check

- **P1** (forgotten leftovers) → J3, J4, J5, J7, J9, J10
- **P2** (decision fatigue → takeout) → J2, J6, J7, J8
- **P3** (disconnected planning & shopping) → J8, J10
