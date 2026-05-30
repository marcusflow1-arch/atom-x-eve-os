// ─── Perk Tree Data ───────────────────────────────────────────────────────
// Defines all weapon perk trees: 3 branches × 4 tiers (Tier 1–3 + Keystone).
//
// DESIGN RULES (enforced by perkTreeStore):
//  - Each tier costs 1 perk point
//  - Must unlock Tier N before Tier N+1 in the same branch
//  - Must spend MIN_BRANCH_POINTS in a branch to unlock its Keystone
//  - Only 1 Keystone can be active per weapon at a time
//  - Total perk points per weapon is capped (see perkTreeStore)
//  - Perks add MECHANICS, not just raw stats — to tune values edit here only

export const PERK_TREE_CONFIG = {
  // ─── POINTS ────────────────────────────────────────────────────────────
  maxPointsPerWeapon: 9,       // 3 branches × 3 tiers — can't fill all
  pointsToUnlockKeystone: 3,   // must spend 3 points in a branch to unlock its keystone
  keystonesCostPoints: false,  // keystones are free once unlocked; choice is the cost

  // ─── SWORD ────────────────────────────────────────────────────────────
  sword: {
    branches: [
      {
        id: 'brutality',
        name: 'Brutality',
        icon: '💥',
        color: '#ef4444',
        description: 'Raw damage and execution power',
        tiers: [
          {
            tier: 1, id: 'heavy_swing',
            name: 'Heavy Swing',
            desc: '+10% heavy attack damage',
            mod: { heavyAtkDmgPct: 10 },
          },
          {
            tier: 2, id: 'brutal_ability',
            name: 'Brutal Ability',
            desc: '+15% ability damage',
            mod: { abilityDmgPct: 15 },
          },
          {
            tier: 3, id: 'armor_pierce',
            name: 'Armor Pierce',
            desc: 'Abilities ignore 10% of enemy armor',
            mod: { abilityArmorPenPct: 10 },
          },
        ],
        keystone: {
          id: 'executioner',
          name: 'Executioner',
          icon: '⚰️',
          desc: '+30% damage to enemies below 30% HP',
          mod: { executeBonusPct: 30, executeThresholdPct: 30 },
        },
      },
      {
        id: 'flow',
        name: 'Flow',
        icon: '🌊',
        color: '#6366f1',
        description: 'Ability cycling and cooldown mastery',
        tiers: [
          {
            tier: 1, id: 'swift_cast',
            name: 'Swift Cast',
            desc: '-10% cooldowns on all abilities',
            mod: { cdrPct: 10 },
          },
          {
            tier: 2, id: 'ability_surge',
            name: 'Ability Surge',
            desc: 'Ability hits grant +5% attack speed (stacks up to 4×, ICD: 0.5s)',
            mod: { abilityAtkSpdPerHit: 5, abilityAtkSpdCap: 4, icdSec: 0.5 },
          },
          {
            tier: 3, id: 'echo_strike',
            name: 'Echo Strike',
            desc: 'Hitting with an ability reduces cooldowns by an additional 5%',
            mod: { abilityHitCdrPct: 5 },
          },
        ],
        keystone: {
          id: 'endless_chain',
          name: 'Endless Chain',
          icon: '🔗',
          desc: 'Ability hits have a 15% chance to reset their own cooldown (ICD: 5s per ability)',
          mod: { cdResetChancePct: 15, cdResetIcdSec: 5 },
        },
      },
      {
        id: 'guardbreaker',
        name: 'Guardbreaker',
        icon: '🛡️💢',
        color: '#f59e0b',
        description: 'Anti-armor and defense shredding',
        tiers: [
          {
            tier: 1, id: 'shred_armor',
            name: 'Armor Shred',
            desc: '+10% damage to armored / high-defense targets',
            mod: { vsArmoredBonusPct: 10 },
          },
          {
            tier: 2, id: 'stagger_force',
            name: 'Stagger Force',
            desc: '+20% stagger power — breaks enemy attack animations more easily',
            mod: { staggerPowerPct: 20 },
          },
          {
            tier: 3, id: 'crit_break',
            name: 'Crit Break',
            desc: 'Critical hits reduce enemy defense by 10% for 4s',
            mod: { critDefenseDebuffPct: 10, critDefenseDebuffSec: 4 },
          },
        ],
        keystone: {
          id: 'shatter',
          name: 'Shatter',
          icon: '💎',
          desc: 'Crits reduce enemy defense by 20% for 5s (replaces Crit Break if both active)',
          mod: { critDefenseDebuffPct: 20, critDefenseDebuffSec: 5 },
        },
      },
    ],
  },

  // ─── BOW ──────────────────────────────────────────────────────────────
  bow: {
    branches: [
      {
        id: 'precision',
        name: 'Precision',
        icon: '🎯',
        color: '#a3e635',
        description: 'Critical hit amplification',
        tiers: [
          {
            tier: 1, id: 'keen_eye',
            name: 'Keen Eye',
            desc: '+5% crit chance',
            mod: { critChancePct: 5 },
          },
          {
            tier: 2, id: 'lethal_aim',
            name: 'Lethal Aim',
            desc: '+20% crit damage',
            mod: { critDmgPct: 20 },
          },
          {
            tier: 3, id: 'momentum_crit',
            name: 'Momentum Crit',
            desc: 'A critical hit increases your next attack\'s damage by 15%',
            mod: { postcritDmgBonusPct: 15 },
          },
        ],
        keystone: {
          id: 'deadeye',
          name: 'Deadeye',
          icon: '👁️',
          desc: 'Headshots (distance > 10 units) guarantee a crit + 25% bonus damage',
          mod: { headshotRangeUnit: 10, headshotGuaranteedCrit: true, headshotBonusDmgPct: 25 },
        },
      },
      {
        id: 'velocity',
        name: 'Velocity',
        icon: '💨',
        color: '#38bdf8',
        description: 'Attack speed stacking',
        tiers: [
          {
            tier: 1, id: 'quick_nock',
            name: 'Quick Nock',
            desc: '+10% attack speed',
            mod: { attackSpeedPct: 10 },
          },
          {
            tier: 2, id: 'rapid_fire',
            name: 'Rapid Fire',
            desc: 'Each consecutive hit increases attack speed by 4% (stacks up to 5×, ICD: 0.8s)',
            mod: { atkSpdPerHit: 4, atkSpdStackCap: 5, icdSec: 0.8 },
          },
          {
            tier: 3, id: 'sprinter',
            name: 'Sprinter',
            desc: 'Hitting an enemy increases your movement speed by 8% for 2s',
            mod: { onHitMoveSpdPct: 8, moveSpdBuffSec: 2 },
          },
        ],
        keystone: {
          id: 'overdrive',
          name: 'Overdrive',
          icon: '⚡',
          desc: 'Reaching max velocity stacks doubles attack speed for 4s (ICD: 20s)',
          mod: { overdriveAtkSpdMultiplier: 2, overdriveDurationSec: 4, overdriveIcdSec: 20 },
        },
      },
      {
        id: 'trickshot',
        name: 'Trickshot',
        icon: '🌀',
        color: '#c084fc',
        description: 'Utility, control and multi-target',
        tiers: [
          {
            tier: 1, id: 'pierce_shot',
            name: 'Pierce Shot',
            desc: 'Arrows pierce 1 additional target',
            mod: { pierceTargets: 1 },
          },
          {
            tier: 2, id: 'chill_arrow',
            name: 'Chill Arrow',
            desc: '20% chance to slow enemy movement by 25% for 2s',
            mod: { slowChancePct: 20, slowMagnitudePct: 25, slowDurationSec: 2 },
          },
          {
            tier: 3, id: 'volley_mastery',
            name: 'Volley Mastery',
            desc: 'Hitting 2+ enemies in one shot grants +10% damage for 3s',
            mod: { multiHitDmgBonusPct: 10, multiHitBonusDurationSec: 3, minHitsToTrigger: 2 },
          },
        ],
        keystone: {
          id: 'ricochet_mastery',
          name: 'Ricochet Mastery',
          icon: '🔄',
          desc: 'Arrows ricochet to up to 2 additional targets within 6 units, each hit deals 60% damage',
          mod: { ricochetTargets: 2, ricochetRangeUnit: 6, ricochetDmgPct: 60 },
        },
      },
    ],
  },

  // ─── DUAL BLADES ──────────────────────────────────────────────────────
  dual_blades: {
    branches: [
      {
        id: 'evasion',
        name: 'Evasion',
        icon: '👻',
        color: '#22d3ee',
        description: 'Dodge and survivability',
        tiers: [
          {
            tier: 1, id: 'ghost_step',
            name: 'Ghost Step',
            desc: '+5% dodge chance',
            mod: { dodgeChancePct: 5 },
          },
          {
            tier: 2, id: 'rebound',
            name: 'Rebound',
            desc: 'Dodging an attack increases your next hit\'s damage by 20%',
            mod: { postDodgeDmgBonusPct: 20 },
          },
          {
            tier: 3, id: 'untouchable',
            name: 'Untouchable',
            desc: 'Successful dodge grants 0.3s of invulnerability frames',
            mod: { dodgeIFramesSec: 0.3 },
          },
        ],
        keystone: {
          id: 'phantom_step',
          name: 'Phantom Step',
          icon: '🌑',
          desc: 'Perfect dodge (within 0.2s of impact) slows time by 40% for 1.5s (ICD: 12s)',
          mod: { perfectDodgeWindowSec: 0.2, timeSlowPct: 40, timeSlowDurationSec: 1.5, icdSec: 12 },
        },
      },
      {
        id: 'deflection',
        name: 'Deflection',
        icon: '🛡️',
        color: '#f59e0b',
        description: 'Counter and reflect system',
        tiers: [
          {
            tier: 1, id: 'parry_stance',
            name: 'Parry Stance',
            desc: '+8% deflect chance',
            mod: { deflectChancePct: 8 },
          },
          {
            tier: 2, id: 'counter_force',
            name: 'Counter Force',
            desc: 'Deflecting an attack reflects an additional +20% bonus damage',
            mod: { deflectBonusReflectPct: 20 },
          },
          {
            tier: 3, id: 'life_tap',
            name: 'Life Tap',
            desc: 'Deflecting heals 3% max HP',
            mod: { deflectHealPct: 3 },
          },
        ],
        keystone: {
          id: 'mirror_edge',
          name: 'Mirror Edge',
          icon: '🪞',
          desc: 'Successful deflect triggers an automatic counterattack dealing 80% weapon damage (ICD: 2s)',
          mod: { deflectCounterDmgPct: 80, icdSec: 2 },
        },
      },
      {
        id: 'bleed',
        name: 'Bleed',
        icon: '🩸',
        color: '#ef4444',
        description: 'Damage over time and stack bursting',
        tiers: [
          {
            tier: 1, id: 'cutting_edge',
            name: 'Cutting Edge',
            desc: 'Attacks apply Bleed: 5 damage/s for 4s (stacks up to 5)',
            mod: { bleedDmgPerSec: 5, bleedDurationSec: 4, bleedMaxStacks: 5 },
          },
          {
            tier: 2, id: 'deep_cut',
            name: 'Deep Cut',
            desc: 'Bleed stacks deal 20% more damage',
            mod: { bleedDmgBonusPct: 20 },
          },
          {
            tier: 3, id: 'crimson_crit',
            name: 'Crimson Crit',
            desc: 'Critical hits apply 2 bleed stacks instead of 1',
            mod: { critBleedStacks: 2 },
          },
        ],
        keystone: {
          id: 'hemorrhage',
          name: 'Hemorrhage',
          icon: '💀',
          desc: 'Reaching max bleed stacks detonates them: each stack deals 15× its per-tick damage as burst damage. Stacks consumed.',
          mod: { hemorrhageDmgMultiplier: 15, consumesStacks: true },
        },
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Get all branches for a weapon. */
export function getBranchesForWeapon(weaponId) {
  return PERK_TREE_CONFIG[weaponId]?.branches || [];
}

/** Get a specific branch by weapon + branch id. */
export function getBranch(weaponId, branchId) {
  return getBranchesForWeapon(weaponId).find(b => b.id === branchId) || null;
}

/** Get a perk node (tier or keystone) by weapon + branch + node id. */
export function getPerkNode(weaponId, branchId, nodeId) {
  const branch = getBranch(weaponId, branchId);
  if (!branch) return null;
  if (branch.keystone?.id === nodeId) return { ...branch.keystone, isKeystone: true };
  const tier = branch.tiers.find(t => t.id === nodeId);
  return tier ? { ...tier, isKeystone: false } : null;
}

/** Returns max perk points for a weapon. */
export function getMaxPoints(weaponId) {
  return PERK_TREE_CONFIG[weaponId]
    ? PERK_TREE_CONFIG.maxPointsPerWeapon
    : 0;
}