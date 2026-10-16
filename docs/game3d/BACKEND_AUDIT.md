# Game 3D backend and social systems: audit

**Date:** 2026-10-16.
**Branch:** `game3d/stat-system-coherence`.
**Author:** Claude, for the owner and PM.

**Why:** the owner asked for the backend, the systems and the chat to be structured like a real MMORPG's, so that everything works together.

**Scope:** what the Game 3D world uses while playing. That means presence and movement, enemies, chat, friends, party, trade and duels, plus the Base44 entities and functions behind them.

**Method:** code reading, the entity access rules in `base44/entities/*.jsonc`, and the functions in `base44/functions`. Nothing was tested against the live Base44 service: access-rule enforcement and deployed functions can't be run locally. The new code is tested against an in-memory stand-in.

## 1. How it works today

| Concern | Where it lives | Who decides |
|---|---|---|
| Level, XP, stat points, gear, upgrades, gold, every progression system | the browser's `localStorage`, per character (`characterScopedStorage`), with a checked copy on the server since this branch (`characterVault`, §2.9) | the player's browser; the server checks each save |
| Presence (who is in the world) | a `PlayerState` row per player, written every 2 s (`MultiplayerSystem.jsx`) | each client writes its own row |
| Movement and animation | WebRTC data channels between every pair of players, up to 33 Hz | peer to peer |
| Enemies | simulated by one elected player's client (`network/hostElectionStore`, `enemySyncBroadcaster`) | the host client |
| Kills, XP, loot, gold | computed in the client that made the kill | the client |
| Chat | friend DMs (`DirectMessage`, through `socialActions`) and clan chat (`ClanMessage`) | the server, with access rules |
| Friends, party, duels, trade requests | `SocialRequest`, `SocialFriendship`, `PartySession`, `DuelSession`, written from the browser | the browser (see §2) |
| Trade | `friendCardTrade`: trades Luna **trading cards**, not game items | the server |

## 2. Fixed on this branch

1. **In-game friend requests, party invites and duel challenges were refused for every player except admins.**
   - **Cause:** on 2026-09-26 (`9cbe5914`) the Base44 builder hardened the access rules. `SocialRequest`, `SocialFriendship` and `FriendRequest` now accept writes only from the server. The dashboard had been moved onto server functions (`socialActions`, `partySystem`); the game never was. It still created, accepted and deleted those rows from the browser. `PartySession` only lets members write, so someone accepting a party invite could not add themselves either.
   - **Fix:** the game now uses the same server systems as Luna:
     - friend requests go through `socialActions`;
     - parties go through `partySystem`;
     - duels go through the new `duelSystem`;
     - trade stays on `friendCardTrade`.

     There is now one friends list and one party for the dashboard and the game: a request or party from either side appears in both. The request popup (`IncomingRequestToast`) reads pending `FriendRequest`, `PartyInvite` (via `partySystem get_state`), `DuelSession` (via `duelSystem state`) and trade `SocialRequest` rows, and answers each through its server.
2. **Duels ignored the stat system and trusted the attacker.**
   - **Before:** every hit was a flat 10 damage × skill multiplier, or a fixed figure sent by the client, against 100 HP. The attacker's browser wrote the opponent's HP and declared itself the winner. Levels, gear and every progression system made no difference in PvP, and any client could set any result.
   - **Now (`base44/functions/duelSystem`):** the server owns the challenge, the accept, every hit and the result.
     - Each hit is rolled on the server (Accuracy against Block, then the capped crit) and resolved with the game's own combat rules. `computeAXESwing` in `base44/shared/axePowerBudget.ts` is one copy, shared with the game, and a test holds it equal to the game's `resolveAXEHit`.
     - Each duelist fights with their own max HP.
     - The server checks range by weapon type, at most one hit per 450 ms, a skill multiplier of at most ×3, a 60 s challenge expiry and a 2 min idle timeout. Forfeit is supported.
     - Only players in the world, or friends, can be challenged.
   - **Limit:** duelists' stats still come from their browsers, because progression isn't server-owned (§3.A). The server clamps every stat to what a fully built hero can have, so absurd values are impossible but moderate tampering isn't.
3. **`DuelSession` had no access rules.** Writes are now server-only. Reads stay open to signed-in users because the Luna leaderboard counts duel wins.
4. **The party panel's kick and leave only changed the local list.** They now go through `partySystem`: anyone can leave, and the leader can remove others. The game's party cap said 4 while `partySystem` enforces 5; the game now shows 5.
5. **The trade watcher read every player's accepted trade sessions and every trade request it could.** `TradeSession` has no access rules. It now asks only for the player's own.
6. **Dead code removed:**
   - The duel accept called `aiBattleHub` `snapshotDuel`, a function that doesn't exist, so it always failed silently.
   - `socialRequestHygiene.jsx`'s browser-side request creation and deletion was refused by the access rules.
7. **Joining a party no longer takes the player out of the world** (was §3.D).
   - **Before:** `PartyPanel` switched the multiplayer channel to `party_<id>` to make voice party-only, and that channel also carries world presence, so party members stopped seeing everyone else.
   - **Now:** the panel switches only the *voice* scope (`lunaVoiceScope`). The game publishes its `partySystem` party into `partySession`, the same way the dashboard does, so `MultiplayerSystem` opens the party's voice-only room (`voiceRoomId`, no data channel) while the world channel and movement stay as they are.
   - A **Party voice / World voice** toggle on the panel lets the player choose.
8. **World and party chat** (was §3.E).
   - **Server:** a new `worldChat` function is the game's only way to write chat.
     - Messages are cleaned (control characters stripped, whitespace folded) and capped at 200 characters.
     - Rate limits: one message per second, six per 20 s, and the same line twice in 15 s is refused.
     - Party chat is checked against the `partySystem` party.
     - Messages are `ChatMessage` rows on `game3d_world` and `game3d_party_<id>`. `ChatMessage` gains an optional `sender_name` field.
   - **In the game:** `WorldChatPanel`, bottom-left above the hotbar.
     - World and Party tabs; the Party tab shows only in a party.
     - Enter opens and sends, Esc closes, and new messages arrive live.
     - While typing, keys never reach the game, so WASD, skill numbers and F do nothing.
   - **Not yet:** local (proximity), zone, guild and whisper channels, or moderation tools. Friend DMs and clan chat already exist elsewhere.
9. **Characters on the server: phase 2a** (was §3.A, in part; owner decision "characters to server"). Full contract: [CHARACTER_VAULT.md](CHARACTER_VAULT.md).
   - **Server:** a new `characterVault` function keeps a checked copy of every character (`Game3DCharacterSave`; only the server writes it).
     - Every save is checked against hard caps (level, attributes, Halo, wings, titles, pets, elixirs, Ascension, items, Silver). Impossible saves are refused, and fast or level-lowering ones are flagged.
     - Every save must build on the revision it names, so a stale device can't overwrite newer progress.
     - Backups (`Game3DCharacterSaveBackup`) are kept on first upload (the migration's rollback point), hourly, before an overwrite, before a level drop and before a restore. An admin can restore any backup, and a restore can itself be undone.
   - **In the game:**
     - characters follow their player to another device or past cleared browser data;
     - a conflict between two devices is the player's choice, and the other save is kept;
     - a save chip shows the state.
   - **Silver is per character now.** It was one balance per browser, shared by every character and account. The old balance goes to the first character once.
   - **Fixed on the way:**
     - the login screen showed Level 1 for every character (it read a key from before accounts);
     - the HUD store could save a stale level over a newly arrived save.
   - **Still client-reported:** the server checks saves; it doesn't decide each kill, drop or upgrade. That is phase 2b (§4).

**Tests:**

- `tests/duel-system-backend.test.mjs` (8): who may challenge and answer; stat clamping; server dice and combat rules; range and rate limits; knockout, forfeit and timeout; state.
- `tests/world-chat-backend.test.mjs` (4): sign-in, cleaning and the length cap; history order without deleted messages; party-only party chat; the three rate limits.
- `tests/game3d/social-routing.test.mjs` (7):
  - Every in-game social action calls its server function, refusals become the codes the game shows, and the request popup gathers all four kinds and answers each through its server. The game never writes the tables itself.
  - The party reaches the shared session, and a party switches voice only, never the world channel.
  - The chat shows history, opens on Enter, keeps typed keys out of the game, sends world and party lines through `worldChat`, and shows live messages from its own channels only.
- `tests/game3d/power-budget.test.mjs` adds a check that the server's swing equals the game's.
- Character Vault: `tests/character-vault-backend.test.mjs` (9), `tests/game3d/character-vault-sync.test.mjs` (9), `tests/game3d/silver-per-character.test.mjs` (2) and `tests/game3d/vault-apply-stores.test.mjs` (1), plus a live check in GameView. See [CHARACTER_VAULT.md](CHARACTER_VAULT.md#tests).

## 3. Open problems, most important first

These need the owner's decisions or larger work.

- **A. Progression, items and gold are still decided in each player's browser.** Phase 2a (§2.9) gave every character a checked server copy, with revisions and backups.
  - **Fixed:** characters follow their player to other devices and survive cleared browser data, and impossible values are refused.
  - **Still open:**
    - a player can still edit their save in the browser within the caps, gradually;
    - game items can't be traded yet, because the server doesn't decide how items are made or moved. That is why the in-world "trade" trades Luna cards.
    - Nothing in an MMORPG economy can be fully trusted until each action is decided on the server (phase 2b).
- **B. Combat and rewards are decided by clients.** The player who lands a kill computes the XP, loot and gold, and one elected player's client simulates the enemies. A tampered client can farm rewards, and a host who leaves takes the enemy state with them.
- **C. Presence won't scale past a handful of players.**
  - There is one world channel, and its 20-player cap is displayed but not enforced: "Server Full" shows while the player stays joined.
  - Every client subscribes to *every* `PlayerState` change in the whole app, dashboard users included.
  - Movement is a full WebRTC mesh: each player connects to every other, which is 190 connections at 20 players.
  - Every player writes presence every 2 s.
- **D. Fixed** (§2.7).
- **E. World and party chat are fixed** (§2.8).
  - **Still missing:** local (proximity), zone and guild channels in the world, plus moderation (mutes, reports, deleting lines).
  - **Remaining gap:** `ChatMessage` has no access rules, and other surfaces (streams, the library) write it directly from the browser. A tampered client could therefore write into a game channel directly, past `worldChat`'s limits. Explicit rules (`sender_id` must be the signed-in user) need a check of those surfaces first.
  - **Scaling:** every client receives every `ChatMessage` event and filters by channel itself.
- **F. A party has no gameplay effect.** There's no shared XP or loot rules; it's a list and a voice room.
- **G. Entities the game relies on have no access rules:** `TradeSession`, `Party`, `PartyInvite`, `PartyMember`. The platform default applies.

## 4. Proposed structure

| Phase | What | Needs |
|---|---|---|
| 1 (this branch) | Social actions through the server; server-resolved duels; scoped queries; party voice without leaving the world; world and party chat | merge (deploys `duelSystem`, `worldChat`, the `DuelSession` rules and the `ChatMessage` field with the client change) |
| 2a (this branch) | **Characters on the server.** `characterVault`: a checked copy of every character, revisions, conflict choice, backups and restore. Each character uploads itself on first open (the migration, backed up). Silver per character | merge (deploys `characterVault`, `Game3DCharacterSave` and `Game3DCharacterSaveBackup` with the client change); owner-approved with backup and rollback |
| 2b | **Server authority per action.** XP from validated kills, upgrades with server dice, Silver and inventory changes decided by the server, on top of the 2a save. Then item trade through server escrow | owner decision; builds on 2a and on the realtime decision (phase 4) |
| 3 | **More chat and party play.** Local (proximity), zone and guild channels in the world; moderation (mutes, reports, deletions) and `ChatMessage` access rules; shared party XP in range | owner decision on channels, moderation and party rules |
| 4 | **Realtime authority.** Either keep peer-to-peer movement and have the server validate rewards, or move to a dedicated realtime server with zones and area-of-interest (C) | **infrastructure decision**: Base44 functions are request/response, not long-lived game servers |

## 5. Decisions for the owner

1. ~~Move characters to the server~~: decided, and phase 2a is built (§2.9).
   - **Next decision:** server authority per action (phase 2b), the foundation for a fair economy and item trading.
   - **Also open:** how long backups are kept (they are never pruned today; see [CHARACTER_VAULT.md](CHARACTER_VAULT.md#limits-what-this-does-not-do-yet)).
2. Realtime architecture (§4 phase 4): peer-to-peer plus server validation, or a dedicated game server?
3. Which further chat channels, and the moderation rules (§3.E).
4. Party rules: shared XP and loot, and range (§3.F).
