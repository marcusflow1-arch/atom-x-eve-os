# Star Wars / Jedi Outcast — Kejim Post integration

This branch adds a **Star Wars** entry beside the existing 3D World button and a dedicated full-screen Kejim Post mission runtime.

## Source of truth

The integration is intentionally split between code and proprietary retail content.

- **Behavior / engine reference:** `grayj/Jedi-Outcast`
- **Retail content source:** the owner's private Google Drive game-data folder
- **First mission:** `kejim_post`
- **Retail objectives:**
  1. Investigate the abandoned Imperial outpost.
  2. Engage Remnant forces in the area.

Retail evidence currently catalogued includes the Kejim Post NAV, mission strip/objective resources, music folder, and ICARUS/IBI scripts such as:

- `kejim_start.ibi`
- `jan_fight.ibi`
- `jan_death.ibi`
- `attack_kyle.ibi`
- `control_elevator.ibi`
- `ambush_officer.ibi`
- `3_point_patrol_loop.ibi`
- `anger_shuttle.ibi`
- `rotate_dish.ibi`
- `probe_lift.ibi`

The runtime manifest is in `src/components/starwars/kejimPostMission.js`.

## Why retail binaries are not committed here

This repository is public. Jedi Outcast retail maps, models, textures, music, voice, and other shipped game assets are proprietary content and are not automatically copied into this repository.

The code therefore expects a **converted/private runtime pack**. This keeps source integration reviewable while avoiding accidental redistribution of retail assets.

## Expected runtime pack

Serve the converted files at:

```text
public/
  starwars/
    kejim_post/
      kejim_post.glb
      actors/
        kyle.glb
        jan.glb
        stormtrooper.glb
        officer.glb
      audio/
        explore.ogg
        action.ogg
```

Actor GLBs should contain the original/converted animation clips where available. The runtime resolves common states through aliases for idle, walk, run, fire, pain, and death.

The mission automatically switches to the converted retail scene when `/starwars/kejim_post/kejim_post.glb` is present. Until then, it uses a procedural combat harness so the route, controls, AI, weapon loop, Jan follow/combat behavior, and mission page can be developed without blocking on asset conversion.

## Current milestone: MAP FIRST

Per project direction, this branch is now intentionally sequenced one mission at a time.

**Milestone 1 is only Kejim Post map reconstruction in the browser.** Combat, character movement, enemy AI, animation hookup, and mission scripting stay parked until the real Kejim Post level geometry is visibly loading and can be inspected in-browser.

The active `/StarWars` route now mounts `KejimPostMapRuntime`, which:

- loads Raven `RBSP v1` directly in the browser;
- supports planar surfaces, triangle soup, and quadratic patch surfaces;
- converts JK2 Z-up coordinates to Three.js Y-up coordinates;
- uses BSP vertex lighting for a neutral geometry preview;
- skips source `SURF_NODRAW` surfaces;
- exposes a fly-camera inspection mode only;
- attempts to load `/starwars/kejim_post/kejim_post.bsp`;
- can load a local `.bsp` file for validation without committing proprietary retail data.

The previously-created combat harness remains in the branch as parked work, but it is no longer the active Star Wars page and should not be developed further until the map milestone passes.

## Fidelity rule

The fallback combat harness is **not** the final Kejim Post reconstruction. It exists only to keep the runtime executable while the private retail pack is converted.

When exact retail data is available, it must replace fallback assumptions. In particular:

- map geometry and player route come from retail BSP/map evidence
- actor placement comes from retail entity/script evidence
- AI activation and scripted sequences come from ICARUS/IBI + released source behavior
- textures/shaders/models/audio/animations come from the owner's retail assets
- objective/progression order remains source-faithful

Do not invent geometry, spawn locations, dialogue, mover timing, or mission events when source evidence exists.

## Locked implementation order

1. **Kejim Post map geometry into the browser first.**
2. Verify the complete first mission layout, scale, patch surfaces, rooms, exterior/interior connectivity, doors/lifts/static props, and material/shader mapping.
3. Only after the map is complete and inspectable: add Kyle movement and camera.
4. Then add original character models and animation playback.
5. Then add combat/weapons/damage.
6. Then add enemy AI, Jan ally AI, patrols, awareness, and spawn behavior from retail entities/scripts.
7. Then add movers, ICARUS mission scripting, objectives, checkpoints, sound/music, mission completion, and final validation.
8. Do not start Kejim Base or any later level until Kejim Post is accepted.

### Frame-by-frame visual reference now available

A second private Drive folder is registered as the visual reconstruction reference:

- folder ID: `17jTbFKOpaDZZynh56-CVXglXiECqN8RY`
- mission: Level 1 / Kejim Outpost
- cadence: approximately 1 screenshot per second
- verified range: frame 000001 at 00:00:00 through frame 001653 at 00:27:32

The frames can now be used as a chronological picture-book of the entire playthrough. They are useful for reconstructing and validating:

- room shape and visual proportions;
- corridor/door placement;
- vertical connections and overlooks;
- lighting fixtures and emissive panels;
- wall/floor/ceiling material families;
- props and pickups;
- weapon progression visible in the walkthrough;
- enemy encounter locations and visible timing;
- route order and player-facing landmarks;
- end-of-level presentation.

Representative checks already show the mission moving from the opening sequence into dark Imperial interiors, brighter segmented floor/column spaces, control/terminal rooms, multi-level industrial sections with Imperial markings and red light strips, pickup/weapon areas, and the final level-stat room.

### Remaining geometry-source limitation

The connected Drive `maps` folder still contains `kejim_post.nav` but **does not contain `kejim_post.bsp`**. The NAV file is navigation data and does not encode the complete rendered level mesh.

That no longer leaves us visually blind: the screenshot sequence + NAV + retail scripts + released source + retail models/textures/shaders can be triangulated to reconstruct the mission one zone at a time. However, the screenshots should be treated as visual/gameplay evidence, not as exact hidden geometry or trigger-volume measurements.

The Raven `RBSP` browser loader remains ready. If the real `kejim_post.bsp` becomes available later, it should supersede manual geometric inference and become the exact structural source of truth.
