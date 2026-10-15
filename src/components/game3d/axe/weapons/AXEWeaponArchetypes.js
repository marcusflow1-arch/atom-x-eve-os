// Wuxia blueprint §3 — five weapon archetypes and Weapon Affinity.
// docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md
//
// The archetype is a second dimension next to the existing three AXE combat
// roles (offensive / defensive / ranged in AXEFactionWeaponConfig). Roles keep
// driving PvP range, mastery paths and the native class passives unchanged;
// archetypes add the blueprint's archetype passive, which the one archetype a
// player specializes in gets doubled (Weapon Affinity, 2.0x).
//
// Passive values are the blueprint's table. They stack with the existing native
// class passives (weaponClassBuffStore) and are provisional balance.

export const AXE_WEAPON_ARCHETYPES = Object.freeze({
  single_hit: Object.freeze({
    id: 'single_hit',
    label: 'Single-Hit Burst',
    examples: 'Greatswords, heavy polearms',
    summary: 'Massive single-instance damage that punches through high armor.',
    passive: Object.freeze({ damagePct: 0.20 }),
  }),
  multi_hit: Object.freeze({
    id: 'multi_hit',
    label: 'Multi-Hit Combo',
    examples: 'Dual daggers, twin blades',
    summary: 'Rapid flurries; every hit rolls its own critical strike.',
    passive: Object.freeze({ critDodgePct: 0.10 }), // the blueprint's "Critical Strike Focus" row
  }),
  ranged: Object.freeze({
    id: 'ranged',
    label: 'Ranged',
    examples: 'Bows, magic rings, lutes, fans',
    summary: 'Long-distance projectiles for kiting and zone control.',
    passive: Object.freeze({ dodgePct: 0.15, moveSpeedPct: 0.15 }),
  }),
  close_combat: Object.freeze({
    id: 'close_combat',
    label: 'Close-Combat Melee',
    examples: 'Dao blades, swords, martial fists',
    summary: 'Fast chaining at medium range, balancing speed with blocking.',
    passive: Object.freeze({ damagePct: 0.20 }),
  }),
  defensive: Object.freeze({
    id: 'defensive',
    label: 'Defensive',
    examples: 'Guard shields, defensive implements',
    summary: 'Cuts incoming damage, holds threat and counters on a block.',
    passive: Object.freeze({ defensePct: 0.50 }),
  }),
});

export const AXE_WEAPON_ARCHETYPE_ORDER = Object.freeze(['single_hit', 'multi_hit', 'ranged', 'close_combat', 'defensive']);
export const AXE_WEAPON_AFFINITY_MULTIPLIER = 2;
export const AXE_QUICK_WEAPON_SLOTS = 2;

// First match wins, so heavy and twin weapons are tested before plain blades
// ("Heavy Greatsword" contains "sword", "War Blades" contains "blade").
const TOKEN_RULES = Object.freeze([
  Object.freeze({ archetype: 'defensive', tokens: ['shield', 'aegis', 'bulwark', 'buckler'] }),
  Object.freeze({ archetype: 'single_hit', tokens: ['greatsword', 'great sword', 'polearm', 'glaive', 'halberd', 'spear', 'war hammer', 'warhammer', 'greataxe', 'great axe'] }),
  Object.freeze({ archetype: 'multi_hit', tokens: ['dagger', 'dual blade', 'dual_blade', 'twin blade', 'twin_blade', 'war blades', 'claws'] }),
  Object.freeze({ archetype: 'ranged', tokens: ['bow', 'crossbow', 'lute', 'ring blade', 'magic ring', 'fan', 'orb'] }),
  Object.freeze({ archetype: 'close_combat', tokens: ['dao', 'fist', 'gauntlet', 'sword', 'katana', 'saber', 'blade'] }),
]);

const BY_MASTERY = Object.freeze({ bow: 'ranged', sky: 'ranged', dual_blades: 'multi_hit', sword: 'close_combat' });

export function isAXEWeaponArchetype(id) {
  return Object.prototype.hasOwnProperty.call(AXE_WEAPON_ARCHETYPES, id);
}

// The archetype of one weapon item: an explicit item.archetype, else its name /
// type / template, else its mastery family. Never null for a weapon.
export function inferAXEWeaponArchetype(item) {
  if (!item) return null;
  if (isAXEWeaponArchetype(item.archetype)) return item.archetype;
  const haystack = [item.name, item.type, item.weaponFamily, item.templateId, item.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const rule = TOKEN_RULES.find((r) => r.tokens.some((t) => haystack.includes(t)));
  if (rule) return rule.archetype;
  return BY_MASTERY[item.masteryWeaponId] || 'close_combat';
}

// The passive for wielding `archetype`; doubled when it is the specialized one.
export function getAXEArchetypePassive(archetype, specialized = null) {
  const def = AXE_WEAPON_ARCHETYPES[archetype];
  if (!def) return { archetype: null, doubled: false, scale: 0, damagePct: 0, defensePct: 0, dodgePct: 0, moveSpeedPct: 0, critDodgePct: 0 };
  const doubled = specialized === archetype;
  const scale = doubled ? AXE_WEAPON_AFFINITY_MULTIPLIER : 1;
  const p = def.passive;
  return {
    archetype,
    doubled,
    scale,
    damagePct: (p.damagePct || 0) * scale,
    defensePct: (p.defensePct || 0) * scale,
    dodgePct: (p.dodgePct || 0) * scale,
    moveSpeedPct: (p.moveSpeedPct || 0) * scale,
    critDodgePct: (p.critDodgePct || 0) * scale,
  };
}

// Final derived-stat stage (after equipment and advanced-class multipliers).
// critChanceReductionPct is the defender field AXECombatMath already reads.
export function applyAXEWeaponAffinityToDerived(derived, passive) {
  if (!derived || !passive?.archetype) return derived;
  const out = { ...derived };
  const dmg = 1 + (passive.damagePct || 0);
  if (dmg !== 1) {
    for (const k of ['damage', 'physicalDamage', 'totalDamage']) if (Number.isFinite(out[k])) out[k] *= dmg;
  }
  if (passive.defensePct && Number.isFinite(out.defense)) out.defense *= 1 + passive.defensePct;
  if (passive.dodgePct && Number.isFinite(out.evasionPct)) out.evasionPct *= 1 + passive.dodgePct;
  if (passive.critDodgePct) out.critChanceReductionPct = Number(out.critChanceReductionPct || 0) + passive.critDodgePct * 100;
  out.weaponAffinity = { archetype: passive.archetype, doubled: passive.doubled, scale: passive.scale };
  return out;
}
