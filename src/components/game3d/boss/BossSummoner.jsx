// BossSummoner — tracks minions belonging to a boss.
//
// The boss skill controller emits `spawn_minion` events that GameWorld3D
// converts into actual enemy entities. Each minion registers itself here
// via registerMinion(); on death it calls notifyDeath(). The brain reads
// `getCount()` to decide if it needs to summon more.
//
// Minions inherit the boss's current target id so they aggro the same
// player by default (GameWorld3D enemy AI reads `inheritedTargetId`).

export function createSummoner(bossId) {
  /** @type {Map<string, {role:string, born:number}>} */
  const minions = new Map();
  const MAX_ALIVE = 8;
  const MINION_LIFETIME_MS = 90_000; // despawn after 90s

  return {
    bossId,
    register(minionId, role) {
      if (minions.size >= MAX_ALIVE) return false;
      minions.set(minionId, { role, born: performance.now() });
      return true;
    },
    notifyDeath(minionId) {
      minions.delete(minionId);
    },
    /** Returns array of minion ids that have outlived their lifetime. */
    getExpired() {
      const now = performance.now();
      const out = [];
      for (const [id, m] of minions) {
        if (now - m.born > MINION_LIFETIME_MS) out.push(id);
      }
      return out;
    },
    getCount() { return minions.size; },
    canSummon() { return minions.size < MAX_ALIVE; },
    clear() { minions.clear(); },
  };
}