---
name: capture-requirement
description: >-
  Capture raw interview pain notes for the Smart Recipe & Pantry
  Assistant and turn them into a numbered requirement spec (P/F/NFR/LR/Scope)
  plus backlog rows. Use when the team comes back from user interviews with
  messy notes, or when a new feature area needs specifying.
---

# Capture Requirement

Turn messy interview notes into a structured spec, then sync the backlog.

## Step 1 — collect the inputs

Ask the user for, and do not proceed without:

1. The **raw pain notes** (paste, or a file path). Who said it, and when.
2. A **topic name** for the file slug (e.g. `receipt-scanning`,
   `pantry-tracking`, `ai-recipe-generation`, `grocery-list`).
3. Confirmation that every pain came from a **real user interview** — if one
   did not, stop and ask before writing it into the spec.

If anything is unclear, **ask and offer at least 3 options. Never guess.**
Never invent an interviewee, a quote, or a pain.

## Step 2 — hand off to the agent

Invoke the `requirement-writer` subagent with the pains and the topic. It
writes `.docs/01-requirements/01-spec/{YYYYMMDD}-{no}-{topic}.md` with the five
required parts:

1. Problem & users (P1, P2…)
2. Functional (F1, F2… + MoSCoW + `solves P<n>`)
3. Non-functional (NFR1… each with a number)
4. Legal (LR1… from [rule.md](../../../rule.md), each citing its law)
5. Scope (in / out / the ONE core workflow)

## Step 3 — sync and verify

1. The agent adds a backlog row for every **Must** `F` and every `LR`.
2. Run `/audit-backlog` and fix anything it reports.
3. Append a line to `.docs/01-requirements/05-log/{YYYYMMDD}-log.md`.
4. Commit and push:

```bash
git add . && git commit -m "Requirements: <topic> spec + backlog sync" && git push
```

## Product reminders

- **Must** requirements stay inside the one core workflow: receipt scan →
  pantry in → AI recipe → cook & confirm leftovers → grocery list. No
  calendar/day-assigned meal planner. Functional scope this phase is exactly
  **F1–F7**, one-to-one with the Charter's feature table.
- Every NFR needs a number (seconds, %, count) — "fast" and "easy" fail review.
- Dietary filters can reveal health or religion → sensitive data under PDPA, so
  any spec touching them needs an explicit-consent LR.
- Any spec that sends pantry data to a third-party AI service needs a transfer
  disclosure + data-minimisation LR and a reproducible AI-output record LR.
