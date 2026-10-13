# Game 5 — G5-0001 / R1: Retrieve the Lost Card

**Status:** Isolated, tested Game 5 quest module; **not connected to the live game or production economy**. Implements `docs/game5/examples/lost-card-task.json` without touching Game 2, Game 3, Luna, or shared services. This README is implementation guidance, **not evidence** that production adapters exist.

## Quest service (unchanged)

`createLostCardQuestService({ repository, verifyCollection })` exposes:

- `acceptQuest({ actor })`: `not_started → active`; repeat acceptance is a no-op.
- `recordItemCollection({ actor, event })`: validates a `game5.inventory.card_collected.v1` event using the injected authoritative verifier; only `game5:lost-card` progresses `active → ready_to_complete`; duplicates have no effect.
- `completeQuest({ actor })`: `ready_to_complete → completed`; test wallet credit and idempotency ledger update in the same repository transaction; repeated completion does not award again.
- `getQuestState({ actor })`: read persistent state.

`game5.quest.item_collected.v1` output is persisted in the same file as a transactional outbox record. It is **not sent** without an outbox dispatcher.

## R1 — crash recovery and lock safety

The previous `mkdir(<player>.lock)` lock could remain after a worker crash forever. R1 uses an **OS-managed advisory `flock(2)`** on a persistent `<player>.flock` *regular file*. It invokes the Linux `flock` utility to lock a duplicated file descriptor while the parent Node process retains the **same open file description**. The parent FD stays open through the commit. When the owner exits or is killed, the kernel closes its FD, releasing the lock automatically; no TTL, timestamps, PID guesses, unsafe `rm`/rename, or lock stealing.

**Operational requirements for this test adapter:**

- Linux with util-linux `flock` available on `PATH`; Node.js 20+; a trusted, process-shared **local** filesystem supporting Linux `flock` semantics. If the helper is absent or lock acquisition fails, the transaction fails closed.
- A private writable data directory with trusted writers. Never delete, rotate, or replace existing `*.flock` files while workers run; a replacement inode would break mutual exclusion. Use exclusive application access and a coordinated shutdown for maintenance.
- **Do not run old (`mkdir`) and new (`flock`) workers concurrently.** They use different locking protocols. Stop all old workers before deploying a new adapter. If a `<player>.lock` legacy artifact exists, the new implementation **rejects** that player's transaction rather than claiming it is stale: old locks do not contain reliable owner identity. After all old workers have been stopped and any in-flight operations reconciled, an operator may remove the legacy artifact *offline*. It is intentionally never auto-deleted.
- Orphaned `*.flock` regular files are **not** stale locks: the kernel releases the held lock on process termination. Reuse the same file inode. A process crash before `rename` leaves the previous committed JSON state intact; orphaned `.tmp` files are harmless but need maintenance after a complete shutdown. Power-loss durability requires stronger fsync/database guarantees than this prototype provides.

The adapter does **not** offer multi-host fencing, database transactions, disaster recovery, or live deployment support. A production multi-node Game 5 server must replace it with a shared transactional database and DB-enforced idempotency.

## Required specialist integrations — NOT implemented

1. **Authentication / authorization specialist:** Expose quest operations only behind an authenticated server route, map identity from verified session/token to the correct Game 5 player, enforce account/character ownership and authorization. Never accept `{ authenticated: true, playerId }` from the client. The service's actor shape is a *contract*, not authentication.
2. **Inventory specialist:** Emit durable, unique card-collection events only from authoritative Game 5 inventory, and implement `verifyCollection({ playerId, event })` using the verified event ID, card instance ID, owner, correct target card and collection provenance. Prevent client-forged pickups and replays. Define whether cards obtained before quest acceptance count (currently **no**).
3. **Rewards/economy specialist:** Define the actual quest reward, enforce a unique `(playerId, questId, completion)` grant key in the production economy, and atomically couple the reward grant to quest completion and the reward ledger (or implement an exactly-once claim protocol backed by the economy). The current `game5_quest_token` is isolated **test currency only**; it does not credit the actual game wallet.
4. **Events/outbox specialist:** Deliver queued `game5.quest.item_collected.v1` records transactionally, with retry, stable event IDs, idempotent consumers, delivery acknowledgment and observability. This adapter **stores but does not dispatch** outbox records.
5. **Backend/database and QA specialists:** Supply a production ACID quest repository shared by all server nodes, network authentication/authorization, server-side concurrency tests, crash tests, failover and rollback checks. Coordinate an offline migration away from legacy `.lock` directories. Do not merge/deploy merely on module tests.

## Test commands (Linux)

At repo root:

```sh
node --test tests/game5/quests/*.test.mjs
node --check src/game5/quests/lostCardQuest.mjs
node --check src/game5/quests/fileQuestRepository.mjs
```

Recovery suite includes old-lock fail-closed behavior; old orphan lock reproduction; a long-lived active lock blocking a contender; orphaned current-format lock file reuse; `SIGKILL` while mutation is in flight; and concurrent mutations after crash. Existing acceptance, persistence, objective transition, and once-only rewards remain covered by the original test suite.
