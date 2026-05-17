// BossThreatSystem — per-boss aggro/threat ledger.
//
// Each boss owns one instance. Players (local + remotes) accumulate threat
// from damage dealt. Threat decays slowly so disengaged players drift off
// the table. The boss picks a target by combining threat + distance + HP%.
//
// Boss can dynamically switch targets when:
//   - current target dies / drops aggro
//   - another player exceeds current target's threat by THREAT_SWITCH_MARGIN
//   - "punish ranged" timer ticks → temporary aggro to furthest threat player

const THREAT_DECAY_PER_SEC = 2;          // slow ambient decay
const THREAT_SWITCH_MARGIN = 1.4;        // new target must beat current ×1.4
const RANGED_PUNISH_INTERVAL = 12;       // seconds — periodically hard-aggro furthest

export function createThreatTable() {
  /** @type {Map<string, number>} playerId → threat */
  const table = new Map();
  let lastSwitchAt = 0;
  let rangedPunishTimer = RANGED_PUNISH_INTERVAL;
  let currentTargetId = null;

  return {
    addThreat(playerId, amount) {
      if (!playerId || amount <= 0) return;
      table.set(playerId, (table.get(playerId) || 0) + amount);
    },
    removeTarget(playerId) {
      table.delete(playerId);
      if (currentTargetId === playerId) currentTargetId = null;
    },
    tick(dt) {
      // Ambient decay
      for (const [id, v] of table) {
        const next = v - THREAT_DECAY_PER_SEC * dt;
        if (next <= 0) table.delete(id);
        else table.set(id, next);
      }
      rangedPunishTimer -= dt;
    },
    /**
     * Pick best target from a list of candidate players.
     * @param {Array<{id, x, z, hp, maxHp, distance}>} players
     * @param {{bossX, bossZ, rangedThreshold}} ctx
     */
    pickTarget(players, ctx) {
      if (!players.length) { currentTargetId = null; return null; }

      // Ensure every visible player has some baseline threat presence
      players.forEach((p) => {
        if (!table.has(p.id)) table.set(p.id, 1);
      });

      // Periodic ranged-punish: pick furthest player as forced target
      if (rangedPunishTimer <= 0) {
        rangedPunishTimer = RANGED_PUNISH_INTERVAL;
        const furthest = players.reduce((a, b) => (a.distance > b.distance ? a : b));
        if (furthest.distance > (ctx.rangedThreshold || 12)) {
          currentTargetId = furthest.id;
          // Boost their threat so this sticks for a few seconds
          table.set(furthest.id, (table.get(furthest.id) || 0) + 50);
          return furthest;
        }
      }

      // Score = threat - distance penalty - hp% (low hp = juicier target)
      let best = null;
      let bestScore = -Infinity;
      for (const p of players) {
        const threat = table.get(p.id) || 0;
        const hpFrac = p.maxHp > 0 ? p.hp / p.maxHp : 1;
        const score = threat - p.distance * 0.5 + (1 - hpFrac) * 8;
        if (score > bestScore) { bestScore = score; best = p; }
      }

      // Sticky targeting — only switch if new target meaningfully beats current
      if (currentTargetId && best && best.id !== currentTargetId) {
        const curT = table.get(currentTargetId) || 0;
        const newT = table.get(best.id) || 0;
        if (newT < curT * THREAT_SWITCH_MARGIN) {
          const cur = players.find((p) => p.id === currentTargetId);
          if (cur) return cur;
        }
      }
      currentTargetId = best?.id || null;
      return best;
    },
    getCurrentTargetId() { return currentTargetId; },
    debug() { return Array.from(table.entries()); },
  };
}