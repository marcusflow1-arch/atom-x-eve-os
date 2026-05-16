// ─── Skill Upgrade & Adaptation Store ─────────────────────────────────────
// Tracks per-skill: level, upgrade points spent, adaptation XP, and slot assignments.

// Upgrade points are earned per player level-up (2 points per level)
// Adaptation XP is earned by using the skill in combat

// ── Path-specific upgrade bonuses ────────────────────────────────────────────
// Each level-up of a skill grants these bonuses based on path
export const SKILL_PATH_BONUSES = {
  damage: {
    per_level: [
      { stat: 'damage_pct',  label: 'Damage',    icon: '⚔️',  value: 0.08  }, // +8% dmg per level
      { stat: 'hit_rate',    label: 'Hit Rate',  icon: '🎯',  value: 0.04  }, // +4% hit per level
    ],
    per_adapt: [
      { stat: 'cast_speed',  label: 'Cast Speed', icon: '⚡', value: 0.05  }, // +5% cast speed per adapt rank
      { stat: 'hit_count',   label: 'Hit Count',  icon: '💥', value: 0.1   }, // +0.1 extra hits per adapt rank
    ],
  },
  defense: {
    per_level: [
      { stat: 'skill_speed', label: 'Skill Speed',   icon: '⚡',  value: 0.06  },
      { stat: 'hit_chance',  label: 'Hit Chance',    icon: '🎯',  value: 0.03  },
      { stat: 'shield_pct',  label: 'Shield on Hit', icon: '🛡️', value: 0.02  }, // 2% HP as shield per hit per level
    ],
    per_adapt: [
      { stat: 'cast_speed',  label: 'Cast Speed',    icon: '⚡', value: 0.04  },
      { stat: 'shield_pct',  label: 'Shield on Hit', icon: '🛡️', value: 0.01  },
    ],
  },
  ranged: {
    per_level: [
      { stat: 'damage_pct',    label: 'Damage',          icon: '🏹',  value: 0.07  },
      { stat: 'crit_chance',   label: 'Critical Strike', icon: '💫',  value: 0.04  },
      { stat: 'elemental_dmg', label: 'Elemental Damage', icon: '🌩️', value: 0.05  },
    ],
    per_adapt: [
      { stat: 'hit_chance',  label: 'Hit Chance',    icon: '🎯', value: 0.05  },
      { stat: 'crit_chance', label: 'Critical Strike',icon: '💫', value: 0.03  },
    ],
  },
  passive: {
    per_level: [
      { stat: 'damage_pct', label: 'Effect Power', icon: '✨', value: 0.06 },
      { stat: 'hit_rate',   label: 'Proc Rate',    icon: '🎯', value: 0.04 },
    ],
    per_adapt: [
      { stat: 'cast_speed', label: 'Proc Speed', icon: '⚡', value: 0.04 },
    ],
  },
};

export const MAX_SKILL_LEVEL = 10;
export const MAX_ADAPT_RANK  = 5;
export const ADAPT_XP_PER_RANK = [100, 250, 500, 1000, 2000]; // XP needed per rank

// Points cost to level a skill: level 1→2 costs 1 pt, 5→6 costs 2 pts, 8+ costs 3 pts
export function upgradeCost(currentLevel) {
  if (currentLevel < 5) return 1;
  if (currentLevel < 8) return 2;
  return 3;
}

// ── In-memory skill upgrade state ────────────────────────────────────────────
// Map: skillId → { level, adaptXP, adaptRank, slotIndex }
let _skillData = {};
let _upgradePoints = 10; // player starts with 10 free points
const _listeners = new Set();

function _notify() { _listeners.forEach(fn => fn({ skillData: _skillData, upgradePoints: _upgradePoints })); }

export function getSkillUpgradeState() {
  return { skillData: _skillData, upgradePoints: _upgradePoints };
}

export function subscribeSkillUpgrades(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getSkillData(skillId) {
  return _skillData[skillId] || { level: 1, adaptXP: 0, adaptRank: 0, slotIndex: null };
}

/** Spend upgrade points to raise skill level */
export function upgradeSkillLevel(skillId) {
  const data = getSkillData(skillId);
  if (data.level >= MAX_SKILL_LEVEL) return false;
  const cost = upgradeCost(data.level);
  if (_upgradePoints < cost) return false;
  _upgradePoints -= cost;
  _skillData = { ..._skillData, [skillId]: { ...data, level: data.level + 1 } };
  _notify();
  return true;
}

/** Award adaptation XP from using the skill in combat */
export function addAdaptXP(skillId, xp = 10) {
  const data = getSkillData(skillId);
  if (data.adaptRank >= MAX_ADAPT_RANK) return;
  let newXP = data.adaptXP + xp;
  let newRank = data.adaptRank;
  const needed = ADAPT_XP_PER_RANK[newRank] || 9999;
  if (newXP >= needed) {
    newXP -= needed;
    newRank = Math.min(MAX_ADAPT_RANK, newRank + 1);
  }
  _skillData = { ..._skillData, [skillId]: { ...data, adaptXP: newXP, adaptRank: newRank } };
  _notify();
}

/** Assign a skill to a quick-slot (0-7) */
export function assignSkillToSlot(skillId, slotIndex) {
  // Unassign from any other skill that has this slot
  const updated = {};
  for (const [id, d] of Object.entries(_skillData)) {
    updated[id] = d.slotIndex === slotIndex && id !== skillId ? { ...d, slotIndex: null } : d;
  }
  const current = getSkillData(skillId);
  updated[skillId] = { ...current, slotIndex };
  _skillData = updated;
  _notify();
}

/** Remove a skill from its slot */
export function unassignSkillSlot(skillId) {
  const data = getSkillData(skillId);
  _skillData = { ..._skillData, [skillId]: { ...data, slotIndex: null } };
  _notify();
}

/** Add upgrade points (called on player level-up) */
export function addUpgradePoints(n = 2) {
  _upgradePoints += n;
  _notify();
}

/** Compute the effective stats for a skill given its level & adapt rank */
export function computeEffectiveStats(skill, level, adaptRank) {
  const path = skill.path || 'damage';
  const bonuses = SKILL_PATH_BONUSES[path] || SKILL_PATH_BONUSES.damage;
  const stats = {};

  // Base from skill definition
  if (skill.damage_pct) stats.damage_pct = skill.damage_pct;

  // Per-level bonuses accumulated
  const lvlBonus = level - 1; // bonus stacks above level 1
  for (const b of bonuses.per_level) {
    stats[b.stat] = (stats[b.stat] || 0) + b.value * lvlBonus;
  }

  // Per-adapt bonuses
  for (const b of bonuses.per_adapt) {
    stats[b.stat] = (stats[b.stat] || 0) + b.value * adaptRank;
  }

  return stats;
}