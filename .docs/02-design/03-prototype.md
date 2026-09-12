# Prototype — low-fidelity wireframes

- Date: 2026-09-02 (W4, DISCOVER)
- Fidelity: **low — layout and content only.** No production code; BUILD starts W6.
- Owner: **Thwin Khant Nyar Zaw (Designer)** produces the visual version.
- Visual file: _link the Figma / Canva / scanned sketch here before W5_ →
  `TODO: <link>`

These wireframes fix *what is on each screen and why*. Colour, type, and spacing
are the Designer's call. There is no weekly-calendar screen, and no
user-facing "My Plan" list screen either — a recipe joins the pending
grocery-list pool automatically the moment it's generated or selected, with
no separate "add" step (see S5, S5b, S7).

---

## S1 — Pantry (home) · F2

```
┌─────────────────────────────────┐
│  My Pantry              [ 📷 ]  │
├─────────────────────────────────┤
│  Spinach      1 bag             │
│  Eggs         6                 │
│  Rice         2 kg              │
│  Chicken      500 g             │
│  Yoghurt      1 tub             │
│  ...                            │
├─────────────────────────────────┤
│  [ 🍳  Cook something with this ]│
└─────────────────────────────────┘
   Pantry  │ Recipes │ List
```
The pantry *is* the entry point; the camera icon starts a receipt scan (F1),
and "Cook something with this" starts item selection (F3).

## S2 — Scan & review receipt · F1

```
┌─────────────────────────────────┐
│  ← Scan receipt                 │
├─────────────────────────────────┤
│  [   📷 camera preview     ]    │
│                                 │
│  Parsed items:                  │
│   Spinach   1 bag        ✓      │
│   Eggs      6             ✓     │
│   Spmach    250g   ⚠ check name │
│                                 │
│         [   Save to pantry   ]  │
└─────────────────────────────────┘
```
No typing for a correct scan — Nan only touches the one flagged line (NFR3).
This screen is the adoption risk named in the Charter: OCR must be tested
against real, messy Thai and international receipts.

## S3 — Consent (first generation only) · LR1, LR2, LR7

```
┌─────────────────────────────────┐
│  Before we generate a recipe    │
├─────────────────────────────────┤
│  We send to our AI service:     │
│    ✓ your selected ingredients  │
│    ✓ your dietary filters       │
│                                 │
│  We never send:                 │
│    ✕ your name or email         │
│    ✕ your address               │
│                                 │
│  [ ] I agree to Terms & the AI  │
│      and Food Safety Disclaimer │
│  [ ] I consent to the above     │
│      data being sent            │
│                                 │
│         [  Continue  ]          │
└─────────────────────────────────┘
```
Two **separate** checkboxes — Terms acceptance and AI-transfer consent are
different consents (LR2, LR7). Plain list, not a legal blob, so it reads as
information rather than a wall.

## S4 — Select items to cook · F3

```
┌─────────────────────────────────┐
│  What do you want to use?       │
├─────────────────────────────────┤
│  [x] Spinach      1 bag         │
│  [x] Eggs         6             │
│  [x] Rice         2 kg          │
│  [ ] Chicken      500 g         │
│  [ ] Yoghurt      1 tub         │
├─────────────────────────────────┤
│         [  Generate recipe  ]   │
└─────────────────────────────────┘
```
Selection is explicit — the recipe is built only from what Nan checks (F3,
NFR5), not from the whole pantry silently.

## S5 — Generated recipe · F3, F5, F6, F4

```
┌─────────────────────────────────┐
│  Spinach & Egg Skillet          │
│  ⏱ 20 min   ·  gluten-free ✓    │
├─────────────────────────────────┤
│  USES FROM YOUR PANTRY          │
│  • Spinach 1 bag                │
│  • Eggs 3                       │
│  • Rice 1 cup                   │
│  STAPLES  salt · oil · pepper   │
├─────────────────────────────────┤
│  1. Heat oil ...                │
│  2. ...                         │
├─────────────────────────────────┤
│ [ Mark as cooked ] [ Regenerate ]│
│           [ Save ]               │
└─────────────────────────────────┘
```
Showing *which* selected pantry items it used is what makes the AI
trustworthy (P1). The dietary badge is the visible half of NFR6. There is
no "Add to plan" button — the recipe already joined the pending grocery-list
pool the moment it was generated (F4, NFR12). "Regenerate" replaces this
recipe with a new one from the same selection; "Mark as cooked" moves to S6.

## S5b — Recipe Library · F5, F7, F4

```
┌─────────────────────────────────┐
│  My Recipes      🔍 by ingredient│
├─────────────────────────────────┤
│  Spinach & Egg Skillet          │
│  Chicken Rice                   │
│  Tomato Pasta                   │
│  ...                            │
├─────────────────────────────────┤
│           [  View  ]            │
└─────────────────────────────────┘
   Pantry  │ Recipes │ List
```
Reached from the **Recipes** tab — no pantry or receipt-scan step in between.
Searching by ingredient (F7) filters this same list. Selecting a recipe here
(re)joins the pending grocery-list pool automatically, the same way
generating one does on S5 — no "Add to plan" button, and it works the same
whether the pantry is full, partly stocked, or empty.

## S6 — Cooked confirmation · F2, NFR11

```
┌─────────────────────────────────┐
│  Nice! What's left over?        │
├─────────────────────────────────┤
│  Removed from pantry:           │
│   Spinach   1 bag   ✓           │
│   Eggs      3        ✓          │
│   Rice      1 cup    ✓          │
├─────────────────────────────────┤
│         [  Confirm  ]           │
└─────────────────────────────────┘
```
Reached only from "Mark as cooked" on S5 — there is no separate "My Plan"
list to open first. Confirming takes ≤ 2 taps (NFR11); if Nan doesn't
confirm, the pantry is left unchanged rather than guessed.

## S7 — Grocery list · F4, NFR7

```
┌─────────────────────────────────┐
│  Shopping list · 6 items        │
│  (14 ingredients already in     │
│   your pantry were removed)     │
├─────────────────────────────────┤
│  [ ] Chicken thighs   500 g     │
│  [ ] Garlic           1 bulb    │
│  [ ] Soy sauce        1 btl     │
│  ...                            │
└─────────────────────────────────┘
```
The "14 already in your pantry" line is the payoff for P3 — it shows the user
what they did **not** have to buy. That number is also the demo moment.

---

## Screen ↔ requirement map

| Screen | Requirements |
|---|---|
| S1 Pantry | F2, NFR9 |
| S2 Scan & review receipt | F1, NFR2, NFR3 |
| S3 Consent | LR1, LR2, LR7 |
| S4 Select items | F3 |
| S5 Recipe | F3, F5, F6, F4, NFR4, NFR5, NFR6, NFR12, LR8 |
| S5b Recipe Library | F5, F7, F4, NFR12 |
| S6 Cooked confirmation | F2, NFR11 |
| S7 Grocery list | F4, NFR7, LR8 |
