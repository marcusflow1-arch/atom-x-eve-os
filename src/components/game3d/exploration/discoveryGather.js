// The short gather (or inspect) before a discovery's reward: the hero stays within reach
// while it runs; walking away cancels it. No scene or React here, so it can be tested alone.
import { DISCOVERY_RULES } from '../../../../base44/shared/explorationDiscoveries.ts';

const reachOf = (def) => def.range + DISCOVERY_RULES.reachToleranceM;
const distanceXZ = (def, p) => Math.hypot(Number(p?.x || 0) - def.position[0], Number(p?.z || 0) - def.position[2]);

export function createDiscoveryGather({ now = () => performance.now() } = {}) {
  let active = null; // { def, startedAt }
  let last = { active: false, discoveryId: null, progress: 0, outcome: null };

  const settle = (outcome) => {
    last = { active: false, discoveryId: active?.def.id || null, progress: outcome === 'complete' ? 1 : last.progress, outcome };
    const def = active?.def || null;
    active = null;
    return def;
  };

  return {
    // false when another gather is running or the hero is out of reach
    start(def, position) {
      if (active || !def || distanceXZ(def, position) > reachOf(def)) return false;
      active = { def, startedAt: now() };
      last = { active: true, discoveryId: def.id, progress: 0, outcome: null };
      return true;
    },
    // each frame: { done: def } when the time is up, { cancelled } when the hero walked off
    update(position) {
      if (!active) return {};
      if (distanceXZ(active.def, position) > reachOf(active.def)) return { cancelled: settle('moved_away') };
      const progress = Math.min(1, (now() - active.startedAt) / Math.max(1, active.def.gatherMs));
      last = { ...last, progress };
      return progress >= 1 ? { done: settle('complete') } : {};
    },
    cancel(reason = 'cancelled') { return active ? settle(reason) : null; },
    snapshot: () => last,
  };
}
