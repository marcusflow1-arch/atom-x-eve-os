export function scaleBossToPlayer(playerLevel = 1) {
  const level = Math.max(1, Math.floor(playerLevel));
  const levelMultiplier = 1 + level * 0.22;
  return {
    level,
    hp: Math.floor(5000 * levelMultiplier),
    damage: Math.floor(40 * levelMultiplier),
    defense: Math.floor(15 * levelMultiplier),
    speed: 1 + level * 0.015,
    aggression: Math.min(3, 1 + level * 0.04),
  };
}

export function weightedRandom(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1]?.[0];
}

export class AdaptiveBossBrain {
  constructor(bossEntity, { hpBars = 20 } = {}) {
    this.boss = bossEntity;
    this.phase = 1;
    this.state = 'idle';
    this.target = null;
    this.cooldowns = {};
    this.activeTelegraphs = [];
    this.hpBars = hpBars;
    this.maxHpBars = hpBars;
    this.currentHP = 0;
    this.maxHP = 0;
    this.barHP = 0;
    this.enrage = false;
    this.decisionTimer = 0;
    this.scaling = {
      playerLevel: 1,
      bossLevel: 1,
      aggression: 1,
      damage: 1,
      speed: 1,
    };
    this.memory = {
      playerDodges: 0,
      playerHitsTaken: 0,
      playerDistancePreference: 'mid',
      repeatedSkillUsage: {},
      farTime: 0,
      closeTime: 0,
    };
  }

  syncScaling(playerLevel = 1) {
    const scaled = scaleBossToPlayer(playerLevel);
    this.scaling = {
      playerLevel,
      bossLevel: scaled.level,
      aggression: scaled.aggression,
      damage: scaled.damage,
      speed: scaled.speed,
    };

    if (!this.maxHP) {
      this.maxHP = scaled.hp;
      this.barHP = this.maxHP / this.maxHpBars;
      this.currentHP = this.barHP;
      this.boss.maxHp = this.maxHP;
      this.boss.hp = this.maxHP;
      this.boss.level = scaled.level;
      this.boss.derived = { ...(this.boss.derived || {}), attack: scaled.damage, defense: scaled.defense, speed: scaled.speed };
    }
  }

  updateMemory(delta, targetDistance) {
    if (targetDistance == null) return;
    if (targetDistance < 3) {
      this.memory.closeTime += delta;
      this.memory.playerDistancePreference = 'close';
    } else if (targetDistance > 10) {
      this.memory.farTime += delta;
      this.memory.playerDistancePreference = 'far';
    } else {
      this.memory.playerDistancePreference = 'mid';
    }
  }

  syncSegments() {
    if (!this.maxHP || !this.boss.maxHp) return null;
    const totalMissing = Math.max(0, this.maxHP - Math.max(0, this.boss.hp));
    const remainingBars = Math.max(0, this.maxHpBars - Math.floor(totalMissing / this.barHP));
    const nextBars = Math.min(this.maxHpBars, Math.max(0, remainingBars));
    if (nextBars < this.hpBars) {
      this.hpBars = nextBars;
      this.updatePhase();
      return { type: 'bar_break', hpBars: this.hpBars, phase: this.phase };
    }
    return null;
  }

  updatePhase() {
    if (this.hpBars <= 5) this.phase = 4;
    else if (this.hpBars <= 10) this.phase = 3;
    else if (this.hpBars <= 15) this.phase = 2;
    else this.phase = 1;
    this.enrage = this.hpBars <= 5;
  }

  tickCooldowns(delta) {
    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - delta);
    }
  }

  canUse(action) {
    return (this.cooldowns[action] || 0) <= 0;
  }

  startCooldown(action, baseCooldown) {
    const phaseSpeed = 1 - (this.phase - 1) * 0.08;
    const aggressionSpeed = 1 / Math.max(1, this.scaling.aggression);
    this.cooldowns[action] = Math.max(2, baseCooldown * phaseSpeed * aggressionSpeed);
  }

  chooseAction(distance) {
    const farPressure = this.memory.playerDistancePreference === 'far' ? 20 : 0;
    const closePunish = this.memory.playerDistancePreference === 'close' ? 15 : 0;

    if (distance < 3) {
      return weightedRandom([
        ['slam', 30 + closePunish],
        ['teleport', 35],
        ['combo', 25],
        ['sky_dive', this.phase >= 3 ? 20 : 0],
      ].filter(([, weight]) => weight > 0));
    }

    if (distance < 10) {
      return weightedRandom([
        ['tracking_aoe', 55],
        ['dash_attack', 25],
        ['summon', this.phase >= 2 ? 25 : 10],
      ]);
    }

    return weightedRandom([
      ['meteor', 40 + farPressure],
      ['teleport', 30],
      ['laser', this.phase >= 2 ? 20 : 0],
      ['tracking_aoe', 25],
    ].filter(([, weight]) => weight > 0));
  }

  decide(delta, target) {
    this.tickCooldowns(delta);
    this.updateMemory(delta, target?.distance);
    this.decisionTimer -= delta;
    if (!target || this.decisionTimer > 0) return null;
    this.decisionTimer = Math.max(0.8, 2.2 / this.scaling.aggression);

    const action = this.chooseAction(target.distance);
    if (!this.canUse(action)) return null;

    const cooldowns = {
      slam: 8,
      combo: 10,
      tracking_aoe: 12,
      dash_attack: 8,
      summon: 18,
      meteor: 16,
      teleport: 11,
      laser: 14,
      sky_dive: 24,
    };
    this.startCooldown(action, cooldowns[action] || 10);
    return action;
  }

  debug() {
    return {
      phase: this.phase,
      hpBars: this.hpBars,
      maxHpBars: this.maxHpBars,
      enrage: this.enrage,
      scaling: this.scaling,
      memory: this.memory,
    };
  }
}