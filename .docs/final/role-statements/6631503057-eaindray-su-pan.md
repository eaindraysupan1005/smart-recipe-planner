# Personal Role Statement — AI Lead

**Eaindray Su Pan — 6631503057**

As AI Lead, I connect the legal rules our product must follow to the AI agents that actually enforce them. I wrote rule.md, turning three Thai laws — PDPA, the Computer Crime Act, and the Electronic Transactions Act — into clear rules: ask consent before collecting sensitive dietary data, disclose and limit what we send to third-party AI, keep access logs for 90 days, and save every AI-generated recipe so it can be reproduced later if a user disputes it. I didn't stop at writing rules on paper — I built them into how the team actually works, by updating requirement-writer.md so every requirement spec includes legal requirements automatically instead of relying on someone remembering to add them. I also wrote backlog-auditor.md and design-writer.md so those same rules stay traceable through the backlog and into the design diagrams, instead of getting lost after our product pivot. On top of that, I wrote three skills (capture-requirement, audit-backlog, audit-design) so the rest of the team can keep following this process on their own, without me checking every file by hand. F1 (Receipt Scanner) and F2 (Pantry Tracker) are already implemented, and the compliance foundation I built is what those features, and the AI recipe generator, have to follow.

## AI disclosure

I used Claude Code to draft the legal requirements (LR1–LR9), the spec and the agent and skill files. I reviewed and edited every draft myself before it was merged, and I am responsible for the final content.

## Reflection

**Lessons learned.** Working on What2Cook with AI changed how I do almost every part of software engineering. For requirements, AI helped me turn long interview notes and three complex Thai laws into clear, numbered rules very fast. Before AI, this would have taken me days of reading and organizing. For design and testing, AI helped the team write documents and test cases quickly too. But I learned that AI can write fast — it cannot think for you. For F1 and F2, I still had to check every AI-made recipe by hand, because AI sometimes picked an ingredient the user did not actually have in their pantry. A human still has to catch mistakes like that.

One thing that got **better**: our work became easier to trace. Because I built the legal rules directly into how we write specs, nothing gets forgotten. Every AI recipe we show a user can be explained later — we know the model, the pantry items used, and the time it was made.

One thing that got **worse**: it was easy to trust AI output too much. AI writing always looks clean and confident, even when it is wrong. In the beginning, some of us reviewed AI drafts too quickly because they looked finished. I learned to slow down and read every AI draft like a first try, not a final answer.

**Where I stand today.** I do not think AI will replace my job. I think AI makes the easy parts of my job faster, but the hard parts — deciding what is safe, what is correct, and what matters to real users — are still mine. That is the skill I want to grow.

**My plan.** Next year, I want to learn more about testing and checking AI systems properly, not just using AI to build things. This project's allergen-safety checks were my first step into that. In five years, I want to be someone a team trusts to build an AI feature and also prove it is safe — both parts together, not just one.

## Evidence

[rule.md](../../../rule.md) · [CLAUDE.md](../../../CLAUDE.md) · [agents](../../../.claude/agents) · [skills](../../../.claude/skills) · [spec](../../01-requirements/01-spec/20260902-01-pantry-meal-planning.md) · [backlog](../../01-requirements/backlog.md)
