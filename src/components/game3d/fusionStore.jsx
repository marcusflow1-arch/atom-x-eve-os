// ─── Fusion Store ──────────────────────────────────────────────────────
// Points-based Deity Fusion resource (0-100).
//   • Earn fusion points by killing enemies (addFusionPoints)
//   • Activating fusion drains 2 points per second
//   • Fusion auto-ends when points hit 0
//   • While fused: companion hidden, player levitates
//
// This is intentionally tiny — runtime state, not persisted.

const LEVITATE_HEIGHT = 1.2;     // world units lifted off the ground
const MAX_POINTS      = 100;
const DRAIN_PER_SEC   = 2;       // points drained while fused
const POINTS_PER_KILL = 5;       // points gained per enemy kill

let state = {
  isFused:    false,
  points:     0,
  lastTickMs: 0,
};

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(state));

export function getFusionState() { return state; }

export function subscribeFusion(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

// Subscribe to fusion state with normalized HUD data.
export function subscribeFusionState(fn) {
  const updateFn = () => {
    fn({
      isFused: state.isFused,
      points: state.points,
      maxPoints: MAX_POINTS,
    });
  };
  listeners.add(updateFn);
  updateFn();
  return () => listeners.delete(updateFn);
}

export function addFusionPoints(amount = POINTS_PER_KILL) {
  state = { ...state, points: Math.min(MAX_POINTS, state.points + amount) };
  emit();
}

export function startFusion() {
  if (state.isFused) return;
  if (state.points <= 0) {
    window.dispatchEvent(new CustomEvent('skillActivatedToast', {
      detail: { text: '⚠️ No fusion points — kill enemies to charge' },
    }));
    return;
  }
  state = { ...state, isFused: true, lastTickMs: performance.now() };
  emit();
  window.dispatchEvent(new CustomEvent('skillActivatedToast', {
    detail: { text: '👼 Deity Fusion activated' },
  }));
}

export function endFusion() {
  if (!state.isFused) return;
  state = { ...state, isFused: false, lastTickMs: 0 };
  emit();
  window.dispatchEvent(new CustomEvent('skillActivatedToast', {
    detail: { text: '✨ Fusion ended' },
  }));
}

// Call every frame — drains points at 2/sec while fused; ends when empty.
export function tickFusion() {
  if (!state.isFused) return;
  const now = performance.now();
  const dt = (now - state.lastTickMs) / 1000;
  if (dt <= 0) return;
  const newPoints = Math.max(0, state.points - DRAIN_PER_SEC * dt);
  state = { ...state, points: newPoints, lastTickMs: now };
  if (newPoints <= 0) { endFusion(); return; }
  emit();
}

export const FUSION_LEVITATE_HEIGHT = LEVITATE_HEIGHT;
export const FUSION_MAX_POINTS = MAX_POINTS;
export const FUSION_POINTS_PER_KILL = POINTS_PER_KILL;