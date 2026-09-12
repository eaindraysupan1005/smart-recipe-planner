# Diagram 4 of 4 — Activity

Shows the core workflow as a flow with decision points: the consent gate
(LR1/LR2/LR7) before generation, the dietary-filter check (NFR6) before a
recipe is shown, and the AI-availability branch (NFR8) — ending in the
grocery list and the pantry deduction on a cooked meal. There is no
calendar/day-assignment step, and no generation cap (dropped from scope per
Project Proposal v1.1).

Laid out as two swimlanes — **User** (actions and decisions made by the
person using the app) and **System** (app/backend processing, checks, and
records) — to make the handoffs between them explicit.

```mermaid
flowchart TB
    subgraph System["Lane: System"]
        direction TB
        ParseReceipt["AI scans receipt,\nbuilds pantry list (F1, NFR2)"]
        AskConsent["Ask AI consent —\nwhat's sent, why (LR2)"]
        Generate["AI generates recipe from\nselected items (F3, F6, LR8)"]
        Pool["Recipe joins pending\ngrocery-list pool (F4, NFR12)"]
        Deduct["AI subtracts used\nquantities from pantry (F2)"]
        BuildList["Build grocery list from\npooled recipes minus pantry (F4, NFR7)"]
    end

    subgraph User["Lane: User"]
        direction TB
        Start(["Log in / sign up"])
        Scan["Scan grocery receipt (F1)"]
        Confirm["Confirm pantry list (F2)"]
        Select["Select pantry items to use (F3)"]
        CookTap["Tap 'Cook something\nwith this' (F3)"]
        ConsentDecision{"Give AI consent?\n(LR2)"}
        RecipeDecision{"Mark as cooked or\nregenerate?"}
        ConfirmDecision{"Confirm leftovers\nnow, or not yet?"}
        ConfirmSub["Confirm pantry\nsubtraction (NFR11)"]
        Exit(["Exit"])
    end

    Start --> Scan
    Scan --> ParseReceipt
    ParseReceipt --> Confirm
    Confirm --> Select
    Select --> CookTap
    CookTap --> AskConsent
    AskConsent --> ConsentDecision
    ConsentDecision -- "no" --> Confirm
    ConsentDecision -- "yes" --> Generate
    Generate --> Pool
    Pool --> RecipeDecision
    RecipeDecision -- "regenerate" --> Generate
    RecipeDecision -- "mark cooked" --> Deduct
    Deduct --> ConfirmDecision
    ConfirmDecision -- "not yet" --> Confirm
    ConfirmDecision -- "confirm" --> ConfirmSub
    ConfirmSub --> BuildList
    BuildList --> Exit
```
