# Luna player avatar integration

The dashboard white-shirt Hi3D warrior is the default player avatar. Explicit saved female selections use Erika Archer. The shared appearance follows the dashboard portrait, small viewer, store, profile, character creator, game HUD, equipment preview, skill preview and editor demonstrations. Scene environments and quest NPCs retain their own assets.

## Controls

Choose **Wave hello** to greet. **Cycle on** rotates through idle, AFK, wave, walk, sit, lean back and standing. Manual actions stop the cycle. **Pause** suspends it. Full previews include the arm slider and WASD after focusing the character. Reduced-motion preferences disable automatic cycling initially. Hidden viewers suspend rendering.

## Character creation

First-time setup: Body → Face → Appearance → Identity → Voice → Review. The character customization dialog uses the same Body / Face / Appearance controls. Camera capture and JPG/PNG/WebP upload fit measured proportions into the existing head geometry, then allow manual adjustment. Camera tracks stop on close, capture, unmount and late permission grants. Multiple faces, small images, poor framing and turned heads receive actionable errors.

Photos are processed in browser memory. The backend saves bounded appearance settings and a face-fit source marker; no photo, image data URL, raw landmarks or generated head is saved. Existing photo-overlay fields are no longer used by the renderer. Fitting is an approximate likeness from one image, not depth reconstruction. Hair fitting changes the existing hair's color, length and volume; arbitrary hair topology is not generated. Mustache and tattoo options are fitted to the male asset's surface and do not use floating planes.

Seven rendering styles: Heroic Fantasy, Graphic Ink, Grounded RPG, Anime, Watercolor, Noir and Neon. Capability-dependent controls avoid tinting the entire white-shirt texture atlas.

## Rig

The optimized asset has 99,826 triangles, 55,586 vertices, 23 joints and 11 clips. The revised arm uses a shared elbow bend plane and smoother sleeve weights; the walk samples the project's existing Mixamo foot trajectory and fits it to this skeleton. Other game clips are retargeted using source and target bind rotations. Sit/lean transitions complete before walking starts. This is a procedural rig; it does not add film-quality anatomy, finger articulation, facial expressions, muscle simulation or cloth physics.

## Verification

Run `npm ci`, `npm run avatar:check`, and `npm run build`.

The checks cover 55 skeletal poses, weight normalization, bind-pose preservation, seated transition ordering, manual arm motion, real head deformation with unchanged body vertices and exact reset, seven style definitions, backend field allowlisting and finite limits, appearance round trips, and animation retargeting. Camera DOM tests simulate permission grants/denials, readiness, capture, upload validation and stream/blob cleanup. They explicitly mock inference.

Live camera hardware, browser WASM inference, GPU shader rendering and authenticated end-to-end backend persistence remain unverified in this execution environment. An earlier native face inference test was rejected by automatic approval review because its unexpected Google connection could not be established as metadata-only. That native test was not retried or bypassed.

`docs/avatar-preview/luna-wave.png` is a CPU render of the actual exported mesh and Wave clip, with approximate lighting. It is not a screenshot of the browser shaders or generated concept art.

## Model dependencies

`@mediapipe/tasks-vision` is pinned to 0.10.32. `predev`/`prebuild` copy its WASM runtime into a versioned directory under `public/vendor/face-landmarker` to avoid stale WASM caches. This pinned release was statically checked for the automatic logging endpoint present in 1.0.1; that endpoint is absent. Public model weights are served by the app rather than uploading a selfie to a service. Their exact file hashes, the avatar hash and walk-source hash are in `tools/hi3d-avatar/asset-checksums.json`.

Public weight sources:
- https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
- https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
- Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js
- Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter/web_js

Source model: user-provided Hi3D warrior. The supplied asset's original texture artwork is retained.
