# CLAUDE.md

Project context for Claude Code. Loaded automatically at the start of every session.

## Project

**Elective Review System** — a Course & Elective Review Platform where students
review university courses and electives (workload, grading style, attendance
policy, exam format). Team: **Apex** (SE Case Studies, 1305493, 1/2569).

Course phase: **DISCOVER** (W1–W5). No production code yet — the work right now
is requirements, backlog, design, and compliance, ending at the User Validation
Gate (W5, Sep 9 2026).

## Legal & compliance rules — always apply

All agent behaviour and every requirement must comply with the team's legal
rules in **[rule.md](rule.md)** (from Week 2). It covers three Thai laws:

- **PDPA** — consent, purpose limit, data minimisation, delete raw IDs after
  verification, treat instructor names as personal data, encrypt the link
  between anonymous reviews and real accounts.
- **Computer Crime Act §26** — keep access/traffic logs (account ID, IP,
  timestamp) for ≥90 days, tied to a real user, retained even after a review
  is edited or deleted.
- **Electronic Transactions Act §9 / 26 / 28** — store retrievable acceptance
  records for Terms/Guidelines clicks, moderation decisions in unalterable
  form, timestamped proof for "verified enrollment" badges.

When writing a requirement spec, fold the Must-have rules above into the spec
as numbered legal requirements (LR1, LR2, LR3…). Do not leave `rule.md` as a
separate file only.

## Repository structure

```
.claude/
  agents/
    requirement-writer.md      # raw pain notes -> requirement spec + backlog update
    backlog-auditor.md
  skills/
    capture-requirement/SKILL.md
    audit-backlog/SKILL.md      # invoke: /audit-backlog
.docs/
  01-requirements/
    01-spec/{YYYYMMDD}-{no}-{topic}.md   # one requirement spec per topic
    backlog.md                           # prioritised backlog, MoSCoW
    05-log/{YYYYMMDD}-log.md             # work log
CLAUDE.md
rule.md                                  # legal/compliance rules (from W2)
```

### Requirement spec files (`.docs/01-requirements/01-spec/`)

Filename: `{YYYYMMDD}-{no}-{topic}.md` (e.g. `20260830-01-course-review.md`).
Each spec has five parts:

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
- Keep the spec and the backlog in sync — run `/audit-backlog` after changes.
- Commit and push after any change under `.claude/` or `.docs/`
  (`git add .` → `git commit -m "…"` → `git push`).
