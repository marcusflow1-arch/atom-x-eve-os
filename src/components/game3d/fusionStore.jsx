// ─── Fusion Store ──────────────────────────────────────────────────────
// Tracks whether the player is currently in Deity Fusion mode. While fused:
//   - The companion 3D model is hidden
//   - The player levitates (Y offset applied each frame)
//   - The fusion expires automatically after `duration` seconds
//
// This is intentionally tiny — it's a transient runtime state, not persisted.

const LEVITATE_HEIGHT = 1.2;  // world units lifted off the ground

let state = {
  isFused:        false,
  startedAt:      0,
  durationMs:     0,
  expiresAt:      0,
};

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(state));

export function getFusionState() { return state; }

export function subscribeFusion(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

// Subscribe to fusion state with time remaining — hydrates HUD display.
export function subscribeFusionState(fn) {
  const updateFn = () => {
    const now = performance.now();
    const remaining = Math.max(0, (state.expiresAt - now) / 1000);
    fn({
      isFused: state.isFused,
      duration: state.durationMs / 1000,
      timeRemaining: remaining,
    });
  };
  listeners.add(updateFn);
  updateFn();
  return () => listeners.delete(updateFn);
}

export function startFusion(durationSec = 20) {
  const now = performance.now();
  state = {
    isFused:    true,
    startedAt:  now,
    durationMs: durationSec * 1000,
    expiresAt:  now + durationSec * 1000,
  };
  emit();
  window.dispatchEvent(new CustomEvent('skillActivatedToast', {
    detail: { text: '👼 Deity Fusion activated' },
  }));
}

export function endFusion() {
  if (!state.isFused) return;
  state = { isFused: false, startedAt: 0, durationMs: 0, expiresAt: 0 };
  emit();
  window.dispatchEvent(new CustomEvent('skillActivatedToast', {
    detail: { text: '✨ Fusion ended' },
  }));
}

// Call every frame — auto-ends fusion when timer expires.
export function tickFusion() {
  if (!state.isFused) return;
  if (performance.now() >= state.expiresAt) endFusion();
}

export const FUSION_LEVITATE_HEIGHT = LEVITATE_HEIGHT;