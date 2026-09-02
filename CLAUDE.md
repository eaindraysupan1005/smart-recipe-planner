# CLAUDE.md

Project context for Claude Code. Loaded automatically at the start of every session.

## Project

**Smart Recipe Planner & Pantry Manager** — a platform that helps home cooks
decide what to cook from the ingredients they already own. Users log pantry
items with quantity and expiry date; the system generates AI recipes around what
is about to expire (respecting dietary filters), assigns meals to a weekly
calendar, and turns that plan into a grocery list containing only the missing
items. Goal: less household food waste, less weekly planning time.

Team: **Apex** (SE Case Studies, 1305493, 1/2569).
Source of truth for vision, roles, and scope:
[Smart Recipe Planner & Pantry Manager - Charter.md](Smart%20Recipe%20Planner%20&%20Pantry%20Manager%20-%20Charter.md).

Course phase: **DISCOVER** (W1–W5). No production code yet — the work right now
is requirements, backlog, design, and compliance, ending at the User Validation
Gate (W5, Sep 9 2026).

## Legal & compliance rules — always apply

All agent behaviour and every requirement must comply with the team's legal
rules in **[rule.md](rule.md)** (from Week 2). It covers three Thai laws:

- **PDPA** — dietary filters that reveal health/religion are **sensitive data**
  needing explicit opt-in; disclose and consent before sending pantry data to a
  third-party AI service and send minimum fields only; pantry data used only for
  recipes/plan/grocery list; full delete on account deletion; store only login
  tokens, never credentials.
- **Computer Crime Act §26** — keep access/traffic logs (account ID, IP,
  timestamp) for ≥90 days for user-created content (manual recipes, saved AI
  recipes, meal plans), retained even after the item is edited or deleted.
- **Electronic Transactions Act §9 / 26 / 28** — retrievable acceptance records
  for Terms / AI & Food Safety Disclaimer and for consent (and withdrawal);
  reproducible AI-output records (text, model version, pantry snapshot, filters,
  timestamp); admin overrides stored unalterably; no "certified" language
  without a real certifying party.

When writing a requirement spec, fold the Must-have rules above into the spec
as numbered legal requirements (LR1, LR2, LR3…). Do not leave `rule.md` as a
separate file only.

## Product guardrails (from the Charter)

- **One core workflow** this semester: *pantry in → AI recipe → meal on the
  calendar → grocery list out*. Anything outside that chain is Should/Could/Won't.
- **Measurable metric** — before/after food waste and weekly planning time.
- Known risks to respect in every requirement: AI output quality (must use real
  pantry items and honour dietary filters), pantry data accuracy, manual-entry
  friction, AI cost/rate limits (graceful degradation to saved recipes), and
  self-reported measurement.

## Repository structure

```
.claude/
  agents/
    requirement-writer.md      # raw pain notes -> requirement spec + backlog update
    backlog-auditor.md         # read-only sync check between specs and backlog
  skills/
    capture-requirement/SKILL.md  # invoke: /capture-requirement
    audit-backlog/SKILL.md        # invoke: /audit-backlog
.docs/
  01-requirements/
    01-spec/{YYYYMMDD}-{no}-{topic}.md   # one requirement spec per topic
    backlog.md                           # prioritised backlog, MoSCoW
    05-log/{YYYYMMDD}-log.md             # work log
CLAUDE.md
rule.md                                  # legal/compliance rules (from W2)
Smart Recipe Planner & Pantry Manager - Charter.md   # W1 company charter
```

### Requirement spec files (`.docs/01-requirements/01-spec/`)

Filename: `{YYYYMMDD}-{no}-{topic}.md`
(e.g. `20260902-01-pantry-meal-planning.md`). Each spec has five parts:

1. **Problem & users** — who is affected + interview pains (P1, P2, P3…)
2. **Functional** — F1, F2… as user stories (`As a…, I want…, so that…`) with
   MoSCoW priority (Must / Should / Could / Won't)
3. **Non-functional** — NFR1, NFR2… each measurable (time, count, %) — never
   "fast" or "good"
4. **Legal** — LR1, LR2… pulled from `rule.md`
5. **Scope** — in / out, and the ONE core workflow this phase builds

### Backlog (`.docs/01-requirements/backlog.md`)

Every backlog row traces back to a requirement ID and a real interview pain
(`Traces to: F1, P1`). No made-up requirements with no source.

## Working rules

- If anything is unclear, **ask and offer at least 3 options. Never guess.**
- Never fabricate interview pains or user quotes. Every `P<n>` in a spec comes
  from a real user interview.
- Keep the spec and the backlog in sync — run `/audit-backlog` after changes.
- Commit and push after any change under `.claude/` or `.docs/`
  (`git add .` → `git commit -m "…"` → `git push`).
