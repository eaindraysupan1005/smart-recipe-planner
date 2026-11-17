# CLAUDE.md

Project context for Claude Code. Loaded automatically at the start of every session.

## Project

**Smart Recipe & Pantry Assistant** — a platform that helps people cooking for
themselves decide what to make from the ingredients they already have. Users
scan a grocery receipt to build their pantry automatically, then select the
items they want to use and the system generates a personalized AI recipe
around them (respecting dietary preferences). Once a meal is marked as cooked,
the app deducts the ingredients it used and asks the user to confirm what is
left over, so the pantry stays accurate without manual entry. Planned meals
are turned automatically into a grocery list containing only the items that
are actually missing. Goal: less household food waste, less weekly planning
time.

Team: **Apex** (SE Case Studies, 1305493, 1/2569).
Source of truth for vision, roles, and scope:
[Smart Recipe & Pantry Assistant- Charter.md](Smart%20Recipe%20%26%20Pantry%20Assistant-%20Charter.md).

Course phase: **All phases complete** (DISCOVER, BUILD, TEST, DELIVER) —
production code, testing, and final deliverables are done; this file now
describes a completed project, not a work-in-progress one.

## Legal & compliance rules — always apply

All agent behaviour and every requirement must comply with the team's legal
rules in **[rule.md](rule.md)** (from Week 2). It covers three Thai laws:

- **PDPA** — dietary filters that reveal health/religion are **sensitive data**
  needing explicit opt-in; disclose and consent before sending pantry data to a
  third-party AI service and send minimum fields only; pantry data used only for
  recipes/planned meals/grocery list; full delete on account deletion; store
  only login tokens, never credentials.
- **Computer Crime Act §26** — keep access/traffic logs (account ID, IP,
  timestamp) for ≥90 days for user-created content (saved AI recipes, planned
  meals), retained even after the item is edited or deleted.
- **Electronic Transactions Act §9 / 26 / 28** — retrievable acceptance records
  for Terms / AI & Food Safety Disclaimer and for consent (and withdrawal);
  reproducible AI-output records (text, model version, pantry snapshot, filters,
  timestamp); no "certified" language without a real certifying party.

When writing a requirement spec, fold the Must-have rules above into the spec
as numbered legal requirements (LR1, LR2, LR3…). Do not leave `rule.md` as a
separate file only.

## Product guardrails (from the Charter)

- **One core workflow** this semester: *receipt scan → pantry in → AI recipe →
  cook & confirm leftovers → grocery list out*. No weekly-calendar meal
  planner — planned meals are a flat list, not day-assigned. Anything outside
  that chain is Should/Could/Won't.
- **Functional scope this phase is exactly F1–F7**, matching the Charter's
  feature table: Receipt Scanner, Pantry Tracker, AI Recipe Generator, Auto
  Grocery List, Recipe Saving, Dietary Filters, Search by Ingredient. All
  seven are Core/Must — do not add F8+ without a new Charter feature behind it.
- **Measurable metric** — before/after food waste (≥20%) and weekly grocery
  cost (≥10%).
- Known risks to respect in every requirement: AI output quality (must use
  real, selected pantry items and honour dietary filters), receipt-scanning
  accuracy (OCR on varied/abbreviated formats), pantry data accuracy over
  time, confirmation fatigue (the cooked/leftover prompt must stay light),
  measurement difficulty (self-reported waste), consent prompt friction, and
  compliance scope creep. *(No per-user generation cap this phase — dropped
  from scope per Project Proposal v1.1; the Charter's Constraints & Risks list
  no longer names AI availability as a risk either, though NFR8 still covers
  it.)*

## How the team uses AI

Two separate uses — don't conflate them:

1. **AI as a dev/process tool (Claude Code).** The team uses Claude Code,
   guided by this file, to draft and keep in sync the DISCOVER/W4 paperwork:
   turning raw interview notes into requirement specs (`requirement-writer`
   agent / `/capture-requirement`), checking the spec-backlog-design stay
   traceable (`backlog-auditor`, `design-writer` agents / `/audit-backlog`,
   `/audit-design`), and drafting final deliverables such as
   `.docs/final/case-study.md` and `.docs/final/ai-logic.md`. A team member
   always reviews and approves what Claude drafts before it's committed —
   nothing here is auto-published. Each member's own personal use of AI
   tools (if any) is disclosed in their own file under
   `.docs/final/role-statements/`.
2. **AI as a product feature (Gemini).** Separate from the above — this is
   what the app itself does for its users: receipt photos are read with
   Gemini vision, and recipes are generated through a
   pick-from-dataset / adapt / invent cascade with a local rule-based
   fallback when Gemini is unavailable. What data goes in, how it's
   constrained (LR2 — minimum fields only), and how it's checked for
   allergen/dietary safety is written up in full in
   [.docs/final/ai-logic.md](.docs/final/ai-logic.md) — that file, not this
   one, is the source of truth for the product's AI logic.

## Repository structure

```
.claude/
  agents/
    requirement-writer.md      # raw pain notes -> requirement spec + backlog update
    backlog-auditor.md         # read-only sync check between specs and backlog
    design-writer.md           # spec -> feature list, journey, prototype, 4 diagrams
  skills/
    capture-requirement/SKILL.md  # invoke: /capture-requirement
    audit-backlog/SKILL.md        # invoke: /audit-backlog
    audit-design/SKILL.md         # invoke: /audit-design
.docs/
  01-requirements/
    01-spec/{YYYYMMDD}-{no}-{topic}.md   # one requirement spec per topic
    backlog.md                           # prioritised backlog, MoSCoW
    05-log/{YYYYMMDD}-log.md             # work log
  02-design/                             # W4 design draft
    01-feature-list.md                   # FE1..FEn, acceptance criteria
    02-user-journey.md                   # the one core workflow, step by step
    03-prototype.md                      # low-fi wireframes (no code)
    04-diagrams/                         # context, use case, architecture, activity
CLAUDE.md
rule.md                                  # legal/compliance rules (from W2)
Smart Recipe & Pantry Assistant- Charter.md   # W1 company charter
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
