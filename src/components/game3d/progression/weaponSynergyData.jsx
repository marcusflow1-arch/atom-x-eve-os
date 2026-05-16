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
  { id: 'greatsword',    name: 'Greatsword',       icon: '⚔️' },
  { id: 'sword_shield',  name: 'Sword & Shield',   icon: '🛡️' },
  { id: 'hatchet',       name: 'Hatchet',          icon: '🪓' },
  { id: 'warhammer',     name: 'War Hammer',       icon: '🔨' },
  { id: 'spear',         name: 'Spear',            icon: '🔱' },
  { id: 'rapier',        name: 'Rapier',           icon: '🗡️' },
  { id: 'bow',           name: 'Bow',              icon: '🏹' },
  { id: 'musket',        name: 'Musket',           icon: '🔫' },
  { id: 'fire_staff',    name: 'Fire Staff',       icon: '🔥' },
  { id: 'life_staff',    name: 'Life Staff',       icon: '✨' },
  { id: 'ice_gauntlet',  name: 'Ice Gauntlet',     icon: '❄️' },
  { id: 'void_gauntlet', name: 'Void Gauntlet',    icon: '🌌' },
];

// Per-stat synergy map. For each stat, list the weapons that scale with it
// and the tier of that scaling. Used by the Attributes tab tooltips/inline list.
export const STAT_SYNERGY = {
  strength: [
    { weaponId: 'greatsword',   tier: 'S' },
    { weaponId: 'warhammer',    tier: 'S' },
    { weaponId: 'hatchet',      tier: 'A' },
    { weaponId: 'sword_shield', tier: 'B' },
    { weaponId: 'spear',        tier: 'B' },
  ],
  dexterity: [
    { weaponId: 'bow',          tier: 'S' },
    { weaponId: 'musket',       tier: 'S' },
    { weaponId: 'rapier',       tier: 'A' },
    { weaponId: 'spear',        tier: 'A' },
    { weaponId: 'hatchet',      tier: 'B' },
    { weaponId: 'sword_shield', tier: 'C' },
  ],
  intelligence: [
    { weaponId: 'fire_staff',    tier: 'S' },
    { weaponId: 'ice_gauntlet',  tier: 'S' },
    { weaponId: 'void_gauntlet', tier: 'A' },
    { weaponId: 'musket',        tier: 'C' },
  ],
  focus: [
    { weaponId: 'life_staff',    tier: 'S' },
    { weaponId: 'void_gauntlet', tier: 'A' },
    { weaponId: 'ice_gauntlet',  tier: 'B' },
  ],
  constitution: [
    { weaponId: 'sword_shield', tier: 'A' },
    { weaponId: 'warhammer',    tier: 'B' },
    { weaponId: 'greatsword',   tier: 'C' },
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
  greatsword: {
    branches: [
      {
        id: 'onslaught', name: 'Onslaught', color: '#ef4444',
        abilities: [
          { id: 'gs_heavy_slash',  name: 'Heavy Slash',     unlockLevel: 1,  icon: '⚔️' },
          { id: 'gs_combo_chain',  name: 'Combo Chain',     unlockLevel: 5,  icon: '🔥' },
          { id: 'gs_relentless',   name: 'Relentless Rush', unlockLevel: 10, icon: '💢' },
          { id: 'gs_ultimate',     name: 'World Breaker',   unlockLevel: 20, icon: '💥' },
        ],
      },
      {
        id: 'guardian', name: 'Guardian', color: '#38bdf8',
        abilities: [
          { id: 'gs_parry',        name: 'Steel Parry',     unlockLevel: 3,  icon: '🛡️' },
          { id: 'gs_iron_skin',    name: 'Iron Skin',       unlockLevel: 8,  icon: '🪨' },
          { id: 'gs_resolve',      name: 'Unbreakable',     unlockLevel: 15, icon: '⛓️' },
        ],
      },
    ],
  },
  sword_shield: {
    branches: [
      {
        id: 'swordmaster', name: 'Swordmaster', color: '#ef4444',
        abilities: [
          { id: 'ss_strike',       name: 'Whirling Strike', unlockLevel: 1,  icon: '🗡️' },
          { id: 'ss_leap',         name: 'Leaping Strike',  unlockLevel: 5,  icon: '🦘' },
          { id: 'ss_reverse',      name: 'Reverse Stab',    unlockLevel: 10, icon: '⚡' },
          { id: 'ss_ultimate',     name: 'Final Blow',      unlockLevel: 20, icon: '💥' },
        ],
      },
      {
        id: 'defender', name: 'Defender', color: '#a855f7',
        abilities: [
          { id: 'ss_bash',         name: 'Shield Bash',     unlockLevel: 3,  icon: '🛡️' },
          { id: 'ss_rush',         name: 'Shield Rush',     unlockLevel: 8,  icon: '🏃' },
          { id: 'ss_taunt',        name: 'Defiant Stance',  unlockLevel: 15, icon: '😤' },
        ],
      },
    ],
  },
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
  fire_staff: {
    branches: [
      {
        id: 'pyromancer', name: 'Pyromancer', color: '#f97316',
        abilities: [
          { id: 'fs_fireball',     name: 'Fireball',        unlockLevel: 1,  icon: '🔥' },
          { id: 'fs_pillar',       name: 'Pillar of Fire',  unlockLevel: 5,  icon: '🗿' },
          { id: 'fs_meteor',       name: 'Meteor Shower',   unlockLevel: 10, icon: '☄️' },
          { id: 'fs_ultimate',     name: 'Incinerate',      unlockLevel: 20, icon: '💥' },
        ],
      },
      {
        id: 'fire_mage', name: 'Fire Mage', color: '#a855f7',
        abilities: [
          { id: 'fs_burnout',      name: 'Burn Out',        unlockLevel: 3,  icon: '🔥' },
          { id: 'fs_flame_thrower',name: 'Flamethrower',    unlockLevel: 8,  icon: '🌋' },
          { id: 'fs_passive_burn', name: 'Singe',           unlockLevel: 15, icon: '✨' },
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