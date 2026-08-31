# Backlog — ElectiveLens

Prioritised by MoSCoW. Every row traces to a requirement ID and a real interview
pain (or a legal requirement). Source spec:
[20260831-01-elective-review.md](01-spec/20260831-01-elective-review.md).

## Must

| # | Item | Traces to |
|---|------|-----------|
| B1 | Anonymous review submission form: workload / grading / attendance / exam ratings + comment | F1, P1, P2 |
| B2 | Course page — aggregate ratings for the four dimensions | F2, P1, P2 |
| B3 | Course page — list of written reviews from verified past students | F3, P1, P2, P3 |
| B4 | Single always-available elective catalogue (independent of MFU/REG uptime) | F4, P3 |
| B5 | MFU SSO enrollment verification before reviewing | F5, P1, P2 |
| B6 | Community Guidelines / Terms acceptance gate before first review | F6, P1 |
| B7 | Delete raw student ID/email after verification; keep only verified flag | LR1 (PDPA) |
| B8 | Encrypted anonymous-review <-> account link, admin-only decryption + access audit | LR2 (PDPA) |
| B9 | Instructor names as personal data (teaching-role context only); SSO stores token only; notices-only messaging without opt-in | LR3 (PDPA) |
| B10 | Posting log: account ID + IP + timestamp, separate from public review | LR4 (CCA §26) |
| B11 | Edit/delete log + original content retained >=90 days after deletion | LR5 (CCA §26) |
| B12 | Extended-retention hold flag (up to 1 year) + retain legally removed reviews internally | LR6 (CCA §26) |
| B13 | Retrievable Terms/Guidelines acceptance record (user ID, timestamp, version) | LR7 (ETA §9/26) |
| B14 | Append-only / unalterable moderation decision store | LR8 (ETA §26/28) |
| B15 | Verified-enrollment badge proof + stored publish confirmation; no CA language without a real CA | LR9 (ETA §9/28) |

## Should

| # | Item | Traces to |
|---|------|-----------|
| B16 | Course search / filter / sort by rating | F7, P3 |
| B17 | "Verified enrollment" badge on reviews | F8, P1, P2 |
| B18 | Self-service edit / delete of own review | F9, P1 |
| B19 | Flag a review as inappropriate or fake | F10, P1 |
| B20 | Moderator queue: approve / take down flagged reviews | F11, P1 |

## Could

| # | Item | Traces to |
|---|------|-----------|
| B21 | "Helpful" reaction on reviews, used for sorting | F12, P3 |
| B22 | Side-by-side course comparison | F13, P1, P3 |

## Won't (this phase)

| # | Item | Traces to |
|---|------|-----------|
| B23 | Public reviewer profiles / reviewer identity / social graph | F14 |
| B24 | Changes to REG registration mechanics or seat allocation | F15 |
