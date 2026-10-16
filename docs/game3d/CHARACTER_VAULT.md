# Character Vault: the server's copy of every Game 3D character

**Date:** 2026-10-16.
**Branch:** `game3d/stat-system-coherence`.
**Owner decision:** "Do the backend: characters to server". Levels, items and Silver move to the server so they follow the player and can't simply be edited. The move is careful: at first the server keeps a checked copy next to the browser save, and every change to a save is backed up and can be rolled back.

This is phase 2a of the [backend audit](BACKEND_AUDIT.md) (§4). The game still plays from browser storage. The server holds the copy that counts across devices, refuses impossible saves and flags suspicious ones. Phase 2b, server authority over every action, is not built yet (see Limits).

## What it does for a player

- **Another device, or cleared browser data:** the characters reappear on the login screen. Opening one brings its level, items and Silver from the server.
- **The same character played on two devices:**
  - when only one device played since the last save, the newer save simply wins;
  - when both did, the game asks which to keep ("This character was also played somewhere else"), shows the level, Silver and items of each, and keeps the other as a backup.
- **A save chip** next to the online pill reads one of:
  - *Saved*;
  - *Saving…* or *Loading save…*;
  - *Saved on this device only* (offline; retried every minute);
  - *Server did not accept this save*, with the reasons on hover;
  - *Save needs support*.
- **Silver now belongs to one character.** It used to be one browser-wide balance shared by every character and every account on that computer. The old balance goes once to the first real character opened afterwards. The old key is left in place, never deleted.

## Parts

| Part | File |
|---|---|
| Save rules, shared by the server and the game | `base44/shared/characterSaveRules.ts` |
| Server function | `base44/functions/characterVault/entry.ts` |
| Entities (writes are server-only: create, update and delete are admin-only; the owner or an admin may read) | `base44/entities/game3-d-character-save.jsonc` (`Game3DCharacterSave`), `base44/entities/game3-d-character-save-backup.jsonc` (`Game3DCharacterSaveBackup`) |
| Sync engine (no React) | `src/components/game3d/character/characterVault.js` |
| Save chip and conflict choice | `src/components/game3d/character/CharacterVaultSync.jsx`, mounted twice in `src/pages/GameView.jsx`: in the world and on the login screen |
| Roster merge | `mergeCharactersFromServer` in `characterStore.jsx` |
| Silver per character | `shop/shopStore.jsx` |

## What a save is

A save is every browser key of one character: `<key>::<user>::<character>`. That covers:

- progression (`wwm_player_progression_v1`);
- Halo, wings, titles, pets and elixirs;
- equipment and loot;
- Silver and the shop (`axe_shop_state_v1`);
- everything else saved through `characterScopedStorage`.

It is sent as `{ key: string }`. The vault's own keys never go into a save: `axe_character_vault_meta` (the revision and fingerprint this device last synced) and `axe_character_vault_local_backup`.

**Kept on this device only:**

- anonymous play (`__anon__`);
- the slot used before a character is picked (`__default__`).

**The Dev Test character is synced.** It is where progress from before characters existed was migrated, so it follows the player too. It has no roster card on the server because every device already has one.

## Checks (`checkCharacterSave`)

**Refused, with the reasons:**

| Area | A save is refused when |
|---|---|
| Format | values aren't strings, a key is malformed or reserved, or the save is over 1 MB, 150 keys or 400 KB in one key |
| Level and attributes | the level is outside 1–100, or more attribute points are spent than 12 + 3 per level + 150 |
| Halo and Aura | a level is above 200 |
| Wings | a level is above 200, or reinforcement is above 120 |
| Titles | a level is above 15 |
| Pets | a level or over-enchant is above 200 |
| Elixirs | more are used than the cap allows |
| Ascension | ascended below level 100 |
| Items | more than 600 items, or an item stat above what any real item has |
| Silver | outside 0–1,000,000,000 |

**Accepted but flagged** (`flags`, `flag_count`) for review:

- levels faster than 2 + 6 per minute;
- Silver faster than 5,000 + 30,000 per minute;
- Halo levels faster than 5 + 20 per minute;
- any save that **lowers** the level (`level_drop`).

## Revisions and conflicts

Every save names the revision it builds on (`expectedRevision`):

- a save that builds on an older revision is refused with `conflict` and the current save, so a stale device can never overwrite newer progress;
- the same save sent again changes nothing (`unchanged`);
- two first uploads of one character at the same moment leave two rows. The function then answers `duplicate_saves`, and support chooses one; nothing is merged silently.

**On this device** (`characterVault.js`):

- **Uploads:** checks every 20 s and uploads only when the save changed. A refused save is not sent again until it changes.
- **Opening a character** compares this device's save with the server's:
  - the same → nothing to do;
  - this device played since its last sync → upload;
  - this device has nothing new (or is a fresh start) → take the server's copy;
  - both changed → the player chooses.
- **Before replacing this device's save**, the engine keeps it in `axe_character_vault_local_backup::<user>::<character>`. That backup holds only the latest one replaced.
- **"Keep this device's"** uploads with `overwrite: true`; the server backs up the save it replaces (`before_overwrite`).
- **The HUD store re-reads first** when a server copy arrives, before the other stores reload. This was found live: without it, the other stores pinged the HUD, which saved its old in-memory level over the new save, and the device then uploaded level 1. `tests/game3d/vault-apply-stores.test.mjs` fails without the fix.

## Backups and rollback

The server writes a backup (`Game3DCharacterSaveBackup`) at these points:

| `reason` | When |
|---|---|
| `first_upload` | The browser save as it was when the server first received it. **This is the migration's rollback point.** |
| `hourly` | At most once an hour while playing. |
| `before_overwrite` | The player chose this device's save over the server's. |
| `before_level_drop` | A save would lower the level; kept whatever the hour. |
| `before_restore` | Before any restore, so a restore can itself be undone. |

**Restoring (admin, for support):**

```js
// list a character's backups
callGameServer('characterVault', 'backups', { ownerId, characterId })
// put one back: the current save is backed up first, and the restore is a new revision
callGameServer('characterVault', 'restore', { ownerId, characterId, backupId })
```

Players may list and restore their own backups the same way, without `ownerId`, though no screen offers it yet. A device picks up a restore the next time it opens the character. If that device played meanwhile, it shows the conflict choice.

## Deploying

The change ships with the client:

- the two entities;
- the `characterVault` function;
- `base44/shared/characterSaveRules.ts`.

Nothing is migrated in bulk. Each character uploads itself the first time its player opens it after the deploy, and that first save is backed up (`first_upload`).

**Turning it off:** remove the two `<CharacterVaultSync />` lines from `GameView.jsx`. The game then plays from browser saves as before, and the server rows stay. Silver per character is separate: reverting `shopStore.jsx` returns to the shared key, which was never deleted.

## Limits (what this does not do yet)

- **Saves are still reported by the browser.**
  - They are checked against hard caps and flagged on fast growth, but the server doesn't see each kill, drop or upgrade. A player can still edit their save within the caps, gradually.
  - Server authority over each action (XP from validated kills, upgrades with server dice, Silver changes) is phase 2b. It is also what item trading needs.
- **There are no transactions.** Base44 has none, so two saves building on the same revision in the same instant could both pass the revision check, and the later one wins. This needs two devices saving within milliseconds of each other. Duplicate first saves are detected and reported.
- **Backups are never pruned.** Each one is at most 1 MB. A retention rule is an owner decision; a suggestion is to keep `first_upload` forever and the latest 50 others.
- **The companion loadout keeps its own server save** (`Game3DCompanionLoadout`, coordinated separately; see `CLAUDE_HANDOFF.md`). The vault copies the companion's browser keys with the rest of the save but does not replace that system.
- **Two tabs of one character on one computer** share browser storage, so they act as one device: the last write wins, as before.
- **A level never drops in play.** The `level_drop` flag and backup assume this. A future feature that lowers levels should adjust the rule.
- **No player-facing restore screen.** Restores are a support action for now.
- **Nothing was run against the live Base44 service.** Access rules and the deployed function can't be run locally (see Tests).

## Tests

All run locally against an in-memory stand-in for the Base44 tables:

- `tests/character-vault-backend.test.mjs` (9):
  - the first upload and its backup;
  - refused saves;
  - revisions;
  - hourly and level-drop backups;
  - flags;
  - restore and undo;
  - privacy;
  - duplicate first saves.
- `tests/game3d/character-vault-sync.test.mjs` (9): the engine against the real function, across two simulated devices:
  - the migration upload;
  - a new device takes the server copy and learns the roster, even before a character is picked;
  - quiet takeover of a newer save;
  - both conflict choices;
  - refused saves;
  - offline;
  - local-only slots.
- `tests/game3d/silver-per-character.test.mjs` (2): the old balance is claimed once; characters and accounts are separate.
- `tests/game3d/vault-apply-stores.test.mjs` (1): the real stores take a server copy without writing the old level back.
- **Live, in GameView,** against a local stand-in running the real `characterVault` function:
  1. a level-12 character uploaded (revision 1 plus `first_upload`);
  2. this browser's copy and roster wiped: the character came back on the login screen;
  3. opened: level 12 and its Silver arrived, and the login screen showed "Level 12";
  4. a newer level-14 save written "from another device" while this one reached 13: the conflict choice appeared;
  5. "Use the saved copy" left this device on level 14, with level 13 in its local backup;
  6. a full save cycle later, nothing had been overwritten.
