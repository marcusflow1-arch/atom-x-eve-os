---
name: mmorpg-agent-handoff
description: Use when an agent accepts, completes or hands off any Wuxia MMORPG task to the project manager.
---
# MMORPG task handoff

Read root CLAUDE.md, the approved task packet, `docs/mmorpg-agent-team/WORKBOARD.md` and relevant contracts. Validate game scope. Do not touch Game 2 or other experiences unless explicitly authorized by owner.

Before work: assert exact task ID, repository branch, sole file ownership, required tests, and blockers. Cross-system work needs architect-approved interface contract.

After work: write a report using `docs/mmorpg-agent-team/REPORT_TEMPLATES.md`. Include exact paths, commit/PR, actual tests/logs, failures, rollback, dependent teams and PM decisions. Post via authorized GitHub action or give full text to user for PM. A report in this chat alone does not notify PM.

Destruction, currency/purchase actions, progression migration, merges and deployment are owner-gated. QA must independently review completion.
