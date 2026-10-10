# Game 2 · Dark Jedi duel

The Game 2 button on the Moon (Luna) dashboard opens `src/pages/Game2.jsx`, which mounts `Game2Duel.jsx`.
The duel is a small WebGL2 engine in `engine/` (plain ES modules, loaded lazily as its own chunk):

| File | What it does |
| --- | --- |
| `gl.js`, `glb.js`, `assets.js` | WebGL2 renderer, GLB loader, asset loading (`public/game2/`) |
| `g2anim.js`, `actor.js` | Ghoul2 `_humanoid` skeleton player with the original Jedi Outcast animation bank |
| `saber.js`, `fighter.js`, `combat.js` | Raven saber move state machine, locomotion, blocks, hits, blaster bolts |
| `forcerules.js` | **Pure Force rules ported from `w_force.c`** (see below), unit tested |
| `force.js` | Force powers for the player *and* the Dark Jedi (same class, same costs) |
| `darkjedi.js` | Dark Jedi brain: saber fencing + Force use picked by range, Force left and cooldowns |
| `game.js`, `hud.js`, `input.js`, `audio.js`, `fx.js`, `world.js` | Game loop, rounds, HUD, input, sounds, effects, arena |

## Start menu: Single Player and Multiplayer

Game 2 opens on a menu. **Multiplayer** is the Dark Jedi duel described here (played against the AI; there is no
online play yet). **Single Player** runs story missions on the *same* combat code: the saber, Force, block, damage
and bolt rules above are shared, not copied. A mission only adds a level, objectives and enemy behaviour around them.

| Module | What it does |
| --- | --- |
| `level/builder.js`, `level/kit.js` | Plain-data floor plans (walls with doorways, rooms with ceilings, ramps, cliffs, doors) → collision triangles, ray boxes and meshes |
| `level/space.js` | Walking collision (the same `BSPCollision` the Raven arena uses), sliding doors, ceilings, zones, line of sight, bolt and camera rays |
| `level/nav.js` | Navigation grid built from that collision, A* with path smoothing, door aware |
| `brains/` | Brain registry (`kind` → AI). `trooper.js`: sight / hearing, firing distance, repositioning to spots with a clear shot, bursts, rolls away from swings, search, officers rally. `companion.js`: Jan Ors follows and shoots. The duel brains are registered unchanged |
| `archetypes.js` | Combatant data (stormtrooper, officer, Jan, and `reborn` = the duel's Reborn value for value) |
| `mission/director.js` | Objectives (zone / clear groups / use console / hold a terminal), triggers, spawn groups, doors, checkpoints, dialogue, barks, mission HUD, results |
| `missions/kejimPost.js` | Mission 1 · Kejim Post (Expanded Remaster), original geometry and dialogue |

Brains only press the same buttons the player does (`Fighter.cmd`), so every character obeys the same rules.
To add a mission, write `missions/<name>.js` (layout + groups + objectives) and register it in `missions/index.js`.
`tests/game2-mission.test.mjs` builds the level headless, checks navigation and doors, and plays the mission
through the real director, including a checkpoint restart.

## Controls

Move with WASD, hold Shift to walk, Space to jump (hold for Force Jump), C to crouch/roll,
R to draw/holster saber, and press Tab to cycle Fast / Medium / Strong lightsaber stances.
Left mouse attacks; aiming the camera up or down during a slash selects an upward or downward animation
and aims the displayed blade and collision in that direction. Slashes sample the full blade sweep
and the opponent's movement between frames, including crouched and grounded targets.
Hold right mouse to send the saber out and keep it spinning at range, steering toward the camera aim;
release right mouse to recall it. This works while jumping or Force-jumping as well.

**Force quick-cast (hold a key for channeled abilities):**
1 Push, 2 Pull, 3 Grip, 4 Lightning, 5 Heal, 6 Speed, 7 Mind Trick,
8 Rage, 9 Protect, 0 Absorb. The numeric keypad also works.

**Force selection menu:** Scroll the mouse wheel (or use [ / ]) to choose any available
Force power and press F to use the highlighted ability. Hold F for Grip, Lightning,
Heal, or Drain. Drain and Force Sight are available through the selector even though
they are beyond the ten direct-cast slots.

F1 shows/hides the controls; Enter rematches; Ctrl + mouse wheel or - / = zooms.
Mouse movement looks around, including a fallback when the browser rejects pointer lock.

## Push, pull, grip and lightning rules

All outcomes are decided in `engine/forcerules.js` and applied by `Game.applyThrow()`:

| Rule | Source |
| --- | --- |
| A defender answers a push / pull with his own push / pull (no Force cost, short lockout) only if he is alive, not already in a Force animation, not mid-swing, on the ground and has Force for the power | `CanCounterThrow` (w_force.c) |
| The defender's level is his own push / pull level, **one less while moving**. Equal or higher level stops the throw completely; a difference of 1 / 2 / 3 stops 80% / 40% / 20% | `ForceThrow` |
| Knock-down only if the attacker out-ranks the defender, attacker level 3 and the target is within 3.2 m; otherwise the target is staggered or slides | `ForceThrow` |
| Force Absorb lowers the power level by the absorb level and refills the absorber's Force | `WP_AbsorbConversion` |
| Grip: 6.4 m range, target in front, not already gripped, not just freed, caster not busy / mid-swing. 2 damage per second; level 1 holds up to 5 s without lifting, level 2 lifts and cracks for 20 at 3 s, level 3 carries the victim and cracks for 40 at 3 s; 4 s limit for 2 and 3 | `ForceGrip`, `DoGripAction` |
| A gripped fighter can still Push / Pull (level >= the grip level breaks it, and the gripper is busy so he cannot counter) or Absorb (cancels it) | `ForceThrow`, `DoGripAction` |
| Lightning: Absorb cancels the damage and feeds the absorber | `ForceLightningDamage` |

On top of the source rules there is one gameplay layer so a block is "likely, not certain": a *reaction roll*
(player 80%, Dark Jedi 70%, lower when the attacker is behind the defender). Everything else is deterministic.
The HUD tells you why a push landed (moving, mid-swing, in the air, low on Force, caught off guard).

## Assets

`public/game2/` holds the character GLB, the rig and animation bank, saber move data and the sound effects.
Any asset change must keep the file names used by `engine/assets.js` and `engine/audio.js`
(`tests/game2-duel.test.mjs` checks that every referenced file exists).

## Original Lightsaber Training Arena

Game 2 Duel mode now loads the actual duel_training.bsp Raven RBSP v1 binary from
public/game2/maps (copied from the user's Drive /maps directory). The loader
reads geometry, texture coordinates, patch tessellation, worldspawn and
deathmatch spawn entities directly from this BSP. The old round placeholder
arena is *not* used in Duel mode; all other app pages and Game 1 are untouched.

The arena collision detects walkable triangles, solid-wall segments, floors and
steps. Combat is the Game 2 single-player duel against a red-saber Reborn opponent.
The opponent currently reuses the installed Dark Jedi model/rig and AI, not a
separate original Reborn character mesh. Multiplayer PvP networking and original
Raven brush/trigger/shader scripting are not implied by this import.

Original texture paths/UVs drive the WebGL2 material batches. Thirteen original
Yavin JPEG textures from the user's Drive have been included under
public/game2/maps/textures/yavin. Materials not yet included use a visible
flat-shaded fallback. This is a native-map geometry import, not a full Jedi
Outcast game engine port.
