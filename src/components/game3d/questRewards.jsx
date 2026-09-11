// ─────────────────────────────────────────────
// Quest Rewards — applies milestone unlock rewards on quest claim.
// Also exposes a reusable remote-claim path for the Spirit Quest Relay so
// modern menu turn-ins grant the exact same XP/stat/unlock rewards as NPCs.
// ─────────────────────────────────────────────
import { getAbilityState, equipAbility, ABILITY_DEFINITIONS } from './abilityStore';
import { unlockClass, selectAdvancedClass } from './talents/advancedClassStore';
import { completeQuest, getQuestState } from './useQuestStore';
import { getPlayerHUD, awardXP } from './playerHUDStore';
import { xpForLevel } from './gameWorldConfig';

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

export function canClaimQuest(quest) {
  if (!quest) return false;
  const state = getQuestState();
  if (!state.acceptedIds.includes(quest.id)) return false;
  const objective = quest.objective || {};
  const needed = Math.max(0, Number(objective.count) || 0);
  const progress = Math.max(0, Number(state.progress?.[quest.id]) || 0);
  return progress >= needed;
}

// Same progression math as GameWorld3D's NPC claim flow, packaged so the
// modernized menu can complete quests without duplicating reward rules.
export function claimQuestRemotely(quest) {
  if (!quest) return { ok: false, reason: 'Quest not found.' };
  if (!canClaimQuest(quest)) return { ok: false, reason: 'Objective is not complete.' };

  completeQuest(quest.id);
  grantQuestReward(quest);

  const hud = getPlayerHUD();
  let newXP = (hud.xp || 0) + (quest.reward?.xp || 0);
  let newLevel = hud.level || 1;
  let needed = xpForLevel(newLevel);
  let levelsGained = 0;

  while (newXP >= needed) {
    newXP -= needed;
    newLevel += 1;
    levelsGained += 1;
    needed = xpForLevel(newLevel);
  }

  awardXP({
    newLevel,
    newXP,
    xpForNext: xpForLevel(newLevel),
    levelsGained,
    bonusPoints: quest.reward?.points || 0,
    xpGained: quest.reward?.xp || 0,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('questClaimedRemotely', {
      detail: {
        questId: quest.id,
        title: quest.title,
        xp: quest.reward?.xp || 0,
        points: quest.reward?.points || 0,
        levelsGained,
      },
    }));
  }

  return {
    ok: true,
    xp: quest.reward?.xp || 0,
    points: quest.reward?.points || 0,
    levelsGained,
  };
}
