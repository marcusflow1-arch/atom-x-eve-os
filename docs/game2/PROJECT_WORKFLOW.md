# Game 2: Agency task board, coordination and review

**This is a proposed protocol for the project owner to approve.** It is not an automatic Claude/Aura connector.

## Single source of truth
The [GitHub issue tracker](https://github.com/marcusflow1-arch/atom-x-eve-os/issues) contains the work assignments; the PR records changes and evidence. `main` is the current shared baseline, not a test playground.

## Workstream issues
| Priority | Issue | Scope | Proposed implementer | Status at creation |
|---|---|---|---|---|
| PM | [#35](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/35) | Agency operating model | ChatGPT + owner | Tracking |
| P0 | [#36](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/36) | Camera, movement, knockdown/recovery, hit reactions | Claude combat specialist | Not dispatched |
| P1 | [#37](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/37) | Rig and animation QA | Claude + Aura | Not dispatched |
| P1 | [#38](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/38) | Three.js/WebGL2 feature-flagged benchmark | Claude rendering specialist | Not dispatched |
| P2 | [#39](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/39) | Force skill tree design | Claude systems specialist | Not dispatched |
| P2 | [#40](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/40) | Equipment, upgrades, sets design | Claude progression specialist | Not dispatched |
| P2 | [#41](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/41) | Legends continuity & optional missions | Research/lore specialist | Not dispatched |
| QA | [#42](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/42) | Repeatable regression test matrix | Claude QA + ChatGPT review | Not dispatched |

## RACI-like authority
- Project owner: sets vision and approves scope, unusual deviations, merges, and live deployment.
- ChatGPT: audits repo, writes acceptance criteria/issues, reviews evidence, coordinates **when explicitly contacted or scheduled**.
- Claude: reads a dispatched issue, works on a named branch, coordinates optional subagents, writes code and tests, opens a PR, reports evidence in the issue.
- Aura: develops authorized Unreal/Blender components and communicates source artifacts, provenance and performance constraints via explicit handoff.
- QA: verifies the working behavior with commands, observable output, screenshots/video and reproducible steps. A self-reported success without logs is unverified.

## Handoff protocol
Every task must have an issue number, goal, out-of-scope list, file ownership, dependent issues, acceptance criteria, and PR links.
1. Before work: Claude posts `TAKEN`, branch, file touch plan, and any blockers in issue comments.
2. During work: add `WIP` comments and request help from other agents on distinct files.
3. At review: open a PR referencing issue; add test commands/results and screenshots or captures if visual.
4. QA: mark checks `PASS`, `FAIL`, or `NOT RUN` and explain the evidence.
5. Owner reviews and explicitly approves any merge/deploy. PRs must not auto-merge.
6. ChatGPT can look up issues and PRs when asked. Automatic ChatGPT notification requires a separately configured integration or scheduled status check.

## Design red lines
1. Do not convert Jedi Outcast to turn-based KOTOR II-style combat.
2. Preserve Fast/Medium/Strong saber styles, Force powers, control responsiveness, existing story progression, and relatively lethal saber strikes.
3. Keep any original scripted exceptions, including wave-defense/escort segments.
4. Any changes to Game 2 must not break Game 1, Game 3, dashboard navigation, or multiplayer.
5. External game files and research references are not licenses to redistribute third-party assets.
6. Gemini research contains known questionable exact stat formulas and some speculative lore: cite sources and mark new proposals as inventions.

## QA starting commands
- `node --test tests/game2-duel.test.mjs tests/game2-mission.test.mjs`
- `npm run lint`
- `npm run build`

These are **proposed commands**. Their results must be captured when executed; a passing unit test does not prove visual/combat correctness. Perform manual browser tests and compare baselines for combat, recovery, rig quality and performance.

## First sprint and definition of done
Complete #36 only after establishing reproducible bugs, adding automated regression coverage, testing player + Dark Jedi + mission + multiplayer, and submitting a PR with before/after evidence. #37 and #38 may happen in parallel without changing combat authority. #39–#41 remain design-only until explicitly approved.
