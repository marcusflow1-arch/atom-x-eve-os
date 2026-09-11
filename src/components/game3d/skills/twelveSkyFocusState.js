let primed = false;
let sourceSlot = null;

function emit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('twelveSkyCriticalFocusChanged', {
    detail: { primed, sourceSlot },
  }));
}

export function primeCriticalFocus(slotIndex = 1) {
  primed = true;
  sourceSlot = slotIndex;
  emit();
}

export function isCriticalFocusPrimed() { return primed; }

// TwelveSky rhythm: charge remains armed through movement/AoE/multi-hit and is
// consumed by the next single-hit finisher.
export function consumeCriticalFocusForSingleHit() {
  if (!primed) return false;
  primed = false;
  sourceSlot = null;
  emit();
  return true;
}

export function clearCriticalFocus() {
  primed = false;
  sourceSlot = null;
  emit();
}
