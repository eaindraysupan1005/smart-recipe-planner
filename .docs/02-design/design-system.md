# Design system — Smart Recipe & Pantry Assistant

- Date: 2026-10-07
- Status: W4 design draft
- Source of truth: [03-prototype.md](./03-prototype.md)
- Scope: mobile-first UI for the one core workflow

This document turns the current low-fidelity prototype into a shared visual
language for the BUILD phase. It describes the intended UI direction; it does
not add features outside F1-F7 or replace the requirements in the
[requirement spec](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md).

## 1. Design principles

1. **Pantry first.** The pantry is the home screen and the starting point for
   cooking (F2).
2. **Make the next action obvious.** Each screen has one primary action:
   save, generate, mark as cooked, confirm, or build the list.
3. **Show the system's work.** Display quantities, selected ingredients,
   declared staples, missing grocery items, and low-confidence receipt lines.
   Never make the user guess what the app changed (P1, P3).
4. **Ask for effort only when it protects accuracy.** Receipt corrections and
   cooked/leftover confirmation are short, explicit checkpoints (NFR3,
   NFR11).
5. **Consent is a product interaction.** Terms acceptance and AI-transfer
   consent are separate, plain-language choices (LR1, LR2, LR7).
6. **Calm, inclusive, and non-judgmental.** Food, dietary needs, and mistakes
   use neutral language. No “certified” or “nutritionist-approved” claims
   (LR9).

## 2. Foundations

### 2.1 Colour tokens

Use semantic names in implementation so a theme or contrast correction does
not require changing screen-level styles.

| Token | Light value | Use |
|---|---|---|
| `color.bg` | `#F7F8F5` | App background |
| `color.surface` | `#FFFFFF` | Cards, sheets, and input surfaces |
| `color.text` | `#1F2933` | Primary text |
| `color.text-muted` | `#667085` | Supporting text and metadata |
| `color.border` | `#D9DEE5` | Dividers and control borders |
| `color.primary` | `#236B4E` | Primary actions, active tab, links |
| `color.primary-pressed` | `#18513A` | Pressed/selected primary controls |
| `color.primary-soft` | `#E4F1EA` | Selected rows and positive badges |
| `color.warning` | `#9A6700` | Low-confidence receipt items |
| `color.warning-soft` | `#FFF4D6` | Warning backgrounds |
| `color.danger` | `#B42318` | Blocking errors and destructive actions |
| `color.danger-soft` | `#FEE4E2` | Error backgrounds |

Colour is never the only indicator: pair warnings and errors with an icon,
label, or status text. Text and controls must meet WCAG AA contrast.

### 2.2 Typography

Use the platform sans-serif font with a readable fallback. Do not use
decorative display fonts; the interface should feel practical and trustworthy.

| Style | Size / line height | Weight | Use |
|---|---:|---:|---|
| `type.screen-title` | 24 / 32 | 700 | Screen headings such as “My Pantry” |
| `type.section-title` | 16 / 24 | 700 | “Uses from your pantry”, list sections |
| `type.body` | 16 / 24 | 400 | Instructions and primary content |
| `type.body-medium` | 16 / 24 | 600 | Selected rows and emphasized values |
| `type.label` | 14 / 20 | 600 | Buttons, field labels, badges |
| `type.caption` | 12 / 16 | 400 | Supporting metadata and timestamps |

Use sentence case. Keep labels short and action-oriented.

### 2.3 Spacing, shape, and elevation

- Base spacing unit: **4 px**. Use 4, 8, 12, 16, 24, and 32 px values.
- Screen horizontal padding: **16 px**.
- Minimum touch target: **44 × 44 px**, including icon-only controls.
- Standard control height: **48 px**.
- Card/input radius: **12 px**. Button radius: **10 px**. Badge radius:
  full pill.
- Use one subtle shadow for raised cards and bottom sheets only. Prefer
  borders and spacing over stacked shadows.
- Separate list rows with a divider or 12 px of whitespace; do not use dense
  tables on mobile.

## 3. Navigation and layout

### Primary navigation

The persistent bottom navigation has exactly three destinations:

| Tab | Icon meaning | Destination |
|---|---|---|
| Pantry | Pantry/container | S1 Pantry home |
| Recipes | Recipe/book | S5b Recipe Library |
| List | Checklist/basket | S7 Grocery list |

The active tab uses `color.primary` and a text label; inactive tabs use
`color.text-muted`. Do not add a calendar or “My Plan” tab. Pending recipes
join the grocery-list pool automatically (F4, NFR12), without an “Add to
plan” action.

### Screen structure

1. Top app bar: back button when needed, screen title, and at most one
   secondary action.
2. Content area: one clear task, with sections in the order the user needs
   them.
3. Sticky primary action when the task has a decisive submit action.
4. Bottom navigation on top-level screens only; hide it during focused
   capture, consent, and confirmation flows.

## 4. Component inventory

### Buttons

- **Primary:** filled `color.primary`; one per screen. Examples: “Save to
  pantry”, “Generate recipe”, “Confirm”.
- **Secondary:** outlined surface button for alternatives such as
  “Regenerate”.
- **Tertiary:** text button for low-emphasis navigation such as “Edit”.
- **Destructive:** danger styling only for deleting user data; never use it for
  ordinary correction or cancellation.
- Disabled buttons remain readable and explain the missing prerequisite nearby;
  do not silently fail.

### Pantry and ingredient rows

Every ingredient row shows the ingredient name and quantity on the same
hierarchy. Use a checkbox only when the user is selecting ingredients (S4);
use a check/status icon only after confirmation. A row may show:

- selected state (`color.primary-soft`);
- low-confidence warning (`color.warning-soft` plus “Check name”);
- missing/insufficient state in the grocery list.

### Cards and badges

Recipe cards show title, time, dietary badges, and the main pantry ingredient.
The generated recipe screen must show separate sections for **Uses from your
pantry** and **Staples**. Dietary badges are informative, not certification.

### Inputs and selection controls

- Checkboxes are used for the two separate consent decisions and ingredient
  selection.
- Checkboxes have visible labels and a generous hit area; never pre-check
  sensitive dietary consent.
- Search uses a labelled text field with a clear action and supports ingredient
  terms (F7).
- Quantity edits use a labelled field and unit; do not rely on colour or
  placeholder text alone.

### Status and feedback

Use inline status text for important outcomes:

- **Progress:** “Generating your recipe…” appears within 1 second of the
  action (NFR4).
- **Success:** confirm what was saved or deducted.
- **Warning:** identify the exact receipt line to review.
- **Error:** explain what the user can do next; never expose a raw AI/service
  error (NFR8).

## 5. Screen patterns

### S1 Pantry

Show the current inventory and quantities first. The camera icon starts the
receipt scan. The primary CTA is “Cook something with this”. Keep the list
useful at 200 items and preserve the under-3-second rendering target (NFR9).

### S2 Scan and review receipt

Show the camera preview, parsed lines, confidence warnings, and “Save to
pantry”. Correct lines remain untouched; only flagged lines require attention.
The user confirms all items before saving (NFR3).

### S3 Consent

Explain what is sent and what is not sent in two short lists. Render Terms +
AI/Food Safety Disclaimer acceptance and AI-transfer consent as **separate,
unchecked checkboxes**. The Continue button remains unavailable until the
required choices are made. Dietary opt-in is explicit, editable, and
deletable (LR1, LR2, LR7).

### S4 Select items

Use checkboxes and quantities. Make the selection boundary visible so the
recipe cannot silently use the entire pantry (F3, NFR5). The CTA states the
result: “Generate recipe”.

### S5 Generated recipe

Lead with the recipe name, preparation time, and dietary badges. Make pantry
usage auditable by naming each selected item and quantity. Provide “Mark as
cooked” as the primary action, “Regenerate” as the secondary action, and
“Save” as a lower-emphasis action. Do not add a separate grocery-pool button.

### S5b Recipe Library

Use searchable recipe cards/list rows. Searching by an ingredient filters the
same library (F7). Opening or selecting a recipe can rejoin the pending
grocery-list pool automatically; no intermediate planning screen is shown.

### S6 Cooked confirmation

Use a compact confirmation surface that lists deducted quantities and lets the
user adjust what is left over. Keep the path to confirmation at no more than
two taps and under 10 seconds (NFR11). If the user leaves without confirming,
leave the pantry unchanged.

### S7 Grocery list

Show the count, missing ingredients, quantities, and the positive payoff:
items already covered by the pantry. Use checkboxes for shopping progress.
Never include an item already stocked in sufficient quantity (NFR7).

## 6. Accessibility and content rules

- All controls, icons, and images have accessible names; camera and search
  icons are not icon-only without a label or assistive text.
- Support dynamic text sizing without clipping quantities, consent text, or
  error messages.
- Preserve logical focus order: title → content → primary action.
- Do not communicate dietary restrictions, warnings, or selection state by
  colour alone.
- Use concrete labels: “Save to pantry”, not “Submit”; “What’s left over?”,
  not “Continue”.
- Avoid blame (“You forgot…”), certainty about food safety, and claims that
  the AI output is professionally certified.

## 7. Traceability

| Design-system area | Requirements |
|---|---|
| Pantry, ingredient rows, cooked confirmation | F2, P1, NFR9, NFR11 |
| Receipt review and warning state | F1, P1, NFR2, NFR3 |
| Consent and dietary controls | F6, LR1, LR2, LR7 |
| Recipe result and generation feedback | F3, F5, F6, NFR4, NFR5, NFR6, NFR8, LR8 |
| Recipe library and search | F5, F7, P2, P3 |
| Grocery list and automatic pooling | F4, NFR7, NFR12, P3, LR8 |
| Accessibility and content constraints | NFR11, LR9 |
