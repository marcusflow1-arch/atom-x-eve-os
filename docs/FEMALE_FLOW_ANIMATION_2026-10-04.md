# Female body: face rig + full-body flow animation (2026-10-04)

`public/models/characters/Artemis_Character_v2.glb` replaces
`Artemis_Character.glb`. Every legacy URL (the hosted
`…96bb872db_Artemis_Character.glb` and the old
`/models/characters/Artemis_Character.glb`) is redirected to it by
`src/lib/characterModelOverrides.js`, so the dashboard, avatar previews, Skill
Book cards and the PvP arena all load the new body.

## What changed in the GLB

- **Face.** `Artemis_Body` keeps its original face (43 478 of its 43 594 vertices
  are bit-identical, the rest are the lips/eye sockets that had to be opened).
  New: real eye openings with `EYE_Sclera_L/R` + `EYE_Iris_L/R` meshes on the new
  bones `eye_l` / `eye_r`, lips split along the lip line with a closed wet inner
  lip, a `jaw` bone, and 30 facial shape keys (`Blink_*`, `Brow_*`, `Eye_Squint_*`,
  `Eye_Wide_*`, `Mouth_Open`, `Mouth_Funnel`, `Smile_*`, `Frown_*`, `Lip_Press`,
  `Cheek_Raise`, `Cheek_Puff`, `Nose_Sneer`, …).
- **Mouth interior.** Never black: a mucosa lining behind the lips (part of the
  body mesh, so it follows the shape keys), `MOUTH_Teeth_Upper/Lower` with
  mamelons and perikymata in the normal map, `MOUTH_Gums_Upper/Lower`,
  `MOUTH_Tongue` (papillae + central groove) and `MOUTH_Palate` (rugae, raphe,
  uvula). All use a small emissive floor so a closed space still reads under
  game lighting.
- **Animation.** Idle, Combat_Idle, Bow_Draw, Bow_Sheathe, Call_Of_The_Husky,
  Rain_Of_Arrows and Lunar_Beam were re-authored on top of the original clips
  (their arm / bow marks are kept at every effect event):
  - the pelvis, spine and neck now carry the motion (anticipation dip, weight
    shift, torso twist, follow-through with a lagged, slightly overshooting
    neck and head);
  - the legs are solved with IK against the original foot plants, so the hips
    swing and the knees bend while planted feet stay planted; airborne phases
    tuck and trail the legs; landings absorb through the knees;
  - arms drag and overlap behind the torso, with the bow string following the
    drawing hand;
  - one-frame arm snaps are spread over a few frames (no joint turns more than
    48°/frame in Rain/Lunar and 32°/frame in Husky; the old clips peaked at 57°);
  - the face acts: blinks, eye darts (gaze aimed at the target during casts),
    brow work, shouts with the jaw open and the interior visible.
- `Idle` is now a 24 s living loop (was 6 s). `Combat_Idle` is a 3 s loop with the
  same face acting at a lower intensity.
- `Chidori_Ultimate` and `Chidori_Hit_Stun_Fall` keep their original body
  channels and gain face-only tracks (eyes, jaw, shape keys).
- Every FX node channel, the bow, `Bow_Glow`, the spirit / husky / rain / lunar
  effect meshes, events and glTF extras (`from`, `returnTo`, `inPlace`,
  `targetDistance`, `events`, `loop`, `home`) are the original ones. Clip
  durations are unchanged except `Idle` (24 s).

## Code

- `characterModelOverrides.js`: new versioned file name + redirect of the old
  `/models/characters/Artemis_Character.glb` path.
- `genesisScene.js`, `PvPArenaStage.jsx`: the eye / mouth meshes opt out of the
  toon outline pass (`prepareFaceDetailMeshes`, same as the male body), because
  their silhouettes sit just behind the skin.
- No runtime changes were needed: `ArtemisDashboardRuntime` plays the clips by
  name and the face is baked into them (bone tracks for `eye_l`, `eye_r`, `jaw`
  and a morph-weight track on `Artemis_Body`).

## Clips

| Clip | Length | Mode |
| --- | --- | --- |
| Idle | 24 s | loop |
| Combat_Idle | 3 s | loop |
| Bow_Draw | 0.733 s | once |
| Bow_Sheathe | 0.8 s | once |
| Call_Of_The_Husky | 2.0 s | once |
| Rain_Of_Arrows | 3.0 s | once |
| Lunar_Beam | 3.6 s | once |
| Chidori_Ultimate | 4.2 s | once |
| Chidori_Hit_Stun_Fall | 3.0 s | once |

All clips are sampled at 30 Hz with linear interpolation. Skeleton conventions
are unchanged (identity rest rotations); three new joints (`eye_l`, `eye_r`,
`jaw`) hang under `head`.
