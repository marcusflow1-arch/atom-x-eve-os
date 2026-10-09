
# Game 3 — Night Run (original arcade racing prototype)

The Game 3 entry is inserted immediately before Game 2 in the Moon/Luna dashboard's top navigation, and routes to `src/pages/Game3.jsx`.

The implementation is independent of Game 2 and does **not** import code, audiovisual assets, or engine routines from Need for Speed or Midnight Club.

## Playable vertical slice
- Three.js/R3F night-city road and arcade vehicle simulation; choose between a Mercedes SLS AMG reference slot and a science-fiction sports-car slot.
- Controls: W/Arrow Up accelerate, S/Arrow Down brake, A/D steer, Space+steer drift, E upshift, N nitrous, N+direction lateral dodge, G ghost overtake after 8s in drafting position.
- Three-light cinematic race countdown with female dual-flag starter, RPM timing and Perfect Start, speed-sensitive camera shake, Perfect Shift smooth camera/wind effect, two-stage slipstream, nitrous, drift, opponent traffic proxy, jump/ramp with orbital camera and finish line.
- Story tab: four original narrative/dialogue beats; music mix is ~0.86 during cinematic story beats, ~0.12 during dialogue, ~0.71 while racing and ~0.44 in menus. Music fades smoothly instead of hard cutting.
- Garage: selects between the two cars, changes body paint proxy, Slipstream aura, Perfect Shift aura and HUD speedometer style; users can import a GLB locally from each slot. Models can also be hosted at /public/game3/models/ and then load automatically.
- Music tab: plays a locally selected audio file and can preview a locally selected reference video, **without distributing copyrighted tracks**.

## Asset integration
The user provided:
- `sci_fi_sport_car.glb` (103 meshes, 54 materials, 0 animations)
- `2010_mercedes_sls_amg.glb` (49 meshes, 49 materials, 0 animations)
- multiple commercial-music MP3s and two ROCKSTAR reference MP4 files.

ChatGPT conversation uploads are not shared with the Base44 app runtime directly. The model files were packaged as `Game3_Car_Model_Assets.zip`. Extract both into `public/game3/models/` to make the original 3D car assets appear automatically. Until uploaded to the app, a procedural proxy car is shown, and the Garage provides a per-session GLB importer.

**Do not publish the commercial music, music videos or third-party Sketchfab-derived GLBs without confirming appropriate licenses and commercial permissions.**

## Full-game features requested; not yet production-complete
- Rigged wheels, tire forces/collision bodies, real suspension and simulation physics
- Licensed 3D assets hosted in the actual app and car/driver rigs with hand-wave jump animation
- Full environment/road geometry, robust traffic AI and networked races
- Complete garage body kits, rims, decals, neon, sticker layering, and persistent user collection/unlocks
- Full cinematic shot sequencing, race progression and original story missions with dialogue VO
- Competitive slipstream/ghost balance, network-authoritative countdown and physics validation
- Licensed soundtrack catalog with adaptive music routing and save/load presets

Implementation is a prototype; do not claim these production systems are complete.
