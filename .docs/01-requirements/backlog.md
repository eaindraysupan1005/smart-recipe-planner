# Backlog — Smart Recipe Planner & Pantry Manager

Prioritised by MoSCoW. Every row traces to a requirement ID and a real
interview pain (or a legal requirement). Source spec:
[20260902-01-pantry-meal-planning.md](01-spec/20260902-01-pantry-meal-planning.md).

Pains: **P1** forgotten pantry / expired food · **P2** cooking decision effort
→ takeout · **P3** unplanned, inefficient grocery shopping.

## Must

| # | Item | Traces to |
|---|------|-----------|
| B1 | Pantry item entry: name + quantity + expiry date | F1, P1 |
| B2 | Pantry list sorted expiry-first, with "expiring soon" marking | F2, P1 |
| B3 | AI recipe generation from current pantry, expiry-prioritised | F3, P1, P2 |
| B4 | Dietary filter profile applied to every generated recipe | F4, P2 |
| B5 | Weekly calendar: assign a recipe to a day | F5, P2, P3 |
| B6 | Auto grocery list = planned meals minus pantry stock | F6, P1, P3 |
| B7 | Save a recipe (AI-generated or manual) for reuse | F7, P2, P3 |
| B8 | Terms + AI & Food Safety Disclaimer gate before first generation | F8, P2 |
| B9 | Explicit opt-in for sensitive dietary/allergy data; editable and deletable | LR1 (PDPA) |
| B10 | AI transfer disclosure + consent; request payload carries ingredients and dietary flags only, no identifiers | LR2 (PDPA) |
| B11 | Purpose limit on pantry data; full delete on account deletion; login stores token only; no third-party dietary data in a shared list | LR3 (PDPA) |
| B12 | Creation log: account ID + IP + timestamp, separate from content | LR4 (CCA §26) |
| B13 | Edit/delete log + original content retained ≥90 days after deletion | LR5 (CCA §26) |
| B14 | Extended-retention hold flag (up to 1 year); retain removed recipes internally | LR6 (CCA §26) |
| B15 | Retrievable acceptance & consent records, including withdrawal (user ID, timestamp, version) | LR7 (ETA §9/26) |
| B16 | Reproducible AI-output record (text, model version, pantry snapshot, filters, timestamp) + stored action confirmations | LR8 (ETA §9/26) |
| B17 | Append-only admin override/removal store; no "certified"/CA language in the UI | LR9 (ETA §26/28) |

## Should

| # | Item | Traces to |
|---|------|-----------|
| B18 | Deduct pantry quantities when a planned meal is marked cooked | F9, P1, P3 |
| B19 | Search saved recipes by an ingredient on hand | F10, P1, P2 |
| B20 | Manual recipe entry form | F11, P3 |
| B21 | Edit / delete pantry items, recipes, and planned meals | F12, P1 |
| B22 | AI-outage fallback to saved-recipe matching, with a clear notice | F13, P2 |

## Could

| # | Item | Traces to |
|---|------|-----------|
| B23 | Barcode / receipt-photo pantry entry | F14, P1 |
| B24 | Share the grocery list with a household member | F15, P3 |
| B25 | Food-waste savings dashboard over time | F16, P1 |

## Won't (this phase)

| # | Item | Traces to |
|---|------|-----------|
| B26 | Social features: public profiles, following, public recipe feed | F17 |
| B27 | Nutrition / calorie / macro tracking; store price or delivery integration | F18 |
