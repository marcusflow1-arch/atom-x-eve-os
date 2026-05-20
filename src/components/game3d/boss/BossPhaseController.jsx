import { weightedRandom } from './AdaptiveBossBrain';

const DIFFICULTY_OFFSETS = Object.freeze({
  easy: -1,
  normal: 0,
  hard: 3,
  nightmare: 7,
});

const BASE_TANK_HP = 10000;
const DEFAULT_TOTAL_TANKS = 20;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function phaseFromHpFraction(frac) {
  if (frac <= 0.25) return 4;
  if (frac <= 0.5) return 3;
  if (frac <= 0.75) return 2;
  return 1;
}

export class BossPhaseController {
  constructor(bossEntity, options = {}) {
    this.boss = bossEntity;
    this.totalTanks = options.totalTanks || DEFAULT_TOTAL_TANKS;
    this.baseHP = options.baseHP || BASE_TANK_HP * this.totalTanks;
    this.baseDamage = options.baseDamage || 40;
    this.baseDefense = options.baseDefense || 15;
    this.difficulty = options.difficulty || 'normal';
    this.phase = 1;
    this.hpBars = this.totalTanks;
    this.maxHpBars = this.totalTanks;
    this.enrage = false;
    this.lastTankIndex = this.totalTanks;
    this.staggerTimer = 0;
    this.decisionTimer = 0;
    this.lastAction = null;
    this.cooldowns = {};
    this.memory = {
      farTime: 0,
      closeTime: 0,
      behindTime: 0,
      playerDistancePreference: 'mid',
    };
    this.scaling = {
      playerLevel: 1,
      bossLevel: 1,
      maxHP: this.baseHP,
      damage: this.baseDamage,
      attackSpeed: 1,
      defense: this.baseDefense,
      speed: 1,
      aggression: 1,
    };
    this.applyTankMetadata();
  }

  syncScaling(playerLevel = 1) {
    const level = Math.max(1, Math.floor(playerLevel));
    const difficultyOffset = DIFFICULTY_OFFSETS[this.difficulty] ?? 0;
    const previousMax = this.boss.maxHp || this.scaling.maxHP || this.baseHP;
    const previousHp = this.boss.hp ?? previousMax;
    const hpRatio = previousMax > 0 ? clamp(previousHp / previousMax, 0, 1) : 1;

    const maxHP = Math.floor(this.baseHP * (1 + level * 0.45));
    const damage = this.baseDamage * (1 + level * 0.18);
    const attackSpeed = 1 + level * 0.015;
    const defense = this.baseDefense * (1 + level * 0.12);

    this.scaling = {
      playerLevel: level,
      bossLevel: Math.max(1, level + difficultyOffset),
      maxHP,
      damage,
      attackSpeed,
      defense,
      speed: attackSpeed,
      aggression: clamp(1 + (this.phase - 1) * 0.35 + level * 0.025, 1, 4),
    };

    if (this.boss.maxHp !== maxHP) {
      this.boss.maxHp = maxHP;
      this.boss.hp = Math.max(1, Math.floor(maxHP * hpRatio));
    }

    this.boss.level = this.scaling.bossLevel;
    this.boss.totalTanks = this.totalTanks;
    this.boss.hpTanks = this.totalTanks;
    this.boss.hpTankSize = maxHP / this.totalTanks;
    this.boss.derived = {
      ...(this.boss.derived || {}),
      attack: damage,
      defense,
      speed: attackSpeed,
    };
    this.applyTankMetadata();
  }

  applyTankMetadata() {
    const tankSize = (this.boss.maxHp || this.scaling.maxHP) / this.totalTanks;
    this.boss.totalTanks = this.totalTanks;
    this.boss.hpTanks = this.totalTanks;
    this.boss.hpTankSize = tankSize;
  }

  syncSegments() {
    const maxHp = this.boss.maxHp || this.scaling.maxHP;
    const hp = clamp(this.boss.hp ?? maxHp, 0, maxHp);
    const hpFrac = maxHp > 0 ? hp / maxHp : 1;
    const tankSize = maxHp / this.totalTanks;
    const currentTankIndex = hp > 0 ? Math.ceil(hp / tankSize) : 0;
    const nextPhase = phaseFromHpFraction(hpFrac);
    const tankBroken = currentTankIndex < this.lastTankIndex;
    const phaseChanged = nextPhase !== this.phase;

    this.hpBars = currentTankIndex;
    this.lastTankIndex = currentTankIndex;
    this.phase = nextPhase;
    this.enrage = this.phase === 4;
    this.applyTankMetadata();

    if (tankBroken) {
      this.staggerTimer = 1;
      this.boss.staggerTimer = 1;
      return {
        type: 'bar_break',
        hpBars: this.hpBars,
        maxHpBars: this.maxHpBars,
        phase: this.phase,
        phaseChanged,
        staggerSeconds: 1,
      };
    }
    return null;
  }

  tickCooldowns(delta) {
    this.staggerTimer = Math.max(0, this.staggerTimer - delta);
    if (this.boss.staggerTimer) this.boss.staggerTimer = Math.max(0, this.boss.staggerTimer - delta);
    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - delta);
    }
  }

  updateMemory(delta, target) {
    if (!target?.distance) return;
    if (target.distance < 3) {
      this.memory.closeTime += delta;
      this.memory.playerDistancePreference = 'close';
    } else if (target.distance > 10) {
      this.memory.farTime += delta;
      this.memory.playerDistancePreference = 'far';
    } else {
      this.memory.playerDistancePreference = 'mid';
    }
  }

  canUse(action) {
    return (this.cooldowns[action] || 0) <= 0 && this.lastAction !== action && this.staggerTimer <= 0;
  }

  startCooldown(action, baseCooldown) {
    const phaseRecovery = 1 - (this.phase - 1) * 0.12;
    const speedRecovery = 1 / Math.max(1, this.scaling.attackSpeed);
    this.cooldowns[action] = Math.max(1.2, baseCooldown * phaseRecovery * speedRecovery);
    this.lastAction = action;
  }

  chooseAction(distance) {
    if (this.phase === 1) {
      return weightedRandom([
        ['combo', 35],
        ['dash_attack', 25],
        ['tracking_aoe', 15],
      ]);
    }
    if (this.phase === 2) {
      return weightedRandom([
        ['teleport', 35],
        ['combo', 30],
        ['dash_attack', 25],
        ['tracking_aoe', 20],
      ]);
    }
    if (this.phase === 3) {
      return weightedRandom([
        ['sky_dive', 35],
        ['tracking_aoe', 30],
        ['teleport', 25],
        ['combo', 25],
      ]);
    }
    return weightedRandom([
      ['teleport', 35],
      ['sky_dive', 35],
      ['combo', 30],
      ['tracking_aoe', 25],
      ['dash_attack', 20],
    ]);
  }

  decide(delta, target) {
    this.updateMemory(delta, target);
    this.decisionTimer -= delta;
    if (!target || this.decisionTimer > 0 || this.staggerTimer > 0) return null;

    this.decisionTimer = Math.max(0.45, 1.6 / this.scaling.aggression);
    const action = this.chooseAction(target.distance);
    if (!this.canUse(action)) return null;

    const cooldowns = {
      combo: 8,
      dash_attack: 7,
      tracking_aoe: 11,
      teleport: this.phase >= 4 ? 5 : 9,
      sky_dive: this.phase >= 4 ? 12 : 18,
    };
    this.startCooldown(action, cooldowns[action] || 8);
    return action;
  }

  debug() {
    return {
      phase: this.phase,
      hpBars: this.hpBars,
      maxHpBars: this.maxHpBars,
      enrage: this.enrage,
      staggerTimer: this.staggerTimer,
      scaling: this.scaling,
      memory: this.memory,
    };
  }
}