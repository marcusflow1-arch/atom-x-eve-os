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
import { addContribution } from './progression/contributionStore';
import { getActiveCharacter } from './characterStore';
import { addAXEFactionReputation } from './axe/factions/AXEFactionReputationStore';

export function grantQuestReward(quest) {
  const reward = quest?.reward || {};
  const results = {
    contribution: 0,
    reputation: null,
    unlock: null,
  };

  if (Number(reward.contribution || 0) > 0) {
    results.contribution = addContribution(reward.contribution);
  }

  if (Number(reward.reputation || 0) > 0) {
    const activeFactionId = getActiveCharacter()?.factionId;
    const rewardFactionId =
      quest?.factionId && quest.factionId !== 'AXE_Faction_Unassigned'
        ? quest.factionId
        : activeFactionId;
    if (rewardFactionId && rewardFactionId !== 'AXE_Faction_Unassigned') {
      results.reputation = addAXEFactionReputation(rewardFactionId, reward.reputation);
    }
  }

  const unlock = reward.unlock;
  if (unlock) {
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

    results.unlock = detail;
    window.dispatchEvent(new CustomEvent('questRewardUnlock', { detail }));
  }

  // Future reward types (items, currencies, recipes, housing unlocks, etc.)
  // route through one stable event instead of hard-coding every system here.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeQuestRewardGranted', {
      detail: { questId: quest?.id, reward, results },
    }));
  }

  return results;
}