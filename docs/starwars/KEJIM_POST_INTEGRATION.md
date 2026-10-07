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

## Current gameplay slice

The branch currently includes:

- Star Wars button in the Atom XE header
- full-screen `/StarWars` route
- restart + return-to-dashboard controls
- third-person Kyle test character
- WASD movement + sprint
- pointer-lock camera
- blaster firing and damage
- Jan follower / ally combat
- Imperial patrol → alert → chase → fire behavior
- stormtrooper/officer test encounters
- health and hostile-count HUD
- source-derived Kejim Post objective text
- mission completion state
- optional GLTF actor animation playback
- fallback environment/actors when private retail pack is absent

## Fidelity rule

The fallback combat harness is **not** the final Kejim Post reconstruction. It exists only to keep the runtime executable while the private retail pack is converted.

When exact retail data is available, it must replace fallback assumptions. In particular:

- map geometry and player route come from retail BSP/map evidence
- actor placement comes from retail entity/script evidence
- AI activation and scripted sequences come from ICARUS/IBI + released source behavior
- textures/shaders/models/audio/animations come from the owner's retail assets
- objective/progression order remains source-faithful

Do not invent geometry, spawn locations, dialogue, mover timing, or mission events when source evidence exists.

## Next integration pass

1. Convert Kejim Post map geometry to GLB/glTF while preserving material names and world scale.
2. Convert required GHOUL2/MD3 character assets and animation clips.
3. Rebuild shader/material mappings from the retail shader + texture folders.
4. Recover retail entity coordinates and scripted encounter activation.
5. Port doors, lifts, dish movement, triggers, objectives, and mission finish conditions.
6. Add the original mission sound/music hooks from a private runtime asset host.
7. Compare the complete playthrough against the retail mission before removing the fallback harness.
