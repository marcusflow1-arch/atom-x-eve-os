// TargetingSystem.js — mirrors TargetingSystem.cs
// Auto-targets nearest alive enemy within range, prioritizing lowest HP

export class TargetingSystem {
  constructor({ range = 20 } = {}) {
    this.range = range;
  }

  // enemies: Enemy[] with { position: {x,y,z}, hp, level, dead }
  // playerPos: {x, y, z}
  getNextTarget(enemies, playerPos) {
    const dist = (e) =>
      Math.sqrt(
        Math.pow(e.position.x - playerPos.x, 2) +
        Math.pow(e.position.z - playerPos.z, 2)
      );

    return enemies
      .filter(e => !e.dead && dist(e) <= this.range)
      .sort((a, b) => {
        // Primary: lowest HP; Secondary: closest distance
        const hpDiff = a.hp - b.hp;
        if (hpDiff !== 0) return hpDiff;
        return dist(a) - dist(b);
      })[0] ?? null;
  }
}