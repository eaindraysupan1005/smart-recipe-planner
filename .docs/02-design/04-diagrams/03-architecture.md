# Diagram 3 of 4 — Architecture

Components, data stores, and where compliance lives.
**The course rubric requires one explicitly stated trade-off — see below.**

```mermaid
flowchart TB
    subgraph CLIENT["Client — mobile-first web app"]
        ui["UI screens S1–S6<br/>pantry · recipe · plan · list"]
    end

    subgraph BACKEND["Backend API"]
        pantrySvc["Pantry Service<br/>F1, F2, F9"]
        recipeSvc["Recipe Service<br/>F3, F7, F10, F11"]
        planSvc["Meal Plan Service<br/>F5"]
        listSvc["Grocery List Service<br/>F6 — plan minus stock"]
        consentSvc["Consent Service<br/>LR1, LR2, LR7"]
        auditSvc["Audit & Log Service<br/>LR4, LR5, LR6"]
        aiGw["AI Gateway<br/>LR2 strip identity · NFR8 quota"]
    end

    subgraph DATA["Data stores"]
        appDb[("App DB<br/>pantry · recipes · plans<br/>dietary profile (encrypted)")]
        consentDb[("Consent & Acceptance store<br/>append-only — LR7")]
        logDb[("Access/Action log store<br/>≥90 days — LR4, LR5, NFR10")]
        genDb[("AI Generation records<br/>text · model version ·<br/>pantry snapshot — LR8")]
    end

    ext["🤖 Third-party AI Service"]
    idp["🔑 Identity Provider"]

    ui --> pantrySvc & recipeSvc & planSvc & listSvc & consentSvc
    ui -.->|"login"| idp

    recipeSvc --> aiGw
    aiGw -->|"ingredients + dietary flags only"| ext
    aiGw --> genDb

    consentSvc -->|"gate: no consent → no call"| aiGw
    pantrySvc & recipeSvc & planSvc --> appDb
    consentSvc --> consentDb
    pantrySvc & recipeSvc & planSvc & listSvc -.->|"every create/edit/delete"| auditSvc
    auditSvc --> logDb
    listSvc --> appDb

    style BACKEND fill:#E4F2F0,stroke:#2A9D8F
    style DATA fill:#F3F4F7,stroke:#6A7686
    style ext fill:#FBEAE2,stroke:#D9542B
    style aiGw fill:#FFF4E0,stroke:#E1972B
```

## Key structural decisions

| Decision | Reason |
|---|---|
| **AI Gateway is its own component** | One chokepoint where identity is stripped (LR2), quota is enforced (NFR8), and the generation record is written (LR8). Compliance in one testable place instead of scattered through the app. |
| **Four separate stores, not one** | Logs must survive content deletion (LR5) and consent must be append-only (LR7). Different lifecycles cannot share a table. |
| **Consent Service gates the gateway** | LR2 is enforced by the call graph — an ungated path to the AI service does not exist. |
| **Grocery list derives, never stores** | The list is computed from plan minus pantry at request time, so it cannot drift out of date (NFR6). |
| **Dietary profile encrypted at rest** | It is sensitive data under PDPA (LR1). |

## Stated trade-off *(required by the rubric)*

> **We call a third-party AI service instead of self-hosting a model.**
>
> **We gain:** a working recipe generator in month 2 with no ML work, no GPU
> cost, and quality good enough to test the real hypothesis — that cooking from
> the pantry reduces waste. A 5-person team with a 3-week build cannot ship a
> self-hosted model and still deliver the workflow.
>
> **We pay:** per-call cost and rate limits (NFR8 caps free-tier users at 30
> generations/month), an availability dependency we do not control (NFR7 sets
> a 99% uptime target and requires a clear error message, never a raw one),
> and a PDPA cross-border transfer that requires disclosure, consent, and data
> minimisation (LR2). The Charter names AI cost and availability as a top
> risk; NFR7 and NFR8 are the direct answer.
>
> **Revisit when:** generation cost per active user exceeds the free tier at
> scale, or an allergen-safety failure (NFR5) traces to model behaviour we
> cannot constrain by prompt.
