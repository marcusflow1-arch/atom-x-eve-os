# Workboard — governed rebuild

| Task | Status | Owner | Scope | Dependency | Evidence |
|---|---|---|---|---|---|
| TASK-000 | BLOCKED_TARGET | PM + Architect | Source and implementation inventory; no code deletion | owner specifies exact game | none |
| TASK-001 | NOT_STARTED | Architect | Versioned stat/item/combat/mount/market contracts | TASK-000 | none |
| TASK-002 | NOT_STARTED | PM + QA | Backup, migration and scrapping approval gate | TASK-000/001 | none |
| TASK-003 | NOT_STARTED | Combat/Network/UI | Small isolated playable vertical slice | TASK-002 | none |

**High-impact actions BLOCKED:** deletion; changing financial ledgers or player saves; altering other games; merging unreviewed work; production deployment.

Every active task needs: named agent, exact paths, nonoverlapping branch, acceptance criteria and a report. PM cannot claim success without observed evidence.
