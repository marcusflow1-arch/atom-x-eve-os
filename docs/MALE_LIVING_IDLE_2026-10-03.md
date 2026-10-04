# Male body: face rig + living idle (2026-10-03)

**Current file: `Getsuga_Tensho_Character_v3.glb`.** v3 goes back to the first
take of the idle: one continuous 48 s `Idle` loop with the stretch (12.3 s),
neck roll (20.4 s), yawn (28.4 s) and look-around (37.2 s) built in. It ships no
separate `Idle_*` variant clips, so the random idle director finds nothing to
play and stays off. Everything else below (face rig, unchanged combat clips,
redirects) is the same as v2. v2 notes follow.


`public/models/characters/Getsuga_Tensho_Character_v2.glb` replaces
`Getsuga_Tensho_Character.glb`. Every legacy URL (the hosted
`…d646be928_Getsuga_Tensho_Character.glb`, `/getsuga/Getsuga_Character.glb` and the
old `/models/characters/Getsuga_Tensho_Character.glb`) is redirected to it by
`src/lib/characterModelOverrides.js`, so the dashboard, avatar previews, Skill
Book cards and the PvP arena all load the new body.

## What changed in the GLB

- `SK_Character`: subdivided face, real eyelids, a mouth opening with a jaw
  split and 31 facial shape keys (`Blink_*`, `Brow_*`, `Smile_*`, `Mouth_Open`,
  `Lip_Press`, `Cheek_Raise`, …).
- New meshes `EYE_Sclera_L/R`, `EYE_Iris_L/R`, `MOUTH_Cavity`,
  `MOUTH_Teeth_Upper/Lower`, `MOUTH_Tongue`, skinned to new bones `eye_l`,
  `eye_r` and `jaw` under `head`.
- Clips:
  - `Idle` (index 0): 12 s seamless loop. Breathing that moves chest, shoulders
    and neck, weight shifts, blinks, eye darts and small facial changes.
  - One-shot idle variants: `Idle_Stretch` (6.5 s), `Idle_LookAround` (5 s),
    `Idle_NeckRoll` (5.5 s), `Idle_Yawn` (5.5 s). Their glTF extras carry
    `idleVariant: true`, `weight` and `returnTo: "Idle"`.
  - Unchanged and bit-identical to the previous file: `Combat_Idle`,
    `Dodge_Left/Right`, `GetsugaTensho` (+ all FX nodes), `Chidori_Attack_01`,
    `Chidori_Ultimate`, `Chidori_Hit_Stun_Fall`, with their event extras.
- Skeleton node names, bind pose and bone frames are those of the previous
  file, so retargeting, the procedural Chidori rig and older card clips behave
  exactly as before.

## Runtime

- `src/components/getsuga/idleVariants.js` — `IdleVariantDirector`: while the
  character stands idle it waits 7–13 s, then 12–24 s between variants, picks
  one by weight (stretch most often, never the same twice in a row), crossfades
  into it and back into the same `Idle` loop. Anything else that takes the body
  (a card cast, locomotion, a hit reaction) interrupts it.
- `GetsugaDashboardRuntime` (Luna dashboard): variants on by default.
  `new GetsugaDashboardRuntime({ idleVariants: false })` turns them off — the PvP
  arena does this so fighters hold a steady idle between turns. Calling
  `playIdle()` while already idle no longer restarts the loop.
- `genesisScene` male previews without the card runtime now play the GLB's own
  `Idle` + variants instead of the synthetic idle derived from GetsugaTensho.
- Eye and mouth meshes opt out of the toon outline pass.

Source files (Blender): `AtomXEve_Work/blend/Male_Master_v009_master.blend`;
the GLB is built by `AtomXEve_Work/tools/axe_merge_r1.py` from the Blender
export plus the previous GLB.
