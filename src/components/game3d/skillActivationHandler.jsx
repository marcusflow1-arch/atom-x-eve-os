// Routes a Skills-Book skill activation (when its slot key 1-8 is pressed) to
// the right effect. Returns true if the skill was handled (so the legacy
// ABILITY_DEFINITIONS path can be skipped).
import { getPlayerHUD } from './playerHUDStore';
import {
  applyShield,
  applyDamageBuff,
  applyCritDamageBonus,
  applyAttackSpeedBuff,
  applyReflectBuff,
  applyPowerCharge,
  applyDodgeBuff,
} from './activeBuffsStore';
import { SKILLS_DATABASE } from './equipment/skillData';
import { ABILITY_DEFINITIONS } from './abilityStore';
import { getActiveWeaponPath } from './weaponClassBuffStore';
import { getSkillData, MAX_SKILL_LEVEL } from './equipment/skillUpgradeStore';

// Linear interpolation from min→max based on skill's current level (1..MAX).
function scaleByLevel(min, max, skillId) {
  const { level = 1 } = getSkillData(skillId);
  const t = Math.min(1, Math.max(0, (level - 1) / (MAX_SKILL_LEVEL - 1)));
  return min + (max - min) * t;
}

const PATH_LABEL = { damage: 'a Damage', defense: 'a Defense', ranged: 'a Ranged' };

// Returns the weapon-class path ('damage'|'defense'|'ranged') required by a
// skill, or null if the skill has no path restriction. Checks both the
// Skills-Book database and the legacy ABILITY_DEFINITIONS list.
function getSkillPath(id) {
  const sk = SKILLS_DATABASE.find((s) => s.id === id);
  if (sk?.path) return sk.path;
  const ab = ABILITY_DEFINITIONS.find((a) => a.id === id);
  return ab?.path || null;
}

// Public helper: returns true if a skill id is allowed to fire given the
// currently equipped weapon class. Used by GameWorld3D for the legacy
// ABILITY_DEFINITIONS path so it can block + toast before any logic runs.
export function isSkillAllowedForActiveWeapon(id) {
  const required = getSkillPath(id);
  const active = getActiveWeaponPath();
  if (!required || !active) return true;
  if (required === active) return true;
  window.dispatchEvent(new CustomEvent('skillActivatedToast', {
    detail: { text: `⛔ Requires ${PATH_LABEL[required] || required} weapon equipped` },
  }));
  return false;
}

// Activation logic per skill id. Each handler receives no args and uses the
// player HUD store (max HP) where needed.
//
// Durations are spec'd by design:
//   • shield     → 180s
//   • reflect    → 180s
//   • dodge      → 180s
//   • power chg  →  90s (also expires when 5 hits consumed)
//   • focus      → unchanged (consumed per hit)
//   • crit dmg   → unchanged
//   • haste      → unchanged
const HANDLERS = {
  repulsion: () => {
    applyReflectBuff(1.0, 20);
    return { toast: `⚡ Repulsion: reflect barrier active (20s)` };
  },
  barrier_aura: () => {
    const hud = getPlayerHUD();
    const amount = Math.round((hud.maxHP || 100) * 0.2);
    applyShield(amount, 20);
    return { toast: `🛡️ Barrier Aura: +${amount} shield (20s)` };
  },
  heavens_destruction: () => {
    applyReflectBuff(0.25, 20);
    return { toast: `🌑 Heaven's Destruction: dark ward active (20s)` };
  },
  aegis_shield: () => {
    const hud = getPlayerHUD();
    const amount = Math.round((hud.maxHP || 100) * 0.15);
    applyShield(amount, 180);
    return { toast: `🛡️ Aegis Shield: +${amount} HP shield (3min)` };
  },
  decisive_blow: () => {
    applyCritDamageBonus(0.25, 20);
    return { toast: `🎯 Decisive Blow: +25% crit damage (20s)` };
  },
  focus: () => {
    applyDamageBuff(0.30, 5);
    return { toast: `🧠 Focus: +30% damage for next 5 hits` };
  },
  gods_deflection: () => {
    applyReflectBuff(0.03, 180);
    return { toast: `✨ God's Deflection: 3% reflect chance (3min)` };
  },
  haste: () => {
    applyAttackSpeedBuff(0.01, 15); // level-1 value; upgrades later scale this
    return { toast: `⚡ Haste: +1% attack speed (15s)` };
  },
  // Power Charge — +100% damage for the next 5 hits, hands glow. 90s timer.
  power_charge: () => {
    applyPowerCharge(1.0, 5, 90);
    return { toast: `🔥 Power Charge: +100% damage for next 5 hits (90s)` };
  },
  reflective_guard: () => {
    applyReflectBuff(1.0, 12);
    return { toast: `🪞 Reflective Guard: full reflection active (12s)` };
  },
  guardian_wall: () => {
    const hud = getPlayerHUD();
    const amount = Math.round((hud.maxHP || 100) * 0.25);
    applyShield(amount, 20);
    return { toast: `🛡️ Guardian Wall: party shield effect active (20s)` };
  },
  iron_fortress: () => {
    const hud = getPlayerHUD();
    const amount = Math.round((hud.maxHP || 100) * 0.2);
    applyShield(amount, 20);
    return { toast: `🏰 Iron Fortress: fortified shield active (20s)` };
  },
  counter_pulse: () => {
    const hud = getPlayerHUD();
    const amount = Math.round((hud.maxHP || 100) * 0.12);
    applyShield(amount, 12);
    return { toast: `🔄 Counter Pulse: counter barrier active (12s)` };
  },
  // Defense buff — chance for enemies to miss you entirely. 180s.
  evasion: () => {
    applyDodgeBuff(0.15, 180);
    return { toast: `💨 Evasion: 15% dodge chance (3min)` };
  },
  // Defense single-hit slash — 80% → 100% weapon damage scaling by skill level.
  shield_slash: () => {
    const mult = scaleByLevel(0.80, 1.00, 'shield_slash');
    window.dispatchEvent(new CustomEvent('playerSkillStrike', {
      detail: { multiplier: mult, hits: 1, skillId: 'shield_slash' },
    }));
    return { toast: `⚔️ Shield Slash: ${Math.round(mult * 100)}% weapon damage` };
  },
  // Defense three-hit strike — 90% → 110% per hit scaling by skill level.
  guardian_triple_strike: () => {
    const mult = scaleByLevel(0.90, 1.10, 'guardian_triple_strike');
    window.dispatchEvent(new CustomEvent('playerSkillStrike', {
      detail: { multiplier: mult, hits: 3, skillId: 'guardian_triple_strike' },
    }));
    return { toast: `⚔️ Guardian Triple Strike: 3× ${Math.round(mult * 100)}% weapon damage` };
  },
};

// Try to activate a Skills-Book skill. `entry` is the slot entry from
// abilityStore — can be a full skill object or a string id. Returns true if
// handled here (skip legacy ABILITY_DEFINITIONS path).
export function tryActivateBookSkill(entry) {
  if (!entry) return false;
  const id = typeof entry === 'string' ? entry : entry.id;
  const handler = HANDLERS[id];
  if (!handler) return false;

  // Weapon-class gate — skill can only fire when the matching weapon class
  // is equipped in the bottom-right weapon switcher.
  const required = getSkillPath(id);
  const active = getActiveWeaponPath();
  if (required && active && required !== active) {
    window.dispatchEvent(new CustomEvent('skillActivatedToast', {
      detail: { text: `⛔ Requires ${PATH_LABEL[required] || required} weapon equipped` },
    }));
    return true; // handled (blocked) — don't fall through to legacy path
  }

  const result = handler();
  if (result?.toast) {
    window.dispatchEvent(new CustomEvent('skillActivatedToast', { detail: { text: result.toast } }));
  }
  return true;
}

export const BOOK_SKILL_IDS = Object.keys(HANDLERS);