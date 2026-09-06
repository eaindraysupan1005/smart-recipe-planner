# Diagram 1 of 4 — Context

What we build versus what we call. One box for the system, everything else
outside it.

```mermaid
flowchart TB
    cook(["👤 Home Cook<br/>(primary user)"])
    member(["👤 Household Member<br/>(shared list — F15, Could)"])

    subgraph SYS["Smart Recipe Planner & Pantry Manager"]
        core["Pantry · AI Recipes · Meal Plan · Grocery List<br/>+ Consent & Audit layer"]
    end

    ai["🤖 Third-party AI Service<br/>recipe generation<br/>LR2: ingredients + dietary flags only"]
    auth["🔑 Identity Provider<br/>LR3c: token only, never a credential"]
    authority["⚖️ Thai Authority<br/>CCA §26 log request — LR6"]

    cook -->|"pantry items, dietary filters,<br/>meal choices (F1,F4,F5)"| SYS
    SYS -->|"recipes, weekly plan,<br/>grocery list (F3,F6)"| cook
    member -->|"reads shared list (F15)"| SYS

    SYS -->|"ingredient names,<br/>quantities, dietary flags"| ai
    ai -->|"generated recipe text"| SYS
    SYS <-->|"verification token"| auth
    authority -.->|"retention request<br/>(≥90 days, up to 1 yr)"| SYS

    style SYS fill:#E4F2F0,stroke:#2A9D8F,stroke-width:2px
    style ai fill:#FBEAE2,stroke:#D9542B
    style authority fill:#FFF4E0,stroke:#E1972B
```

## What this diagram settles

| Boundary decision | Why |
|---|---|
| Recipe generation is **outside** the box | We call a third-party model; we do not train or host one. This is what makes LR2 (transfer disclosure + minimisation) necessary at all. |
| Identity is **outside** the box | We never store a password — only a verification token (LR3c). |
| The consent & audit layer is **inside** the box | Compliance is our system's job, not the AI vendor's. |
| The Thai authority is an actor, not a user | CCA §26 makes log retention a real external interface, not an internal nicety (LR6). |

**Data leaving the system:** ingredient names, quantities, expiry proximity, and
dietary flags — and nothing else. No name, email, address, or household
identifier crosses the boundary to the AI service (LR2).
