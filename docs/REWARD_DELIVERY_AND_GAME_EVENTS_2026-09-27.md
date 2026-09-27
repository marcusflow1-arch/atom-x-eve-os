# Reward delivery and signed game events — 27 September 2026

This continues the platform audit from `e5128eff71bd6249c3b14204336173defc608c8e`. The previous authorization pass remains in place. Newer combat and rig-specific eligibility changes were preserved; this pass does not claim authorship of those parallel changes.

## Delivered behavior

- Achievement rewards use a persistent `RewardGrant` journal. The authorized card, quantity, XP, source and progress are captured before delivery.
- Card delivery adds a grant marker to the owned card. Stack quantity changes and their marker use the same conditional server update. A recorded card delivery can be recognized after a lost response or transfer.
- XP changes and their grant marker use the same conditional server update. Retries repair the level projection without adding XP again.
- The achievement becomes unlocked only after card and XP delivery finish. Retrying an approved proof resumes a partial grant; repeated completed approval is a successful no-op.
- A completed delivery receipt prevents reminting a card that was later transferred or consumed. Fusion refuses reward cards with an unfinished delivery receipt so it cannot destroy their only delivery evidence.
- Explicit draft and retired reward definitions are rejected. Older catalog rows without a status retain their prior compatibility.
- Activity and notification failures do not turn an already delivered economic reward into a failed reward response. These presentation side effects remain best effort.
- Signed game events have durable receipts and a payload fingerprint. Repeating the same event does not add its progress again; reusing its ID with different data is rejected.
- Each affected achievement is checkpointed separately. A retry after a batch interruption skips completed targets and continues the remaining ones.
- Event progress is accumulated in server-owned `verified_event_value` and `verified_event_ids`. Legacy proof metadata such as `progress.event_value` is not used to authorize a reward.
- Achievement discovery is filtered by game/event before pagination; it no longer scans a globally capped 5,000-row catalog.
- New free-game entitlements capture their original starter-card list. A repeated claim resumes incomplete starter delivery, even if the catalog list changes later. The endpoint returns 202 with `rewards_pending` and `pending_card_ids` while delivery remains incomplete.
- Free claims require an explicit finite numeric price of zero. Missing, malformed, negative and non-finite prices are rejected; paid games remain restricted to checkout.
- Paid and free starter delivery use a stable per-player/game/card grant key. The paid checkout's broader order-recovery workflow is still outstanding.

## Storage and SDK contract

New schemas:

| Entity | Purpose | Client access |
| --- | --- | --- |
| RewardGrant | Immutable reward snapshot and delivery completion | Owner/admin read; admin/service writes |
| GameEventReceipt | Signed event fingerprint, captured target rules and completed targets | Admin/service only |

Additional fields:

| Entity | Fields |
| --- | --- |
| UserAchievement | verified_event_value, verified_event_ids, reward_grant_key |
| AvatarProgression | reward_grant_keys |
| UserCard | reward_grant_keys |
| Entitlement | starter_reward_version, starter_card_ids |

Reward callers now import the verified installed SDK version `0.8.51`, which provides `upsert` and `updateMany`. The shared helper checks capability and result shape rather than falling back to an unsafe read/add/write.

Keyed initialization sends identity fields only, preserving existing balances, progress and completed delivery state. Payload initialization uses a conditional update. Existing duplicate identity rows produce a reconciliation error.

API references: [Base44 entities](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) and the installed `@base44/sdk@0.8.51` entity types. These describe conditional query/update operators and keyed writes. They do not establish a multi-record transaction or a cross-request uniqueness guarantee.

## Signed event integration

Send events from a trusted game server. Never put a game signing secret in a browser client.

`POST gameEvent` headers:

- `X-Game-Id`: the catalog game ID.
- `X-Signature`: HMAC-SHA256 of the exact UTF-8 request body, in hexadecimal. The `sha256=` prefix is accepted.
- Signing key: the configured `GAME_SECRET_<gameId>` environment secret.

Body example:

```json
{
  "event_id": "match-184-player-42-win",
  "user_id": "player-record-id",
  "event_key": "match_won",
  "value": 1,
  "occurred_at": "2026-09-27T06:00:00.000Z"
}
```

The integration must persist the original event body and reuse its event ID and body for retries. IDs and event keys must be nonempty strings of at most 128 characters without surrounding whitespace. Counts must be positive safe integers. Request bodies are limited to 64 KiB.

New events must be no more than 24 hours old and no more than five minutes in the future. An identical event with an already initialized receipt may resume after 24 hours. Completed duplicates still require a valid signature.

| Response | Meaning / handling |
| --- | --- |
| 200, duplicate false | All captured targets processed |
| 200, duplicate true | Previously completed event acknowledged |
| 400 | Invalid body, count or timestamp; correct the producer |
| 401 | Missing/invalid signature or integration configuration |
| 404 | Game, recipient or required catalog record unavailable |
| 409 | ID conflict, invalid reward configuration or duplicate storage records; reconcile |
| 413 | Request exceeds size limit |
| 503 / transient 5xx | Retry the same event/body; completed steps are retained |

The receipt captures the target achievement IDs and thresholds. Catalog additions do not reinterpret a completed event replay.

## Migration and remaining limits

1. **Legacy delivery is unknown.** Already-unlocked achievements without journals return `legacyDelivery`; old game entitlements without starter-delivery metadata return `legacy_rewards_unverified`. They are not automatically paid again. Historical partial grants and legacy event totals require an evidence-based reconciliation; no production migration or backfill ran.
2. **First-time concurrent creation is not guaranteed unique.** The published SDK contract does not establish cross-request uniqueness or transactions. New ownership rows still have a create boundary, so truly simultaneous first delivery can race. Duplicate journal rows fail closed once visible, but that is not a substitute for storage-level uniqueness. Verify the provider's actual predicate/upsert guarantees and add a proven unique or transactional primitive before claiming exactly-once delivery.
3. **Other writers still matter.** Unrelated progression, trading and economy endpoints can still contain read/write races. The new per-effect markers do not make the entire app transactional.
4. **Paid order recovery remains.** `verifyStripeSession` still returns early for an existing order and can skip incomplete entitlements/rewards from an earlier interruption. Its order state machine, amount/catalog behavior and fulfillment recovery need a separate pass.
5. **UI and live acceptance remain.** The free-claim endpoint exposes pending rewards, but the existing store handler is not currently attached to an active transaction modal. A complete visible claim/retry flow still needs integration. No live two-account or production policy/concurrency verification was performed.
6. **Retention and notifications.** Receipt/marker retention must be designed before pruning; deleting delivery evidence can remove replay protection. Notification/activity delivery is best effort. Non-tradable versus trade-locked card semantics remain a separate issue.

## Verification

```sh
node --test tests/card-ownership-security.test.mjs tests/battle-skill-eligibility.test.mjs tests/reward-delivery.test.mjs
node tests/skill-book-eligibility-ui.test.mjs
node tests/skill-book-avatar-refresh.test.mjs
npm run build
```

All **131 backend tests pass**: 57 reward/event tests, 38 ownership tests and 36 battle/equipment tests. Both UI tests pass. The seven affected backend entry points bundle successfully and the production frontend build passes. Existing browser-data freshness and Tailwind duration warnings remain.

Tests run the actual bundled handlers against an in-memory SDK fixture with schema defaults, local permission checks, conditional updates and before/after-write fault injection. They cover partial and lost acknowledgements at journal/card/XP/unlock boundaries, transfer/consumption, stack preservation, frozen rewards, duplicate and conflicting events, event batches, delayed retries, proof authority, legacy safeguards and free-game price validation. Overlap tests cover existing records under the simulated conditional-update contract; they are not proof of production uniqueness.

The existing Skill Book tests were updated for the current male Getsuga/female Artemis rig rules and the current accessible equip button, which blocks incompatible equip and explains the restriction when clicked.
