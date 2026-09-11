# Diagram 4 of 4 — Activity

Shows the core workflow as a flow with decision points: the consent gate
(LR1/LR2/LR7) before generation, the dietary-filter check (NFR6) before a
recipe is shown, and the AI-availability branch (NFR8) — ending in the
grocery list and the pantry deduction on a cooked meal. There is no
calendar/day-assignment step, and no generation cap (dropped from scope per
Project Proposal v1.1).

```mermaid
flowchart TD
    Start(["Home cook opens app"]) --> Scan["Scan grocery receipt (F1)"]
    Scan --> Parse{"All items parsed\nconfidently?"}
    Parse -- "no" --> Correct["Correct flagged item(s) (F2)"]
    Correct --> Pantry
    Parse -- "yes" --> Pantry["Pantry updated (F2)"]

    Pantry --> Select["Select pantry items to use (F3)"]
    Select --> ConsentCheck{"Terms + AI consent\nalready on file?"}
    ConsentCheck -- "no" --> ConsentGate["Show consent gate (LR1, LR2, LR7)"]
    ConsentGate --> ConsentGiven{"Consent given?"}
    ConsentGiven -- "no" --> End1(["Stop — no generation"])
    ConsentGiven -- "yes" --> AIAvail
    ConsentCheck -- "yes" --> AIAvail{"AI service\navailable? (NFR8)"}

    AIAvail -- "no" --> Fallback["Show plain-language notice,\noffer saved recipes"]
    Fallback --> End2(["Stop"])
    AIAvail -- "yes" --> Generate["Generate recipe from\nselected items (F3)"]

    Generate --> DietCheck{"Zero excluded\ningredients? (NFR6)"}
    DietCheck -- "no — release blocker" --> Reject["Recipe rejected,\nregenerate or fall back"]
    Reject --> Generate
    DietCheck -- "yes" --> ShowRecipe["Show recipe,\nstore generation record (LR8)"]

    ShowRecipe --> SaveDecision{"Save and/or\nadd to plan?"}
    SaveDecision -- "save" --> SaveRecipe["Save to library (F5, LR4)"]
    SaveDecision -- "add to plan" --> AddPlan["Add to flat plan list (F4)"]
    SaveRecipe --> AddPlan

    AddPlan --> Cooked{"Meal marked\ncooked?"}
    Cooked -- "not yet" --> BuildList
    Cooked -- "yes" --> Deduct["Deduct pantry quantities,\nconfirm leftovers (F2, NFR11)"]
    Deduct --> BuildList["Build grocery list =\nplanned meals minus pantry (F4, NFR7)"]

    BuildList --> Done(["Grocery list shown"])
```
