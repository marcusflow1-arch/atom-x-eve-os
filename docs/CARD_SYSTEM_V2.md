# Adam XE.AIOS Card System v2

Card System v2 is the shared card contract for Cards, Forge, Skill Book, PvP/PvE, Marketplace, Trading Post and player-to-player trades.

The goal is simple: **one owned card instance, one progression record, one combat identity, one trade history.**

## Source-defined rules

These mechanics come from the Card Ascension Architecture Specification supplied for Adam XE.AIOS:

- Playable tiers are **Rare, Epic, Legendary, Demigod, Mythical, Deity, Chosen**.
- Enhancement materials are the non-playable **Common, Uncommon and Unique** material class.
- A card's Enhancement gauge runs from **0% to 120%**.
- At 120%, the card may **Ascend**.
- Ascension resets the visible Enhancement gauge to **0%**, but **no stats, damage or attributes earned during the previous cycle are lost**.
- Each card may Ascend a maximum of **5 times**.
- The fifth Ascension unlocks the card's mastered **3D animated / holographic** presentation state.
- Two duplicate cards of the same tier may be **Stacked**, up to **Stack Level 4**.
- Each card has a persistent Digital Passport concept intended to establish identity, ownership history, Ascension milestones and anti-duplication provenance.
- Chain Cards (merging two different cards into a new combined ability) are a future system and are not part of Card System v2.

## Player-facing progression

Card System v2 deliberately retires overlapping upgrade verbs from the primary flow. The player needs to understand only:

1. **Collect** — earn or trade for a distinct card instance.
2. **Enhance** — feed enhancement materials into that exact card from 0% to 120%.
3. **Ascend** — at 120%, lock that cycle's gains permanently and reset the visible gauge to 0%.
4. **Stack** — consume an exact duplicate of the same card and tier to increase Stack Level, maximum 4.
5. **Equip** — place the same owned card instance into Skill Book/loadouts.
6. **Trade** — transfer the same upgraded instance, including its progression and passport history.

Legacy actions such as `train`, `levelUp`, `enchant`, `overEnchant`, `unlockSkill` and `togglePerk` are no longer canonical Card System v2 upgrade actions. Existing investment is migrated rather than discarded.

## Canonical data model

### `UserCard`

Represents one actual collectible copy owned by a player.

Important identity fields:

- `id` — internal owned-card record
- `trading_card_id` — definition/template
- `passport_id` — permanent collectible identity
- `user_id` — current owner
- acquisition, equipped and trade state

New playable rewards should be separate `UserCard` rows with `quantity = 1`. Legacy multi-quantity rows remain supported until consumed or reconciled.

### `CardProgression`

One progression record follows one `UserCard` across trades.

Canonical v2 fields:

- `system_version = 2`
- `enhancement_percent` — 0..120
- `ascension` — 0..5
- `stack_level` — 1..4
- `permanent_stats` — gains locked by completed Ascensions
- `current_cycle_stats` — gains earned in the current 0..120% cycle
- `base_stats`
- `power_score`
- `migration_power_multiplier`
- `mastery_visual`
- `passport_id`

### `CardPassport`

One passport belongs to one owned card instance. It follows the card when ownership changes.

### `CardProvenanceEvent`

Append-only event chain for mint/registration, enhancement, Ascension, stacking and ownership transfer milestones.

Each event stores its previous hash and its own SHA-256 hash to make the internal history tamper-evident.

## Enhancement and Ascension

Enhancement converts material value into:

- visible gauge progress toward 120%, and
- actual `current_cycle_stats` that affect the card immediately.

At Ascension:

```text
permanent_stats = permanent_stats + current_cycle_stats
current_cycle_stats = {}
enhancement_percent = 0
ascension += 1
```

This is intentionally designed so the card's effective stats are identical immediately before and immediately after the Ascension reset. The reset is a progression cycle reset, **not a power reset**.

The CI regression test `tests/card-system-v2.test.mjs` enforces this invariant.

## Stacking

Stacking consumes one exact duplicate `UserCard` of the same `trading_card_id` and card tier.

Rules:

- target and duplicate must belong to the same player
- target cannot Stack above **Stack Level 4**
- duplicate cannot be equipped
- duplicate cannot be trade-locked
- protected starter grants cannot be consumed
- consumed card's passport is retained as a retired/consumed provenance record and linked to the target's stack event

Players may choose to keep or trade duplicates instead of consuming them.

## Skill Book integration

The Skill Book keeps its existing authoritative loadout/equip endpoint and adds a single batched Card System v2 presentation read through `cardSystemSkillState`.

That adapter exposes, per owned ability instance:

- playable tier
- Enhancement percentage
- Ascension count
- Stack Level
- power score
- mastery state
- Digital Passport ID

`useSkillBookLoadout` merges those fields into the same card already returned by `skillBookLoadout`. It deliberately preserves the existing authoritative combat preview instead of recalculating damage in the browser.

The Skill Book UI therefore shows the same V2 progression language as Forge while preserving all existing gender eligibility, drag/drop, slot equip and prefab behavior.

## Combat integration

`effectiveCardStats()` is the single progression calculation consumed by Skill Book, PvP/PvE previews and server combat snapshots.

When a PvP match freezes the Skill Book loadout, it records the exact pre-defense ability damage as:

- `skillbook_damage`
- `frozen_damage`
- `effective_base_damage`

This makes the number shown in Skill Book and the raw number entering authoritative combat the same snapshot. Defense, dodge, crit and legal combat variance can still change final HP loss.

## Trading integration

Marketplace and friend trades transfer the existing `UserCard` ID. They do not mint a replacement.

The following stay with the card:

- `CardProgression`
- Enhancement progress
- permanent Ascension gains
- Ascension count
- Stack Level
- power score
- Card Passport
- provenance event chain

Trade snapshots expose the upgraded instance rather than only the card template, so two copies of the same named card can have different collectible/combat value.

The Trading Post now treats seller rows as **card instances**, not generic card copies. A V2 seller row exposes the card's playable tier, Enhancement, Ascension, Stack Level, holographic mastery state and shortened Passport identity. Old listings that predate V2 are labeled as legacy snapshots instead of inventing fake `Lv 1` or `1★` progression.

## Provenance and external ledger status

The source specification describes a Bitcoin-inspired distributed blockchain for immutable registration and anti-duplication.

**Current implementation:** Adam XE.AIOS now has an internal SHA-256 hash-chained Card Passport ledger (`internal_hash_chain_v1`). It provides a stable card identity and tamper-evident application history.

**Not yet implemented:** no external Bitcoin/blockchain network is currently connected by this repository. Therefore passports explicitly report:

```text
external_ledger_status = not_anchored
```

The UI must not describe a card as externally blockchain-anchored until a real ledger adapter records a successful external transaction. The schema already reserves fields for that future adapter.

## Balance values that are implementation choices

The specification defines the structure of the progression loop but does not define exact per-material or per-Stack numeric power values. Card System v2 therefore centralizes those tunable values in `base44/shared/cardSystem.ts`.

Initial implementation defaults:

- Common material: +4 Enhancement points
- Uncommon material: +8
- Unique material: +16
- one Enhancement percentage point creates stat gain equal to 0.2% of the card's base stats
- each Stack Level above 1 adds 12% to the card stat multiplier

These values are **balance defaults, not source-document requirements**. They can be tuned without changing the card data contract.

## Legacy migration

Opening/using a pre-v2 card migrates it lazily.

To avoid destroying existing player investment:

- old `enhanced_stats` are moved into `permanent_stats`
- old enchantment modifier stats are also moved into `permanent_stats`
- old level/stage/Ascension/over-enchant/selected skill-tree power is frozen into `migration_power_multiplier`
- old `stage` becomes the initial v2 `stack_level`, capped at 4

Legacy fields remain readable for compatibility but are not used as new player-facing progression paths.

## Regression gates

The Card System v2 pull request runs dedicated coverage before the application build:

- `tests/card-system-v2.test.mjs` — progression constants, migration, Ascension power preservation, stacking and backend bundle checks
- `tests/card-system-v2-ui.test.mjs` — Forge/card-detail progression and Passport UI
- `tests/card-system-v2-market-ui.test.mjs` — card-instance listing panel and V2 trade snapshot
- `tests/card-system-v2-skillbook-ui.test.mjs` — Skill Book V2 labels, damage preview and equip preservation
- `tests/card-system-v2-trading-post-ui.test.mjs` — seller-instance progression and Passport presentation
- existing Skill Book eligibility/avatar-refresh and avatar/card combat-stat tests

Unrelated stale PvP queue lifecycle tests are not used as Card System v2 merge gates; they cover a separate battle-state contract and are tracked independently from this card architecture change.

## Integration rule

No subsystem should invent its own card progression math.

All surfaces must resolve the same:

```text
UserCard
  -> CardProgression
  -> effectiveCardStats()
  -> combat / collection / trade presentation
```

This rule is the core of Card System v2.
