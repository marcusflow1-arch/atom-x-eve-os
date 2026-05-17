// Resolves a Z/X/V/B keypress into either a legacy companion ability id
// (fired through processCompanionAbilityPress) OR a Deity Fusion activation.
// Extracted from GameWorld3D's onKeyDown to keep that file under its size cap.

import { getCompanionSkillForKey } from './skills/companionLoadoutStore';
import { startFusion, getFusionState } from './fusionStore';

/**
 * @param {string} k — lowercase key ('z' | 'x' | 'v' | 'b')
 * @param {{ current: string|null }} pressedRef — ref to set the legacy ability id
 */
export function handleCompanionKey(k, pressedRef) {
  if (k !== 'z' && k !== 'x' && k !== 'v' && k !== 'b') return;
  const eq = getCompanionSkillForKey(k.toUpperCase());
  if (!eq) return;
  if (eq.fusion) {
    if (!getFusionState().isFused) startFusion(eq.duration || 20);
    return;
  }
  if (eq.legacy_id) pressedRef.current = eq.legacy_id;
}