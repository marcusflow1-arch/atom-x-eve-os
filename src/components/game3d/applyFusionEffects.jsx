// Per-frame fusion effect application. Called from GameWorld3D's animate loop.
// While fused:
//   • Companion 3D model is hidden
//   • Player levitates by FUSION_LEVITATE_HEIGHT units (Y offset)
// When not fused, this is a no-op (companion visibility is owned by the
// mount/follow logic earlier in the frame).

import { getFusionState, FUSION_LEVITATE_HEIGHT } from './fusionStore';

export function applyFusionEffects(model, companionGroup, isMounted) {
  const fused = getFusionState().isFused;
  if (fused && companionGroup) companionGroup.visible = false;
  if (fused && model) model.position.y += FUSION_LEVITATE_HEIGHT;
}