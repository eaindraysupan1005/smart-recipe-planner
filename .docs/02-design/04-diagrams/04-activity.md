# Diagram 4 of 4 — Activity

The core workflow as a flow, with every decision point.
This is where the consent step (LR1/LR2) and the dietary-filter check (NFR5)
become visible, rather than just claimed in prose.

```mermaid
flowchart TD
    start([User opens the app]) --> hasItems{Pantry<br/>has items?}
    hasItems -->|No| addItem["Add item:<br/>name, quantity, expiry<br/>F1 · NFR2 ≤15s"]
    addItem --> logCreate[/"Log: account, IP, timestamp<br/>LR4"/]
    logCreate --> hasItems
    hasItems -->|Yes| showPantry["Show pantry, expiry-first<br/>'expiring soon' flagged<br/>F2 · P1"]

    showPantry --> tapCook["User taps<br/>'Cook something with this'"]
    tapCook --> consent{Terms accepted<br/>AND AI consent<br/>given?<br/>LR2 · LR7}

    consent -->|No| showConsent["Show what is sent:<br/>ingredients + dietary flags.<br/>What is never sent: identity.<br/>Two separate checkboxes"]
    showConsent --> agreed{User<br/>agrees?}
    agreed -->|No| noGen["No generation.<br/>Offer saved-recipe search<br/>F10"]
    agreed -->|Yes| storeConsent[/"Store acceptance:<br/>user id, timestamp, version<br/>LR7"/]
    storeConsent --> quota

    consent -->|Yes| quota{Under quota?<br/>≤30/month<br/>NFR8}
    quota -->|No| blocked["Blocked: monthly cap reached.<br/>Explain cap, offer saved-<br/>recipe search instead<br/>F10 · NFR8"]
    quota -->|Yes| aiUp{AI service<br/>reachable?}

    aiUp -->|No| error["Show clear message:<br/>AI service unavailable.<br/>Offer saved-recipe search<br/>F10 · NFR7"]
    blocked --> tapCook
    error --> tapCook

    aiUp -->|Yes| callAi["AI Gateway strips identity,<br/>sends ingredients + dietary<br/>flags only · LR2"]
    callAi --> generated["Recipe returned <10s p90<br/>NFR3"]
    generated --> dietCheck{Violates any<br/>dietary filter?<br/>NFR5 = 100%}
    dietCheck -->|Yes| reject["Reject and regenerate.<br/>Never shown to the user.<br/>Release blocker if it recurs"]
    reject --> callAi
    dietCheck -->|No| storeGen[/"Store: text, model version,<br/>pantry snapshot, filters,<br/>timestamp · LR8"/]
    storeGen --> showRecipe["Show recipe with the pantry<br/>items it used + expiry flags<br/>F3 · P1 · P2"]

    showRecipe --> pickRecipe{User keeps it?}
    pickRecipe -->|No| tapCook
    pickRecipe -->|Yes| saveRecipe["Save to library<br/>F7 · LR4"]
    saveRecipe --> assign["Assign to a day on<br/>the weekly calendar<br/>F5 · P2 · P3"]
    assign --> more{More meals<br/>to plan?}
    more -->|Yes| tapCook
    more -->|No| buildList["Generate grocery list:<br/>planned ingredients<br/>MINUS pantry stock<br/>F6 · NFR6 = 0 duplicates"]

    buildList --> confirm[/"Store confirmation record<br/>'grocery list generated'<br/>LR8"/]
    confirm --> shop["User shops: 6 items,<br/>not 20 · P3"]
    shop --> cooked{Meal cooked?}
    cooked -->|Yes| deduct["Deduct quantities<br/>from pantry<br/>F9 · keeps P1 solved"]
    deduct --> done([Less waste, less planning time<br/>NFR1])
    cooked -->|Not yet| done

    style consent fill:#FFF4E0,stroke:#E1972B,stroke-width:2px
    style showConsent fill:#FFF4E0,stroke:#E1972B
    style dietCheck fill:#FBEAE2,stroke:#D9542B,stroke-width:2px
    style storeGen fill:#F3F4F7,stroke:#6A7686
    style storeConsent fill:#F3F4F7,stroke:#6A7686
    style logCreate fill:#F3F4F7,stroke:#6A7686
    style confirm fill:#F3F4F7,stroke:#6A7686
```

## Reading the diagram

| Shape | Meaning |
|---|---|
| `{ diamond }` | Decision point |
| `[/ parallelogram /]` | A legally required record is written (LR4, LR7, LR8) |
| Amber | Consent gate — LR1, LR2, LR7 |
| Red | Dietary/allergen check — NFR5, the one 100% requirement |

## The three branches that matter at the gate

1. **No consent → no AI call.** There is no path from "tap cook" to the AI
   service that skips the consent diamond. LR2 is structural, not a promise.
2. **Dietary violation → never shown.** The check sits between generation and
   display, so a bad recipe cannot reach the user. This is NFR5 at 100% and the
   Charter's "AI output quality" risk.
3. **AI down or over quota → no raw error.** Both branches show a clear
   message and point the user to manual saved-recipe search (F10) instead of
   crashing or exposing a raw error (NFR7).
