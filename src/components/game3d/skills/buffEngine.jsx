// ─── Buff Engine — Active Buff Lifecycle ───────────────────────────────
// Owns the 5 ACTIVE_BUFF skills:
//   • heavens_riposte    — reflect chance (duration)
//   • aegis_shield       — temp HP shield (duration)
//   • decisive_blow      — crit chance bonus (duration)
//   • focus              — damage bonus for next N hits (duration OR until N consumed)
//   • gods_deflection    — crit damage reduction + crit resist (duration)
//
// State shape (singleton):
//   {
//     buffs: {
//       [skill_id]: {
//         skill_id, level, startedAt, expiresAt,
//         hitsRemaining?,   // focus only
//         values: { ...computed numeric values for this cast }
//       }
//     }
//   }
//
// Subscribers get the full buffs map. Subscribe from HUD / damage layer.

import { getSkillById, scaleStat } from './skillRegistry';

const _listeners = new Set();
let _state = { buffs: {} };

const now = () => performance.now();
const emit = () => _listeners.forEach((fn) => fn(_state));

export function getBuffs() { return _state.buffs; }
export function subscribeBuffs(fn) {
  _listeners.add(fn);
  fn(_state);
  return () => _listeners.delete(fn);
}

/**
 * Activate a buff skill at the given level. Replaces any existing instance.
 * Returns the computed buff record.
 */
export function activateBuff(skill_id, level = 1, ctx = {}) {
  const skill = getSkillById(skill_id);
  if (!skill || skill.skill_type !== 'ACTIVE_BUFF') return null;

  const startedAt = now();
  const expiresAt = startedAt + (skill.duration || 0) * 1000;

  // Compute per-skill values up front so the consumer never has to look back
  // at the skill registry to figure out what the buff means right now.
  const values = {};
  switch (skill_id) {
    case 'heavens_riposte':
      values.reflect_chance = scaleStat(skill, 'reflect_chance', level);
      break;
    case 'aegis_shield': {
      const pct = scaleStat(skill, 'shield_pct_max_hp', level);
      values.shield_pct_max_hp = pct;
      values.shield_amount = Math.round((ctx.maxHP || 100) * pct);
      break;
    }
    case 'decisive_blow':
      values.crit_chance_flat = scaleStat(skill, 'crit_chance_flat', level);
      break;
    case 'focus':
      values.damage_bonus_pct = scaleStat(skill, 'damage_bonus_pct', level);
      break;
    case 'gods_deflection':
      values.crit_damage_reduction_pct = scaleStat(skill, 'crit_damage_reduction_pct', level);
      values.crit_resist_pct           = scaleStat(skill, 'crit_resist_pct', level);
      break;
    default:
      break;
  }

  const record = {
    skill_id,
    level,
    startedAt,
    expiresAt,
    values,
    ...(skill_id === 'focus' ? { hitsRemaining: skill.hit_count } : {}),
  };

  _state = { buffs: { ..._state.buffs, [skill_id]: record } };
  emit();
  return record;
}

/** Remove a buff explicitly (e.g. focus consumed its last hit). */
export function clearBuff(skill_id) {
  if (!_state.buffs[skill_id]) return;
  const next = { ..._state.buffs };
  delete next[skill_id];
  _state = { buffs: next };
  emit();
}

/** Is the buff currently active? (not expired and present) */
export function isBuffActive(skill_id) {
  const b = _state.buffs[skill_id];
  return !!b && b.expiresAt > now();
}

/** Consume one hit on Focus. Returns the damage multiplier to apply (or 1). */
export function consumeFocusHit() {
  const b = _state.buffs.focus;
  if (!b || b.expiresAt < now() || b.hitsRemaining <= 0) return 1;
  const mult = 1 + (b.values.damage_bonus_pct || 0);
  const hitsRemaining = b.hitsRemaining - 1;
  if (hitsRemaining <= 0) {
    clearBuff('focus');
  } else {
    _state = { buffs: { ..._state.buffs, focus: { ...b, hitsRemaining } } };
    emit();
  }
  return mult;
}

/** Roll Heaven's Riposte reflect on incoming damage. */
export function rollRiposte() {
  const b = _state.buffs.heavens_riposte;
  if (!b || b.expiresAt < now()) return false;
  return Math.random() < (b.values.reflect_chance || 0);
}

/** Returns the Aegis Shield's current absorb pool, or 0. */
export function getAegisShield() {
  const b = _state.buffs.aegis_shield;
  if (!b || b.expiresAt < now()) return 0;
  return b.values.shield_amount || 0;
}

/** Subtract damage from Aegis shield. Returns amount absorbed. */
export function absorbAegis(incoming) {
  const b = _state.buffs.aegis_shield;
  if (!b || b.expiresAt < now()) return 0;
  const absorbed = Math.min(b.values.shield_amount || 0, incoming);
  const remaining = (b.values.shield_amount || 0) - absorbed;
  if (remaining <= 0) {
    clearBuff('aegis_shield');
  } else {
    _state = {
      buffs: {
        ..._state.buffs,
        aegis_shield: { ...b, values: { ...b.values, shield_amount: remaining } },
      },
    };
    emit();
  }
  return absorbed;
}

/** Flat crit chance bonus from Decisive Blow (0 if inactive). */
export function getCritBonus() {
  const b = _state.buffs.decisive_blow;
  if (!b || b.expiresAt < now()) return 0;
  return b.values.crit_chance_flat || 0;
}

/** Apply God's Deflection to an incoming crit. Returns { negated, mitigatedDmg }. */
export function applyDeflectionToCrit(incomingDmg) {
  const b = _state.buffs.gods_deflection;
  if (!b || b.expiresAt < now()) return { negated: false, mitigatedDmg: incomingDmg };
  if (Math.random() < (b.values.crit_resist_pct || 0)) {
    return { negated: true, mitigatedDmg: 0 };
  }
  const reduced = incomingDmg * (1 - (b.values.crit_damage_reduction_pct || 0));
  return { negated: false, mitigatedDmg: Math.round(reduced) };
}

/** Tick — drop expired buffs. Call every frame. */
export function tickBuffEngine() {
  const t = now();
  const next = {};
  let changed = false;
  for (const [id, b] of Object.entries(_state.buffs)) {
    if (b.expiresAt > t) next[id] = b;
    else changed = true;
  }
  if (changed) { _state = { buffs: next }; emit(); }
}