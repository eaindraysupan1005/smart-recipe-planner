# Backlog — Smart Recipe & Pantry Assistant

Prioritised by MoSCoW. Every row traces to a requirement ID and a real
interview pain (or a legal requirement). Source spec:
[20260902-01-pantry-meal-planning.md](01-spec/20260902-01-pantry-meal-planning.md).

Pains: **P1** forgotten leftovers · **P2** decision fatigue & unusable
recipes → takeout · **P3** disconnected planning & shopping.

## Must

| # | Item | Traces to |
|---|------|-----------|
| B1 | Receipt scan builds the pantry automatically (items + quantities, no typing) | F1, P1 |
| B2 | Pantry view with correction, and cooked-meal deduction + leftover confirm | F2, P1 |
| B3 | AI recipe generation from pantry items the user selects | F3, P1, P2 |
| B4 | Auto grocery list = planned meals minus pantry stock | F4, P3 |
| B5 | Save a recipe (AI-generated or manual) for reuse | F5, P2, P3 |
| B6 | Dietary filter profile applied to every generated recipe | F6, P2 |
| B7 | Search saved recipes by an ingredient on hand | F7, P1, P2 |
| B8 | Terms + AI & Food Safety Disclaimer gate before first generation | LR7 |
| B9 | Explicit opt-in for sensitive dietary/allergy data; editable and deletable | LR1 (PDPA) |
| B10 | AI transfer disclosure + consent; request payload carries selected ingredients and dietary flags only, no identifiers | LR2 (PDPA) |
| B11 | Purpose limit on pantry/receipt data; full delete on account deletion; login stores token only | LR3 (PDPA) |
| B12 | Creation log: account ID + IP + timestamp, separate from content | LR4 (CCA §26) |
| B13 | Edit/delete log + original content retained ≥90 days after deletion | LR5 (CCA §26) |
| B14 | Extended-retention hold flag (up to 1 year); retain removed recipes internally | LR6 (CCA §26) |
| B15 | Retrievable acceptance & consent records, including withdrawal (user ID, timestamp, version) | LR7 (ETA §9/26) |
| B16 | Reproducible AI-output record (text, model version, pantry snapshot, filters, timestamp) + stored action confirmations | LR8 (ETA §9/26) |
| B17 | No "certified"/"nutritionist-approved"/CA language in the UI | LR9 (ETA §28) |
