**Project Charter: Smart Recipe & Pantry Assistant**

# **1\. Project Overview**

The Smart Recipe & Pantry Assistant is a digital platform that helps people cooking for themselves decide what to make from the ingredients they already have. Users scan a grocery receipt to build their pantry automatically, then select the items they want to use and the system generates a personalized recipe around them, respecting their dietary preferences. Once a meal is marked as cooked, the app deducts the ingredients it used and asks the user to confirm what is left over, so the pantry stays accurate without manual entry. Planned meals are turned automatically into a grocery list containing only the items that are actually missing. By connecting the pantry, recipe and the shopping list in one place, the system stops small leftovers from being forgotten and going bad, saves money, and removes the daily "what should I cook?" decision.

# **2\. Problem Statement**

Young people living alone waste a significant share of the food they buy, not because they intend to, but because meal decisions are made separately from the food already in the kitchen. Users face three major obstacles:

* **Forgotten Leftovers:** After cooking, small amounts are left behind — one egg, two tomatoes, half an onion. These get pushed to the back of the fridge, forgotten, and discovered only once they have gone bad, so food is thrown away and re-bought.  
* **Decision Fatigue & Unusable Recipes:** Even when users know what they have left, turning a random handful of ingredients into a meal takes real mental effort. Recipe sites are organized around dishes, not around available ingredients, so users must read a recipe first and then check whether they can make it — and most recipes demand a shopping trip for one or two missing items. Faced with that effort, people default to takeout.  
* **Disconnected Planning & Shopping:** Meal plans, saved recipes, and grocery lists live in different places — notes apps, screenshots, browser bookmarks, and memory. Shopping lists are written from scratch without any view of what is already at home, so users over-buy items they already have and forget the ones they need.

As a result, users overbuy, cook the same few meals repeatedly, and throw away edible food, losing both money and time every week.

# **3\. Project Goals & Objectives**

The main goal of this project is to help users cook from what they already have, so that less food is wasted and weekly planning takes less effort. The objectives are:

* **Make the Pantry Visible Without Manual Entry:** Build the pantry automatically from a scanned grocery receipt, and keep it accurate by deducting ingredients when a meal is marked as cooked, so users always see what they have and how much without typing it in. 

* **Cook From What Is On Hand:** Use AI to generate recipes built around the pantry items the user selects, so even a small handful of leftovers becomes a usable meal instead of takeout. 

* **Respect Dietary Needs:** Apply saved dietary filters (vegetarian, gluten-free, low-carb, and others) to every generated or suggested recipe.

* **Streamline Grocery Shopping:** Convert planned meals into an accurate shopping list that excludes anything already in the pantry.

* **Reduce Food Waste Measurably:** Achieve a measurable before/after reduction in discarded food and in weekly meal-planning time for real users.

# **4\. Key Stakeholders**

| Role | Name | Responsibilities |
| :---- | :---- | :---- |
| Product Owner | CHELL HMUE MAY | Owns the project vision, defines requirements, and manages scope, priorities, and timeline. |
| QA /Tester | KYU KYU THIN | Verifies specs against the backlog, checks traceability and legal requirements, and tests that acceptance criteria are met. |
| AI Lead | EAINDRAY SU PAN | Owns the team's AI tooling, builds the agents.md, skills.md, the spec and backlog. Handles AI disclosure, and governance. |
| Tech Lead | HSU MYAT THWE | Oversees the GitHub repository, code standards, and technical decisions. |
| Designer | THWIN KHANT NYAR ZAW | Creates user-friendly, visually appealing, and intuitive digital experiences. |
| Target Users | Young students and young individuals who lives alone and cook 4+times a week  | Track their pantry, plan weekly meals, and use the generated grocery lists to shop with less waste. |

# **5\. Scope and Key Features**

The system focuses on one core workflow: pantry in, meal plan and grocery list out. The main features include:

|  | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| 1 | **Receipt Scanner** | Scan a grocery receipt to add items and quantities to the pantry automatically, with no typing.  | Core |
| 2 | **Pantry Tracker** | Check what food you have and how much, update if there are any mismatches in the list. | Core |
| 3 | **AI Recipe Generator** | AI creates a new recipe from whatever is in your pantry, respecting dietary filters. | Core |
| 4 | **Auto Grocery List** | Turn planned meals into a shopping list, minus what you already have. | Core |
| 5 | **Recipe Saving** | Save both AI-generated and manually entered recipes for reuse. | Core |
| 6 | **Dietary Filters** | Filter recipes by vegetarian, gluten-free, low-carb, and similar needs. | Core |
| 7 | **Search by Ingredient** | Find saved recipes using ingredients you already have. | Core |

# **6\. Constraints & Risks**

* **AI Output Quality:** Generated recipes must be realistic, safe to cook, and must actually use the selected pantry items and honour the dietary filters; hallucinated quantities or ignored restrictions would break user trust.

* **Receipt Scanning Accuracy:** Receipts vary widely in format and print quality, and many use abbreviated or store-specific item names ("TOM CHRY 250G"). If scanning misreads items or quantities, the pantry starts wrong and everything downstream inherits the error. A correction step at scan time is required, and OCR accuracy on real Thai and international receipts must be tested early.

* **Pantry Data Accuracy Over Time:** The system depends on the pantry staying current. The cooked-and-confirm step handles ingredients used in recipes, but items that are never cooked — or eaten outside a planned meal — will drift out of sync with reality.

* **Confirmation Fatigue:** The leftover confirmation only works if users actually mark meals as cooked. If they skip that step, the pantry silently degrades. The prompt must stay to a few taps, and the app should behave sensibly when a meal is never confirmed.

* **AI Cost & Availability:** Recipe generation depends on a third-party AI service with usage costs and rate limits; the app must degrade gracefully to save recipes when the service is unavailable.

* **Measurement Difficulty:** Food waste reduction is self-reported, so the before/after metric must be defined carefully to remain credible.

# **7\. Timeline & Milestones**

| Phase | Milestone /Deliverable | Weeks |
| :---- | :---- | :---- |
| Discover | Company Charter; requirement spec \+ backlog; 4 diagrams \+ prototype sketch; **User Validation Gate (pass/fail)** | **W1–W5** |
| Build | Scope locked \+ Sprint 0; **Alpha Demo** – a user adds pantry items, generates an AI recipe from them, assigns it to a day, and receives a grocery list end-to-end | **W6–W8** |
| Test | **Beta Review** – before/after metric (food waste and planning time) \+ at least 3 feedback-driven fixes (Impact Report) | **W9–W11** |
| Deliver | Real-user sign-off; **Final Showcase** (10-min pitch); portfolio pack (case study, demo video, evidence log, impact metrics, role statements) | **W12–W14** |

# **8\. Authorization**

**Team Members:** Chell Hmue May, Eaindray Su Pan, Kyu Kyu Thin, Thwin Khant Nyar Zaw, Hsu Myat Thwe

