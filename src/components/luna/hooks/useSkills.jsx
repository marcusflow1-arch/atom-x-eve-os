import { useState, useEffect } from 'react';
import useLunaStore from '../useLunaStore';

const DEFAULT_EFFECT_COOLDOWN_MS = 3000;
const DEFAULT_EFFECT_DURATION_MS = 800;

/**
 * Hook for managing the four Luna / AI Battle skill-card slots.
 *
 * Cards are the source of truth. A slot only triggers an animation/VFX package
 * when the equipped card carries animation_effect metadata. The keyboard never
 * owns an effect directly: Digit1..Digit4 resolve the card in that logical slot,
 * then the card resolves the effect.
 */
export function useSkills() {
  const [activeSkills, setActiveSkills] = useState([false, false, false, false]);
  const { triggerSkill: storeSkill, isOnCooldown, setCooldown, getHotbarItem } = useLunaStore();

  const activateSkill = (index, duration = DEFAULT_EFFECT_DURATION_MS) => {
    setActiveSkills((prev) => {
      const next = [...prev];
      next[index] = true;

      window.setTimeout(() => {
        setActiveSkills((current) => {
          const updated = [...current];
          updated[index] = false;
          return updated;
        });
      }, Math.max(100, Number(duration) || DEFAULT_EFFECT_DURATION_MS));

      return next;
    });
  };

  /**
   * Resolve a logical skill slot to its equipped card and cast it.
   * The generic lunaCardAnimationEffectProc event is consumed by the player
   * character runtime; individual effects can add adapters without changing the
   * hotbar or key mapping.
   */
  const triggerSkill = (slotIndex, source = 'luna_skill_bar') => {
    const assigned = getHotbarItem(slotIndex);
    if (!assigned) return false;

    // In a live AI Battle, the cinematic turn controller is authoritative for
    // whether the local player may commit a card. This prevents keyboard input
    // or the clickable hand from attacking while the opponent is taking a turn.
    const battleTurn = typeof window !== 'undefined' ? window.__lunaAIBattleTurn : null;
    if (battleTurn?.matchId && battleTurn.canLocalAct === false) {
      window.dispatchEvent(new CustomEvent('lunaAIBattleSkillBlocked', {
        detail: { slotIndex, card: assigned, source, reason: 'not_local_turn', turn: battleTurn },
      }));
      return false;
    }

    // DashboardAvatarScene owns the live target selection while an AI Battle is
    // active. Keep that target attached to the card cast so VFX, impact events
    // and damage all resolve the same opponent.
    const target = typeof window !== 'undefined' ? (window.__lunaAIBattleTarget || null) : null;

    window.dispatchEvent(new CustomEvent('lunaSkillSlotActivated', {
      detail: {
        slotIndex,
        card: assigned,
        source,
        caster: { type: 'local_player' },
        target,
      },
    }));

    const effect = assigned.animation_effect || assigned.animationEffect || null;
    const effectId = String(effect?.id || '').trim();

    if (effectId) {
      if (isOnCooldown(effectId)) return false;

      const durationMs = Math.max(100, Number(effect?.duration_ms) || DEFAULT_EFFECT_DURATION_MS);
      const cooldownMs = Math.max(durationMs, Number(effect?.cooldown_ms) || DEFAULT_EFFECT_COOLDOWN_MS);
      const requiresRuntimeAcceptance = effect?.mode === 'embedded'
        && (effectId === 'getsuga_tensho' || effectId.startsWith('artemis_'));

      const detail = {
        slotIndex,
        card: assigned,
        effect,
        source,
        caster: { type: 'local_player' },
        target,
        accepted: requiresRuntimeAcceptance ? false : undefined,
        rejectionReason: '',
      };
      window.dispatchEvent(new CustomEvent('lunaCardAbilityTargeted', { detail }));
      // CustomEvent listeners are synchronous. The mounted avatar runtime marks
      // embedded casts accepted only when it actually found and started the clip.
      window.dispatchEvent(new CustomEvent('lunaCardAnimationEffectProc', { detail }));

      if (requiresRuntimeAcceptance && detail.accepted !== true) {
        window.dispatchEvent(new CustomEvent('lunaSkillCastRejected', {
          detail: {
            slotIndex,
            card: assigned,
            effect,
            source,
            reason: detail.rejectionReason || 'The active avatar does not contain this embedded skill animation.',
          },
        }));
        return false;
      }

      storeSkill(effectId);
      activateSkill(slotIndex, durationMs);
      setCooldown(effectId, Date.now() + cooldownMs);

      // The dashboard multiplayer layer carries the same committed card to the
      // opponent regardless of whether either player is using editor preview or
      // published/live. This does not create a second cast locally; it is only a
      // peer notification for the remote PvP presentation/combat bridge.
      if (battleTurn?.matchId && target?.playerId) {
        window.dispatchEvent(new CustomEvent('multiplayerLocalAction', {
          detail: {
            kind: 'ai_battle_card_cast',
            matchId: String(battleTurn.matchId),
            turnRevision: Number(battleTurn.revision || 0),
            slotIndex,
            effectId,
            effect: {
              id: effectId,
              clip_name: effect?.clip_name || effect?.clipName || '',
              duration_ms: durationMs,
            },
            targetPlayerId: String(target.playerId),
          },
        }));
      }

      // Compatibility bridge while older Getsuga listeners are phased out.
      if (effectId === 'getsuga_tensho') {
        window.dispatchEvent(new CustomEvent('lunaGetsugaTenshoProc', { detail }));
      }
      return true;
    }

    // Cards without a bound VFX can still use the existing gameplay action
    // mapping, but they do not invent or borrow an animation effect.
    const skillFromCardType = { ability: 'kick_ability' };
    const derived = skillFromCardType[String(assigned.type || assigned.card_type || '').toLowerCase()] || 'kick_ability';
    if (isOnCooldown(derived)) return false;

    storeSkill(derived);
    activateSkill(slotIndex);
    setCooldown(derived, Date.now() + DEFAULT_EFFECT_COOLDOWN_MS);
    return true;
  };

  /**
   * AI Battle / dashboard skill-card keys are a direct 1→1 ... 4→4 mapping.
   * No effect may remap its card to another number: slot identity is persistent.
   */
  useEffect(() => {
    const handleSkillKey = (event) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target instanceof HTMLElement && target.isContentEditable) return;

      // Use physical Digit1..Digit5 as the primary mapping so skills still cast
      // while WASD movement/gameplay handlers are active or on non-US layouts.
      // Fall back to event.key for accessibility/on-screen keyboard input.
      const codeMatch = /^Digit([1-4])$/.exec(String(event.code || ''));
      const key = codeMatch?.[1] || String(event.key || '');
      if (!['1', '2', '3', '4'].includes(key)) return;

      const slotIndex = Number(key) - 1;
      if (!getHotbarItem(slotIndex)) return;
      event.preventDefault();
      triggerSkill(slotIndex, 'keyboard');
    };

    const handleRequestedSlot = (event) => {
      const slotIndex = Number(event?.detail?.slotIndex);
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 3) return;
      triggerSkill(slotIndex, event?.detail?.source || 'dashboard_click');
    };

    // Capture phase is intentional: 3D movement/game controls may consume key
    // events later in the bubble phase. Skill slots must remain usable while the
    // avatar is walking and inside PvP.
    window.addEventListener('keydown', handleSkillKey, true);
    window.addEventListener('lunaRequestSkillSlotActivation', handleRequestedSlot);
    return () => {
      window.removeEventListener('keydown', handleSkillKey, true);
      window.removeEventListener('lunaRequestSkillSlotActivation', handleRequestedSlot);
    };
  }, []);

  return {
    activeSkills,
    activateSkill,
    triggerSkill,
  };
}
