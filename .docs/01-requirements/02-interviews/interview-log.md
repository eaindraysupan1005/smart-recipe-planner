# Real-User Interviews — Evidence Log

**Real users interviewed: 5** (U01–U05), all on **2 Sep 2026** — meets the "at least 5" rule.
Participants are coded only (no real names). Every answer below is taken from the team's
interview notes; nothing is added or inferred. Method: the same 15 questions, in the same
order, for every participant (Q1–Q15 in the table below).

## 1. Participants

| Code | Who | Cooks / week | Grocery spend / week | Diet |
|---|---|---|---|---|
| U01 | Student, eats a lot of vegetables | 3–5 | 500–700 baht | — |
| U02 | Master's student | 6–7 | 800–1,000 baht | No pork, prefers low-carb |
| U03 | Student, health-conscious | 6–7 | 800–1,000 baht | Low-carb, avoids pork |
| U04 | Student, busy academic schedule | 3–4 | 500–700 baht | — (wants meals under ~30 min) |
| U05 | Student, wants to cut food costs | ~3 | 400–600 baht | — |

## 2. The 15 questions

| # | Question | Pain it probes |
|---|---|---|
| Q1 | How often do you cook for yourself in a typical week? | Background |
| Q2 | Roughly how much do you spend on groceries each week? | Background / cost metric |
| Q3 | Think of the last time you threw food away. What was it, and why did it go bad? | P1 |
| Q4 | How do you remember what you have at home? | P1 |
| Q5 | What do you do with small leftovers, like half an onion or one egg? | P1 |
| Q6 | Walk me through the last time you wondered "what can I make with what I have?" | P2 |
| Q7 | How often does a recipe need things you don't have? What then, and how often takeout? | P2 |
| Q8 | How do you write your shopping list, and where does it live? | P3 |
| Q9 | Have you bought something you already had, or forgotten something you needed? | P3 |
| Q10 | Have you used any pantry, recipe or grocery apps? Why did you stop? | P2 / P3 / F2 |
| Q11 | Would you scan a grocery receipt to fill your pantry? What would worry you? | F1 |
| Q12 | What would make you trust a recipe suggested by AI, and what would make you doubt it? | F3 / F6 |
| Q13 | After cooking, would you confirm what's left over in a quick prompt? | F2 / confirmation fatigue |
| Q14 | How would you feel about the app storing dietary needs and sending your pantry list to an AI service? | PDPA (LR) |
| Q15 | What is the single biggest annoyance in your cooking and shopping routine? | Main pain |

## 3. Pains found — what the interviews show

### P1 — Forgotten leftovers and food thrown away (5 of 5 threw food away)

| User | Evidence (their words) |
|---|---|
| U01 | "I bought more than I needed, but I didn't use them quickly enough." — threw away lettuce and cabbage. "I mostly rely on my memory." Small leftovers: "sometimes I forget about them." |
| U02 | Threw away leafy vegetables: "I bought too many at once." "Sometimes I also forget about ingredients stored in the refrigerator." |
| U03 | Threw away lettuce and broccoli: "Sometimes I buy too many vegetables at once." "I don't have a proper inventory system." |
| U04 | "I threw away some leftover cooked vegetables because I forgot to eat them." |
| U05 | Threw away mushrooms and cabbage bought on sale. "Sometimes I forget about ingredients stored at the back of the fridge." |

- Threw food away: **5/5** · Forgot items or leftovers at some point: **4/5** (U01, U02, U04, U05)
- Keeps track by memory or by looking in the fridge, with no inventory: **5/5**

### P2 — Deciding what to cook, and recipes that don't fit what they have

- A recipe needs something they don't have "quite often" / "pretty often": **5/5**. They skip or substitute the ingredient, or pick another recipe.
- Takeout when tired or short on time: U01 sometimes, U04 once or twice a week, U05 sometimes (tries to avoid it); U02 and U03 rarely.
- Existing recipe tools do not consider what is already at home: **U01, U02, U03, U05** (U04 left apps because "they had too many steps").
- U01: "Sometimes I have vegetables and other ingredients in my fridge, but I can't think of a good combination."

### P3 — Shopping list disconnected from what is at home

- Lists live in a phone notes app, a message to self, or memory (U01 and U04 sometimes make no list): **5/5**.
- Bought something they already had: **5/5**. Forgot something needed and had to return or change the plan: **U01, U02**.
- U05: "Sometimes I buy too much because of promotions, and some ingredients end up going bad."
- Pantry apps abandoned because manual entry takes too long: **U01, U02** (U04: too many steps; U05: none combines tracking, lists and recipes).

### Main pain, in each user's answer to Q15

| User | Biggest annoyance |
|---|---|
| U01 | Not knowing what to cook with the ingredients already at home. |
| U02 | Finding recipes that match both available ingredients and diet. |
| U03 | Finding recipes that match diet and the ingredients already at home. |
| U04 | Deciding what to cook when there is little time. |
| U05 | Buying groceries without knowing what is already at home. |

## 4. Reactions to the planned features

| Topic | Result |
|---|---|
| Receipt scan (F1) | **5/5 would use it.** Worry: wrong item or quantity recognised (U01, U02, U03, U05; U05 also names discounts and package sizes). U01, U02, U03 want to review and edit before saving. |
| Leftover confirm (F2) | **5/5 would confirm if quick** ("only takes a few seconds"). U04 and U05 want a checklist, not typing. Typing every item and quantity would make U01 and U02 stop. |
| AI recipe trust (F3) | **5/5: must use ingredients they actually have.** Also asked for: dietary fit (U02, U03), nutrition/carb info (U02, U03), clear steps (U01, U02), sensible substitutions (U01), prep time under ~30 min (U04), cost per meal (U05). Doubt it if it suggests ingredients they don't have. |
| Dietary data and AI sharing (PDPA) | **5/5 would accept if told clearly.** Want to know what is collected, whether it goes to a third-party AI, and how it is protected (U01, U02, U04, U05). Want to edit or delete it: **U01, U02, U03**. |

## 5. Themes seen in the interviews that are not yet in the spec

The spec's P1–P3 are confirmed above. These came up too, and were **not** added as new
P-numbers or backlog rows, because that would change scope (the Charter fixes F1–F7):

1. **Recipes that fit dietary preferences (U02, U03)** — already served by F6, so this supports it.
2. **Time-limited cooking (U04)** — wants recipes of about 15–30 minutes. Recipes already show minutes; no requirement asks to filter or rank by time.
3. **Cost awareness (U05)** — asked for estimated cost per meal. Not in F1–F7.
4. **Scan accuracy and edit-before-save (U01, U02, U03, U05)** — matches the receipt-scanning risk already in the Charter.


