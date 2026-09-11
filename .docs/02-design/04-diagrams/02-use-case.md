# Diagram 2 of 4 — Use Case

Shows the User actor and every use case they can perform — scan a
receipt, correct the pantry, set dietary filters, accept consent, select
items and generate a recipe, save a recipe, search by ingredient, mark a meal
cooked and confirm leftovers, and build the grocery list — each mapped to its
`F` requirement in the spec. There is no "plan the week" use case — planned
meals are a flat list, not a calendar.

```mermaid
graph LR
    User((User))

    UC1["UC1 Scan grocery receipt (F1)"]
    UC2["UC2 Correct a pantry item (F2)"]
    UC3["UC3 Set dietary filters (F6, LR1)"]
    UC4["UC4 Accept Terms & consent (LR7, LR2)"]
    UC5["UC5 Select pantry items & generate recipe (F3)"]
    UC6["UC6 Save an AI-generated recipe (F5)"]
    UC7["UC7 Search saved recipes by ingredient (F7)"]
    UC8["UC8 Add a recipe to my plan (F4)"]
    UC9["UC9 Mark a meal cooked & confirm leftovers (F2)"]
    UC10["UC10 Build grocery list (F4)"]
    UC11["UC11 Withdraw consent (LR7)"]
    UC12["UC12 Delete account (LR3)"]

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12

    UC5 -. includes .-> UC4
    UC9 -. includes .-> UC10
```
