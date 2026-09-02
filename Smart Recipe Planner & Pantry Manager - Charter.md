**Project Charter: Smart Recipe Planner & Pantry Manager**

# **1\. Project Overview**

The Smart Recipe Planner & Pantry Manager is a digital platform that helps home cooks decide what to cook using the ingredients they already own. Users log their pantry items with quantities and expiry dates, and the system generates personalized recipes and weekly meal plans around what is about to expire, while respecting their dietary preferences. Planned meals are turned automatically into a grocery list containing only the items that are actually missing. By connecting the pantry, the meal calendar, and the shopping list in one place, the system reduces household food waste, saves money, and removes the daily "what should I cook?" decision.

# **2\. Problem Statement**

Households waste a significant share of the food they buy, not because they intend to, but because meal decisions are made separately from the food already in the kitchen. Users face three major obstacles:

* **Invisible Inventory:** People do not know what they already have or when it expires. Ingredients are pushed to the back of the fridge or cupboard and discovered only after they have spoiled, so food is thrown away and re-bought.

* **Decision Fatigue & Unusable Recipes:** Recipe sites are organized around dishes, not around available ingredients. Users must read a recipe first and then check whether they can make it, and most recipes demand a shopping trip for one or two missing items.

* **Disconnected Planning & Shopping:** Meal plans, saved recipes, and grocery lists live in different places — notes apps, screenshots, browser bookmarks, and memory. Shopping lists are written from scratch and duplicate items that are already in the pantry.

As a result, users overbuy, cook the same few meals repeatedly, and throw away edible food, losing both money and time every week.

# **3\. Project Goals & Objectives**

The main goal of this project is to help users cook from what they already have, so that less food is wasted and weekly planning takes less effort. The objectives are:

* **Make the Pantry Visible:** Provide one place where users can see what they have, how much, and what expires the quickest.

* **Cook From What Is On Hand:** Use AI to generate recipes built around the user’s current pantry items, prioritizing ingredients close to expiry.

* **Respect Dietary Needs:** Apply saved dietary filters (vegetarian, gluten-free, low-carb, and others) to every generated or suggested recipe.

* **Streamline Grocery Shopping:** Convert planned meals into an accurate shopping list that excludes anything already in the pantry.

* **Reduce Food Waste Measurably:** Achieve a measurable before/after reduction in discarded food and in weekly meal-planning time for real users.

# **4\. Key Stakeholders**

| Role | Name | Responsibilities |
| :---- | :---- | :---- |
| Project Owner | CHELL HMUE MAY | Owns the project vision, defines requirements, and manages scope, priorities, and timeline. |
| QA /Tester | KYU KYU THIN | Verifies specs against the backlog, checks traceability and legal requirements, and tests that acceptance criteria are met. |
| AI Lead | EAINDRAY SU PAN | Owns the team's AI tooling, builds the agents.md, skills.md, the spec and backlog. Handles AI disclosure, and governance. |
| Tech Lead | HSU MYAT THWE | Oversees the GitHub repository, code standards, and technical decisions. |
| Designer | THWIN KHANT NYAR ZAW | Creates user-friendly, visually appealing, and intuitive digital experiences. |
| Target Users | Home cooks & students | Track their pantry, plan weekly meals, and use the generated grocery lists to shop with less waste. |

# **5\. Scope and Key Features**

The system focuses on one core workflow: pantry in, meal plan and grocery list out. The main features include:

|  | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| 1 | **Pantry Tracker** | Log what food you have, how much, and when it expires. | Core |
| 2 | **Calendar Meal Planner** | Assign a meal to each day of the week. | Core |
| 3 | **AI Recipe Generator** | AI creates a new recipe from whatever is in your pantry, respecting dietary filters. | Core |
| 4 | **Auto Grocery List** | Turn planned meals into a shopping list, minus what you already have. | Core |
| 5 | **Recipe Saving** | Save both AI-generated and manually entered recipes for reuse. | Core |
| 6 | **Dietary Filters** | Filter recipes by vegetarian, gluten-free, low-carb, and similar needs. | Core |
| 7 | **Recipe Import (Manual)** | Manually write a recipe into the app's given form. | Core |
| 8 | **Search by Ingredient** | Find saved recipes using ingredients you already have. | Core |

# **6\. Constraints & Risks**

* **AI Output Quality:** Generated recipes must be realistic, safe to cook, and must actually use the pantry items and honour the dietary filters; hallucinated quantities or ignored restrictions would break user trust.

* **Pantry Data Accuracy:** The whole system depends on users keeping their pantry up to date. If logging is tedious or stock is not deducted after cooking, recipes and grocery lists become wrong.

* **Manual Entry Friction:** Typing every item with quantity and expiry date is the biggest adoption barrier; entry must stay fast or users abandon the app after the first week.

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

