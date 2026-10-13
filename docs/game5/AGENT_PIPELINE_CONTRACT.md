# Game 5 Agent Pipeline — Task Contract v1

Status: proposed; no automatic dispatch implemented. Scope: new isolated Wuxia MMORPG Game 5. Existing games, Luna, payment systems, and player data are read-only.

## Required task packet (GitHub Issue)
```yaml
schema_version: game5.task.v1
task_id: G5-0001
title: "Retrieve the Lost Card — quest event contract"
agent_role: quest_npc
status: planned
priority: normal
depends_on: []
allowed_paths:
  - "src/game5/quests/**"
  - "tests/game5/quests/**"
input_contracts: []
output_contracts:
  - "game5.quest.item_collected.v1"
acceptance_tests:
  - "collecting target item advances objective exactly once"
  - "quest reward is issued exactly once by server authority"
approval_required: true
```

## Roles and control flow
Owner request → Communication → PM task packets → dependency validation → specialist claim → isolated branch/PR → independent QA → PM summary → owner approval → protected integration.

Only a configured external agent runner can execute tasks. An ordinary ChatGPT conversation does not monitor GitHub issues or automatically wake when assigned.

## Task states
`planned → ready → claimed → in_progress → review → qa_passed → awaiting_owner → done`. Exceptional states: `blocked`, `qa_failed`, `cancelled`. Each transition requires an auditable actor, timestamp, and reason. `qa_failed` returns to the owning specialist; `blocked` is reopened only after dependencies clear.

## Worker result (PR description or artifact)
```yaml
schema_version: game5.result.v1
task_id: G5-0001
agent_role: quest_npc
branch: "game5/G5-0001-quest-events"
base_commit: "<sha>"
commit: "<sha>"
changed_files: []
tests:
  - command: "<actual command>"
    outcome: "<pass|fail|not_run>"
    evidence: "<logs or artifact link>"
known_issues: []
followup_tasks: []
ready_for_qa: false
```

## Dispatch guardrails
1. Reject unknown role IDs, schema versions, unauthorized file paths and incomplete acceptance tests.
2. Start workers only when all `depends_on` tasks are `done` or explicitly approved by the PM.
3. Claim tasks with atomic leases and timeouts; deduplicate GitHub deliveries using event IDs and a task/attempt idempotency key.
4. Enforce concurrency limits (initially six to eight), spending limits, and stop controls.
5. Credentials live in protected runner secrets, never in issues, agent prompts, code or logs.
6. Never run instructions pasted into an issue as trusted system instructions; project rules and task scopes take precedence.
7. No auto-merge, deployment, deletion, bulk migration or changes to existing games.
8. QA must report observed checks, not assume success from a submitted report.

## First integration test
A minimal Game 5 player accepts *Retrieve the Lost Card*, finds and collects the target item, sees the quest advance, receives one server-authoritative reward and retains completion after reload. Test two concurrent clients for duplicate reward prevention. This is a planned acceptance test, not a completed feature.

## Next implementation files
- `docs/game5/agents/registry.json` — role allowlists and concurrency.
- `docs/game5/agents/task.schema.json` and `result.schema.json` — machine validation.
- `tools/game5/dispatcher` — dry-run routing, leases and audit logs.
- `.github/workflows/game5-agent-dispatch.yml` — controlled runner trigger.
- Separate worker and QA runner harnesses with a human approval gate.
