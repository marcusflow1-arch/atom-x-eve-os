# Avatar creator locomotion (12 Oct 2026)

**Bodies:**
- `Getsuga_Tensho_Character_v4.glb` (male)
- `Artemis_Character_v4.glb` (female)

Each v4 file is its v3 file plus two clips, `Walk` and `Run`. These clips were authored directly on that body's own skeleton by `tools/avatar-motion/locomotion.mjs`. Every v3 byte, clip, skin weight and shape key is unchanged; `tests/avatar-locomotion.test.mjs` checks this.

`src/lib/characterModelOverrides.js` now serves v4, and redirects v3 and every older URL to it.

## What the player sees

The creator stage ("YOUR CHARACTER / LIVE 3D") has **Idle · Walk · Run** buttons between the rotate buttons. The character walks or runs in place. A faint stage grid scrolls under the feet at the clip's authored speed, so a planted foot stays on the floor.

All changes continue from the pose on screen; nothing restarts or snaps:

- **Idle → Walk/Run.** The clip starts at the phase whose legs best match the current pose (sampled at 32 points of the cycle). The remaining difference fades out as a critically damped spring that keeps the old motion's velocity (inertial blending, 0.11 s half-life). Cadence and floor speed ease in together over 0.35 s.
- **Walk ↔ Run.** This is a phase-locked blend: both clips advance on one shared gait phase while their weights cross, so the feet stay in step and the floor speed blends with them.
- **Walk/Run → Idle.** The character finishes to the next heel strike, then eases into the body's own idle.
- **Rotate buttons.** These now turn the character smoothly instead of jumping 45°.

## How the clips are built

The tool solves each frame procedurally on the real rig, then checks and fits it:

- **Pelvis.** It carries bob, sway, yaw and roll. The chest counter-rotates and the head keeps the gaze level.
- **Legs.** Two-bone IK onto authored ankle paths:
  - Stance rolls heel → flat → ball, with the toes planted, and slides back at exactly the clip speed.
  - Swing is a C1 Hermite path.
  - The knee points where the foot points; the bind feet turn out 11–14°.
  - In the air the foot follows the shin, and the swing leg can't straighten past its contact reach.
- **Fitting.** Per body, the tool fits:
  - hip height (mid-stance knee bend);
  - stance centring;
  - cadence and ground-contact time, so the leg never over-reaches.
- **Arms.** They swing against the legs with elbow flex.
- **Held bow.** Artemis's bow keeps its Idle orientation and that arm swings at half amplitude, so the bow never sweeps through her legs.
- **Face.** Blinks and eye saccades, placed so they loop with the clip.
- **Sampling.** The walk is baked at 30 keys/s and the run at 60 keys/s.

| Body | Clip | Speed | Cycle | Keys/s | Size added |
|---|---|---|---|---|---|
| Male | Walk | 1.24 m/s | 1.10 s | 30 | |
| Male | Run | 3.28 m/s | 0.68 s | 60 | +0.25 MB for both clips |
| Female | Walk | 1.21 m/s | 1.08 s | 30 | |
| Female | Run | 3.19 m/s | 0.65 s | 60 | +0.29 MB for both clips |

To regenerate (deterministic: two runs give byte-identical files):

```bash
node tools/avatar-motion/locomotion.mjs
```

## Evidence

**`node --test tests/avatar-locomotion.test.mjs`: 6/6 pass.**

- **v4 = v3 + Walk + Run.** The v3 binary is a byte prefix of v4, and every v3 JSON entry is identical.
- **Seamless loops.** The first and last keys match on every rotation track (< 0.5°).
- **Planted feet.** Drift while the foot is flat, at the authored speed:

  | Body | Walk | Run |
  |---|---|---|
  | Male | 0.05–0.06 mm | 0.12–0.13 mm |
  | Female | 0.05 mm | 0.14 mm |

- **No pops.** The largest joint move per 60 fps frame across 15 body joints:

  | Transition | Male | Female |
  |---|---|---|
  | Steady run (the bar) | 12.9° | 13.3° |
  | Idle → Walk | 5.6° | 5.3° |
  | Walk → Run | 12.8° | 12.6° |
  | Run → Walk | 10.1° | 10.0° |
  | Walk → Idle | 5.5° | 4.5° |
  | Same Idle → Walk as a hard switch | **23.8°** | **34.7°** |

- **Stops land on a heel strike.** Measured at phases 7.500 (male) and 6.994 (female); a heel strike is a multiple of 0.5.

**Visual checks.** Side and front filmstrips were rendered for both bodies in the local motion viewer.

**In-app checks.** On the creator stage, the clicked sequence Walk → Run → Walk → Idle ran for both bodies:
- floor speed: 1.26 → 3.38 → 1.28 → 0 (male);
- the stop waited for the next heel strike (male: phase 3.80 → 4.00; female: phase 4.49 → 5.00).

**Full suite:** `node --test tests/*.test.mjs` gives 550 pass and 27 fail. The same 27 fail on an untouched checkout of `c35919d5`; they are in loadout locks, dashboard UI, the Jedi camera and the GPL WASM build. ESLint is clean on the changed files.

## Known limits / next

- **Artemis's dress.** Its front panel is skinned to the pelvis only (the skin has no cloth bones), so the forward thigh shows through it on each step. The fix is a driven skirt bone, or thigh-blended weights on that panel: a Blender task (phase 2).
- **Dashboard movement.** WASD on the dashboard still uses the old FBX motions. These clips and the transition code can replace them next.
- **More gaits.** Turn-in-place, start/stop and strafe clips are not authored yet.

## Update, 14 Oct 2026: arms, shoulders, a calm standing idle, and Artemis's right-arm skin

This update responds to review feedback. In the walk and run, Artemis's arm looked "severed / half an arm", the shoulders looked stiff, and the idle looked like it was moving all the time.

### Arms and shoulders

These changes are in `tools/avatar-motion/locomotion.mjs` and apply to Walk, Run and Stand on both bodies.

- **Elbow bend is now an absolute angle about each arm's own hinge.** Before, the clips added their bend on top of the 27–41° already present in each body's idle pose. Artemis's running elbow reached about 125°, which folded the forearm into the upper arm and her belt.
  - The bend is now about 16–26° walking and 75–87° running.
  - Her bow arm is capped at 45°.
- **Abduction is now absolute as well.** The arms hang 7–12° out from vertical when standing, more when running, so the forearms clear the hips and belt.
- **Shoulders.**
  - They sit 3–5° lowered.
  - They draw forward and back with the arm swing; before, they shrugged up and down.
  - Standing, they lift slightly with each breath.

### Stand: the creator's idle

`Stand` is a new 16 s loop authored on each body. It replaces the busy authored idle on the creator stage; the authored idle included stretches, a yawn and looking around. The dashboard keeps the authored idles.

- **Pose.** Weight is on the right leg, the left hip sits slightly lower, and the left foot is relaxed forward and turned out.
- **Breathing.** Slow breathing on a 4 s cycle lifts the chest and shoulders.
- **Face and head.** An unhurried glance around, with blinks.
- **Movement.** Body joints move less than 0.1° per frame, and the feet stay planted.

### Artemis's right upper arm skin

The arm was skinned to her collarbone and chest instead of her arm. Only a strip along its outer side followed the arm bone, so a swinging arm left its skin behind.

- The fix is `reskinUpperArm`, a smooth envelope around the arm's axis. It tapers from deltoid to elbow, gives full upper-arm weight within 75 % of the radius, and fades to none at 140 %.
- It re-skins 447 vertices in place. Joint indices and weights are rewritten in their existing slots, so the file size is unchanged.
- **Stretch at the run's extremes.** The worst triangle stretch on that arm drops from 37× to 3.8×. Her untouched left arm reaches 5.7×.
- **Swing.** Her right arm is modelled fused to her side along their contact, so it swings 40 % less. This keeps that seam from tearing.
- **Rejected approach.** A broader "move chest weight onto any arm" repair was tried and dropped: it made her left arm worse, 25× instead of 5.7×.

### Evidence

`node --test tests/avatar-locomotion.test.mjs`: 13/13 pass. Five of those checks are new for this update:
- **Elbow bend.** Never past 87° in the run and 26° in the walk.
- **Arm angle.** Arms stay within 10–19° of vertical.
- **Stand.** The feet drift 0.00 mm, and joints move at most 0.07° per frame.
- **Skin fix.** It only touches right-upper-arm vertices, only adds upper-arm weight, and keeps every weight normalized.
- **Transitions.** They now start from Stand and still don't pop: Stand → Walk 5.3°/frame against 22–24° for a hard switch.

All 32 avatar tests pass.
