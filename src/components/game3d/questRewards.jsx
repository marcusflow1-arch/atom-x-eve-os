// ─────────────────────────────────────────────
// Quest Rewards — applies milestone unlock rewards on quest claim.
//   • type 'ability' — learns the ability and auto-equips it into the first
//     empty hotbar slot so it's usable immediately.
//   • type 'class'   — unlocks the advanced class and switches to it (class
//     change). If the switch is blocked (in combat etc.) it stays unlocked
//     for the player to select in the Talents menu.
// Dispatches 'questRewardUnlock' so the toast layer can announce it.
// ─────────────────────────────────────────────
import { getAbilityState, equipAbility, ABILITY_DEFINITIONS } from './abilityStore';
import { unlockClass, selectAdvancedClass } from './talents/advancedClassStore';

export function grantQuestReward(quest) {
  const unlock = quest?.reward?.unlock;
  if (!unlock) return;
  const detail = { ...unlock };

  if (unlock.type === 'ability') {
    const ab = ABILITY_DEFINITIONS.find((a) => a.id === unlock.id);
    const slots = getAbilityState().equipped || [];
    const empty = slots.findIndex((s) => !s);
    if (ab && empty !== -1) {
      equipAbility(empty, ab.id);
      detail.equippedSlot = empty + 1;
    }
  } else if (unlock.type === 'class') {
    unlockClass(unlock.id);
    const res = selectAdvancedClass(unlock.id);
    detail.activated = !!res?.success;
  }

  window.dispatchEvent(new CustomEvent('questRewardUnlock', { detail }));
}