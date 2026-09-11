# Diagram 1 of 4 — Context

Shows the system as one box against everything outside it: the User, the
third-party AI service called for recipe generation (LR2), the identity
provider (LR3c), and the Thai authority that can request log retention under
CCA §26 (LR6).

```mermaid
graph LR
    User["User"]
    Authority["Thai Authority\n(CCA §26 retention / hold request)"]

    subgraph System["Smart Recipe & Pantry Assistant"]
        App["Pantry, Recipe & Grocery List System"]
    end

    AI["Third-party AI Service\n(recipe generation)"]
    IdP["Identity Provider\n(social / email login)"]

    User -- "scans receipt, selects items,\nsets dietary filters, accepts consent" --> App
    App -- "pantry list, recipe, grocery list" --> User

    App -- "selected ingredients + dietary flags only (LR2)" --> AI
    AI -- "generated recipe text" --> App

    User -- "sign in" --> IdP
    IdP -- "verification token only (LR3c)" --> App

    Authority -- "retention / hold request (LR6)" --> App
```
