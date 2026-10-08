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

## Viewer resolution correction — 2026-10-08

- Startup requests the original engine's custom mode `r_mode=-1`, `r_customwidth=1024`, `r_customheight=768`, and 4:3 aspect. The pinned v1.1.0 platform already honors this mode and skips viewport-triggered renderer restarts in it.
- Report resolution only after native renderer initialization, through Emscripten `postRun`. `onRuntimeInitialized` precedes `callMain`/GLimp_Init and cannot establish that the game is running or that its render size is final.
- The toolbar reads the existing WebGL context's actual `drawingBufferWidth/Height`. It does not substitute requested dimensions or enlarge the backing canvas after rendering has started.
- The iframe fills the available stage. Its canvas fits the actual render aspect into that space, including small previews and fullscreen, without stretching or clipping. Resizing presentation does not lower the 1024×768 native render target.
- Attribute/size observers refresh the measured label after native video-setting or presentation changes. Fatal/lost-context states cannot be overwritten by a late running notification.
- The canvas and iframe changes do not replace engine binaries, data-loading/cache code, controls, saved configuration, or original game content.
- Verification: launcher lifecycle regression coverage simulates startup ordering, real-vs-requested drawing-buffer dimensions, viewport resizing, and fatal/context-loss status. It is not a live GPU/gameplay test; the authenticated preview must still be visually checked.

## Kyle model and camera audit — 2026-10-08

The active Base44 retail-archive chunks were read without changing them. Each fetched chunk matched its recorded SHA-256; ZIP extraction verified the selected entries' CRCs. Archive precedence resolves Kyle's model, skins, and humanoid animation to assets0.pk3.

- Kyle GLM: 394,988 bytes, format 2LGM v6, 72 bones, 4 LODs, 82 surfaces. Its animation reference is `models/players/_humanoid/_humanoid`.
- Humanoid GLA: 9,983,644 bytes, format 2LGA v6, matching 72 bones and 17,278 frames.
- The normal skin and both original first-person saber skins exist. The first-person skin mappings intentionally hide the head, avoiding rendering Kyle's own head over the camera.
- No substitute model, root transform, model scale, custom camera attachment, or animation retargeting is introduced by this correction.

The original `code/cgame/cg_main.cpp` defines FOV 80, third-person range 80/max 150, angle/pitch/horizontal offsets 0, vertical offset 16, and camera/target damping 0.3/0.5. The launcher now applies those values at startup. First/third-person switching, view direction, collision avoidance, zoom, and mission cinematics remain native-engine behavior. Earlier launcher versions applied a 90–121 degree viewport-derived FOV; this change removes that projection as a possible cause. The user's live browser camera state was not directly observed.

A separate verified defect affected build freshness: the loader reused a constant v1.1.0 cache key after the engine was rebuilt. It now reads current build metadata with `cache: no-store` and uses the exact current JS/WASM hashes in artifact URLs. The rebuild workflow updates that same active hash set; the original release hashes remain recorded separately. No global fetch rewriting is needed.

This validates asset structure and startup configuration; it does not establish visual camera correctness in the authenticated gameplay session.


## Live camera correction — 2026-10-08

A Base44 preview screenshot showed the third-person camera effectively pushed into Kyle's head, with the character occupying the lower center of the frame and very little playable space visible. The camera was also still centered directly behind the player.

The browser launcher now keeps Raven's native third-person camera/collision code but changes the startup framing to a pulled-back over-the-right-shoulder view:

- `cg_thirdPersonRange = 135`
- `cg_thirdPersonMaxRange = 220`
- `cg_thirdPersonHorzOffset = -18`
- `cg_thirdPersonVertOffset = 22`
- `cg_thirdPersonPitchOffset = -3`
- `cg_thirdPersonCameraDamp = 0.22`
- `cg_thirdPersonTargetDamp = 0.4`
- FOV remains 80.

Mouse freelook is explicitly kept enabled with Raven's standard `m_pitch` / `m_yaw` values. The game canvas also explicitly requests pointer lock on click as a Base44 iframe fallback so horizontal and vertical mouse movement reliably reach the original engine.

This is a framing/input correction only. It does not replace Raven's camera collision, character model, aiming code, crosshair logic, cinematics, or weapon behavior.
