# Exploration discoveries: rare materials and elite finds out in the land

**Date:** 2026-10-17.
**Branch:** `game3d/exploration-discoveries`, stacked on `game3d/skill-mastery`.
**Owner's direction (2026-10-16):** exploration like Breath of the Wild: going out into the land to find unique things,
such as elite skills and rare materials. Back end and mechanics first, content later.

This is build-order item 11 of the [Wuxia gap map](WUXIA_BLUEPRINT_GAP_MAP.md) (§12). It follows the pattern of
[server-rolled upgrades](SERVER_UPGRADES.md): the server decides, keeps a ledger, and the
[Character Vault](CHARACTER_VAULT.md) puts every save right to it.

## What a player sees

- **Glowing crystal clusters stand out in the land:** four material nodes in the First Faction Territory, 60–230 m from
  the capital start. A weathered stone tablet with a golden ring stands in the far corner.
- **Walking up shows a prompt:** `E  Gather Spirit Crystal Vein`. Pressing E starts a short gather (1.5–3 s) with a
  progress bar. Walking away cancels it ("Interrupted — you moved away").
- **The reward arrives as a toast:** "Gathered 2× Spirit Crystal". The units go into the loot inventory like a
  picked-up drop, so the Services panel can spend them.
- **A gathered node dims while it respawns.** Its prompt reads "Spirit Crystal Vein — returns in 18 min".
- **A one-time find disappears** once taken, for that character, for good.
- **The tablet is an elite find.** Inspecting it teaches a skill: today the placeholder "Unwritten Technique
  (placeholder)" (see Owner decisions).
- **Offline, nothing is gathered:** "Not gathered — discoveries need a server connection". Nothing is used up, and
  the node stays available.

## The seeds

All in `AXE_Region_FirstTerritory` (First Faction Territory, the region around the playable 400 m plane):

| Id | Name | Position (x, z) | Kind | Reward (per claim) | Respawn |
|---|---|---|---|---|---|
| `ft_spirit_vein` | Spirit Crystal Vein | 48, −62 | material node | Spirit Crystal 1–2; Starlight Dust 1 at 15% | 20 min |
| `ft_reinforce_outcrop` | Reinforcement Stone Outcrop | −84, 36 | material node | Reinforcement Stone 2–3; Elite Tempering Stone 1 at 5% | 15 min |
| `ft_soul_bloom` | Soul Fragment Bloom | 122, 104 | material node | Soul Fragment 1–2; Aura Shard 1 at 25% | 30 min |
| `ft_hidden_divine_cache` | Hidden Divine Cache | −158, −146 | material node | Divine Essence 2; Heroic Core 1 | once |
| `ft_weathered_tablet` | Weathered Stone Tablet | 170, −175 | elite find (placeholder) | the placeholder elite skill | once |

The rewards are existing loot-table materials. The quantities and respawn times are first guesses for the owner to
tune; they only change data.

## The definition format

`base44/shared/explorationDiscoveries.ts` holds one copy, for the game and the server:

```ts
{
  id: 'ft_spirit_vein', name: 'Spirit Crystal Vein',
  region: 'AXE_Region_FirstTerritory',      // a region of the world manifest
  position: [48, 0, -62],                    // metres
  kind: 'material_node',                     // or 'elite_find'
  interaction: 'Gather',                     // or 'Inspect' (AXEInteractionSystem intents)
  gatherMs: 1500, range: 3,                  // time at it; reach in metres
  respawnMs: 20 * 60_000,                    // null: once per character, ever
  rewards: [
    { type: 'material', itemId: 'mat_crystal', min: 1, max: 2, chance: 1 },
    { type: 'material', itemId: 'mat_starlight', min: 1, max: 1, chance: 0.15 },
  ],                                         // an elite find: [{ type: 'skill', skillId }]
  minLevel: undefined,                       // optional; the server checks its copy of the save
  placeholder: undefined,                    // true: content the owner has not chosen yet
}
```

Adding a discovery means adding an entry. A material reward must be in `DISCOVERY_MATERIALS`, which a test keeps equal
to the loot table. A skill reward must be in `ELITE_SKILLS`.

## How it works

```
E on a discovery ─ ExplorationDiscoveryMount ─ gather (discoveryGather.js, cancelled when the hero walks away)
                                              └─ claimExplorationDiscovery (explorationDiscoveryStore.js)
                                                   ├─ refused here first: taken, or respawning (never reaches the server)
                                                   ├─ a character the server keeps → source from CharacterVaultSync
                                                   │     → engine.flush() → explorationDiscovery 'claim'
                                                   │     (the server checks, rolls, records, returns the units)
                                                   ├─ anonymous play / pre-character slot → rolled here, same table
                                                   ├─ units into the loot inventory (the server's dropIds), skills learned,
                                                   │   claim recorded (the server's timestamps)
                                                   └─ engine.flush(): the reward goes to the server's copy at once
```

| Part | File |
|---|---|
| Definitions, seeds, reward roll, availability, the Vault's rule | `base44/shared/explorationDiscoveries.ts` |
| Server function | `base44/functions/explorationDiscovery/entry.ts` |
| Ledger entity: one row per character and discovery; only the server writes; the owner or an admin may read | `base44/entities/game3-d-discovery-claim.jsonc` (`Game3DDiscoveryClaim`) |
| The Vault's rule on every save, and a restore | `base44/functions/characterVault/entry.ts` |
| Claim store (per character, `axe_exploration_discoveries_v1`) | `src/components/game3d/exploration/explorationDiscoveryStore.js` |
| Gather timer | `src/components/game3d/exploration/discoveryGather.js` |
| Markers, prompt, E key, toasts | `src/components/game3d/exploration/ExplorationDiscoveryMount.jsx`, mounted in `src/pages/GameView.jsx` |
| Server source | `createServerDiscoveryClaims` in `character/characterVault.js`, registered by `CharacterVaultSync.jsx` |

The mount reads the hero's position from `window.__localPlayerPos` and adds its own meshes to `window.__gw3dScene`.
It does not change `GameWorld3D.jsx`. It runs its own `AXEInteractionSystem`, because the shared
`AXEInteractionMount` is paused while Game 3D uses its flat test plane.

### `explorationDiscovery` `claim`

**Request:** `{ characterId, discoveryId, position: { x, y, z }, transactionId }`.

**Answer:** `{ result: { ok: true, discoveryId, kind, units, skills, claim } }`.

- `units` are whole loot units (`id`, `name`, `rarity`, `icon`, `category`, `dropId`, `source: 'discovery'`,
  `collectedAt`). Each `dropId` starts with `disc_`.
- `claim` is `{ count, firstClaimedAt, lastClaimedAt, nextAvailableAt }`.

When nothing is granted, the answer is `{ result: { ok: false, reason, claim, nextAvailableAt } }`. The reason is
`already_claimed`, `respawning` or `level_too_low`. The device records the server's claim, so a find another device
took shows as taken here too.

**What the server checks:**

- **The character must be on the server.** Otherwise the answer is `not_synced`; the game saves and tries once more.
  `__default__` and `__anon__` get `local_only`, and the game rolls locally.
- **The discovery must exist:** `invalid`.
- **The hero must be within reach:** the discovery's range plus 2 m, else `too_far`.
- **A one-time find is claimed once; a respawning node waits out its cooldown.** Both are checked against the ledger,
  not the save.
- **One claim a second per character,** across all discoveries; faster gets `too_fast`.
- **A repeated `transactionId` gets the same answer and never a second reward,** for example when an answer was lost.
- **The reward is rolled here** with the discovery's table and `crypto.getRandomValues`, so the browser can neither
  choose nor predict it.
- **Two first claims of a one-time find at the same moment** (Base44 has no transactions) both write a row. The
  earliest row keeps the find; the other is deleted and answered `already_claimed`.

### The Vault's rule (`enforceDiscoveryLedger`)

On every save of a character the server keeps:

- **The claim state is the ledger's.** A reloaded save can't make a taken find available again.
- **An elite skill is learned exactly when the ledger granted it.** A skill added in the browser is removed; a granted
  one missing from a save (another device, a reload) is learned again.
- **A unit with a `disc_` dropId must be one the server granted:** still pending, or already in the previous server
  save. Each dropId may appear once, so a copied unit is removed. A unit that was spent and comes back with an older
  browser save is removed too.
- **Granted units the save doesn't hold yet are delivered into it.** This covers a lost answer and a device that closed
  before saving. Once a save holds them, they are no longer pending.

A save that breaks the rule is not refused. It is put right, kept and sent back with `corrected: true`, and the device
applies it, as with upgrades. A delivery is normal and is not flagged. Removed units and forged skills are flagged
(`discovery_corrected`) for review.

### Restores

`characterVault restore` keeps the ledger: what the hero found stays found, and elite skills stay learned. Units
granted after the chosen backup become pending again, and the next save receives them. Each row keeps its latest 50
grants for this.

## Deploying

Ships with the client:

- the `Game3DDiscoveryClaim` entity;
- the `explorationDiscovery` function;
- `base44/shared/explorationDiscoveries.ts`;
- the updated `characterVault`.

**Migration:** nothing to migrate. No save holds discoveries yet; rows appear as heroes find things.

**Turning it off:**

1. Remove `<ExplorationDiscoveryMount />` from `GameView.jsx`. The markers and the prompt go; nothing else uses them.
2. To keep the server out of it as well, remove the `setDiscoveryClaimSource` effect in `CharacterVaultSync.jsx` and
   the `enforceDiscoveryLedger` call in `characterVault`.

The ledger rows stay either way.

## Limits

- **The hero's position is the browser's.** The reach check only stops a careless script. A server-side position, from
  the movement netcode, would close this. The Vault's rule still stops a find from being claimed twice or invented.
- **Other materials are still reported by the browser** (see [SERVER_UPGRADES.md](SERVER_UPGRADES.md), Limits).
  Discovery units are the server's; a material added to a save under any other dropId is only watched by the
  `material_rate` flag.
- **A unit spent before any save holds it is delivered again.** The game sends the reward to the server right after
  applying it, so the window is the length of one save request.
- **There are no transactions.** A claim and a save landing on the same row within a few milliseconds can, rarely,
  deliver a unit twice or drop one from pending. Two first claims of a one-time find in the same millisecond, created
  by two server instances, could both win.
- **Only one region has discoveries,** and the markers are simple meshes (crystals, a tablet) until the art pass.
- **A gather is not interrupted by combat,** only by walking away.
- **No map or compass marks discoveries.** A hero finds them by looking around, as intended for exploration. A nearby
  approach (30 m) sends the quest event `location_discovered` for the discovery's id.
- **Nothing was run against the live Base44 service,** and the game was not played in a browser for this change; the
  tests below run the real functions and stores locally.

## Owner decisions

- **D13 (elite skills):** which elite skills exist, what each does, where each is found, and whether an elite skill can
  be found by more than one character or only the first. The grant path is built and tested with one placeholder,
  `elite_placeholder_unwritten`. It has no combat effect and no numbers. Replace it, and the tablet's `placeholder`
  flag, before this ships.
- **Rewards and respawns:** the seeds' quantities, chances and respawn times are first guesses.

## Tests

- **`tests/exploration-discovery-backend.test.mjs` (11):** both functions over shared in-memory tables, with fixed
  server dice and a server clock:
  - a claim needs the character on the server, a real discovery, and the hero in reach;
  - the reward follows the node's table with the server's roll, and is recorded;
  - granted units reach the save even when the device lost the answer; a device that applied them finds nothing to
    correct;
  - a one-time find is found once, whatever the save says;
  - a respawning node waits out its cooldown;
  - claims are paced, and a retried claim gets the same answer without a second reward;
  - forged and copied units are removed, and a spent unit can't come back;
  - an elite find teaches its skill, and only a find can;
  - a restore keeps the finds and delivers the newer rewards again;
  - two first claims at the same moment: only one gets the find;
  - `list` shows a character only its own claims.

  With the Vault's rule disabled, 6 of the 11 fail.
- **`tests/game3d/exploration-discoveries.test.mjs` (7):** over the real stores:
  - the seeds stand on the playable plane, in a manifest region, with loot-table rewards and no combat numbers on the
    elite placeholder;
  - a local character rolls with the shared table and keeps its claim;
  - for a server character, the server's units, dropIds and claim are kept, and an answer applied twice adds nothing;
  - a find another device took grants nothing here, and the device learns the claim;
  - an elite find teaches its skill. The device's save, run through the Vault's rule with the server's rows, needs no
    correction, so the two sides never loop;
  - the server source saves first, retries once and maps refusals;
  - the gather runs its time, and walking away cancels it.
