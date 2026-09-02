# Prototype — low-fidelity wireframes

- Date: 2026-09-02 (W4, DISCOVER)
- Fidelity: **low — layout and content only.** No production code; BUILD starts W6.
- Owner: **Thwin Khant Nyar Zaw (Designer)** produces the visual version.
- Visual file: _link the Figma / Canva / scanned sketch here before W5_ →
  `TODO: <link>`

These wireframes fix *what is on each screen and why*. Colour, type, and spacing
are the Designer's call.

---

## S1 — Pantry (home) · F1, F2

```
┌─────────────────────────────────┐
│  My Pantry              [ + ]   │
├─────────────────────────────────┤
│  ⚠ EXPIRING SOON                │
│  Spinach      1 bag    2 days   │
│  Eggs         6        3 days   │
├─────────────────────────────────┤
│  Rice         2 kg     Nov 12   │
│  Chicken      500 g    Sep 20   │
│  Yoghurt      1 tub    Sep 14   │
│  ...                            │
├─────────────────────────────────┤
│  [ 🍳  Cook something with this ]│
└─────────────────────────────────┘
   Pantry  │ Plan │ Recipes │ List
```
Expiry-first order is the default, not a filter the user must find (F2, P1).
The primary action sits on the pantry screen — the pantry *is* the entry point.

## S2 — Add item · F1, NFR2

```
┌─────────────────────────────────┐
│  ← Add to pantry                │
├─────────────────────────────────┤
│  Item     [ Spinach          ]  │
│  Quantity [ 1 ] [ bag  ▾ ]      │
│  Expires  [ Sep 4, 2026    📅]  │
│                                 │
│         [   Save & add next  ]  │
└─────────────────────────────────┘
```
Three fields, nothing else. "Save & add next" keeps focus in the form so 20
items take under 6 minutes (NFR2). This screen is the adoption risk — every
extra field costs users in week 1.

## S3 — Consent (first generation only) · F8, LR2, LR7

```
┌─────────────────────────────────┐
│  Before we generate a recipe    │
├─────────────────────────────────┤
│  We send to our AI service:     │
│    ✓ your ingredient names      │
│    ✓ quantities & expiry dates  │
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

## S4 — Generated recipe · F3, F7, LR8

```
┌─────────────────────────────────┐
│  Spinach & Egg Skillet          │
│  ⏱ 20 min   ·  gluten-free ✓    │
├─────────────────────────────────┤
│  USES FROM YOUR PANTRY          │
│  • Spinach 1 bag   ⚠ 2 days     │
│  • Eggs 3          ⚠ 3 days     │
│  • Rice 1 cup                   │
│  STAPLES  salt · oil · pepper   │
├─────────────────────────────────┤
│  1. Heat oil ...                │
│  2. ...                         │
├─────────────────────────────────┤
│ [ Save ]  [ Add to a day ▾ ]    │
└─────────────────────────────────┘
```
Showing *which* pantry items it used — and their expiry warning — is what makes
the AI trustworthy (P1). The dietary badge is the visible half of NFR5.

## S4b — AI unavailable · F13, NFR7

```
┌─────────────────────────────────┐
│  ⚠ Recipe generation is offline │
│  Here's what you can cook from  │
│  your saved recipes instead:    │
│                                 │
│  • Fried rice        4/5 items  │
│  • Omelette          5/5 items  │
└─────────────────────────────────┘
```
The app stays useful when the third-party service is down (Charter risk:
AI cost & availability).

## S5 — Weekly plan · F5, F9

```
┌─────────────────────────────────┐
│  This week          Sep 2 – 8   │
├─────────────────────────────────┤
│  Wed  —                    [+]  │
│  Thu  Spinach & Egg Skillet ✓   │
│  Fri  Chicken Rice         [+]  │
│  Sat  —                    [+]  │
├─────────────────────────────────┤
│   [  Build my shopping list  ]  │
└─────────────────────────────────┘
```
The ✓ marks "cooked" and triggers the pantry deduction (F9) — the mechanism
that keeps the pantry accurate without re-entry.

## S6 — Grocery list · F6, NFR6

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
| S1 Pantry | F1, F2, F12, NFR9 |
| S2 Add item | F1, NFR2 |
| S3 Consent | F8, LR1, LR2, LR7 |
| S4 Recipe | F3, F7, NFR3, NFR4, NFR5, LR8 |
| S4b Fallback | F13, NFR7, NFR8 |
| S5 Weekly plan | F5, F9, F12, LR8 |
| S6 Grocery list | F6, NFR6, LR8 |

Not prototyped this phase: F10 ingredient search, F11 manual recipe entry (both
Should), F14–F16 (Could), F17–F18 (Won't).
