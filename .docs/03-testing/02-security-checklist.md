# Security Checklist — Smart Recipe & Pantry Assistant

- Legal source: [rule.md](../../rule.md)
- Spec: [20260902-01-pantry-meal-planning.md](../01-requirements/01-spec/20260902-01-pantry-meal-planning.md)
- Test plan: [01-test-plan.md](01-test-plan.md)

- [✅] Consent is recorded before pantry data goes to the third-party AI, and each request carries only selected ingredient names and dietary flags — no email, name, address or household ID. (PDPA; LR2, LR7)
- [✅] Deleting an account removes the user's pantry items, planned meals, saved recipes and dietary profile, with only CCA §26 logs retained. (PDPA; LR3b)
- [✅] Edit/delete actions are logged with account ID, IP and timestamp, and the log and original content are kept for at least 90 days even after deletion. (CCA §26; LR4, LR5)
