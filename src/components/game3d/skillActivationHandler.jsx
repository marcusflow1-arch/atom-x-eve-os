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
} from './activeBuffsStore';

// Activation logic per skill id. Each handler receives no args and uses the
// player HUD store (max HP) where needed.
const HANDLERS = {
  aegis_shield: () => {
    const hud = getPlayerHUD();
    const amount = Math.round((hud.maxHP || 100) * 0.15);
    applyShield(amount, 15);
    return { toast: `🛡️ Aegis Shield: +${amount} HP shield` };
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
    applyReflectBuff(0.03, 20);
    return { toast: `✨ God's Deflection: 3% reflect chance (20s)` };
  },
  haste: () => {
    applyAttackSpeedBuff(0.01, 15); // level-1 value; upgrades later scale this
    return { toast: `⚡ Haste: +1% attack speed (15s)` };
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