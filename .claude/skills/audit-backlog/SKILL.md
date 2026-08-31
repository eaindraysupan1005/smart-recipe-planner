---
name: audit-backlog
description: >-
  Check that the requirement specs and the backlog are in sync. Every
  Must-priority functional requirement and every legal requirement (LR) must
  have a backlog row, and every backlog row must trace to a real requirement
  ID. Run after editing any spec or the backlog.
---

# Audit Backlog

Verify that `.docs/01-requirements/backlog.md` and the specs in
`.docs/01-requirements/01-spec/` agree.

## Steps

1. Read every spec file in `.docs/01-requirements/01-spec/`. Collect:
   - every functional requirement ID and its MoSCoW priority (`F1 Must`, …)
   - every legal requirement ID (`LR1`, `LR2`, …)
   - every interview pain ID (`P1`, `P2`, …)
2. Read `.docs/01-requirements/backlog.md`. Collect every row and its
   `Traces to:` references.
3. Report three lists:
   - **Missing** — Must `F` items and every `LR` with no backlog row.
   - **Orphan** — backlog rows whose `Traces to:` points to an ID that does
     not exist in any spec, or is empty.
   - **Priority mismatch** — a backlog row placed under the wrong MoSCoW
     heading versus the spec.
4. If two items look like the same thing but are worded differently, **do not
   merge them silently — ask**, and offer at least 3 options (merge / keep
   separate / rename one).

## Output

A short pass/fail summary, then the three lists above with the exact IDs.
Do not edit any file unless the user asks you to fix a specific gap.

## Rule

If anything is unclear, ask and offer at least 3 options. Never guess.
