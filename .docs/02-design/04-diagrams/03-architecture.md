# Diagram 3 of 4 — Architecture

Shows the client, backend services (receipt OCR, pantry, recipe, plan,
grocery list, consent, audit, AI gateway), and the data stores behind them.

**Stated trade-off (course rubric requirement):** Receipt OCR parsing runs
**synchronously** in the request path (client waits for parsed items) rather
than as an async background job. This keeps the scan → review flow on one
screen and meets NFR2's under-1-minute intake target, at the cost of the
client blocking on a slower or lower-quality photo instead of getting an
immediate response with results delivered later.

```mermaid
graph TD
    Client["Client App\n(mobile/web)"]

    subgraph Backend["Backend services"]
        OCR["Receipt OCR Service (F1)"]
        Pantry["Pantry Service (F2)"]
        Recipe["Recipe Service (F3, F5, F7)"]
        Plan["Plan & Grocery List Service (F4)"]
        Consent["Consent Service (LR1, LR2, LR7)"]
        Audit["Audit & Log Service (LR4, LR5, LR6)"]
        Gateway["AI Gateway (LR2, LR8)"]
    end

    AI["Third-party AI Service"]

    subgraph Stores["Data stores"]
        PantryDB[("Pantry DB")]
        RecipeDB[("Recipe & Generation DB")]
        ConsentDB[("Consent & Acceptance DB")]
        AuditDB[("Audit Log DB (≥90 days)")]
    end

    Client --> OCR --> Pantry
    Client --> Pantry
    Client --> Consent
    Client --> Recipe --> Gateway --> AI
    Client --> Plan

    Pantry --> PantryDB
    Recipe --> RecipeDB
    Consent --> ConsentDB
    Plan --> Pantry

    Pantry -. writes .-> Audit
    Recipe -. writes .-> Audit
    Plan -. writes .-> Audit
    Consent -. writes .-> Audit
    Audit --> AuditDB
```
