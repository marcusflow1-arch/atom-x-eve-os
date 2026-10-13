# Game 5 — G5-0001: Retrieve the Lost Card

This is an **isolated server-side quest prototype**, not a live Game 5 deployment.
It implements the `game5.task.v1` task packet in `docs/game5/examples/lost-card-task.json` without modifying other games or shared platform systems.

## API and state transitions

`createLostCardQuestService({ repository, verifyCollection })` exposes:

- `acceptQuest({ actor })`: `not_started → active`, idempotent.
- `recordItemCollection({ actor, event })`: verifies a trusted Game 5 inventory collection of `game5:lost-card`, then `active → ready_to_complete`. Duplicate pickups do not advance twice.
- `completeQuest({ actor })`: `ready_to_complete → completed`, applying the reward and idempotency ledger in the same transaction. Repeated calls award nothing.
- `getQuestState({ actor })`: reads state without changing it.

**Actor must originate from trusted server authentication**, not from JSON sent by a browser. An actor is `{ authenticated: true, playerId: '...' }`; the `authenticated` flag alone is **not** an authentication solution.

Incoming inventory event:

```js
{
  type: 'game5.inventory.card_collected.v1',
  eventId: 'trusted-inventory-event-id',
  cardId: 'game5:lost-card',
  cardInstanceId: 'trusted-inventory-item-id'
}
```

The provided `verifyCollection({ playerId, event })` callback **must** check the event ID, target card ID, instance ID, and owner against an authoritative Game 5 collection record. The service rejects unverified events. The contract output `game5.quest.item_collected.v1` is persisted in a per-player outbox, allowing a later dispatcher to publish it reliably.

**Test-only reward:** one `game5_quest_token` is credited to the isolated quest wallet. Actual game economy values, inventory integration, and network APIs must be specified and integrated in follow-up approved tasks.

## Persistence / duplicate-reward protection

`FileQuestRepository({ directory })` is supplied for a reproducible local test pipeline. It uses a per-player exclusive filesystem lock and atomic file replacement, saving quest progress, an award ledger, the test wallet, and the output event in one file. Reconstructing the repository from the same directory reloads prior progress and reward state. Within a shared local filesystem, concurrent callers serialize, so one quest completion credits once.

**Production limitations:** Do not use separate host-local files for a multi-node server. Provide a shared, durable ACID datastore with an atomic `read` / `transact` adapter and a real inventory verifier. This sample file lock can remain stale if a process crashes while holding it; operational lock recovery, security authorization at the transport, cross-host consistency, and transactional integration with the real reward economy are not included in G5-0001. The outbox is saved but not dispatched.

## Tests

At repository root, with Node.js 20+:

```sh
node --test tests/game5/quests/*.test.mjs
node --check src/game5/quests/lostCardQuest.mjs
node --check src/game5/quests/fileQuestRepository.mjs
```

The tests cover acceptance, inactive/active/readiness/completion states, invalid/unverified items, one-time output events, exact-once rewards, persistence across service rebuilds, concurrent callers sharing a data directory, per-player isolation, and transaction rollback on verification errors. These are module-level tests; integration with a running Game 5 server requires a separate task and QA pass.
