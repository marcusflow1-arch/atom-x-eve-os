# Platform audit continuation — 26–27 September 2026

This change continues the current Atom X Eve OS implementation using the uploaded **Atom X Eve OS: Full Platform Audit and Fix Plan**. The report inspected commit `d2b4e40`; the application has continued changing since then. Verify each remaining finding against current source before implementing it.

## Delivered: Skill Book and AI Battle eligibility

The current battle entry point is `aiBattleMatchmaker`, with server-calculated ATB, cooldowns, hit timing and frozen player skills. The current Skill Book has three genre sets with **four slots each**. Both frontend and backend constants already specified four; the remaining five-slot counter was stale.

- A shared server rule requires a female avatar for Artemis effects. The rule applies when equipping, building effective Skill Book state, freezing a battle loadout, and accepting casts from older frozen matches.
- Battle snapshots use the gender captured for that match. Changing the profile or supplying a gender in a cast request cannot change that snapshot's eligibility.
- Owned incompatible cards remain in the collection. Responses include `can_equip`, `equip_error`, and `required_avatar_gender`; the UI explains restrictions and disables equip and dragging. Saved selections remain intact, while incompatible/trade-locked cards are excluded from the effective hotbar.
- Saving or switching an avatar through the existing `avatarAppearanceSaved` event refreshes the player's Skill Book query and hotbar. Other players' events are ignored.
- A frozen battle skill must be an owned, available Ability card. Non-Ability, foreign and trade-locked cards are excluded. Cast slots must fall within the current four-slot range.
- Loadout mutation checks filter `AIBattleMatch` by the authenticated player's membership and live status **before** applying a limit. More recent matches from other players cannot conceal the player's live match. A failed lookup returns 503 without proceeding with the mutation.
- Cancel/reset also ends a match in the pre-combat `matched` state, releasing both players' locks.
- Ready, dodge and cast requests verify membership before settling any pending match updates. Removing a stale foreign card assignment never changes the other owner's card.

The 27 September continuation found that later work had changed the lock to trust `PlayerState.active_match_id`. That field is owner-writable and its updates can fail independently of match creation. Both Skill Book and equipment now use the shared `base44/shared/matchLock.ts` participant/status query. Missing, stale or unrelated presence pointers cannot authorize mutations. Equipment checks run before creating or activating a loadout, and lookup failures return 503 without writes. Presence tracking in the matchmaker remains available for its existing consumers.

The existing character assets and animations are preserved. No alternative battle engine, progression currency or model replacement was introduced.

## Delivered: card ownership and reward authorization

This pass started from `c4066789bff0d384b038a9e49a0814d2b0637f42`. The canonical card catalog, reward engine and equipment loadout already existed in that source; this pass repairs their verified integration and authorization gaps.

- `cardProgression` requires an existing owned card with a positive whole-number quantity. It never mints ownership from a user profile array or a locked, pending or completed achievement record.
- Initial progression stats and game/achievement links come from the owned card and its canonical definition. A caller cannot attach another achievement's stats. Purchased and transferred cards remain usable without requiring their new owner to have earned the original achievement.
- Trade-locked cards can be inspected but cannot be upgraded. Unknown actions, malformed training counts, non-Boolean wildcard selections and invalid material balances are rejected.
- Fusion validates every card that will be consumed before deleting the first one. Duplicate, foreign, equipped, trade-locked and tracked avatar starter selections are rejected. Multi-record operations remain non-transactional; see the limitations below.
- Equipment replacement, unequip and clear verify the current card owner before changing equipment flags. A stale saved reference cannot modify a card now owned by someone else.
- `UserAchievement` creation is restricted to admin/service-role writes. Users submit proof through the authenticated `achievementSystem` handler; only an admin can review it, with an explicit Boolean approval. A string such as `"false"` cannot approve a proof.
- `UserMaterial` balances are readable by their owner/admin and writable only by admin/service code. Material and enchantment definitions remain readable, with admin-only writes.
- The detail UI passes stable ownership and achievement IDs separately. Skill eligibility accepts both canonical `ability` and legacy `Ability` values.
- Catalog migration applies only when `apply === true`. Linking a card preserves its quantity, original acquisition timestamp and equipped state. No production migration was run.
- The obsolete `unlockGameSystem` endpoint now returns 410 after authentication and performs no writes. It previously recorded completed purchases without verifying payment. Current storefront clients use the existing free-claim or verified checkout flows.

## Policy reconciliation

The owner previously authorized fixed avatar starter abilities, including female Artemis abilities. Later code had disabled their bootstrap; this pass restores those specific grants. All other ownership must still come through verified rewards, purchases, trades or admin grants.

New starter cards use `card_type: 'ability'`, `source: 'starter'`, and original-recipient/effect grant fields. Existing managed legacy starters can be tagged during bootstrap. Canonical or purchased cards are not relabeled or overwritten. Sequential retries do not duplicate a grant, and a tracked card transferred away does not trigger a replacement for its original recipient. Tracked starters cannot be consumed in fusion, preserving that grant record. The frontend asks for female-only starters according to the server's avatar gender.

The grant lookup/create is not a unique, atomic database operation. Simultaneous first-time bootstrap requests can still race. Historic transfers without grant metadata cannot be reconstructed by this change; no inventory backfill was performed.

Tests use isolated in-memory data and do not mint production cards, spend production materials, migrate inventories or rewrite historical matches. Schema authorization changes are part of this pass; actual production policy enforcement still requires a live normal-user/admin integration check.

## Verification

Run from the repository root:

```sh
node --test tests/card-ownership-security.test.mjs tests/battle-skill-eligibility.test.mjs
node tests/skill-book-eligibility-ui.test.mjs
node tests/skill-book-avatar-refresh.test.mjs
npx eslint src/components/dashboard/LunaCardsPanel.jsx src/components/luna/hooks/useSkillBookLoadout.jsx src/components/streaming/MysteryCardDetail.jsx
npm run build
```

All **73 backend tests pass**: 37 ownership/reward tests and 36 battle/equipment tests. They invoke the actual bundled handlers against in-memory entity fixtures; the ownership suite also checks the authored schemas with a local policy simulator.

Coverage includes unauthorized minting, trusted stats and metadata, training and fusion validation, proof review, material access, retired purchases, migration preservation, starter transfer/retry behavior, both ability enum formats, all Artemis abilities, frozen avatar eligibility, foreign ownership, stale selections, 550 newer unrelated matches, missing/stale presence pointers, database failures, all five Skill Book mutation actions, all three equipment mutation actions, queue pairing, legacy casts, non-member requests and cancel/reset.

The UI tests mount the real panel and query hook in JSDOM. They exercise disabled and enabled equip/drag controls, four-slot labels, avatar-save refetching, hotbar removal/restoration, foreign-event filtering and listener cleanup.

Both UI tests, targeted ESLint, `git diff --check` and the production build pass. The build retains existing browser-data freshness and ambiguous Tailwind duration warnings.

These are automated source/runtime checks, not a live multiplayer or production RLS verification. A live two-account Base44 session has not been verified in this pass.

## Remaining integrity work

- **Retry-safe rewards and events:** the current reward engine marks an achievement unlocked before all card/XP writes complete. An interruption can leave a partial reward that a retry skips. Signed `gameEvent` requests still lack a replay receipt. Build an authenticated event journal and recoverable grants on verified conditional/atomic storage guarantees.
- **Concurrent mutations:** material spend, fusion, starter creation, entitlement creation and match updates still contain read/write races. Prevalidation prevents invalid selections from consuming cards; it does not provide rollback or transaction isolation.
- **Catalog and entitlement follow-up:** the collection fallback can expose non-retired draft catalog entries; migration joins still need ambiguity/duplicate reporting and pagination. Free-claim price validation and reward recovery need a separate pass. No production catalog migration has been executed.
- **Lifecycle and live acceptance:** verify ordinary players through proof submission/admin review, equipment/skill changes, matchmaking, dashboard joining, combat, disconnect and rewards. Historical orphan matches and non-tradable versus trade-locked semantics remain follow-up work.

This is a tested authorization slice of the platform audit, not completion of the whole audit or the full AI Battle roadmap.

## Revised implementation and handoff order

1. **Server authority first.** Recheck the audit's reward, wallet, entitlement, ownership and RLS findings against the latest code. Close verified authorization gaps before enabling additional rewards or purchase paths.
2. **Canonical cards.** Establish stable catalog, achievement and ownership IDs. Prepare an admin-only dry-run migration with counts, ambiguous joins and duplicate reports. Preserve ownership; do not mint from unverified user achievement arrays.
3. **One collection read contract.** Connect Skill Book, equipment, companions, home items, inventory and storefront consumers through the same ownership-aware catalog service and shared query invalidation.
4. **Verified rewards and transactions.** Centralize trusted event validation, replay prevention, once-only claims and explicit starter grants. Use verified atomic/conditional storage guarantees; a read followed by a write is not proof of idempotency.
5. **Continue the current PvP system.** Add authoritative sequencing for concurrent casts, queue deduplication, stale-match recovery and reliable terminal-state cleanup. Then verify two ordinary players through pairing, dashboard joining, combat, disconnect, cancellation and rewards. Keep the current matchmaker as the integration point.
6. **Expand the game loop.** Add quest/dungeon/boss definitions and verified completion, gear progression and achievement-derived abilities through those shared contracts. Connect clan/home/world/market/Aura features in the audit's dependency order. Remove unused code only after route and dynamic-import verification.

**Asura handoff:** build combat presentation, encounter content and world interactions against the established match and collection contracts. Preserve the current player avatar, owned-card restrictions and existing dashboard integration.

**Fable handoff:** connect canonical data, trusted rewards, ownership, match lifecycle and backend concurrency. Use this tested slice as a baseline. The referenced Phase 24 deliverable was not available in the inspected project material; no assumptions about its completed work are encoded here.

Asset generation through Meshy, Blender or another provider belongs behind the existing model/animation import and validation pipeline. Skeleton compatibility, animation clips, hit markers and asset budgets should be validated before generated assets enter combat.
