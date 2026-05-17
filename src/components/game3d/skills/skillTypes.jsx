// ─── Skill Classification Enums ────────────────────────────────────────
// The four canonical skill types. Every skill in the registry must declare
// exactly one of these. No exceptions, no overlap.

export const SKILL_TYPE = Object.freeze({
  ACTIVE_ATTACK: 'ACTIVE_ATTACK', // damage skills used in active slots
  ACTIVE_BUFF:   'ACTIVE_BUFF',   // temporary combat modifiers, used in active slots
  PASSIVE:       'PASSIVE',       // always-on once learned. NEVER manually cast.
});

// Weapon archetypes. Every skill that is weapon-locked declares one of these
// as `weapon_type`. Skills usable by any weapon use `null`.
export const WEAPON_TYPE = Object.freeze({
  SWORD:    'sword',     // single-handed sword(s), greatsword
  GUARDIAN: 'guardian',  // shield/fist/defensive melee
  RANGED:   'ranged',    // bow / firearm / energy weapon
});

// Cast patterns — drives the executor. One enum per supported pattern.
export const CAST_TYPE = Object.freeze({
  SELF_CAST:           'self_cast',           // buffs apply to self, no projectile
  SINGLE_HIT:          'single_hit',          // 1 strike
  MULTI_HIT_SEQUENTIAL:'multi_hit_sequential',// hits separated by hit_delay (sword)
  MULTI_HIT_BURST:     'multi_hit_burst',     // first hits simultaneous, last delayed (guardian)
  RANGED_DOUBLE:       'ranged_double',       // 2 projectiles, second after short delay
  RANGED_BARRAGE:      'ranged_barrage',      // N projectiles, fixed interval
  PASSIVE_TICK:        'passive_tick',        // never manually cast
});

// Slot kinds used by the loadout store. Active slots accept ACTIVE_ATTACK
// and ACTIVE_BUFF freely. Passive panel accepts PASSIVE only.
export const SLOT_KIND = Object.freeze({
  ACTIVE:  'active',
  PASSIVE: 'passive',
});