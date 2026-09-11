**Apex — Legal & Compliance Rules (rule.md)**

6631503056  Chell Hmue May  
6631503057  Eaindray Su Pan  
6631503063  Kyu Kyu Thin  
6631503120  Hsu Myat Thwe  
6631503096  Thwin Khant Nyar Zaw

**Product: Smart Recipe & Pantry Assistant** (receipt-scanned pantry tracking,
AI recipe generation from selected on-hand ingredients, cooked-meal pantry
deduction, auto grocery list)

**PDPA (Personal Data Protection Act)**

**What it is:** Thailand's law governing how personal data is collected, used,
and disclosed, giving individuals rights over their own data — including data
that reveals health, religion, or belief, which is *sensitive* data needing
explicit consent.

**What it requires:** consent · purpose limit · minimise · access/correct/delete
· sensitive data · disclosure to third parties / cross-border transfer

**Rules for the agent:**

\- If the system stores a dietary filter that can reveal health or religion
(gluten-free/coeliac, diabetic, halal, allergy list), it must treat it as
**sensitive personal data** and collect it under explicit, separate opt-in
consent — never as a silent default.

\- If the system sends pantry items, dietary filters, or any user content to a
third-party AI service to generate a recipe, it must disclose that transfer,
obtain consent before the first generation, and send the **minimum** fields
needed (ingredient names + dietary flags) — never the account email, name, or
household identifiers.

\- If the system stores a pantry log, it must use it only for recipe
generation, planned meals, and the grocery list — not for advertising,
resale, or profiling — unless the user opts in separately.

\- If the user deletes their account, the system must delete the pantry items,
planned meals, saved recipes, and dietary profile, and must not retain them in
backups beyond the stated retention window (access logs excepted — see CCA §26).

\- If the system uses a social or email login, it must store only a
verification token, never the provider password or credential.

\- If the system exports or shares a grocery list (e.g. to a household member),
it must not include the other person's dietary or health data without that
person's own consent.

\- If the system reads a scanned grocery receipt, it must extract only item
names, quantities, and prices needed to build the pantry — a receipt image
must not be repurposed for anything beyond that (e.g. location, other
purchases profiling) without separate consent.

**Computer Crime Act §26**

**What it is**: A Thai law requiring service providers to keep traffic/access
logs so the origin of an online action can be traced if authorities request it.

**What it requires**: keep an access/traffic log ≥90 days, tied to a real user

**Rules for the agent:**

\- If the system lets a user create content (a saved AI recipe, a planned
meal), it must log the account ID, IP address, and timestamp separately from
the content itself.

\- If the system has an edit or delete action on a recipe, pantry item, or
planned meal, it must log actor identity, IP, and timestamp, kept for ≥90 days
even if the item is later deleted.

\- If a competent authority requests extended retention on a specific record,
the system must support flagging that record to keep it up to 1 year without
altering its content.

\- If a recipe is taken down (unsafe content, complaint), the system must still
retain the original content and its log internally for the required period.

\- If the system stores logs on third-party cloud infrastructure, it must
configure retention to ≥90 days, since default cloud settings are often shorter.

**Electronic Transactions Act §9 / 26 / 28**

**What it is:** A Thai law giving electronic records the same legal standing as
paper writing, and recognizing e-signatures as valid when they reliably link to
the signer.

**What it requires**: valid e-signature test (§9) · presumed-reliable signature
(§26) · CA duties (§28)

**Rules for the agent:**

\- If the user clicks "I agree" on the Terms of Use / AI & Food Safety
Disclaimer, the system must record the user ID, timestamp, and terms version as
a retrievable acceptance record.

\- If the user gives explicit consent for sensitive dietary/allergy data or for
sending pantry data to the AI service, the system must store that consent as a
retrievable, timestamped, versioned record — and store its withdrawal the same
way.

\- If the system shows an AI-generated recipe, it must store the exact generated
text, the model/version, the pantry snapshot and dietary filters used, and the
timestamp, so the output shown to the user can be reproduced in a later dispute.

\- If the system sends a confirmation (e.g. "meal added to plan", "grocery list
generated"), it must store that confirmation as a retrievable record, not just
a transient UI notice.

\- If the system displays any "certified", "nutritionist-approved", or
CA-backed signature language, it must not use that language unless a licensed
Certification Authority or a real certified professional is actually involved.
