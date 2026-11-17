# Final Submission Index — What2Cook (Smart Recipe & Pantry Assistant)

Team Apex · SE Case Studies 1305493/2569 · Repository branch for every item below: **`main`** unless noted.

Status key: ✅ in the repo · ❌ not in the repo (stated honestly, nothing invented).

**Live app:** <https://what2cook-ojt5.onrender.com/>

## 1) DISCOVER

| Item | Status | Link |
|---|---|---|
| Company Charter (members, roles) | ✅ | [Charter](../../Smart%20Recipe%20%26%20Pantry%20Assistant-%20Charter.md) |
| Charter team rules | ✅ | [Charter §8 Team Rules](../../Smart%20Recipe%20%26%20Pantry%20Assistant-%20Charter.md) |
| Real-user interviews (≥ 5) or SECONDARY review | ✅ | Pains P1–P3 are recorded in the [spec](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md) §1; interview count and sources are not documented |
| Lean Canvas (optional) | ❌ | Not made |
| Requirements spec (F, NFR, LR, scope) | ✅ | [spec](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md) |
| Product backlog (MoSCoW, Must marked) | ✅ | [backlog.md](../01-requirements/backlog.md) |
| PDPA / legal rules | ✅ | [rule.md](../../rule.md) |
| How the team uses AI | ✅ | [CLAUDE.md](../../CLAUDE.md), [.claude/agents](../../.claude/agents), [.claude/skills](../../.claude/skills) |
| Work logs | ✅ | [05-log](../01-requirements/05-log) |

## 2) BUILD

| Item | Status | Link |
|---|---|---|
| Use case diagram | ✅ | [02-use-case.md](../02-design/04-diagrams/02-use-case.md) · [UseCase.png](../02-design/04-diagrams/UseCase.png) |
| Activity diagram | ✅ | [04-activity.md](../02-design/04-diagrams/04-activity.md) |
| Sequence diagram | ✅ | [05-sequence.md](../02-design/04-diagrams/05-sequence.md) · [Sequence.png](../02-design/04-diagrams/Sequence.png) |
| Context diagram | ✅ | [01-context.md](../02-design/04-diagrams/01-context.md) |
| Architecture | ✅ | [03-architecture.md](../02-design/04-diagrams/03-architecture.md) · [Architecture.png](../02-design/04-diagrams/Architecture.png) |
| Feature list, user journey, prototype, design system | ✅ | [.docs/02-design](../02-design) |
| Database schema | ✅ | [schema.sql](../../backend/supabase/schema.sql) |
| Source code | ✅ | [frontend/](../../frontend) · [backend/](../../backend) |
| Own tests | ✅ | [backend/test](../../backend/test) — `npm test`: 62 tests, 62 pass (17 Nov 2026) |
| How to run, `.env.example`, test account | ✅ | [README.md](../../README.md) · [backend/.env.example](../../backend/.env.example) |
| Security checklist | ✅ | [02-security-checklist.md](../03-testing/02-security-checklist.md) |
| No secrets in repo | ✅ | `.env` is git-ignored; `.env.example` holds no values. Checked by [repo-checklist.test.ts](../../backend/test/repo-checklist.test.ts) |

## 3) TEST

| Item | Status | Link |
|---|---|---|
| Test plan | ✅ | [01-test-plan.md](../03-testing/01-test-plan.md) |
| Real-user session logs (U01–U16, codes only) | ✅ | [Round 1 (U01–U08)](../03-testing/03-uat-session-logs-round1.md) · [Round 2 (U09–U16)](../03-testing/04-uat-session-logs-round2.md) |
| Before / After numbers for every Must task | ✅ | [05-before-after.md](../03-testing/05-before-after.md) (charts in [charts/](../03-testing/charts)) |
| SUS responses and results | ✅ | [06-sus.md](../03-testing/06-sus.md) — 16 responses, mean 71.3 |
| Issue log (severity, change/fix, retest) | ✅ | [07-issue-log.md](../03-testing/07-issue-log.md) — severity, related change from git, Round 2 evidence, and the list of changes made before testing |

The team used SUS as its usability instrument. Real-user testing was done, so no `no-real-user-test.md` is needed.

## 4) DELIVER (this folder)

| Item | Status | Link |
|---|---|---|
| Case study (Problem, Process, Outcome + live URL) | ✅ | [case-study.md](case-study.md) · live app: <https://what2cook-ojt5.onrender.com/> |
| AI logic (Where, How, Prove, Measure) | ✅ | [ai-logic.md](ai-logic.md) — Prove and Measure use the test suite and the UAT results; a live-model allergen test set is listed there as not yet done |
| Comparison table (incl. AI row) | ✅ | [comparison-table.md](comparison-table.md) |
| Role statement — Eaindray Su Pan (AI Lead) | ✅ | [6631503057-eaindray-su-pan.md](role-statements/6631503057-eaindray-su-pan.md) |
| Role statement — Kyu Kyu Thin (QA/Test) | ✅ | [6631503063-kyu-kyu-thin.md](role-statements/6631503063-kyu-kyu-thin.md) |
| Role statement — Thwin Khant Nyar Zaw (Designer) | ✅ | [6631503096-thwin-khant-nyar-zaw.md](role-statements/6631503096-thwin-khant-nyar-zaw.md) |
| Role statement — Hsu Myat Thwe (Tech Lead) | ✅ | [6631503120-hsu-myat-thwe.md](role-statements/6631503120-hsu-myat-thwe.md) |
| Role statement — Chell Hmue May (Product Owner) | ❌ | Not yet written |

Reflections (≈ 300 words per member, due Sun 22 Nov 23:59) will be added to each role statement after the presentation.

## 5) ANYTHING ELSE

| Item | Link |
|---|---|
| AI use in the system and legal controls | [ai-logic.md](ai-logic.md), [rule.md](../../rule.md) |
| Design system | [design-system.md](../02-design/design-system.md) |
| Security checklist | [02-security-checklist.md](../03-testing/02-security-checklist.md) |
