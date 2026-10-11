# Game 2 — Drive arenas, 7v7 Capture the Flag, 8v8 Sudden Death

These changes are specifically for **Luna → Game Two** (`src/pages/Game2.jsx` → `Game2Duel.jsx`). They do not change the separate Unreal / JK2_2026 CTF prototype, the Game Two campaign, or the existing 10-player online free-for-all.

## Choose a match

The Game Two menu now offers:
- **Capture the Flag (7v7)**: the local player plus six Blue AI versus seven Red AI. Three captures win; pick up the opposing flag by touching it, return home with it while your own flag is at base, and prevent the enemy from doing likewise. Kill a carrier to drop the flag; teammates return dropped home flags on touch; dropped flags auto-return after 20 seconds. Defeated fighters respawn after five seconds.
- **Sudden Death (8v8)**: local player plus seven Blue AI versus eight Red AI. Everyone has one life, no respawns. The first team to eliminate all eight opponents wins.

AI teammates use attack / defend / support objectives in CTF and fight the opposing team in Sudden Death. Friendly fire is disabled in the saber/Force targeting logic. The ordinary HUD adds team scores, flag states or surviving-fighter counts and a result overlay. For non-BSP original Hangar test geometry, AI uses the existing Game 2 A* navigation grid.

**These are local player-versus-AI modes.** The live Railway multiplayer server remains capped at ten human players. This work does NOT claim to support sixteen simultaneous human-controlled characters or replicated CTF scoring yet.

## Two map sources verified in the user's Google Drive

| Menu choice | Drive source | File ID | Availability |
|---|---|---|---|
| Lightsaber Training | `/maps/duel_training.bsp` | `1uIQPWKuqMbujSn9dUrnwVFGqv6LKq3t9` | Existing project map |
| Hangar Duel | `/maps/duel_hangar.bsp` | `16dHdYcOiPIJo1lvHVhcOjEZcf3KJmIJV` | Authenticated local Drive sync; otherwise original Hangar test arena |

Both were inspected as Raven `RBSP` version 1 files from Drive. Map metadata includes original deathmatch player spawn entities. The scene loader accepts either map in team modes, and uses the source BSP's geometry when available. The Hangar test arena is expressly NOT the original retail BSP geometry.

### Sync authorized original maps locally

For assets you are legally entitled to use, obtain a Google OAuth access token with read permission to the provided Drive files. On your development workstation:

```bash
GOOGLE_DRIVE_ACCESS_TOKEN="YOUR_TOKEN" node tools/game2/sync-team-maps.mjs
```

The Node script validates the magic header, BSP version and expected file length, then installs `duel_training.bsp` and `duel_hangar.bsp` to `public/game2/maps/`. Existing valid files are skipped. **Never commit OAuth tokens, secrets, or newly synced original retail map assets to this public repository.** Git ignores `duel_hangar.bsp`. Deployed environments must provision authorized assets separately if genuine Hangar geometry is intended to be served to end users.

The first choice currently loads the already-installed authentic Training map. When the Hangar BSP is absent (or a dev server returns SPA HTML for the missing path) its choice loads an authored game-test layout with collision and navigation. This makes the new modes playable for testing without claiming unavailable licensed game art has already been deployed.

## QA checklist

Run this before treating it as production-ready:

```bash
node --test tests/game2-team-modes.test.mjs
npm run build
```

Then in Game Two's dashboard menu:
1. Choose **Capture the Flag** on **Lightsaber Training**. Check that Blue has 7 participants total, Red has 7; both flags can be stolen/dropped/returned and scoring requires your home flag present.
2. Choose **Capture the Flag** on **Hangar Duel**. Verify the test layout is navigable, AI avoids cover obstacles and flag states are correctly announced. With your local BSP installed, repeat on real Hangar geometry.
3. Choose **Sudden Death** on both maps. Confirm Blue 8, Red 8; killed fighters never respawn, and the last surviving team receives the victory announcement.
4. Retest **Single Player**, the **Dark Jedi Duel**, and **online Free-for-all** for regressions.
5. Profile 16 on-screen animated characters on your target desktop and mobile devices. Bots on legacy BSP maps currently use local steering rather than imported `.wnt` route graphs and will need navigation refinement before shipping.

## Known limitations

- No 16-human online rooms: no Railway transport/matchmaker/server changes.
- Existing BSP training and optional original Hangar are not newly optimized for a crowded 16-fighter match.
- AI uses existing humanoid character animation and simple role policy; it is an initial prototype.
- This PR does not republish the proprietary Hangar model or textures. Only the small original Hangar fallback geometry is committed.
