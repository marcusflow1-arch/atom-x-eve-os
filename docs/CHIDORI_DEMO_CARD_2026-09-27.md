# Chidori demo card, new character bodies, Atom X Eve grouping (2026-09-27)

## Character bodies
- `public/models/characters/Getsuga_Tensho_Character.glb` (male) and
  `public/models/characters/Artemis_Character.glb` (female) replace the old hosted
  uploads. They keep the same skeletons (every older card animation still plays)
  and add `Chidori_Ultimate` + `Chidori_Hit_Stun_Fall` (male also `Combat_Idle`,
  `Dodge_Left/Right`, `Chidori_Attack_01`).
- `src/lib/characterModelOverrides.js` (imported first in `src/main.jsx`) redirects
  every three.js load of the legacy URLs (`…d646be928_Getsuga_Tensho_Character.glb`,
  `…96bb872db_Artemis_Character.glb`, `/getsuga/Getsuga_Character.glb`) to the new
  files. Stored avatar rows, card effects and backend validation keep the old
  identifiers, so no data migration is needed.
- `characterBodyBounds()` sizes/centres a character from its skinned body only. The
  GLBs also contain their ability VFX meshes (Artemis' husky and beam sit metres in
  front of her at rest), which must not move or shrink the avatar.
- PvP always loads the canonical body for the fighter's gender (same as the
  dashboard), so both fighters own the Chidori clips.

## Skill Book
- All demo animation cards are filed under one game: **Atom X Eve** (genre tag
  "Action RPG"): Getsuga Tenshō (moved from "Bleach"), the Artemis cards, Chidori,
  and any admin "Adam XE" demo cards.
- `skillBookLoadout` `bootstrap` grants missing demo cards (`getState` is now
  read-only). The client calls `bootstrap` once per session when a demo card is
  missing. Artemis starters stay a female-avatar grant.
- Chidori comes from a demo achievement: **One Thousand Birds**
  (game: *Naruto Shippuden: Ultimate Ninja Storm 4*, category `ability`). The
  achievement and its TradingCard (`Sasuke Uchiha - Chidori`) are created once;
  the card is delivered through `grantAchievement` (durable RewardGrant, so a
  consumed/traded card is never re-minted) and filed under Atom X Eve via
  `reward.skill_book_game`. Effect: `{ id: 'chidori', clip_name: 'Chidori_Ultimate' }`,
  no gender lock.

## Chidori in PvP
Timeline (seconds from cast): charge 0–1.42 · dash across the net 1.42–2.0 ·
impact 2.0 (target plays `Chidori_Hit_Stun_Fall`, is blasted back ~1.35 m and
electrified) · leap back to own side 3.3–3.95 · clip ends 4.2.
- Server (`aiBattleMatchmaker`): `SKILL_STATS.chidori` (80 ATB, 220 dmg,
  hit 2000 ms, stun 2800 ms). A landed hit writes `match.stuns[target]`, gives the
  turn back to the attacker, and every action by a stunned player returns 409
  "You are stunned". Dodged/missed strikes do not stun. The Adam XE Chidori
  ultimates share the stun.
- Client: `src/components/battle/chidoriCaster.js` drives the supplied
  `chidoriFx.js` (one fresh rig per cast), the dash/knock-back curves and the
  screen hints (flash, invert frame, camera shake). The fighter bar shows a
  "Stunned" badge and disables actions.
- Dashboard: Chidori plays on either body with the lightning FX (no target).

Tests: `tests/ai-battle-matchmaking.test.mjs` (stun, dodge),
`tests/card-ownership-security.test.mjs` (achievement → card, grouping, no re-mint).
