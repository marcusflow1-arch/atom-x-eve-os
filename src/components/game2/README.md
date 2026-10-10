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

## Saber, movement and aim rules (checked against the original source)

Both modes share these rules; each line names the Raven source it follows.

| Rule | Source |
| --- | --- |
| The ignited blade is traced every step and always cuts what it touches. Outside an attack, contact deals stance-scaled touch damage every 200 ms (Fast 2 · Medium 3 · Strong 4.5) | `w_saber.c` `CheckSaberDamage` (idle wound) |
| During an attack move a contact deals the stance damage (12 / 18 / 28, x1.6 specials) and the same blade may hit that target again 100 ms later (300 ms after a block). Non-Jedi take x1.5; back attacks and the jump slash cannot be parried | `CheckSaberDamage` (attack wound), `WP_SaberCanBlock` |
| The torso follows the view: the view yaw and 75% of the view pitch are spread over `lower_lumbar` 30% · `upper_lumbar` 30% · `thoracic` 40%, so the mouse steers the swing and looking down drives it toward the ground. NPCs pitch toward their target | `cg_players.c` `CG_G2PlayerAngles` |
| No strafe cycles: sideways and diagonal movement play run / walk with the legs turned up to 60° toward travel; backpedalling uses the back cycles. Standing, the legs hold until the view is 40° away, swing at 300°/s and never trail by more than 90° (turn-in-place steps while they catch up) | `bg_pmove.c` `PM_Footsteps`, `CG_SwingAngles` |
| Story mode Bryar pistol: 10 damage, 40 m/s bolt, 400 ms between shots; hold alt fire to charge in 200 ms steps (up to 10 x 5 x 1.7 = 85) | `bg_weapons.c`, `g_weapon.c` `WP_FireBryarPistol` |
| A strike is committed: once the attack itself plays (after the wind-up) the mouse no longer turns or pitches the body until it ends. During the wind-up a deliberate mouse flick (60 px) re-aims it: down = vertical, down-right / down-left = diagonal going right / left, sideways = horizontal | Game 2 addition (mouse-directed swings) |
| Standing still, a swing plays on the whole body as authored. Over running or jumping legs the torso keeps the attack's own hip turn (`G2Rig.matchHips`), so a vertical chop lands in front instead of ~70 degrees to the side | Game 2 addition |
| Leap slash: jump held in the first 500 ms of a strong attack with the feet within 32 units (0.8 m) of the floor; no move input during it, no landing animation | `bg_pmove.c` `PM_CheckJump`, `PM_CrashLand`, `bg_saber.c` `PM_SaberJumpAttackMove` |
| A slash from the air holds its strike until 100 ms after landing and leans into the ground; a downward slash aimed at the floor does the same. A blade that reaches the floor sparks, plays the wall-hit sound and leaves a scorch | `w_saber.c` world trace + Game 2 addition |

## Start menu: Single Player and Multiplayer

Game 2 opens on a menu. **Multiplayer** opens the online lobby (below); its *Practice* button starts the offline
Dark Jedi duel described here. **Single Player** runs story missions on the *same* combat code: the saber, Force, block, damage
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

## Online multiplayer: Jedi vs Dark Jedi

Up to 10 players in the Lightsaber Training arena. Each player picks **Jedi** (blue blade) or **Dark Jedi** (red blade);
the host adds 0 to 3 AI Reborn on the Dark side. Rounds: a side wins when the other has nobody standing; everyone
respawns for the next round. The HUD shows the score, ping, players, kills / deaths and a kill feed.

| Module | What it does |
| --- | --- |
| `Game2Lobby.jsx` | Callsign, side, room list, host a room (name, AI count), offline practice. Needs a signed-in account |
| `net/signaling.js` | Room list and the WebRTC offer / answer through the app backend: `base44/entities/Game2Room.jsonc` and `Game2Signal.jsonc` (the pattern the voice chat uses with `VoiceSignal`). `?g2net=local` uses the tabs of one browser instead, for testing |
| `net/mesh.js` | One WebRTC connection per pair of players (full mesh, no server hop). Channel `u` (unordered, no retransmits) for snapshots and pings, `r` (reliable) for hits, Force and rounds |
| `net/session.js` | Host / guests, join handshake, 10-player cap, sides and spawn slots, relay through the host when two players cannot link directly |
| `engine/netgame.js` | Game sync: snapshots (60/s, 30/s above 6 players), other players' fighters, remote hits and Force, host-run AI and rounds, online HUD |

Authority and latency: every player simulates their own fighter, so moves, swings and Force answer on the next frame and
never wait for the network. Other fighters are shown at their extrapolated current position and updated every rendered
frame. A blade contact is resolved by the attacker and applied by the victim's game; a push / pull is resolved by the
victim's game with its exact state (counters and blocks per `w_force.c`). Measured on one machine over a real WebRTC link:
0.45 ms round trip, a snapshot reaches the other player 1.3 ms after the action and shows on their screen within one frame
(6 ms at 144 Hz); sending costs under 0.05 ms per step. Over the internet the ping is the distance between the players
(typically under 65 ms in the same region). ICE servers come from the `getIceServers` backend function (STUN, plus TURN
when configured; without TURN, two players behind strict NATs cannot connect directly).

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
