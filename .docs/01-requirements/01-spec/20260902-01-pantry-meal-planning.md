# Requirement Spec — Pantry & Meal Planning (Smart Recipe Planner & Pantry Manager)

- Date: 2026-09-02
- No: 01
- Topic: pantry-meal-planning
- Phase: DISCOVER (no production code)
- Charter: [Smart Recipe Planner & Pantry Manager - Charter.md](../../../Smart%20Recipe%20Planner%20&%20Pantry%20Manager%20-%20Charter.md)
- Legal source: [rule.md](../../../rule.md) (Apex W2 legal & compliance rules)

## 1. Problem & users

### Users
- **Primary:** Home cooks who shop and cook for a household weekly and throw
  away food they meant to use.
- **Secondary:** Students cooking for themselves on a tight budget, with a
  small pantry and little planning time.
- **Also affected:** Household members who shop from the list someone else made.

### Interview pains

- **P1 — Forgotten pantry, expired food:** Users forget what is in their pantry
  and let food expire, wasting money.
- **P2 — Cooking decision effort → takeout:** Deciding what to cook with random
  leftover ingredients takes too much effort, so people default to takeout
  instead.
- **P3 — Unplanned shopping:** Grocery shopping is inefficient and people
  over-buy or forget items because they don't plan against what they already
  have.

## 2. Functional requirements

| ID | User story | MoSCoW | Traces |
|----|-----------|--------|--------|
| F1 | As a home cook, I want to log a pantry item with name, quantity, and expiry date, so that I can see what I actually have. | Must | solves P1 |
| F2 | As a home cook, I want my pantry sorted so that items closest to expiry appear first, with items expiring soon marked, so that I use food before it spoils. | Must | solves P1 |
| F3 | As a home cook, I want the system to generate a recipe built from the ingredients currently in my pantry, prioritising the ones closest to expiry, so that I can cook without a shopping trip. | Must | solves P1, P2 |
| F4 | As a home cook with dietary needs, I want to save dietary filters (vegetarian, gluten-free, low-carb, allergies) and have every generated recipe honour them, so that suggestions are actually cookable for me. | Must | solves P2 |
| F5 | As a home cook, I want to assign a recipe to a specific day on a weekly calendar, so that the week's meals are decided in one sitting. | Must | solves P2, P3 |
| F6 | As a home cook, I want the planned week turned into a grocery list that excludes what is already in my pantry, so that I stop re-buying and overbuying. | Must | solves P1, P3 |
| F7 | As a home cook, I want to save an AI-generated or manually written recipe, so that I can cook it again without regenerating it. | Must | solves P2, P3 |
| F8 | As a user, I want to accept the Terms and the AI & Food Safety Disclaimer, and give explicit consent for my dietary data and for sending pantry data to the AI service, before the first recipe is generated, so that I know what is shared and why. | Must | solves P2 (trust), LR1, LR2, LR7 |
| F9 | As a home cook, I want pantry quantities deducted when I mark a planned meal as cooked, so that my pantry stays accurate without re-entering everything. | Should | solves P1, P3 |
| F10 | As a home cook, I want to search my saved recipes by an ingredient I have, so that I can find a use for something before it expires. | Should | solves P1, P2 |
| F11 | As a home cook, I want to write a recipe manually into a form, so that family recipes live with the AI ones. | Should | solves P3 |
| F12 | As a home cook, I want to edit or delete any pantry item, recipe, or planned meal, so that I can correct mistakes. | Should | solves P1 |
| F13 | As a home cook, I want to be warned when the AI service is unavailable and be shown my saved recipes that match my pantry instead, so that the app is still useful. | Should | solves P2 |
| F14 | As a home cook, I want to add pantry items by scanning a barcode or a receipt photo, so that logging is faster than typing. | Could | solves P1 |
| F15 | As a home cook, I want to share my grocery list with a household member, so that whoever shops has the right list. | Could | solves P3 |
| F16 | As a home cook, I want to see how much food I stopped wasting over time, so that I can see the app working. | Could | solves P1 |
| F17 | As a user, I do not need social features — public profiles, following other cooks, or a public recipe feed — in this phase. | Won't | out of scope |
| F18 | As a user, I do not need nutrition/calorie tracking, macro targets, or grocery-store price or delivery integration in this phase. | Won't | out of scope |

## 3. Non-functional requirements

- **NFR1 (the project metric):** In a before/after pilot with real users, median
  self-reported food thrown away per household per week drops by **≥ 30%**, and
  median weekly meal-planning time drops from baseline to **under 15 minutes**,
  measured over **≥ 2 weeks** per user. Secondary: self-reported takeout
  orders per week drop by **≥ 1** for users who reported defaulting to takeout
  (P2).
- **NFR2 (entry friction):** Adding one pantry item takes **no more than 3
  fields** (name, quantity, expiry) and **under 15 seconds** for a typical user;
  a first-time pantry of 20 items is loggable in **under 6 minutes**.
- **NFR3 (generation latency):** An AI recipe is returned in **under 10 seconds**
  at the 90th percentile; the UI shows progress within **1 second** of the tap.
- **NFR4 (AI fidelity — pantry):** In a 50-generation test set, **≥ 90%** of
  generated recipes use **only** ingredients in the user's pantry plus a
  declared staples list (salt, oil, water, pepper), and **≥ 80%** include at
  least one item expiring within 3 days when such an item exists.
- **NFR5 (AI fidelity — dietary):** In the same test set, **100%** of generated
  recipes contain **zero** ingredients excluded by the user's saved dietary
  filters. Any violation is a release blocker.
- **NFR6 (grocery-list accuracy):** A generated grocery list contains **0**
  items already stocked in sufficient quantity in the pantry, verified across
  **≥ 20** test plans.
- **NFR7 (availability & degradation):** The app is available **≥ 99.0%** per
  calendar month; when the AI service fails or is rate-limited, the app falls
  back to saved-recipe matching within **5 seconds** and never shows a raw error.
- **NFR8 (AI cost ceiling):** Recipe generation stays within a budget of **≤ 30
  generations per user per month** on the free tier, enforced server-side.
- **NFR9 (page load):** The pantry list (up to 200 items) and the weekly plan
  each render in **under 3 seconds** on a mid-range phone over a typical mobile
  connection.
- **NFR10 (log retention):** Access/action logs are retained for **≥ 90 days**,
  configured explicitly and not left at cloud defaults.

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
  **only** ingredient names, quantities, expiry proximity, and dietary flags —
  never account email, real name, address, or household identifiers. *Testable:
  capture the outbound request payload → contains no identifier fields.*
- **LR3 (PDPA — purpose limit, deletion, credentials):** (a) Pantry, plan, and
  recipe data are used only for recipe generation, meal planning, and the
  grocery list — no advertising, resale, or profiling without separate opt-in.
  (b) On account deletion, pantry items, meal plan, saved recipes, and the
  dietary profile are deleted, including from backups within the stated window
  (CCA §26 logs excepted). (c) Social/email login stores only a verification
  token, never the provider password. (d) A shared grocery list must not expose
  another person's dietary or health data without that person's consent.
  *Testable: delete account → no user rows remain except retained logs; token
  store holds no credential.*

### Computer Crime Act §26
- **LR4 (CCA §26 — creation log):** Every user-created item (manual recipe,
  saved AI recipe, meal plan entry, shared list) is logged with account ID, IP
  address, and timestamp, stored separately from the content itself. *Testable:
  each saved recipe has a matching log row with all three fields.*
- **LR5 (CCA §26 — edit/delete log, 90-day retention):** Every edit or delete
  of a recipe, pantry item, or meal plan is logged with actor identity, IP, and
  timestamp; the log and the original content are retained **≥ 90 days even
  after deletion**. *Testable: delete a recipe → log and original content still
  retrievable internally at day 89.*
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
  and version, the pantry snapshot and dietary filters used, and the timestamp,
  so the output can be reproduced in a later safety dispute. It also stores
  action confirmations ("meal plan saved", "grocery list generated") as
  retrievable records, not transient UI notices. *Testable: given a recipe ID,
  return the exact text, model version, and inputs used.*
- **LR9 (ETA §28 — no false certification):** The product must not use
  "certified", "nutritionist-approved", or CA-backed signature language unless a
  licensed Certification Authority or a real certified professional is actually
  involved. *Testable: a UI copy scan finds no certification claims.*

## 5. Scope

### In scope
- Pantry logging with quantity and expiry, sorted expiry-first (F1, F2).
- AI recipe generation from current pantry, expiry-prioritised (F3).
- Saved dietary filters applied to every generated recipe (F4, LR1).
- Weekly meal calendar assignment (F5).
- Auto grocery list = planned meals minus pantry stock (F6).
- Recipe saving, AI and manual (F7, F11).
- Consent & terms gate before first generation (F8, LR1, LR2, LR7).
- Logging, ≥90-day retention, AI-output records (LR3–LR9).
- Should-haves: deduct on cooked, ingredient search, edit/delete, AI-outage
  fallback (F9–F13).

### Out of scope
- Social features: public profiles, following, public recipe feed (F17).
- Nutrition/calorie/macro tracking; store price or delivery integration (F18).
- Could-haves not committed this phase: barcode/receipt scanning (F14),
  household list sharing (F15), waste-savings dashboard (F16).
- Any "certified"/CA-backed claim — explicitly excluded by LR9.

### The ONE core workflow this phase builds end-to-end
A home cook logs pantry items with expiry dates → the system generates an AI
recipe built from those items, prioritising what expires soonest and honouring
their dietary filters → the cook assigns it to a day on the weekly calendar →
the app produces a grocery list containing only the missing ingredients.
