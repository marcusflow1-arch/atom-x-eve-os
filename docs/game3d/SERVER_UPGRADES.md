# Server-rolled item upgrades

**Date:** 2026-10-16.
**Branches:**

- `game3d/server-upgrades`, which builds on `game3d/character-vault`: the server rolls;
- `game3d/server-upgrade-costs`, which builds on `game3d/server-upgrades`: the server also pays.

This is the first part of phase 2b of the [backend audit](BACKEND_AUDIT.md) (§4), where the server decides actions instead of only checking saves. It builds on the [Character Vault](CHARACTER_VAULT.md).

## What changed for a player

Four equipment upgrades can go wrong:

| Upgrade | What a failure can do |
|---|---|
| Reinforcement | downgrade |
| Over-enchant | fracture |
| Refine | downgrade or destroy the item |
| Ultimate | seal |

Until now the browser rolled them, so reloading an older browser save undid a bad roll, and an edited save could claim any level. Now:

- **For a character the server keeps, the server rolls these four.** The Services panel looks and costs the same. The roll is the server's, and so is the result.
- **Each attempt is paid on the server.** The server takes the cost, unit by unit, from its copy of the character's materials, and those units stay spent. A reloaded save that gives the materials back loses them again. Without the materials on the server, nothing is rolled. A protected attempt needs a real Stabilizer.
- **A save that disagrees with the server is put right on its next sync.** This covers a reloaded save that undoes a bad roll, an edited level, a deleted fracture or seal, and an item the server destroyed. The device then takes the corrected save (its own is kept in the local backup). Each attempt is flagged on the server save for review.
- **Upgrades need the server.** Offline, the panel says "Not completed — upgrades need a server connection", and nothing is paid. This is how an MMORPG works: the server holds the dice.
- **Anonymous play and the pre-character slot** still roll on the device, as before.
- **Enchant slots, stage, combine, sockets, gems and equipment aura are unchanged** (see Limits).

## How it works

```
Services panel ─ executeAXEServiceTransaction ─┬─ checks first: owned, eligible, not at the cap, materials
                                                │   (a refused attempt never costs a roll)
                                                ├─ writes the inventory (starter items may be only in memory)
                                                ├─ dice source (CharacterVaultSync) → engine.flush()
                                                │     → itemUpgrade 'roll' (the server's copy of the save)
                                                │     (the server rolls and pays with units of its copy)
                                                ├─ this device pays the same units (consumeLootUnits)
                                                ├─ a destroyed item is removed
                                                └─ the item's record := the server's result
```

| Part | File |
|---|---|
| Upgrade rules, one copy for the game and the server (moved from `src/…/AXEItemEnhancementSystem.js` and `AXEItemAdvancementSystem.js`, which now re-export them) | `base44/shared/axeItemEnhancement.ts`, `base44/shared/axeItemAdvancement.ts` |
| Which upgrades the server rolls, where each lives in a save, what an attempt costs, which units pay it, and the correction rule | `base44/shared/itemUpgradeLedger.ts` |
| Service costs, one copy (moved from `src/…/AXEServiceEconomy.js`, which re-exports them; reinforcement and over-enchant costs added) | `base44/shared/axeServiceEconomy.ts` |
| Server function | `base44/functions/itemUpgrade/entry.ts` |
| Ledger entity: one row per item and upgrade; only the server writes; the owner or an admin may read | `base44/entities/game3-d-item-upgrade.jsonc` (`Game3DItemUpgrade`) |
| Correction on every save, and the ledger follows a restore | `base44/functions/characterVault/entry.ts` |
| Server dice for the gateway | `createServerDice` in `character/characterVault.js`, registered by `CharacterVaultSync.jsx` |
| Gateway path | `axe/services/AXEServiceTransactionGateway.js` (`setAXEServiceDiceSource`) |
| Store hooks | `setServerUpgradeRecord` and the cost functions in `enchantmentStore.jsx`; `setAXEAdvancementRecord`; `persistAXEEquipmentInventory`; `consumeLootUnits` in `lootStore.jsx` |
| `material_rate` flag (upgrade materials gained faster than 30 + 120 a minute) | `base44/shared/characterSaveRules.ts` |

### `itemUpgrade` `roll`

**Request:**

```js
{ characterId, serviceId, itemId, protectedAttempt, transactionId }
```

**Answer:**

```js
{ result: { ok, outcome, chance, destroyed, roll, before, after, cost, spent } }
```

When nothing was rolled, the answer is `{ result: { ok: false, reason } }`. The reason is one of `max_reinforcement`, `max_over_enchant`, `MAX_REFINE`, `MAX_ULTIMATE`, `RARITY_NOT_ELIGIBLE` or `insufficient_materials` (with `cost` and `missing`).

**What the server checks:**

- **The character must be on the server, and must hold the item.** Otherwise the answer is `not_synced`; the game saves and tries once more.
- **The roll is made on the server's own record.** That is the ledger row, or the item's record in the server's copy of the save. The rarity for Ultimate comes from that copy too.
- **The attempt is paid from the server's copy of the save.**
  - The cost is the game's own, at the server's record; protection adds a Stabilizer.
  - The units come out of the server's copy of the loot inventory, and a unit already spent is never taken again.
  - Their `dropId`s go into the ledger row (`spent`) and back to the device (`spent`), which removes those same units.
  - A unit the device already used elsewhere is replaced by another of the same material, so the full cost is paid either way.
- **A destroyed item can't be rolled:** `item_destroyed`.
- **A repeated `transactionId` gets the same answer and never a second roll,** for example when an answer was lost.
- **Rolls on one item and upgrade are paced** at one per 250 ms; faster ones get `too_fast`.
- **`__default__` and `__anon__` are refused** with `local_only`, and the game then rolls locally.
- **Server randomness** is `crypto.getRandomValues`, so the browser can neither choose nor predict a roll.

### The correction rule (`enforceUpgradeLedger`)

Each of the four upgrades is checked for every item the save owns:

- **With a ledger row,** the item's record must equal the row's.
- **Without a row,** the record may not differ from the previous server save. The first save is the starting point, so upgrades made before this change are kept.
- **An item whose refine row says `destroyed` leaves the inventory,** and stops being the active weapon.
- **Materials the server spent leave the loot inventory,** counted per `dropId`, so a save that gives them back loses them again.

A save that breaks the rule is not refused. It is put right, kept, flagged (`upgrade_corrected`) and sent back with `corrected: true`, and the device applies it.

### Restores

`characterVault restore` updates every ledger row to the restored save's records. An item the server destroyed after that backup comes back, with its upgrades as they were. Materials in the restored save are no longer counted as spent, so they stay.

## Deploying

Ships with the client and with the Character Vault:

- the `Game3DItemUpgrade` entity;
- the `itemUpgrade` function;
- the shared files (`axeItemEnhancement.ts`, `axeItemAdvancement.ts`, `axeServiceEconomy.ts`, `itemUpgradeLedger.ts`, and the `material_rate` flag in `characterSaveRules.ts`);
- the updated `characterVault`.

**Migration:** nothing to migrate. Existing upgrades are the starting point (each save's previous server copy). Ledger rows appear as players upgrade.

**Turning it off:**

1. Remove the `setAXEServiceDiceSource` effect in `CharacterVaultSync.jsx`. The game then rolls locally, as before.
2. Remove the `enforceUpgradeLedger` call in `characterVault` too. Otherwise saves with local rolls would be put back to the ledger.

The ledger rows stay either way.

## Limits

- **New materials are still reported by the browser.** Spending is the server's, but earning isn't yet: drops come from the client that kills the enemy, and shop purchases from the browser's Silver.
  - A player who adds new material units to their save can still afford extra attempts.
  - Saves that gain upgrade materials faster than 30 + 120 a minute are flagged (`material_rate`).
  - Validated drops and a server-side shop (Silver) are the next parts of 2b.
- **Not covered yet:**
  - **Combine, sockets and equipment aura** also roll, but on the device.
  - **Halo, wings, pets and capes** have their own rolls in their own stores.

  They can follow the same pattern: shared rules, a ledger row and a correction rule.
- **Enchant slots and stage don't roll** (they always succeed and cost materials), so they stay local until materials are on the server.
- **A save from before the server's first roll** can, in a narrow window, hold an upgrade that only that device made. The server rolls on its own copy, so that upgrade is lost if it was made in the few seconds before the first roll. The game saves before asking, which makes the window small.
- **Two different upgrades on the same item at the same moment** write different ledger rows, so they don't overwrite each other. The same upgrade on the same item is locked by the gateway.
- **Ledger rows are never deleted** (one per item and upgrade).

## Tests

- **`tests/item-upgrade-backend.test.mjs` (12):** both functions over shared in-memory tables with fixed server dice:
  - the character and the item must be on the server;
  - the game's rules with the server's roll, on the server's record;
  - undoing a bad roll or adding levels is corrected, settles, and is recorded again on a repeat;
  - no upgrade without a server roll, and no deleting a fracture;
  - a destroyed item leaves the inventory and can't be rolled;
  - a retried transaction gets the same answer, and rolls are paced;
  - nothing is rolled at the cap or for an ineligible item;
  - a restore brings items back and the ledger follows;
  - each attempt is paid from the server's copy, a unit is never taken twice, and spent units leave a save that gives them back;
  - without the materials nothing is rolled, and protection needs a Stabilizer;
  - a retried attempt is not paid twice;
  - a restore gives the materials back.

  With the correction rule disabled, 2 of the first 8 fail.
- **`tests/game3d/server-rolled-upgrades.test.mjs` (8):** the gateway over the real stores:
  - the server's record and roll are used, and the device pays the very units the server spent;
  - a unit the server spent that this device already used is replaced, never paid twice;
  - the server's result wins over what the game alone computes (this fails if the final record isn't applied);
  - a server-destroyed item is removed here;
  - starter items are written before the server is asked;
  - refused attempts never reach the server, and a server refusal costs nothing;
  - local characters roll locally, and stage never asks the server;
  - the dice saves first, retries once and maps refusals.
- **`tests/game3d/character-vault-sync.test.mjs`:** a corrected save is taken by the device.
- **`tests/character-vault-backend.test.mjs`:** upgrade materials gained too fast are flagged.
- **Live, in GameView,** against a local stand-in running the real functions:
  1. **The first Reinforce failed.** The server's copy of the save had no inventory, because a new character's starter items were only in memory; fixed by writing the inventory before asking.
  2. After the fix, Reinforce on the Dev Test sword gave "Success — success". The server rolled 0.888, the sword went to 5%, one stone was paid, and the ledger row was written.
  3. The browser save was edited to 100% and the page reloaded. The device was put back to 5%, and its 100% copy sits in the local backup.
  4. With the server paying: Reinforce at 5% cost one stone. The server spent `inv_1792160328499_vlprge`, that same unit left the device (7 → 6), and the sword went to 10%.
  5. That stone was put back in the browser save and the page reloaded. The server removed it again: 6 stones, with the 7-stone copy in the local backup.
