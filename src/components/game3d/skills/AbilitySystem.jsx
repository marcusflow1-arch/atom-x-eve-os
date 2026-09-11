import { getPlayerHUD } from '../playerHUDStore';

export class AbilitySystem {
  constructor({ getLoadout, castSkill, startSkillCooldown, getAbilityState, startLegacyCooldown, castLegacy }) {
    this.getLoadout = getLoadout;
    this.castSkill = castSkill;
    this.startSkillCooldown = startSkillCooldown;
    this.getAbilityState = getAbilityState;
    this.startLegacyCooldown = startLegacyCooldown;
    this.castLegacy = castLegacy;
    this.extendedKeyHandler = null;
    this.attachExtendedHotkeys();
  }

  castSlot(slotIndex, context = {}) {
    const loadout = this.getLoadout?.();
    const skillId = loadout?.activeSlots?.[slotIndex];
    const cooldown = loadout?.cooldowns?.[slotIndex] ?? 0;
    if (skillId && cooldown <= 0) {
      const result = this.castSkill?.(skillId, { ...context, slotIndex });
      if (result?.ok) this.startSkillCooldown?.(slotIndex);
      return !!result?.ok;
    }
    return false;
  }

  // GameWorld's legacy listener owns 1..8. TwelveSky adds positions 9 and 10;
  // bridge only those keys here so the giant world component does not need a
  // duplicate combat path. Key 0 maps to hotbar position 10.
  attachExtendedHotkeys() {
    if (typeof window === 'undefined') return;
    if (window.__twelveSkyExtendedHotkeyHandler) {
      window.removeEventListener('keydown', window.__twelveSkyExtendedHotkeyHandler);
    }
    this.extendedKeyHandler = (event) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '')) return;
      const slotIndex = event.key === '9' ? 8 : event.key === '0' ? 9 : -1;
      if (slotIndex < 0) return;
      const hud = getPlayerHUD();
      if (this.castSlot(slotIndex, { level: hud.level || 1, maxHP: hud.maxHP || 100 })) {
        event.preventDefault();
      }
    };
    window.__twelveSkyExtendedHotkeyHandler = this.extendedKeyHandler;
    window.addEventListener('keydown', this.extendedKeyHandler);
  }

  dispose() {
    if (typeof window === 'undefined' || !this.extendedKeyHandler) return;
    window.removeEventListener('keydown', this.extendedKeyHandler);
    if (window.__twelveSkyExtendedHotkeyHandler === this.extendedKeyHandler) {
      delete window.__twelveSkyExtendedHotkeyHandler;
    }
    this.extendedKeyHandler = null;
  }
}
