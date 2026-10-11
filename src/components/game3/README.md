# Game 3 — Night Run (original street racing game)

## Scope
Standalone Game 3 under Atom × Eve OS, separate from Game 2. All driving code is original; the NFSMW static recompilation folder from the supplied Drive remains an engineering reference **only**, not a game dependency or imported runtime.

## Imported Drive assets
- 4 GLB cars: Mercedes SLS AMG, sci-fi sport car, Bugatti EB110 Super Sport, Porsche 992 GT3 R.
- 1 Alfa Romeo 33 Stradale FBX extracted from the supplied ZIP; original ZIP retained.
- Glen Canyon Dam environment FBX and 21 associated textures. Dam is currently a **scenic preview**, not a collision-mapped finished driving circuit.
- 37 Alfa Romeo and 35 Porsche additional textures, preserved under `public/game3`; GLB embedded materials remain intact.
- 11 audio files + 2 MP4 reference videos, with playlist mapping in `mediaManifest.json`.
- Music uses user-initiated playback, clickable tracks, previous/next, auto-next, mute and volume. Cinematic music is louder, character dialogue ducks music smoothly; Ghost Slipstream dims the mix.

## Playable systems (prototype)
- Original keyboard arcade racing controls: W/S/A/D or arrows, E shift, Space drift, N nitrous, N+left/right dodge, G Ghost Slipstream.
- Perfect Start via starter flags + red/yellow/green/countdown, Perfect Shift with wind streaks and temporary camera-shake cancellation.
- Two-stage draft at 4s/8s behind opponent, temporary intangible ghost pass with dimming and afterimages, nitrous/drift/lateral-dodge prototypes.
- Top-speed camera shake, airborne ramp jump orbit shot, pre-landing camera return, clean landing nitrous bonus.
- Car collection and local win-based car unlocks, material-targeted paint/rim customization, underglow, custom slipstream/shift colors, HUD gauge styles.
- Seven-scene original prologue introducing the best friend's childhood promise and final-race warning, with conditional audio mixing. Video previews are available on the music tab.

## Main story / finale canon
Full open-city campaign and eight-part finale are specified in `docs/GAME3_NIGHT_RUN_FINALE_STORY_BIBLE.md`; machine-readable mission data is in `src/components/game3/campaignOutline.js`. The story ends with a rescue trip to the hospital, lightweight final race without nitrous, waterfront sacrifice, memory-flipbook fight and graveside spirit reveal. These finale gameplay/cinematic scenes are **design only**, not playable content in this checkpoint. No driver or friend character rigs are provided.

## Still not complete
- Realistic rigid-body tire/suspension collision dynamics, traffic AI, server-authoritative online racing.
- Separate bumper/wing/body-kit geometry, editable layered vinyl decals/stickers, full upgrade/tuning economy. Source car models do not necessarily expose swappable parts.
- Properly rigged driver character face, hand-sign aerial animation and 3D flag-starter animation. No driver rig was provided.
- Authored racing lanes/collision meshes for dam, full campaign and additional stages.
- Runtime browser QA and publication verification; unit/integration checks and production bundle build are not equivalent.

## Licensing
Importing the owner's provided assets for prototyping does not prove distribution or commercial rights. Do not publicly release the supplied commercial songs, videos, car models, or derived textures without verifying the licenses and obtaining necessary permissions.
