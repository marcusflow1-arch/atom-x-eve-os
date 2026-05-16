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
};

// Try to activate a Skills-Book skill. `entry` is the slot entry from
// abilityStore — can be a full skill object or a string id. Returns true if
// handled here (skip legacy ABILITY_DEFINITIONS path).
export function tryActivateBookSkill(entry) {
  if (!entry) return false;
  const id = typeof entry === 'string' ? entry : entry.id;
  const handler = HANDLERS[id];
  if (!handler) return false;
  const result = handler();
  if (result?.toast) {
    window.dispatchEvent(new CustomEvent('skillActivatedToast', { detail: { text: result.toast } }));
  }
  return true;
}

export const BOOK_SKILL_IDS = Object.keys(HANDLERS);