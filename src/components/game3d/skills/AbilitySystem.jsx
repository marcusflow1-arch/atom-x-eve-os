export class AbilitySystem {
  constructor({ getLoadout, castSkill, startSkillCooldown, getAbilityState, startLegacyCooldown, castLegacy }) {
    this.getLoadout = getLoadout;
    this.castSkill = castSkill;
    this.startSkillCooldown = startSkillCooldown;
    this.getAbilityState = getAbilityState;
    this.startLegacyCooldown = startLegacyCooldown;
    this.castLegacy = castLegacy;
  }

  castSlot(slotIndex, context) {
    const loadout = this.getLoadout?.();
    const skillId = loadout?.activeSlots?.[slotIndex];
    const cooldown = loadout?.cooldowns?.[slotIndex] ?? 0;
    if (skillId && cooldown <= 0) {
      const result = this.castSkill?.(skillId, context);
      if (result?.ok) this.startSkillCooldown?.(slotIndex);
      return !!result?.ok;
    }
    return false;
  }
}