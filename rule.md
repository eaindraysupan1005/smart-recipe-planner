**Apex — Legal & Compliance Rules (rule.md)**

6631503056  Chell Hmue May  
6631503057  Eaindray Su Pan  
6631503063  Kyu Kyu Thin  
6631503120  Hsu Myat Thwe  
6631503096  Thwin Khant Nyar Zaw

**Product: Course & Elective Review Platform** (workload, grading style, attendance policy, exam format reviews)

**PDPA (Personal Data Protection Act)**

**What it is:** Thailand's law governing how personal data is collected, used, and disclosed, giving individuals rights over their own data — including third parties named in user content, not just account holders.

**What it requires:** consent · purpose limit · minimise · access/correct/delete · sensitive data

**Rules for the agent:**

\- If the system stores a university email or student ID for enrollment verification, it must delete the raw ID once verified and keep only a verified flag.

\- If the system uses a student's email, it must not send anything beyond account/moderation notices unless the student opts in separately.

\- If the system stores a review that names an instructor, it must treat the instructor's name as personal data and only display it in a teaching-role context.

\- If the system stores a link between an anonymous review and its real posting account, it must encrypt that link and restrict access to a named admin role.

\- If the system uses university SSO for verification, it must store only a verification token, never the SSO password or credential.

**Computer Crime Act §26**

**What it is**: A Thai law requiring service providers to keep traffic/access logs so the origin of an online post can be traced if authorities request it.

**What it requires**: keep an access/traffic log ≥90 days, tied to a real user

**Rules for the agent:**

\- If the system has a review-posting feature, it must log the posting account ID, IP address, and timestamp separately from the publicly shown review.

\- If the system has an edit or delete action on a review, it must log actor identity, IP, and timestamp, kept for ≥90 days even if the review is later deleted.

\- If a competent authority requests extended retention on a specific record, the system must support flagging that record to keep it up to 1 year without altering its content.

\- If a review is taken down from public view due to a legal complaint, the system must still retain the original content and its log internally for the required period.

\- If the system stores logs on third-party cloud infrastructure, it must configure retention to ≥90 days, since default cloud settings are often shorter.

**Electronic Transactions Act §9 / 26 / 28**

**What it is:** A Thai law giving electronic records the same legal standing as paper writing, and recognizing e-signatures as valid when they reliably link to the signer.

**What it requires**: valid e-signature test (§9) · presumed-reliable signature (§26) · CA duties (§28)

**Rules for the agent:**

\- If the user clicks "I agree" on the Community Guidelines/Terms of Use, the system must record the user ID, timestamp, and terms version as a retrievable acceptance record.

\- If an instructor disputes a review and requests takedown, the system must record the decision, reasoning, timestamp, and approving moderator in unalterable form.

\- If the system shows a "verified enrollment" badge on a review, it must generate a timestamped proof (e.g., SSO token) linking the claim to the actual enrolled student.

\- If the system sends a post-submission confirmation (e.g., "review published"), it must store that confirmation as a retrievable record, not just a transient UI notice.

\- If a moderator rejects a flagged review, the system must record moderator identity and timestamp as a signed decision, and must not allow silent edits afterward.

\- If the system displays any "certified" or CA-backed signature language, it must not use that language unless a licensed Certification Authority is actually integrated.

