# Atom XE: development-agent operating contract

This is a shared repository containing several application experiences. **Do not change Game 1, Game 3, or unrelated Atom XE pages when working on Game 2.**

## Project management
- The project owner controls scope, major design decisions, merges, and production deployment.
- ChatGPT acts as the project manager/reviewer when asked. Claude acts as an implementation lead **when the user or a configured integration explicitly dispatches a task**. Neither chat alone makes the other AI aware of events.
- GitHub Issues, pull requests and committed documentation are the asynchronous task ledger: see [Game 2 workflow](docs/game2/PROJECT_WORKFLOW.md).
- Never claim ChatGPT, Claude or Aura was notified without an actual tool/API handoff. Never claim tests passed unless they were run and their output observed.

## Game 2 hard rules
- **Jedi Knight II: Jedi Outcast is the foundation.** Preserve its real-time saber combat, Force, movement feel, lethal encounters, canonical mission progression and scripted events. Expand in small reversible increments.
- KOTOR II and Star Wars Outlaws are references for *ideas only*, not substitutes for combat mechanics, enemy HP balance, copyrighted game assets or Legends-era lore.
- Read `src/components/game2/README.md` and inspect existing code before edits.
- The playable Game 2 engine uses custom WebGL2 today. `three` and `@react-three/fiber` are already dependencies; Three.js can use a WebGL2 backend. Any migration must be isolated, benchmarked and reversible, while keeping the current saber/Force/mission simulation authoritative.
- Separate branches and PRs for combat, animation, rendering and progression; no simultaneous conflicting source-file edits.
- Before requesting a merge, provide actual test commands/results, reproduction steps, file list, known limitations, multiplayer and unrelated-feature regression risks.
- No unapproved direct merges or live deployments.

## Skill triggers
Use `.claude/skills/game2-task-handoff/SKILL.md` when taking/handing off an issue.
Use `.claude/skills/game2-combat-qa/SKILL.md` for combat and movement changes.
Use `.claude/skills/game2-renderer-benchmark/SKILL.md` when changing 3D rendering.
