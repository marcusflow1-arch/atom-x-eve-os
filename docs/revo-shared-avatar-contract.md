# Revo: one canonical AI avatar across Atom X Eve (implementation contract)

**Owner direction, October 14, 2026:** Each player uses the single avatar they created for Luna/Revo in every compatible native game, including combat, PvP, quests, racing driver presentation, and future worlds. Do **not** spawn a second player character or require game-specific character creation. **Game 2/Jedi Outcast is explicitly exempt** until a future decision.

## Canonical identity

- The existing authenticated user's `Avatar` record, surfaced through `AvatarGenesisGate` → `CompanionIdentityProvider`, is the one source of visual player identity. Reuse the saved `avatar.id` across games.
- `playerAppearance(avatar)` and the existing `loadAvatarModel`/`applyPlayerAppearance` pipeline resolve the correct shared body, rig, face, complexion, gender and art style. The saved model does not need to be reuploaded to join another game.
- The browser may render appearance, but identity **for gameplay authority** comes solely from verified server authentication. Never grant XP, movement authority, quest items, money or cards from a browser avatar ID.
- A missing or unloadable avatar must show a recoverable error with a link back to Luna/Genesis. Never silently create a random permanent character or overwrite the player's saved model. A transient loading state is okay.
- The same player avatar can wear per-game outfits, weapons, animations and forms; those are **cosmetics/loadouts** bound to the same identity, not alternate player accounts or character slots. NPCs, enemies, mission cast, opponents and the Game 3 flag starter may keep their distinct identities.

## Per-game progression and data compatibility

- Avatar identity is global; each game may have **separate skill trees, levels, quest states, maps, item rules and competitive balancing**. Do not incorrectly merge game-specific XP, currencies or wins into the global account.
- Synchronize compatible shared Avatar data (body and appearance) without resetting or forking existing saves.
- Existing Game 1/GameView `characterStore.jsx` still owns a separate character roster whose activeId namespaces levels/XP and other progression. **Do not delete those records or silently replace their IDs.** Design and test a one-time migration mapping existing owned character progress onto the canonical Avatar, with conflict, rollback and legacy-data handling. Only then remove the second character selection/creation prompt.
- Multiplayer should replicate an authorized avatar presentation descriptor from the server rather than letting peers spoof another user's asset/ID. Model animation can be retargeted per genre.

## Current implementation status

- Luna, onboarding, store and AI Battle already have shared-avatar functionality in parts of the existing codebase; this PR does not rewrite them.
- Game 5's local Three.js player placeholder is replaced with the real saved Revo body and model animations, in BOTH Browser Demo and Connected Test presentation. Elder Shen and other NPC models stay separate. This is **cosmetic only**; connected quest hosting/authority remains independently blocked pending verified backend QA.
- Game 3's racing HUD now identifies the saved Revo driver. No player-character creation is added. Putting the body into the vehicle interior and start cinematic needs a separately tested vehicle seat attachment/animation pass; the flag-start NPC is not the driver.
- Game 1/GameView's pre-existing character roster remains unchanged until progression migration is approved and independently tested.
- Game 2 is unchanged by this PR.

## Next integration acceptance criteria

1. A saved avatar edited in Luna displays with the same face, model, name and customization in Game 5 and every game where the player body appears.
2. Game 3's driver identity comes from the same `Avatar` record, and later cinematics attach that body, not a randomly selected character.
3. Game 1 opens using Revo automatically after a safe progression migration. The player is never forced into a second character creator.
4. PvP/PvE participants see each other's correctly authorized avatar without affecting balance or account access.
5. Switching games preserves the shared avatar identity; changing per-game cosmetics does not replace global skin/model without explicit user choice.
6. Game 2 behavior stays exactly as before.
7. Run regression, full build, and real browser rendering/collision/animation walkthrough before merging or deploying.

## QA and release

This phase is proposed as a **draft PR**, not a production rollout. No Game 2, production economy, global quest or shared auth changes are authorized. Independent QA and the owner's explicit approval are required before merge/deployment.
