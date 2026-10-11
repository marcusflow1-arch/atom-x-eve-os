---
name: game2-task-handoff
description: Use whenever accepting, assigning, updating or submitting work on the Atom XE Jedi Outcast Game 2 project via GitHub issues and pull requests.
---
# Game 2 task handoff

## Inputs
The original GitHub issue, current `main` source, project owner instructions and any cited design/research materials.

## Procedure
1. Read `CLAUDE.md`, `docs/game2/PROJECT_WORKFLOW.md` and `src/components/game2/README.md`.
2. Check if another issue/branch currently owns the same files. Do not overwrite ongoing specialist work.
3. Comment on the issue that the task was taken, with scope, dependency issues, working branch and a short file-touch plan.
4. Inspect the real source files and existing tests before changing anything. Clearly separate verified observations from hypotheses.
5. Work on a named branch. Avoid changes outside Game 2 without specific owner approval.
6. Produce the requested deliverables; run actual automated and relevant manual tests. Mark tests that could not run.
7. Open a PR linked to the issue; provide files changed, test command/output, visual evidence if applicable, rollback approach and known risks.
8. Request owner review. Do not merge or deploy without approval. Report a blocker instead of claiming completion.

## Output template
- Issue / branch / PR
- Scope delivered
- Changed paths
- Tests: PASS / FAIL / NOT RUN, command and environment
- Before/after observations
- Unverified claims and blockers
- Risks and rollback
- Owner approval required

## Constraints
Claude may not directly communicate with ChatGPT unless a connector is configured. GitHub is the explicit asynchronous message bus, **not an autonomous direct agent connection**.
