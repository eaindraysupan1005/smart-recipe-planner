# Case Study — What2Cook (Smart Recipe & Pantry Assistant)

Team Apex · SE Case Studies 1305493/2569

**Live app:** <https://what2cook-ojt5.onrender.com/> (hosted on Render; sign in with the test account in the [README](../../README.md))

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

**Evidence:** 5 real-user interviews (U01–U05, students who cook for themselves,
2 Sep 2026): 5/5 had thrown food away (P1), 5/5 had hit recipes needing items
they lacked (P2), and 5/5 had bought something they already owned (P3). Full
answers, counts and limits (small sample, all students, U04/U05 cook under 4
times a week) are in
[interview-log.md](../01-requirements/02-interviews/interview-log.md).

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
- **Tested with real users in two rounds:** a [test plan](../03-testing/01-test-plan.md)
  with 15 test cases and 5 task-based UAT scenarios; Round 1 (8 users) found
  the problems, the team fixed them, Round 2 (8 different users) re-ran the
  same tasks, and 16 SUS questionnaire responses were collected.
- **AI as a cascade with a safety net**, not a single prompt call — see
  [ai-logic.md](ai-logic.md) for the full PICK → ADAPT → INVENT → local-fallback
  design, and why allergen/diet safety is checked twice (by the model's
  system prompt *and* independently in code).

## Outcome

- A working demo: one-command run (`npm run demo`) with a seeded account,
  12 pantry items, a saved recipe, and a pending grocery list — see
  [README.md](../../README.md) for the 4-minute demo path.
- **Live URL:** <https://what2cook-ojt5.onrender.com/> — the app is deployed on Render (the home page and the `/api/health` check both answer 200).
- **Real-user results** (two UAT rounds, 8 users each, 5 tasks; full numbers in
  [comparison-table.md](comparison-table.md) and
  [05-before-after.md](../03-testing/05-before-after.md)):

  | | Round 1 (before) | Round 2 (after) |
  |---|---|---|
  | Task attempts passed | 23/40 (57.5%) | 40/40 (100%) |
  | Users passing all 5 tasks | 0/8 | 8/8 |
  | AI recipe task (T2) passed | 2/8 | 8/8 |
  | Median AI recipe time (target ≤ 10 s) | 14.1 s | 8.4 s |
  | Median receipt-scan time (target ≤ 60 s) | 54.5 s | 12.4 s |
  | Issues observed / Severity-3 | 24 / 13 | 0 / 0 |

  Usability (SUS, 16 responses): mean **71.3**, median 72.5 — above the 68
  benchmark but below the 80.8 "excellent" threshold, with a wide spread
  (range 50–100; 7 of 16 responses below 68) — see
  [06-sus.md](../03-testing/06-sus.md). Issues, severities and Round 2 retest
  evidence: [07-issue-log.md](../03-testing/07-issue-log.md); session logs:
  [Round 1](../03-testing/03-uat-session-logs-round1.md),
  [Round 2](../03-testing/04-uat-session-logs-round2.md).
- **Limits of the evidence:** 8 users per round and different people in each
  round, so the improvement is indicative, not statistically proven. The
  Charter's food-waste (≥ 20%) and grocery-cost (≥ 10%) targets were **not
  measured** — the UAT tested task performance, not weeks of real cooking.
- **What is still open:** no live-model AI evaluation set (see
  [ai-logic.md](ai-logic.md)), and the interview count is not documented. The
  full status of every deliverable is in [README.md](README.md).
