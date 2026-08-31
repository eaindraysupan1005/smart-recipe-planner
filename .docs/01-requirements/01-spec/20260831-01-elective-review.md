# Requirement Spec — Elective Review (ElectiveLens)

- Date: 2026-08-31
- No: 01
- Topic: elective-review
- Phase: DISCOVER (no production code)
- Legal source: [rule.md](../../../rule.md) (Apex W2 legal & compliance rules)

## 1. Problem & users

### Users
- **Primary:** MFU undergraduates (all year levels) who register for electives.
  1st- and 2nd-year students feel the pain most.
- **Secondary:** Upper-year students who write reviews of electives they have
  already taken.
- **Constraint from research:** almost all 14 survey respondents said they would
  only write a review **anonymously**.

### Interview pains (14-response survey + interviews)
- **P1:** Students can't find out a course's real workload and difficulty before
  registering; the REG system syllabus isn't enough. Many report the course was
  "harder than expected."
- **P2:** An instructor's grading style, attendance strictness, and exam format
  are unknown until it's too late to drop the course.
- **P3:** Course info lives only in senior and friend group chats — scattered,
  outdated — and the MFU/REG website is often down.

## 2. Functional requirements

| ID | User story | MoSCoW | Traces |
|----|-----------|--------|--------|
| F1 | As a past student, I want to submit an anonymous review of a course I took, rating workload, grading style, attendance policy, and exam format on a fixed scale plus a written comment, so that future students learn what the syllabus doesn't say. | Must | solves P1, P2 |
| F2 | As a registering student, I want to open a course page and see aggregate ratings for workload, grading style, attendance policy, and exam format, so that I can judge difficulty before I register. | Must | solves P1, P2 |
| F3 | As a registering student, I want to read the written reviews from verified past students on a course page, so that I get detail beyond the numbers. | Must | solves P1, P2, P3 |
| F4 | As a student, I want all elective information in one always-available place instead of group chats and the REG site, so that I don't depend on scattered or offline sources. | Must | solves P3 |
| F5 | As a past student, I want to verify I actually enrolled in a course (via MFU SSO) before I can review it, so that reviews come from real students. | Must | solves P1, P2 |
| F6 | As a reviewer, I want to accept the Community Guidelines/Terms before my first review, so that I know the rules for acceptable content. | Must | solves P1 (trust), LR4 |
| F7 | As a registering student, I want to search and filter courses by name/code and sort by rating, so that I can find candidate electives quickly. | Should | solves P3 |
| F8 | As a reader, I want each review to show a "verified enrollment" badge, so that I can trust it is from someone who took the course. | Should | solves P1, P2 |
| F9 | As a reviewer, I want to edit or delete my own review, so that I can correct or retract what I wrote. | Should | solves P1 |
| F10 | As a reader, I want to flag a review as inappropriate or fake, so that moderators can act on it. | Should | solves P1 |
| F11 | As a moderator, I want to review flagged content and approve or take down reviews, so that the platform stays trustworthy. | Should | solves P1 |
| F12 | As a student, I want to react to a review as "helpful", so that the most useful reviews surface first. | Could | solves P3 |
| F13 | As a registering student, I want to compare two or more courses side by side, so that I can choose between electives faster. | Could | solves P1, P3 |
| F14 | As a user, I do not need public reviewer profiles, follower counts, or any public reviewer identity in this phase. | Won't | (protects anonymity; out of scope) |
| F15 | As a user, I do not need changes to REG registration mechanics or seat allocation in this phase. | Won't | out of scope |

## 3. Non-functional requirements

- **NFR1:** In a task-based pilot, the median time for a student to decide on an
  elective drops from ~60+ minutes (baseline) to **under 15 minutes** using the
  platform.
- **NFR2:** A course page (aggregate ratings + first 10 reviews) loads in
  **under 3 seconds** on a mid-range phone over a typical mobile connection.
- **NFR3:** The platform is available **≥ 99.0%** per calendar month
  (independent of MFU/REG uptime).
- **NFR4:** Submitting a review takes **no more than 5 form fields plus one
  comment box** and completes in **under 2 minutes** for a typical user.
- **NFR5:** Aggregate ratings recompute and reflect a newly published review
  within **60 seconds**.
- **NFR6:** Search returns results in **under 1 second** for a catalogue of up to
  **2,000 courses**.
- **NFR7:** The stored link between an anonymous review and its posting account
  is encrypted; decryption is possible only for **1 named admin role** and every
  access is logged.
- **NFR8:** Access/action logs are retained for **≥ 90 days** (configured
  explicitly, not left at cloud defaults).

## 4. Legal requirements (from rule.md)

### PDPA
- **LR1 (PDPA — minimise / delete):** After SSO enrollment verification
  succeeds, the system must delete the raw student ID and university email and
  keep only a boolean `verified` flag plus the course entitlement. Raw
  identifiers must not persist in any table or backup beyond the verification
  transaction. *Testable: query all stores for raw ID/email after verification →
  none found.*
- **LR2 (PDPA — encrypted anonymous link):** The system must store the mapping
  between an anonymous review and its real posting account in encrypted form,
  with decryption restricted to a single named admin role; every decryption is
  written to an audit log. *Testable: DB dump shows ciphertext only; non-admin
  role cannot resolve author.*
- **LR3 (PDPA — instructor names / SSO token / purpose limit):**
  (a) Instructor names are treated as personal data and shown only in a
  teaching-role context on a course page, never in listings unrelated to
  teaching. (b) University SSO integration stores only a verification token,
  never the SSO password or credential. (c) The system sends students only
  account and moderation notices unless the student separately opts in to other
  messages. *Testable: token store contains no credential; no marketing send
  without opt-in record.*

### Computer Crime Act §26
- **LR4 (CCA §26 — posting log):** Every review submission is logged with
  posting account ID, IP address, and timestamp, stored separately from the
  publicly displayed review. *Testable: each published review has a matching log
  row with all three fields.*
- **LR5 (CCA §26 — edit/delete log, 90-day retention):** Every edit or delete
  action on a review is logged with actor identity, IP, and timestamp, and the
  log plus the original review content is retained **≥ 90 days even after the
  review is deleted**. *Testable: delete a review → log and original content
  still retrievable internally at day 89.*
- **LR6 (CCA §26 — authority hold / takedown retention):** The system can flag a
  specific record for extended retention (up to 1 year) without altering its
  content, and a review removed from public view due to a legal complaint is
  still retained internally with its log for the required period. *Testable:
  set hold flag → content unchanged, purge job skips it.*

### Electronic Transactions Act §9 / 26 / 28
- **LR7 (ETA §9/26 — acceptance record):** When a user clicks "I agree" on the
  Community Guidelines/Terms, the system records user ID, timestamp, and terms
  version as a retrievable acceptance record. *Testable: fetch acceptance record
  by user ID returns version + timestamp.*
- **LR8 (ETA §26/28 — unalterable moderation decisions):** Every moderation
  decision (takedown, rejection of a flagged review, instructor dispute outcome)
  is stored with decision, reasoning, timestamp, and approving/ rejecting
  moderator identity in append-only / unalterable form; silent edits afterward
  are not permitted. *Testable: attempt to update a decision row → rejected;
  history preserved.*
- **LR9 (ETA §9/28 — verified badge proof; confirmation record):**
  (a) Each "verified enrollment" badge is backed by a timestamped proof (e.g.
  SSO token reference) linking the badge to the actual enrolled student.
  (b) A post-submission confirmation ("review published") is stored as a
  retrievable record, not only a transient UI notice.
  (c) The system must not use "certified" or CA-backed signature language unless
  a licensed Certification Authority is actually integrated. *Testable: badge
  resolves to a proof record with timestamp; confirmation retrievable later.*

## 5. Scope

### In scope
- Anonymous review submission with the four rating dimensions (workload, grading
  style, attendance policy, exam format) + written comment (F1).
- Course pages with aggregate ratings and verified-student written reviews
  (F2, F3).
- Single always-available catalogue of electives (F4).
- MFU SSO enrollment verification producing only a token/flag (F5, LR1, LR3).
- Terms/Guidelines acceptance capture (F6, LR7).
- Logging, retention, encrypted author link, moderation-decision store
  (LR2, LR4–LR9).
- Should-have: search/filter/sort, verified badge, self edit/delete, flagging,
  moderator queue (F7–F11).

### Out of scope
- Limited seats in popular electives; REG registration mechanics; anything that
  changes REG itself (F15).
- Public reviewer profiles / reviewer identity / social graph (F14).
- Could-haves not committed this phase: helpful reactions (F12), side-by-side
  course comparison (F13).
- Integration of a licensed Certification Authority (explicitly excluded by
  LR9c).

### The ONE core workflow this phase builds end-to-end
A verified past student writes an anonymous review of a course they took
(workload / grading / attendance / exam ratings + comment) → the next student
opens that course page and reads it before registering.
