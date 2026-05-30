// ─── Weapon Synergy & Mastery Data ────────────────────────────────────────
// New-World-inspired weapon scaling tiers + master-list of weapons for the
// Attributes panel synergy display.
//
// Tiers: S > A > B > C > D > E (E = no scaling)
// Each weapon may scale primarily off ONE stat with a secondary contribution.
//
// `weaponMasteryConfig` powers the Weapon Mastery tab — per-weapon level
// curves, unlock milestones, and two-branch skill trees keyed by weapon id.

export const SCALING_TIERS = {
  S: { label: 'S Tier', color: '#ffd86b', strength: 1.00 },
  A: { label: 'A Tier', color: '#a3e635', strength: 0.85 },
  B: { label: 'B Tier', color: '#38bdf8', strength: 0.65 },
  C: { label: 'C Tier', color: '#94a3b8', strength: 0.45 },
  D: { label: 'D Tier', color: '#64748b', strength: 0.25 },
  E: { label: 'E Tier', color: '#475569', strength: 0.10 },
};

// Master list of weapons available in the world.
export const WEAPONS = [
  { id: 'bow',          name: 'Bow',          icon: '🏹' },
  { id: 'sword',        name: 'Sword',        icon: '⚔️' },
  { id: 'dual_blades',  name: 'Dual Blades',  icon: '🗡️' },
  { id: 'sky',          name: 'Sky',          icon: '🌌' },
];

// Per-stat synergy map. For each stat, list the weapons that scale with it
// and the tier of that scaling. Used by the Attributes tab tooltips/inline list.
export const STAT_SYNERGY = {
  strength: [
    { weaponId: 'sword',       tier: 'S' },
  ],
  dexterity: [
    { weaponId: 'bow',         tier: 'S' },
    { weaponId: 'dual_blades', tier: 'S' },
    { weaponId: 'sword',       tier: 'B' },
  ],
  constitution: [
    { weaponId: 'sword',       tier: 'B' },
    { weaponId: 'dual_blades', tier: 'B' },  // survivability role
  ],
  focus: [
    { weaponId: 'sky',         tier: 'S' },
  ],
  intelligence: [
    { weaponId: 'sky',         tier: 'A' },
  ],
  defense: [
    { weaponId: 'dual_blades', tier: 'A' },  // deflect/counter system
  ],
};

// Map weaponId → display name for tooltips.
export function getWeaponName(id) {
  return WEAPONS.find((w) => w.id === id)?.name || id;
}

// Mastery configuration — one entry per weapon. Each defines two branch trees
// (like Swordmaster / Defender) with ability nodes. Phase 1 uses a uniform
// curve; per-weapon tuning can come later.
export const MASTERY_MAX_LEVEL = 20;

export function killsForMasteryLevel(level) {
  if (level <= 0) return 0;
  if (level > MASTERY_MAX_LEVEL) return Infinity;
  // Mirrors title curve flavor but tuned per-weapon (cheaper than titles).
  const curve = [0, 50, 120, 220, 360, 540, 760, 1020, 1320, 1660, 2040,
                 2460, 2920, 3420, 3960, 4540, 5160, 5820, 6520, 7260, 8040];
  return curve[level];
}

// Skill tree branch definitions. Each ability node has a level it unlocks at.
export const WEAPON_TREES = {
  bow: {
    branches: [
      {
        id: 'hunter', name: 'Hunter', color: '#a3e635',
        abilities: [
          { id: 'bow_rapid',       name: 'Rapid Shot',      unlockLevel: 1,  icon: '🏹' },
          { id: 'bow_evade',       name: 'Evade Shot',      unlockLevel: 5,  icon: '💨' },
          { id: 'bow_penetrate',   name: 'Penetrating Shot',unlockLevel: 10, icon: '🎯' },
          { id: 'bow_ultimate',    name: 'Rain of Arrows',  unlockLevel: 20, icon: '🌧️' },
        ],
      },
      {
        id: 'skirmisher', name: 'Skirmisher', color: '#38bdf8',
        abilities: [
          { id: 'bow_trap',        name: 'Poison Shot',     unlockLevel: 3,  icon: '☠️' },
          { id: 'bow_explosive',   name: 'Explosive Arrow', unlockLevel: 8,  icon: '💣' },
          { id: 'bow_concuss',     name: 'Concussion Shot', unlockLevel: 15, icon: '⚡' },
        ],
      },
    ],
  },
  sword: {
    branches: [
      {
        id: 'swordmaster', name: 'Swordmaster', color: '#ef4444',
        abilities: [
          { id: 'sw_whirl',        name: 'Whirling Strike', unlockLevel: 1,  icon: '⚔️' },
          { id: 'sw_leap',         name: 'Leaping Strike',  unlockLevel: 5,  icon: '🦘' },
          { id: 'sw_reverse',      name: 'Reverse Stab',    unlockLevel: 10, icon: '⚡' },
          { id: 'sw_ultimate',     name: 'Final Blow',      unlockLevel: 20, icon: '💥' },
        ],
      },
      {
        id: 'duelist', name: 'Duelist', color: '#fbbf24',
        abilities: [
          { id: 'sw_parry',        name: 'Steel Parry',     unlockLevel: 3,  icon: '🛡️' },
          { id: 'sw_riposte',      name: 'Riposte',         unlockLevel: 8,  icon: '🗡️' },
          { id: 'sw_resolve',      name: 'Unbreakable',     unlockLevel: 15, icon: '⛓️' },
        ],
      },
    ],
  },
  dual_blades: {
    branches: [
      {
        id: 'tempest', name: 'Tempest', color: '#22d3ee',
        abilities: [
          { id: 'db_flurry',       name: 'Flurry',          unlockLevel: 1,  icon: '🌀' },
          { id: 'db_dash',         name: 'Twin Dash',       unlockLevel: 5,  icon: '💨' },
          { id: 'db_storm',        name: 'Blade Storm',     unlockLevel: 10, icon: '🌪️' },
          { id: 'db_ultimate',     name: 'Mirror Dance',    unlockLevel: 20, icon: '✨' },
        ],
      },
      {
        id: 'assassin', name: 'Assassin', color: '#a855f7',
        abilities: [
          { id: 'db_shadow',       name: 'Shadow Step',     unlockLevel: 3,  icon: '🌑' },
          { id: 'db_bleed',        name: 'Bleeding Edge',   unlockLevel: 8,  icon: '🩸' },
          { id: 'db_silence',      name: 'Silent Kill',     unlockLevel: 15, icon: '☠️' },
        ],
      },
    ],
  },
  sky: {
    branches: [
      {
        id: 'celestial', name: 'Celestial', color: '#818cf8',
        abilities: [
          { id: 'sky_ascend',      name: 'Ascend',          unlockLevel: 1,  icon: '🌌' },
          { id: 'sky_starfall',    name: 'Starfall',        unlockLevel: 5,  icon: '⭐' },
          { id: 'sky_voidstrike',  name: 'Void Strike',     unlockLevel: 10, icon: '🌠' },
          { id: 'sky_ultimate',    name: 'Cosmic Collapse', unlockLevel: 20, icon: '💫' },
        ],
      },
      {
        id: 'stormcaller', name: 'Stormcaller', color: '#38bdf8',
        abilities: [
          { id: 'sky_gust',        name: 'Gust Slash',      unlockLevel: 3,  icon: '💨' },
          { id: 'sky_lightning',   name: 'Sky Lightning',   unlockLevel: 8,  icon: '⚡' },
          { id: 'sky_tempest',     name: 'Heaven\'s Wrath', unlockLevel: 15, icon: '🌩️' },
        ],
      },
    ],
  },
};

// Default tree fallback for weapons not yet detailed.
export const DEFAULT_TREE = {
  branches: [
    {
      id: 'offense', name: 'Offense', color: '#ef4444',
      abilities: [
        { id: 'def_basic',    name: 'Basic Strike',   unlockLevel: 1,  icon: '⚔️' },
        { id: 'def_combo',    name: 'Combo Attack',   unlockLevel: 5,  icon: '🔥' },
        { id: 'def_burst',    name: 'Burst Skill',    unlockLevel: 10, icon: '💢' },
        { id: 'def_ultimate', name: 'Ultimate',       unlockLevel: 20, icon: '💥' },
      ],
    },
    {
      id: 'utility', name: 'Utility', color: '#38bdf8',
      abilities: [
        { id: 'def_perk1',    name: 'Stance',         unlockLevel: 3,  icon: '🛡️' },
        { id: 'def_perk2',    name: 'Resolve',        unlockLevel: 8,  icon: '🪨' },
        { id: 'def_perk3',    name: 'Mastery',        unlockLevel: 15, icon: '⭐' },
      ],
    },
  ],
};

export function getTreeForWeapon(weaponId) {
  return WEAPON_TREES[weaponId] || DEFAULT_TREE;
}

// Damage-scaling stats list for a given weapon (shown under "DAMAGE SCALES WITH").
export function getDamageScalingFor(weaponId) {
  const stats = [];
  Object.entries(STAT_SYNERGY).forEach(([stat, entries]) => {
    const hit = entries.find((e) => e.weaponId === weaponId);
    if (hit && (hit.tier === 'S' || hit.tier === 'A')) {
      stats.push({ stat, tier: hit.tier });
    }
  });
  return stats;
}