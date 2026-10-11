---
name: game2-combat-qa
description: Use for Game 2 movement, camera, saber hit, Force reaction, knockdown/getup or combat animation changes and reviews.
---
# Jedi Outcast combat regression

## Sources to inspect
`src/components/game2/engine/fighter.js`, `input.js`, `saber.js`, `combat.js`, `force.js`, `forcerules.js`, `actor.js`, `g2anim.js`, `game.js`.
Read original compatibility claims in `src/components/game2/README.md`. These are project claims and must be tested when possible.

## Reproduce before patching
1. Input: pointer lock granted/rejected, normal mouse look, WASD, camera-directed slash, wheel Force selector, Tab stance.
2. Movement: idle/walk/run/strafe, sprinting, crouch, jump and landing, tumble/roll, recovery transition.
3. Combat: Fast/Medium/Strong directional swings, blocks/parries, saber/body swept contacts including running, crouching and airborne opponents.
4. Force: Push/Pull effect, stagger, knockdown, attempted recovery while airborne, Space quick getup, enemy retaliation and hit reactions.
5. Networking: test multiplayer if available, otherwise report as NOT RUN.

## Static audit leads—not yet diagnosed runtime bugs
- `fighter.js` switches `flung` → `down`, where jumpPressed gets checked, but an earlier airborne Space tap may be lost.
- `fighter.js` transitions out of `getup` on a fresh jumpPressed: verify animation continuity.
- `fighter.js` `hurt` tests `!this.forceUntil` instead of `this.forceUntil <= this.now`: determine whether old nonzero timestamps block future flinches.
- `input.js` pointer-lock fallback: test movement and mouse event handling under embedded iframes.

## Validation gates
- Ground knockdown Space initiates responsive getup; 0.5-second fallback and rapid tap override work per owner request, without snapping the skeleton or skipping necessary contact.
- Hit react remains reliable after Force actions.
- Saber timing/collision, intended attack commitment and lethality stay consistent with original game goals.
- Existing mission and multiplayer behaviors remain functional.
- Record exact reproduction steps and compare before vs after.

## Tests and evidence
Run actual commands for relevant tests including `node --test tests/game2-duel.test.mjs tests/game2-mission.test.mjs`, and appropriate build/lint checks. Add targeted tests covering discovered bugs. If browser/CI unavailable, say NOT RUN; do not invent benchmark or visual proof.

Deliver issue comment and PR with result matrix plus ownership/approval details.
