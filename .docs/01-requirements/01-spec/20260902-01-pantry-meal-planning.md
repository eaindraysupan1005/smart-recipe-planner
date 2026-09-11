# Requirement Spec — Pantry, Recipes & Grocery List (Smart Recipe & Pantry Assistant)

- Date: 2026-09-02
- No: 01
- Topic: pantry-meal-planning
- Phase: DISCOVER (no production code)
- Charter: [Smart Recipe & Pantry Assistant- Charter.md](../../../Smart%20Recipe%20%26%20Pantry%20Assistant-%20Charter.md)
- Legal source: [rule.md](../../../rule.md) (Apex W2 legal & compliance rules)

## 1. Problem & users

### Users
- **Primary:** Young people cooking for themselves 4+ times a week who waste a
  significant share of the food they buy.
- **Secondary:** Students on a tight budget, with a small pantry and little
  planning time.
- **Also affected:** Household members who shop from a list someone else made.

### Interview pains

- **P1 — Forgotten leftovers:** After cooking, small amounts are left behind —
  one egg, two tomatoes, half an onion. These get pushed to the back of the
  fridge, forgotten, and discovered only once they have gone bad, so food is
  thrown away and re-bought.
- **P2 — Decision fatigue & unusable recipes:** Even when users know what they
  have left, turning a random handful of ingredients into a meal takes real
  mental effort. Recipe sites are organised around dishes, not around
  available ingredients, and most recipes demand a shopping trip for one or
  two missing items. Faced with that effort, people default to takeout.
- **P3 — Disconnected planning & shopping:** Meal plans, saved recipes, and
  grocery lists live in different places — notes apps, screenshots, browser
  bookmarks, and memory. Shopping lists are written from scratch without any
  view of what is already at home, so users over-buy items they already have
  and forget the ones they need.

## 2. Functional requirements

Exactly seven functional requirements this phase, matching the Charter's
feature table (§5) one-for-one. All seven are **Core**, so all are **Must** —
nothing outside this list is in scope.

| ID | User story | MoSCoW | Traces |
|----|-----------|--------|--------|
| F1 | As a home cook, I want to scan a grocery receipt so that its items and quantities are added to my pantry automatically, with no typing, so that my pantry is never empty because entry felt like too much work. | Must | solves P1 |
| F2 | As a home cook, I want to see what food I have and how much, correct anything the scan got wrong, and have quantities deducted (with a quick confirm of what's left) when I mark a meal cooked, so that my pantry always reflects reality without me re-entering it. | Must | solves P1 |
| F3 | As a home cook, I want the AI to generate a recipe built from the pantry items I select, so that even a small handful of leftovers becomes a usable meal instead of takeout. | Must | solves P1, P2 |
| F4 | As a home cook, I want my planned meals turned into a grocery list that excludes what is already in my pantry, so that I stop re-buying and overbuying. | Must | solves P3 |
| F5 | As a home cook, I want to save both AI-generated and manually entered recipes, so that I can cook them again without regenerating or rewriting them. | Must | solves P2, P3 |
| F6 | As a home cook with dietary needs, I want to save dietary filters (vegetarian, gluten-free, low-carb, and others) and have every generated recipe honour them, so that suggestions are actually cookable for me. | Must | solves P2 |
| F7 | As a home cook, I want to search my saved recipes by an ingredient I have, so that I can find a use for something before it expires. | Must | solves P1, P2 |

The Terms/AI & Food Safety Disclaimer and consent gate that must sit in front
of F3's first use is not a separate `F` item — it is carried as **LR1, LR2,
LR7** below, and appears as a gate in the Scope workflow (§5).

## 3. Non-functional requirements

- **NFR1 (the project metric):** In a before/after pilot with real users,
  median self-reported food thrown away per household per week drops by
  **≥ 30%**, and median weekly meal-planning time drops from baseline to
  **under 15 minutes**, measured over **≥ 2 weeks** per user. Secondary:
  self-reported takeout orders per week drop by **≥ 1** for users who reported
  defaulting to takeout (P2).
- **NFR2 (receipt-scan accuracy & friction):** A scanned receipt's items are
  parsed and ready for pantry review in **under 5 seconds**; correcting one
  misread line item takes **under 10 seconds**. Across a test set of **≥ 30**
  real receipts (Thai and international formats, including abbreviated
  store-specific names), **≥ 85%** of line items are parsed correctly before
  any manual correction.
- **NFR3 (generation latency):** An AI recipe is returned in **under 10
  seconds** at the 90th percentile; the UI shows progress within **1 second**
  of the tap.
- **NFR4 (AI fidelity — pantry):** In a 50-generation test set, **≥ 90%** of
  generated recipes use **only** the pantry items the user selected plus a
  declared staples list (salt, oil, water, pepper).
- **NFR5 (AI fidelity — dietary):** In the same test set, **100%** of
  generated recipes contain **zero** ingredients excluded by the user's saved
  dietary filters. Any violation is a release blocker.
- **NFR6 (grocery-list accuracy):** A generated grocery list contains **0**
  items already stocked in sufficient quantity in the pantry, verified across
  **≥ 20** test grocery lists.
- **NFR7 (availability):** The app is available **≥ 99.0%** per calendar
  month; when the AI service fails or is rate-limited, the app shows a clear
  message and never a raw error.
- **NFR8 (AI cost ceiling):** Recipe generation stays within a budget of
  **≤ 30 generations per user per month** on the free tier, enforced
  server-side.
- **NFR9 (page load):** The pantry list (up to 200 items) and the grocery
  list each render in **under 3 seconds** on a mid-range phone over a typical
  mobile connection.
- **NFR10 (log retention):** Access/action logs are retained for **≥ 90
  days**, configured explicitly and not left at cloud defaults.
- **NFR11 (confirmation fatigue):** Marking a planned meal "cooked" and
  confirming what's left over takes **no more than 2 taps** and **under 10
  seconds**, so pantry accuracy does not depend on sustained user effort.

## 4. Legal requirements (from rule.md)

### PDPA
- **LR1 (PDPA — sensitive dietary data, explicit consent):** Dietary filters
  that can reveal health or religion (coeliac/gluten-free, diabetic, allergy
  list, halal) must be collected under an explicit, separate opt-in, never as a
  silent default, and must be editable and deletable by the user. *Testable: a
  new account has no dietary flags set until an opt-in record exists.*
- **LR2 (PDPA — third-party AI transfer, disclosure + minimisation):** Before
  the first recipe generation the system must disclose that ingredient data is
  sent to a third-party AI service and obtain consent; each request must carry
  **only** the selected ingredient names and dietary flags — never account
  email, real name, address, or household identifiers. *Testable: capture the
  outbound request payload → contains no identifier fields.*
- **LR3 (PDPA — purpose limit, deletion, credentials, receipt data):** (a)
  Pantry, planned-meal, and recipe data are used only for recipe generation,
  planning, and the grocery list — no advertising, resale, or profiling
  without separate opt-in. (b) On account deletion, pantry items, planned
  meals, saved recipes, and the dietary profile are deleted, including from
  backups within the stated window (CCA §26 logs excepted). (c) Social/email
  login stores only a verification token, never the provider password. (d) A
  scanned receipt is used only to extract item names, quantities, and prices
  for the pantry — not repurposed for location or spending-profile data
  without separate consent. *Testable: delete account → no user rows remain
  except retained logs; token store holds no credential.*

### Computer Crime Act §26
- **LR4 (CCA §26 — creation log):** Every user-created item (manual recipe,
  saved AI recipe, planned meal) is logged with account ID, IP address, and
  timestamp, stored separately from the content itself. *Testable:
  each saved recipe has a matching log row with all three fields.*
- **LR5 (CCA §26 — edit/delete log, 90-day retention):** Every edit or delete
  of a recipe, pantry item, or planned meal is logged with actor identity, IP,
  and timestamp; the log and the original content are retained **≥ 90 days
  even after deletion**. *Testable: delete a recipe → log and original content
  still retrievable internally at day 89.*
- **LR6 (CCA §26 — authority hold / takedown retention):** The system can flag a
  record for extended retention (up to 1 year) without altering its content, and
  a recipe removed from view after a complaint or safety issue is still retained
  internally with its log. *Testable: set hold flag → content unchanged, purge
  job skips it.*

### Electronic Transactions Act §9 / 26 / 28
- **LR7 (ETA §9/26 — acceptance & consent records):** Clicking "I agree" on the
  Terms / AI & Food Safety Disclaimer, and each explicit consent (LR1 dietary,
  LR2 AI transfer), is stored as a retrievable record with user ID, timestamp,
  and version; **withdrawal of consent is stored the same way**. *Testable:
  fetch by user ID returns version + timestamp for each acceptance and for any
  withdrawal.*
- **LR8 (ETA §9/26 — reproducible AI output record):** For every AI-generated
  recipe shown to a user the system stores the exact generated text, the model
  and version, the pantry snapshot and dietary filters used, and the
  timestamp, so the output can be reproduced in a later safety dispute. It also
  stores action confirmations ("meal added to plan", "grocery list generated")
  as retrievable records, not transient UI notices. *Testable: given a recipe
  ID, return the exact text, model version, and inputs used.*
- **LR9 (ETA §28 — no false certification):** The product must not use
  "certified", "nutritionist-approved", or CA-backed signature language unless a
  licensed Certification Authority or a real certified professional is actually
  involved. *Testable: a UI copy scan finds no certification claims.*

## 5. Scope

### In scope
- Pantry built automatically from a scanned receipt (F1, NFR2).
- Pantry viewing, correction, and cooked-meal deduction with leftover confirm
  (F2, NFR11).
- AI recipe generation from selected pantry items (F3).
- Auto grocery list = planned meals minus pantry stock (F4).
- Recipe saving, AI-generated and manual (F5).
- Saved dietary filters applied to every generated recipe (F6, LR1).
- Search saved recipes by an ingredient on hand (F7).
- Consent & terms gate before first generation (LR1, LR2, LR7).
- Logging, ≥90-day retention, AI-output records (LR3–LR9).

### Out of scope
- Any day-by-day / weekly-calendar meal planner. Planned meals are a flat
  list the grocery list is built from — not assigned to specific days.
- Any "certified"/CA-backed claim — explicitly excluded by LR9.

### The ONE core workflow this phase builds end-to-end
A home cook scans a grocery receipt → the pantry is built automatically → the
cook selects pantry items to use → the system generates an AI recipe around
them, honouring their dietary filters → the cook marks the meal cooked and
confirms what's left over, so the pantry stays accurate → the app produces a
grocery list containing only the missing ingredients from what is still
planned.
