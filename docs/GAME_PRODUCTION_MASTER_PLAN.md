# Atom X Eve Game Production Master Plan

## 1. Goal

Build the game with a repeatable production pipeline instead of making assets one-by-one manually.

The production chain will be:

1. **Design / reference**
2. **Tripo model generation or existing-model intake**
3. **Rig check**
4. **Tripo Mixamo-compatible rig**
5. **Animation creation / retargeting**
6. **Blender cleanup, QA, baking, LODs, collisions, materials**
7. **Admin asset library import**
8. **Game runtime integration**
9. **Gameplay-state assignment**
10. **Performance and multiplayer validation**

Existing models should enter at step 2 without being regenerated.

---

## 2. Core Toolchain

### Tripo
Primary AI 3D production service.

Use it for:
- text-to-model
- image-to-model
- multiview-to-model
- mesh cleanup / reduction where useful
- rig-check
- automatic skeletal rigging
- Mixamo-compatible rig output
- preset animation retargeting

The application already contains a Tripo API integration and a `TripoModel` entity. New animation pipeline actions should use the v3 animation endpoints and preserve permanent copies of generated assets.

### Blender
Primary DCC/finishing application.

Use it for:
- mesh cleanup
- correcting scale and transforms
- inspecting skeletons
- weight-paint repair
- animation cleanup
- loop cleanup
- animation baking
- root-motion preparation
- sockets / attachment points
- material cleanup
- LOD generation
- collision meshes
- terrain and environment assembly
- export validation

Blender will be connected through an MCP bridge so an AI agent can inspect and edit the live Blender scene.

### Atom X Eve Admin
Asset registry and game-facing production console.

Existing entities:
- `Model3D`
- `AnimationFBX`
- `TripoModel`

Admin remains the source of truth for models and animation clips that are approved for runtime use.

---

## 3. Character Asset Standard

Every humanoid gameplay character should eventually satisfy:

- one root object
- one humanoid armature
- Mixamo-compatible bone naming where practical
- neutral bind pose
- consistent forward axis
- consistent world scale
- no unapplied transforms before final export
- PBR materials
- optimized texture sizes
- game-ready polygon budget
- named attachment sockets
- tested deformation at shoulders, elbows, wrists, hips, knees, ankles
- validated animation loops
- GLB for web/runtime previews
- FBX retained when a DCC/game-engine workflow needs it

### Character size classes
Maintain named classes rather than arbitrary scale:
- Child
- Small humanoid
- Standard humanoid
- Large humanoid
- Giant / boss

---

## 4. Animation Library

Create animations as reusable motion assets instead of binding each animation permanently to one character.

### A. Core locomotion
Required first:
- Idle
- AFK
- Walk forward
- Walk backward
- Strafe left
- Strafe right
- Run
- Sprint
- Crouch idle
- Crouch walk
- Jump start
- Jump loop
- Jump land
- Turn left
- Turn right

### B. Evasion
- Dodge left
- Dodge right
- Dodge backward
- Forward roll
- Backstep
- Knockback recovery

### C. Universal combat
- Draw weapon
- Sheathe weapon
- Guard idle
- Block
- Guard break
- Light hit reactions
- Heavy hit reactions
- Stagger
- Knockdown
- Get up
- Death front
- Death back

### D. Weapon families
Build reusable sets for:
- unarmed
- one-handed sword
- two-handed sword / great sword
- dual weapons
- spear / polearm
- bow
- rifle / firearm
- staff / magic focus

Each family needs:
- combat idle
- light attack chain
- heavy attack
- charged attack
- running attack
- aerial attack where applicable
- block / parry
- skill cast variants
- finisher

### E. Social / world interaction
- Sit
- Stand
- Lean
- Wave
- Point
- Talk
- Cheer
- Pick up
- Open
- Use object
- Craft
- Mine / gather
- Blacksmith
- Inspect item

### F. AI / NPC
- alert
- investigate
- patrol
- hostile idle
- aggro
- search
- flee
- celebrate
- wounded

---

## 5. Animation State Machine

Animations are not selected directly by UI buttons in the final game. Gameplay state drives animation state.

Main layers:

1. **Locomotion base layer**
2. **Upper-body weapon/action layer**
3. **Hit reaction layer**
4. **Status / CC override layer**
5. **Facial / look-at layer**
6. **Equipment additive layer**

State examples:

`Idle -> Walk -> Run -> Sprint`

`Idle -> DrawWeapon -> CombatIdle`

`CombatIdle -> Attack1 -> Attack2 -> Attack3 -> Recovery`

`AnyState -> HitReact`

`AnyState -> Knockdown -> GetUp`

Rules:
- transition windows must be data-driven
- attack cancel windows must be explicit
- animation events trigger damage, VFX, sound and hitboxes
- root motion must be opt-in per clip
- networked animation state must replicate deterministically

---

## 6. Existing Model Pipeline

For every existing model:

1. Register/select it from Admin `Model3D`.
2. Run Tripo rig-check.
3. If already correctly rigged:
   - skip auto-rig
   - normalize skeleton naming if necessary
4. If not rigged:
   - send the model to Tripo auto-rig
   - request Mixamo-compatible output
5. Apply the base animation pack.
6. Open in Blender.
7. Fix bad weights / clipping.
8. Validate loops and root motion.
9. Export game-ready GLB.
10. Register final model and clips in Admin.
11. Attach runtime animation profile.

No model should enter gameplay before passing the validation checklist.

---

## 7. Landscape / World Production

Split the world into modular pieces.

### Terrain
- heightfield / terrain base
- biome masks
- roads
- rivers
- cliffs
- caves
- traversal blockers
- navmesh zones

### Modular environment kits
Create reusable kits for:
- village
- city
- temple
- dungeon
- fortress
- cave
- forest
- mountain
- desert
- ruins

Each kit contains:
- walls
- floors
- roofs
- doors
- stairs
- columns
- bridges
- props
- destruction variants
- collision variants

### World optimization
- chunk/sector streaming
- LODs
- occlusion
- instancing
- texture atlases where useful
- proxy collision
- navmesh streaming
- distant impostors for large scenery

---

## 8. Gameplay Production Order

Do not build the entire world before combat works.

### Milestone 1 — Vertical Slice
One character, one enemy, one small arena.

Must include:
- movement
- camera
- targeting
- one weapon family
- basic combo
- hit detection
- damage
- health
- enemy AI
- death
- loot
- XP
- animation state machine

### Milestone 2 — Combat Foundation
- all universal locomotion
- dodge
- block/parry
- stagger
- status effects
- skills
- cooldowns
- resource system
- weapon switching

### Milestone 3 — RPG Systems
- levels
- stats
- equipment
- inventory
- crafting
- quests
- NPC interactions
- shops
- blacksmith
- drops

### Milestone 4 — World
- streamed zones
- spawn system
- bosses
- dungeons
- traversal
- world events

### Milestone 5 — Multiplayer
- authoritative movement
- replicated combat
- party
- loot ownership
- enemy authority
- anti-cheat validation
- persistence

---

## 9. Asset Folder Standard

Recommended logical asset tree:

```
GameAssets/
  Characters/
    Player/
    Enemies/
    NPC/
    Bosses/
  Animations/
    Core/
    Combat/
    Weapons/
    Social/
    NPC/
  Weapons/
  Armor/
  Props/
  Environment/
    Terrain/
    Biomes/
    Buildings/
    Dungeons/
  Materials/
  VFX/
  Audio/
```

Naming:

```
CHR_Player_Male_A
CHR_Bandit_A
ANM_Core_Idle
ANM_Core_Run
ANM_Sword1H_Attack_01
WPN_Sword_Iron_01
ENV_Ruins_Wall_A
```

---

## 10. Production Rules

- Keep source assets; never overwrite the only master.
- Generated provider URLs must be copied to permanent storage.
- Every gameplay character gets a skeleton compatibility record.
- Every animation records loop/root-motion/weapon-family metadata.
- No animation timing is hard-coded into combat code.
- VFX, sounds and damage windows use animation event markers.
- One animation library should serve many compatible characters.
- Characters with unusual proportions can have retarget profiles.
- Landscape art and gameplay collision stay separable.
- Each asset must have a performance budget.

---

## 11. Immediate Build Order

### Phase A — Pipeline foundation
1. Finish Tripo v3 rig-check / rig / retarget backend actions.
2. Connect Blender through MCP.
3. Add Blender validation/export script.
4. Add Admin production queue for model -> rig -> animation -> approved.

### Phase B — First animation pack
Create and validate:
- Idle
- AFK
- Walk
- Run
- Sprint
- Crouch
- Jump start/loop/land
- Roll
- Dodge left/right/back
- Block
- Hit
- Death

### Phase C — First combat weapon
Use one weapon family and finish it completely before duplicating the system.

Recommended first family:
- one-handed sword or the weapon currently used by the chosen vertical-slice character

### Phase D — First environment
Build one small combat zone with:
- terrain
- modular architecture
- props
- collisions
- navmesh
- spawn points
- one boss arena

---

## 12. Definition of Done for the Pipeline

We can consider the asset pipeline operational when:

- an existing Admin model can be selected
- the system can determine whether it needs a rig
- a rigged Mixamo-compatible output can be produced
- a selected animation can be applied/retargeted
- Blender can inspect and edit the result through MCP
- Blender can run the QA/export script
- the final asset returns to Admin
- the game can load the asset and play the animation through the state machine
