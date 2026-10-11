---
name: game2-renderer-benchmark
description: Use when evaluating or integrating Three.js and WebGL2 for Atom XE Game 2 without changing Jedi Outcast combat authority.
---
# Three.js/WebGL2 feature-flagged benchmark

## Architecture facts
- Game 2 currently has a custom WebGL2 renderer in `src/components/game2/engine/gl.js`.
- `actor.js` and `g2anim.js` handle animation and produce poses.
- `combat.js`, `fighter.js`, `force.js` and `mission/director.js` own gameplay.
- Existing `three` and `@react-three/fiber` dependencies are already declared in `package.json`; check installed versions rather than reinstalling blindly.
- Three.js can use WebGL2 as a backend; this is not a choice between two mutually exclusive game engines.

## Tasks
1. Document source renderer and animation update flow.
2. Design a separate, opt-in Three.js presentation layer for one character and a small environment.
3. Preserve one authoritative set of poses, camera targets, blade endpoints and combat state. Avoid two renderers fighting for one canvas.
4. Compare at equal fidelity, character count and hardware: frame time p50/p95, draw calls, GPU/CPU load where measurable, memory and scene load, skinning correctness, lighting/shadows and browser support.
5. Test hitbox vs rendered blade alignment, Force effect, locomotion animation, camera latency, pointer lock behavior and multiplayer synchronization.
6. Return adopt / modify / defer with traceable evidence. Keep rollback/feature flag in place.

## Safety
No blanket replacement of raw WebGL2 or gameplay modules. No UE→browser automatic conversion claims. No use of proprietary third-party assets without rights.
Benchmark-only changes live in a reviewable PR; do not merge/deploy without approval.
