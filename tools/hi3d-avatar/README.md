# Hi3D warrior animation integration

This uses the user's supplied **Hi3D Stylized Modern Fantasy Male Warrior** GLB. The original upload is a static, unrigged mesh with 5,000,000 triangles and two 8192px JPEG textures. The deliverable adds a 23-joint skeleton, four normalized influences per vertex, eleven skeletal animation clips, and an optimized web mesh. It preserves the supplied character design and UV layout.

## Controls

On the Luna dashboard, enter the existing character focus mode. Click the character, then use WASD to walk. Double-click to wave. The animation bar offers Idle, AFK, Wave, Walk, Sit, Lean back, Stand, Pause, and a right-arm slider. Walk previews the gait in place; WASD moves the character. A character in a seated pose completes the return-to-standing sequence before movement is enabled. AFK begins after 20 seconds in idle. The slider stays manual until another action is selected.

The local player's solo and shared dashboard stages use `Hi3DPlayerPreview`. Guest and host companion records still use the established Genesis renderer. Both small avatar viewers use the original White Y-Bot. Shared room, environment, friends, and attribute features remain in the current dashboard component.

## Files

- `public/models/luna-hi3d/warrior.glb`: deployment asset, 4096px textures.
- `public/models/luna-hi3d/warrior.json`: asset provenance, joint positions, clip durations, and geometry counts.
- `src/components/dashboard/Hi3DPlayerPreview.jsx`: focus, input, AFK, and accessible animation controls.
- `src/components/onboarding/embeddedAvatarController.js`: clip transitions and additive manual arm control.
- `src/components/onboarding/genesisScene.js`: the existing renderer, extended to recognize this embedded rig and preserve its material appearance.

The separate downloadable `Hi3D-Warrior-Animated.glb` retains the source 8192px textures. `Hi3D-Warrior-Preview.html` embeds the web model and Three.js and can be opened directly in a browser without a server or account.

## Embedded animation clips

| Clip | Seconds | Behavior |
| --- | ---: | --- |
| Idle | 4 | Loop; subtle breathing |
| AFK | 8 | Loop; head and body shifts |
| Wave | 3.2 | One shot, then Idle |
| Walk | 1.2 | In-place loop |
| Arm_Raise | 1.4 | Sampled by the manual slider |
| Sit_Down | 2.6 | Transition to Sit_Idle |
| Sit_Idle | 4 | Seated loop |
| Lean_Back | 2.2 | Transition to Lean_Back_Idle |
| Lean_Back_Idle | 4 | Reclined loop with support hands |
| Sit_Forward | 2.2 | Return from reclined to seated |
| Stand_Up | 2.6 | Return to standing |

## Rebuild and validation

Use the repository's Node dependencies, plus Python with `pip install -r tools/hi3d-avatar/requirements.txt`. Run from the repository root. Supply the original uploaded GLB as the first input; generated intermediates can live outside the repository.

```bash
node tools/hi3d-avatar/optimize.mjs /path/to/source.glb /tmp/warrior-optimized.glb 100000
node tools/hi3d-avatar/rig-and-animate.mjs /tmp/warrior-optimized.glb /tmp/Hi3D-Warrior-Animated.glb
python tools/hi3d-avatar/web-textures.py /tmp/Hi3D-Warrior-Animated.glb public/models/luna-hi3d/warrior.glb 4096
node tools/hi3d-avatar/validate.mjs
node tools/hi3d-avatar/build-preview.mjs public/models/luna-hi3d/warrior.glb /tmp/Hi3D-Warrior-Preview.html
npm run build
```

The optimization uses meshoptimizer 0.22; the geometry builder normalizes the character to 1.8 meters, fits this specific pose, isolates the sword and thumb surfaces, and separates small fused contact triangles so independently moving parts do not stretch between the body and hands. The sword follows the left thigh. This is a fitted procedural rig and authored animation, not motion capture or a generic automatic rigger.

Validation loads the actual GLB through Three.js, checks the bind pose and normalized weights, samples 55 animation poses, checks floor penetration and support-wrist targets, and exercises interrupted transitions, wave completion, standing before walking, and the arm slider. Inspection images render the actual posed mesh with approximate CPU lighting. Browser WebGL playback and signed-in production dashboard interaction still require a visual check in the target environment.

This pass does not add facial blendshapes, independent finger articulation, cloth/hair physics, a removable outfit, or new sculpted anatomy. The source's fused clothing and prop topology still limits extreme deformation; dedicated topology and corrective-shape work would be needed for a production cinematic rig. It must not be described as a completed AAA remaster.

The repository's ordinary Base44 build variables are still required for API calls in deployment. There is no new backend, API key, upload endpoint, or paid generation service in this integration.
