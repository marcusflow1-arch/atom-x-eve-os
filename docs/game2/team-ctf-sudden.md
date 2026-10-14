# Game Two — skirmish: Skybridge Citadel and the Drive arenas; FFA, TDM, 7v7 CTF, 8v8 Sudden Death

This applies to **Atom XE → Luna → Game Two**, not the separate Unreal project.

## Team modes

- **Capture the Flag**: Blue = player + 6 bots; Red = 7 bots. Take the enemy flag back to your own base while your flag is home. Flag drop on death, 20-second auto-return, 5-second respawn, first to three captures wins.
- **Sudden Death**: Blue = player + 7 bots; Red = 8 bots. No respawns. Eliminate the entire opposing team.
- **Team Deathmatch**: Blue = player + 5 bots; Red = 6 bots. 4-second respawns; the first team to 30 defeats wins.
- **Free for All**: the player and 7 bots, each with their own blade colour, everyone hostile to everyone. 3-second respawns at the spawn point furthest from everyone; the first to 15 defeats wins.

Every respawn comes with 3 seconds of immunity. These are **local player vs AI matches**, not 16-player live networking. The existing 10-human Railway arena and the Jedi Outcast campaign remain separate. Code: `src/components/game2/engine/teamMatch.js`.

## Skybridge Citadel (authored, the default skirmish map)

`engine/levels/skybridge.js`, original geometry built by `engine/level/builder.js` like the story mission. Two fortress platforms (Blue west, Red east, each with a flag dais, keep, pillars and cover) and a central island hang over a bottomless chasm. Each side has a permanent stone bridge in the middle lane and two energy bridges (north and south lanes).

- **Energy bridges:** a console stands at each end of every energy bridge (8 in all; the HUD shows `[E] Cut the … bridge`). Using one makes the bridge flicker for 0.6 s, drop for 10 s, then reform. Anyone on it falls.
- **Falls are fatal:** below the kill height (9 m under the floors) a fighter dies, credited to whoever last hurt, pushed, pulled or lifted them in the previous 10 s, or cut the bridge under them. The kill counts for TDM and FFA scores, and a flag dropped into the chasm returns home.
- **Bots:** they route over the navigation grid (it knows which bridges are up and keeps a metre from every edge), never step off a ledge on their own, Force Push enemies who have a drop behind them, and cut a bridge from a console when it carries enemies and none of their friends. In TDM the defenders guard a bridge console on their own side.

## Real source maps used

All three menu entries now resolve to actual, different Raven RBSP v1 binary geometry that was read from the connected Google Drive /maps folder. No map-choice placeholder or fallback is allowed.

| Choice | Original map file | Size (bytes) |
| --- | --- | ---: |
| Lightsaber Training | `public/game2/maps/duel_training.bsp` | 905,388 |
| Hangar Duel | `public/game2/maps/duel_hangar.bsp` | 702,604 |
| Carbon Chamber | `public/game2/maps/duel_carbon.bsp` | 910,684 |

The loader verifies actual BSP format, loads the specified geometry, positions the world relative to each map's own spawn origins, and fails visibly instead of displaying another map when the selected binary is missing. The material renderer currently only has shipped Yavin surface textures for Training; other source materials use color approximations rather than full original textures. This affects appearance but not which BSP geometry is loaded.

**Licensing:** These imported level binaries may contain third-party copyrighted level design or assets. Possession in Drive does not establish public redistribution rights. Confirm authorization before keeping them in a public GitHub repository or serving them from a public site.

## Verification

```bash
node --test tests/game2-team-modes.test.mjs tests/game2-skybridge.test.mjs tests/game2-native-map.test.mjs tests/game2-multi-map.test.mjs tests/game2-mission.test.mjs
npm run build
```

The multi-map test checks source binary lengths, magic and unique SHA-256s, parsed geometry and collision, and map-specific coordinate normalization. Re-test every map in 7v7 and 8v8 through Luna, including collision, spawning, match completion and frame rates with 16 characters onscreen. Team AI still uses basic steering on native BSP maps rather than advanced BSP route graph navigation, and will need more work for reliable competitive matches.

### Separately: Luna AI Attribute waterfall

The Luna panel glass experiment now uses a time-varying full-surface transparent water shader, not thin vertical strokes. On systems without WebGL it uses a CSS-animated broad ripple fallback. It leaves the existing panel shell, icon/stat content and input controls unchanged. As with map gameplay, verify it visually on the deployed dashboard and on mobile before declaring it final.
