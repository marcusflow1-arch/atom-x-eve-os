let forcedCriticalHits = 0;

export function armForcedCriticalHit(count = 1) {
  forcedCriticalHits = Math.max(forcedCriticalHits, Math.max(1, Math.floor(Number(count) || 1)));
}

export function consumeForcedCriticalHit() {
  if (forcedCriticalHits <= 0) return false;
  forcedCriticalHits -= 1;
  return true;
}

export function clearForcedCriticalHits() {
  forcedCriticalHits = 0;
}
