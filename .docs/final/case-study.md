# Case Study — What2Cook (Smart Recipe & Pantry Assistant)

Team Apex · SE Case Studies 1305493/2569

## Problem

People who cook for themselves 4+ times a week waste a meaningful share of
the food they buy, for three documented reasons (interview pains, spec
§1 — [20260902-01-pantry-meal-planning.md](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md)):

- **P1 — Forgotten leftovers.** Small amounts left after cooking (one egg,
  two tomatoes, half an onion) get pushed to the back of the fridge and
  thrown away once spoiled.
- **P2 — Decision fatigue & unusable recipes.** Even knowing what's left,
  turning a random handful of ingredients into a meal is effortful; most
  recipes demand a shopping trip for one or two missing items, so people
  default to takeout.
- **P3 — Disconnected planning & shopping.** Meal plans, saved recipes, and
  grocery lists live in different places (notes apps, screenshots, memory),
  so people over-buy what they already have and forget what they need.

*(Interview count/sources are not yet documented in the spec — see the open
gap in the repo audit. This is a known item to close before submission: at
least 5 real interviews, or a clearly labelled SECONDARY source.)*

## Process

One core workflow, scoped deliberately to avoid a weekly-calendar meal
planner (Charter guardrail):

> **Scan a receipt → pantry updates automatically → pick pantry items → AI
> generates a recipe (respecting dietary filters) → mark cooked & confirm
> leftovers → grocery list builds itself from what's still missing.**

Built as a React + TypeScript frontend and a Node/Express + TypeScript
backend ([frontend/](../../frontend), [backend/](../../backend)), with:

- **Requirements first:** interview pains → 7 Must functional requirements
  (F1–F7) → MoSCoW backlog ([backlog.md](../01-requirements/backlog.md)),
  every row traced to a requirement ID.
- **Legal rules built in, not bolted on:** `rule.md` turns PDPA / Computer
  Crime Act §26 / Electronic Transactions Act §9/26/28 into numbered legal
  requirements (LR1–LR9) folded directly into the spec, not left as a
  separate compliance document (see `ai-logic.md` and the security
  checklist for how these are enforced in code).
- **Design before code:** feature list, user journey, low-fi prototype, and
  diagrams (context, use case, architecture, activity) in
  [.docs/02-design/](../02-design) before any screen was built.
- **AI as a cascade with a safety net**, not a single prompt call — see
  [ai-logic.md](ai-logic.md) for the full PICK → ADAPT → INVENT → local-fallback
  design, and why allergen/diet safety is checked twice (by the model's
  system prompt *and* independently in code).

## Outcome

- A working demo: one-command run (`npm run demo`) with a seeded account,
  12 pantry items, a saved recipe, and a pending grocery list — see
  [README.md](../../README.md) for the 4-minute demo path.
- **No live/deployed URL yet** — the app currently runs locally only (no
  hosting configured). This is an open gap to close before final
  submission if a public link is required.
- Real-user testing, SUS/before-after numbers, and an issue log are **not
  yet captured** in the repo (test plan exists, but results don't) — see
  the repo gap audit for the full list. `comparison-table.md` in this same
  folder is intentionally left blank until those numbers exist, so nothing
  here is a placeholder presented as a result.
