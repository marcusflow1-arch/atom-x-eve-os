# Atom x Eve Genre Skill Tree Runtime

## Purpose

Genre skill perks are permanent account unlocks that can modify gameplay only in titles that explicitly integrate the Atom x Eve perk runtime. Unlocking a perk never patches or injects code into an unsupported game.

## Server authority

`base44/functions/genreSkillTree/entry.ts` is authoritative for:

- genre catalog and node definitions
- genre-level skill point entitlement
- prerequisite and level validation
- unlock persistence
- respecs
- game integration configuration
- supported/exclusive perk filtering
- runtime effect aggregation
- audit records

Persistent entities:

- `GenreSkillProgress`: per-user, per-genre unlock state and skill points
- `GamePerkIntegration`: per-game integration tier and effect whitelist
- `GenreSkillAudit`: unlock/respec/runtime audit trail

## Game integration rules

A game must have an enabled `GamePerkIntegration` record. `integration_tier` is either:

- `supported`: standard unlocked perks can apply
- `exclusive`: standard perks plus exclusive keystones can apply

The game also provides `supported_effect_keys`. Only whitelisted effects are returned by the runtime. `*` is intended for internal development only.

Example integration record:

```json
{
  "game_id": "GAME_ENTITY_ID",
  "enabled": true,
  "integration_tier": "supported",
  "genre_ids": ["shooter"],
  "supported_effect_keys": [
    "ranged_damage_pct",
    "magazine_bonus",
    "reload_speed_pct"
  ],
  "sdk_version": "1.0"
}
```

## Runtime request

Frontend/internal game clients can use `src/lib/genrePerkRuntime.js`.

```js
const runtime = await resolveGenrePerksForGame(gameId);
```

Equivalent server action:

```json
{
  "action": "get_game_effects",
  "data": { "game_id": "GAME_ENTITY_ID" }
}
```

The response contains only modifiers the game has declared support for:

```json
{
  "success": true,
  "integrated": true,
  "integration_tier": "supported",
  "effects": [
    {
      "key": "ranged_damage_pct",
      "value": 5,
      "unit": "%",
      "sources": ["shooter:precision:t1"]
    }
  ]
}
```

The game remains responsible for applying each modifier at the correct gameplay hook. For example, a shooter can multiply its final supported ranged-damage value by `1 + ranged_damage_pct / 100`; a game that does not expose that hook should not whitelist the key.

## Skill point rules

Skill points are synchronized from `AvatarProgression.genres` on the server. The current curve grants one point at genre level 1, then one additional point every two genre levels. Server-side reward systems may also grant bonus points through the admin-only `grant_points` action.

## Safety and integrity

The client cannot directly choose effect values or claim extra points. Unlock requests are revalidated by the server against:

- authenticated user
- genre level
- prerequisite node
- available points
- canonical node catalog

Game effect resolution also checks integration tier and effect whitelist before returning modifiers.
