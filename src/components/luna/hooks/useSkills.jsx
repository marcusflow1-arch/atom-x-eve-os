import { useState, useEffect } from 'react';
import useLunaStore from '../useLunaStore';

const DEFAULT_EFFECT_COOLDOWN_MS = 3000;
const DEFAULT_EFFECT_DURATION_MS = 800;

/**
 * Hook for managing the five Luna / AI Battle skill-card slots.
 *
 * Cards are the source of truth. A slot only triggers an animation/VFX package
 * when the equipped card carries animation_effect metadata. The keyboard never
 * owns an effect directly: Digit1..Digit5 resolve the card in that logical slot,
 * then the card resolves the effect.
 */
export function useSkills() {
  const [activeSkills, setActiveSkills] = useState([false, false, false, false, false]);
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

    window.dispatchEvent(new CustomEvent('lunaSkillSlotActivated', {
      detail: { slotIndex, card: assigned, source },
    }));

    const effect = assigned.animation_effect || assigned.animationEffect || null;
    const effectId = String(effect?.id || '').trim();

    if (effectId) {
      if (isOnCooldown(effectId)) return false;

      const durationMs = Math.max(100, Number(effect?.duration_ms) || DEFAULT_EFFECT_DURATION_MS);
      const cooldownMs = Math.max(durationMs, Number(effect?.cooldown_ms) || DEFAULT_EFFECT_COOLDOWN_MS);

      storeSkill(effectId);
      activateSkill(slotIndex, durationMs);
      setCooldown(effectId, Date.now() + cooldownMs);

      const detail = { slotIndex, card: assigned, effect, source };
      window.dispatchEvent(new CustomEvent('lunaCardAnimationEffectProc', { detail }));

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
   * AI Battle / dashboard skill-card keys are a direct 1→1 ... 5→5 mapping.
   * No effect may remap its card to another number: slot identity is persistent.
   */
  useEffect(() => {
    const handleSkillKey = (event) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target instanceof HTMLElement && target.isContentEditable) return;

      const key = String(event.key || '');
      if (!['1', '2', '3', '4', '5'].includes(key)) return;

      const slotIndex = Number(key) - 1;
      if (!getHotbarItem(slotIndex)) return;
      event.preventDefault();
      triggerSkill(slotIndex, 'keyboard');
    };

    const handleRequestedSlot = (event) => {
      const slotIndex = Number(event?.detail?.slotIndex);
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 4) return;
      triggerSkill(slotIndex, event?.detail?.source || 'dashboard_click');
    };

    window.addEventListener('keydown', handleSkillKey);
    window.addEventListener('lunaRequestSkillSlotActivation', handleRequestedSlot);
    return () => {
      window.removeEventListener('keydown', handleSkillKey);
      window.removeEventListener('lunaRequestSkillSlotActivation', handleRequestedSlot);
    };
  }, []);

  return {
    activeSkills,
    activateSkill,
    triggerSkill,
  };
}
