# Jedi Outcast: original engine integration

The Luna dashboard button and `/JediOutcast` route now open an isolated, local WebAssembly port of Raven's original single-player engine. The former Three.js `createKyleProxy`, `createStormtrooperProxy`, invented corridor, damage formulas, synthetic audio and Force controls have been removed. The engine owns rendering, Ghoul2 animation, mission scripts, movement, combat, UI and game progression.

## Source and scope

- Requested reference: `grayj/Jedi-Outcast`, commit `85f58467344d3ccbc6e2501a9af573ff4488a898`.
- Browser compatibility port: `Virtastic/jk2-web`, release `v1.1.0`, commit `3aa6c1daee11cfc491a4f57f8d51dbb1402d67fd`.
- Engine (`jk2.js`, `jk2.wasm`) and single-player game module (`qagame.wasm`) are unmodified release bytes. `public/games/jedi-outcast/SOURCE.json` records SHA-256 checksums, source URL and release bundle.
- `engine-shell.js` is adapted from the matching GPL launcher: demo/autoboot paths and automatic gameplay/graphics cvar overrides are removed. Original filesystem, save persistence, audio and engine initialization are retained. Changes are reproducible with `python3 tools/jedi-outcast/install-runtime.py`.
- `atom-launcher.mjs`, `asset-validation.mjs`, the launcher HTML/CSS and React iframe lifecycle are the application integration. They do not create game assets or replace game simulation.
- The source, license and attribution links ship beside the binaries. No retail game assets are published in the app repository.

## Supplied-data audit, 2026-10-07

Inspected the user's two supplied Drive folders, directly listing these folders rather than assuming their contents from folder names:

| Supplied location | Observation |
| --- | --- |
| `19lKiOAeAl1m9r01uw9HTULXl4kw3t2Jp` | Extracted game-data directory tree, configuration, navigation and mission-script files. |
| `maps` (`1jYqwGPuAPzppgn_DlTZYNlGmvNrCMBV_`) | 32 direct files. `kejim_post.nav` is present. `kejim_post.bsp` is absent. Only six BSP files are listed: five duel maps and `pit.bsp`. |
| `models/players/kyle` (`1Ve6_AGdgWnPAz-HLNFNa8MVjjxgUV3Ty`) | Folder exists; direct listing returned no files. |
| `models/players/stormtrooper` (`1_TNPfgVVylubNBu-JvcL0NHE7DYaYoSH`) | Folder exists; direct listing returned no files. |
| `models/players/_humanoid` (`1v7LDsN8t4aOSD_vBcSIaQ81jjnkaydSG`) | Folder exists; direct listing returned no files. |
| `scripts/kejim_post` | Original `.ibi` files are present, including `kejim_start.ibi`, `jan_fight.ibi`, alarm, elevator, dialogue and patrol scripts. |
| `17jTbFKOpaDZZynh56-CVXglXiECqN8RY` | Timestamped Kejim Outpost reference frames. Inspected 00:01:30 and 00:27:05 frames, plus the supplied screenshot of the rejected proxy scene. |

The source code compiles the engine; it does not contain the retail maps or character meshes. A NAV file cannot replace BSP geometry, and a screenshot cannot replace a Ghoul2 mesh or animation. This accessible copy is insufficient to recreate the requested retail level. No assertion is made that the missing assets do not exist elsewhere on the user's computer.

## Launch

1. Open **Jedi Outcast** from Luna.
2. Select every original `assets*.pk3` from an installed `GameData/base` folder, or select the complete extracted base folder. Do not upload files to a server; the browser reads the selected local files.
3. The loader checks the actual ZIP central directory, required starting-level files, original RBSP v1 / GLM v6 / GLA v6 headers, and the presence of textures, shaders, audio and menus. Missing, truncated and unsupported files are reported before engine boot. It does not authenticate retail provenance by filename alone or promise that every campaign dependency is present.
4. Start the original game. Use **New Game** in the original menu for mission setup; no `devmap`, cheats, artificial Force unlocks or replacement spawn points are injected.
5. Saves/config persist in this browser through IDBFS; game data is not persisted or uploaded. Reselect original files after a reload. Returning to Luna requests a save-storage flush before destroying the iframe.

The loader supports ordinary retail ZIP/PK3, not multipart or ZIP64 repacks, with a 1.5 GB selected-data limit. Empty folders are not files. Saved games and user config from the selected disk folder are not silently imported.

## Verification boundaries

Repository checks cover the pinned binary hashes and valid WebAssembly modules, required-file validation, corrupt/traversal ZIP rejection, loose-folder paths, format mismatch rejection, launcher states and source-based routing. The application build is also checked.

**The full original campaign and screenshot parity are not verified.** Required retail assets are absent from the accessible supplied copy. A headless Chromium installation was attempted but its browser download was invalid in the current environment, so no successful live-engine rendering test is claimed. Complete original files and a real browser playthrough remain the acceptance gate. Do not label the game finished, replace missing files with generated content, or use a reference image as gameplay.
