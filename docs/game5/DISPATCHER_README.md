# Game 5 dispatcher — first executable milestone

This is a **dry-run simulator**, not an autonomous coding team. It validates a PM-created task packet, enforces a scoped agent role, blocks unmet dependencies, and outputs an explicit PM → specialist → QA → owner handoff *plan*. It never calls an AI provider, edits game code, creates PRs on behalf of workers, or reports QA success.

Run:
```sh
node --test tools/game5/dispatcher.test.mjs
node tools/game5/dispatcher.mjs docs/game5/examples/lost-card-task.json
```
GitHub Actions runs the same tests on matching PRs or when manually triggered. The workflow has read-only permissions, uses no secrets, and makes no changes.

## Next milestone before automation is real
Implement a credential-scoped worker adapter with task leases, event deduplication, cost limits, path verification against the final git diff, PR review, separately executed QA tests, and an explicit owner gate. Only then enable issue-driven dispatch. Do not run untrusted Issue prose as privileged instructions.

Existing Atom XE apps, all non-Game 5 code, player data, payments and deployment remain out of scope.
