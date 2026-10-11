# GAME 3 / NIGHT RUN — STORY BIBLE: FINAL ACT
Status: narrative design and implementation contract; not a claim that 3D cinematics, missions, or character assets have been implemented.
Scope: original standalone racing game in Atom × Eve OS. This ending is core canon, not a side mode.

## Genre and player experience
- An open-city, story-driven arcade street-racer. The player can walk, enter interiors, converse with NPCs, encounter optional street disputes and limited hand-to-hand fights, get into cars, drive to meets, prep vehicles, and compete.
- Racing and relationships remain central. Rough target: 80% racing/story/social exploration; at most ~20% of playable activity is hand-to-hand encounters, mostly optional. Do not turn this into a beat-'em-up.
- Playable city: interactive buildings, shop and garage visits, walk-up race registration, mechanic/crew encounters, shortcuts, nightlife and traffic.
- Childhood memories and friendship must be established throughout earlier chapters, so the ending is earned rather than a surprise stranger's death.
- The childhood friend and driver are **not yet named**. Use DRIVER and BEST FRIEND as placeholders. The antagonist is either the shooter or the person who ordered the shooting; the latter should be established earlier.

## Last-act story sequence — fixed canonical order

### F01 / The injury: urgent hospital run
**Story event:** The best friend is shot during the conflict around the protagonist's final race aspirations. The driver chooses to rush him to the hospital rather than abandon him.
**Gameplay:** urgent nighttime driving under traffic pressure; tires and camera express stress, not an unfair artificial control freeze.
**Cinematic:** another vehicle rams them. The car rides a small ramp and tilts. The wounded friend is thrown partly out a side window; the driver catches his arm, maintaining one-handed steering with visibly reduced steering precision.
**Agency:** the player steers while the grab animation is locked to an IK target; steer resistance/response changes predictably. No random inputs.

### F02 / Over the freeway: rescue in midair
**Cinematic + controlled input:** the car clears a freeway gap on a large ramp. In slow motion, the driver holds his friend at the window, reaches back to release the rear door, tells him to let go on cue, holds the door open, and guides him through the rear side opening.
**Dialogue:** DRIVER: "Hurry up! Hurry up!"
**Blocking:** specify left/right driving seat, door geometry, opening angle and friend body path in storyboard/rig review; currently no character rig is supplied. Do not animate through metal.
**Landing:** the friend makes it inside, fastens his belt and loses consciousness. The driver, not fully reseated after the catch, briefly braces above the seat while operating the pedals and steering, then corrects the car into a parking lot.
**Transition:** camera returns to playable chase view before touchdown. Do not trigger this long shot on ordinary jumps.

### F03 / The e-bike and emergency entrance
**Story/gameplay:** in the parking lot, the protagonist transfers the friend to a two-person-capable e-bike to avoid attention. He threads through narrow city routes to the hospital service entrance. A short wheelie and speed push can occur in the final approach.
**Cinematic:** arriving at the rear emergency access, medical staff take the friend onto a stretcher and hurry him to surgery. A doctor warns his survival is uncertain.
**Performance:** sirens and music recede; breathing and heartbeat lead the mix. The protagonist's pain transforms into quiet determination.

### F04 / The last race: the childhood car
**Story:** his driving ambition began years ago, and people warned this dangerous race could kill him. He chooses to enter anyway. On the way, he finds a familiar old lightweight car resembling one he once owned. This is an emotional callback, not a new luxury unlock.
**Interaction:** he gains access and gets it running in a brief cinematic. Avoid interactive step-by-step vehicle break-in instructions.
**Core race constraint:** no nitrous equipped and no high-end tuning. Emphasize skill: precise Perfect Shift timing, first- and second-stage Slipstream where feasible, careful drafting, strategic shortcuts, effective line choices, countersteer/drift and momentum management.
**User terminology:** user also mentioned "dust" in the final race; reserve it as a named but not-yet-defined mechanic. Do not silently reinterpret as a feature or invent its effect.
**Balance:** the car is light and agile enough to offset its power disadvantage; not magically faster in a straight line.
**Final straight:** protagonist and rival finish nearly neck and neck. In slow-motion photo-finish verification, the protagonist wins by a tiny but deterministic margin. First show ambiguity; then reveal accurate finishing order.
**Audio:** music builds under the final lap and briefly drops out for the freeze frame.

### F05 / Prize night, waterfront ambush
The organizer/rival who ordered the friend's shooting is enraged by the protagonist's win. While the winner moves near the waterfront to collect money, the antagonist assaults him and prepares to shoot.
At the instant of the threatened shot: smash cut to a future graveside scene. A familiar unseen voice speaks. The viewpoint drifts, showing a seemingly living figure who is the best friend; before showing the protagonist's full response, snap back to the waterfront.
**Temporal rule:** this is a purposeful flash-forward with a later spiritual reveal, not a separate real-time teleport.

### F06 / The sacrifice
**Payoff:** the best friend survived emergency surgery long enough to leave the hospital, although gravely wounded. He tracks down the ambush (narrative bridge required: a crew contact/location call or another clear clue). He arrives and takes the bullet intended for the protagonist. He dies from the second injury.
**Continuity safeguard:** show that several hours pass across surgery and the climactic race; do not imply he walked straight out of an operating room minutes after a critical injury without explanation.
The protagonist is stunned and acts instinctively. Avoid treating the friend's death merely as a power-up or reward.

### F07 / The memory-fight
**Playable cinematic fight:** against the antagonist. Punches and dodges are responsive, with simple grounded controls rather than a new full combat-focused game system.
**Signature presentation:** each successful strike produces a small memory image beside the active action, left or right. As the combo accelerates, childhood moments play as a rapid flipbook: playing at being anime heroes, inventing martial-arts moves, growing older together.
**Memory dialogue:** BEST FRIEND: "What if we could really do this?" Then: "One day we might actually pull this off."
**Final choreography:** protagonist grasps the antagonist's chain, pulls him downward, swings one leg upward into a chin-level strike, then follows with a reverse descending flip kick. The opponent falls and his head strikes the ground. Use choreographed, well-rigged animation, not procedural ragdoll clipping.
**Tone:** impressive yet emotional, not comically superheroic. This is an extreme, adrenaline-powered version of a move rehearsed since childhood. Do not assume literal supernatural powers.
**Audio:** per-punch transient effects; music gains intensity with the flipbook montage, but ducks when memory voices become clear.

### F08 / Graveside revelation and credits
Return to the grave scene. The friend is present as a spirit or memory-figure, speaking reassuringly to the protagonist. Slowly establish that the grave is his; this reframes the preceding spiritual voice. His parting message is about living onward rather than needless revenge.
Camera reveals the protagonist's grief and resolve; the sound becomes sparse and intimate. Fade to end credits.
Do not contradict the fixed sacrifice by revealing the friend was physically alive at the graveside.

## Interactivity and pacing requirements
- Open world exploration / conversation -> race signup -> car prep -> race -> narrative beat; not only back-to-back race menus.
- Long flagship cinematics (freeway rescue, waterfront cut, spirit reveal) are authored cutscenes with small meaningful player-controlled sections. Never take control of steering during an ordinary competitive jump.
- Skip and replay cinematics; provide accessible input prompts and optional reduced camera movement.
- Important plot deaths are fixed story events, not misleading failures attributed to player skill.
- During the ambulance run: player keeps steering, with partial restrictions made understandable through car response and camera.
- E-bike has its own handling and safe two-person rider animation/collision.
- Race has no nitrous; garage loadout and HUD must visibly reflect its disabled state; do not auto-grant nitrous from Perfect Shift on this mission.
- Photo finish decision must use position/timestamp simulation rather than fake random outcome. Story result can be scripted to be narrow when player fulfills objective.

## Adaptive soundtrack direction
- Music rises in cinematic showcases, nighttime travel montage and critical laps (~0.80–0.90 relative mix).
- Dialogue: duck music to ~0.12–0.20, keep dialogue clear, ease up gradually.
- Hospital: low score, environmental voices/heartbeat, silence after doctor's prognosis.
- Photo finish: brief near-silence and then winning cue.
- Waterfront gunshot: hard transient then near-silence / ringing before flash-forward.
- Flashback fight: memory voices prioritized over dynamic soundtrack.
- Graveside: almost no percussion; resolve to restrained elegiac motif.
- The user-provided MP3s can be auditioned as local/prototype reference music, but synchronization/master and other applicable permissions are required for distribution.

## Narrative continuity and dependencies
- Seed childhood car and anime-move rehearsal near the beginning; memory fragments recur throughout the campaign.
- Seed friend loyalty, antagonist motivation and threat to both racers before the endgame.
- Script final race takes place during a long surgery timeline; communicate that the friend managed to leave only after a critical operation.
- 3D runtime needs player and friend rigs, facial expressions, vehicle interiors, opening doors, seat belts, stretcher, e-bike, 3D hospital, memorial scene and antagonist rig. These assets were **not** provided by the current Drive folder.
- Don't claim scenes are playable until corresponding assets/logic/QA exist.
