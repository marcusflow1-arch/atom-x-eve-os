import { useState, useEffect } from 'react';
import useLunaStore from '../useLunaStore';

/**
 * Hook for managing skills and ability hotbar with Zustand store
 * @returns {Object} Skill state and handlers
 */
export function useSkills() {
  const [activeSkills, setActiveSkills] = useState([false, false, false, false, false]);
  const { triggerSkill: storeSkill, isOnCooldown, setCooldown, getHotbarItem } = useLunaStore();

  /**
   * Activate a skill slot
   * @param {number} index - Skill slot index (0-4)
   * @param {number} duration - Duration to keep skill active (ms)
   */
  const activateSkill = (index, duration = 800) => {
    setActiveSkills((prev) => {
      const next = [...prev];
      next[index] = true;
      
      setTimeout(() => {
        setActiveSkills((p) => {
          const n = [...p];
          n[index] = false;
          return n;
        });
      }, duration);
      
      return next;
    });
  };

  /**
   * Trigger skill from hotbar or mapping
   * @param {number} slotIndex - Slot index (0-4)
   */
  const triggerSkill = (slotIndex) => {
    const assigned = getHotbarItem(slotIndex);
    
    if (assigned) {
      const cardName = String(assigned.card_name || assigned.title || assigned.name || '').toLowerCase();
      const isGetsuga = cardName.includes('getsuga tensh') || (cardName.includes('ichigo') && cardName.includes('getsuga'));

      // Getsuga Tensho is card-driven, not slot-driven. If the card is equipped
      // in any skill slot, pressing that slot's number key plays the packaged
      // character animation + VFX.
      if (isGetsuga) {
        const skillId = 'getsuga_tensho';
        if (!isOnCooldown(skillId)) {
          storeSkill(skillId);
          activateSkill(slotIndex, 7000);
          setCooldown(skillId, Date.now() + 8000);
          window.dispatchEvent(new CustomEvent('lunaGetsugaTenshoProc', {
            detail: { slotIndex, card: assigned, source: 'luna_skill_bar' },
          }));
        }
        return;
      }

      const skillFromCardType = { ability: 'kick_ability' };
      const derived = skillFromCardType[String(assigned.type || assigned.card_type || '').toLowerCase()] || 'kick_ability';
      
      if (!isOnCooldown(derived)) {
        storeSkill(derived);
        activateSkill(slotIndex);
        setCooldown(derived, Date.now() + 3000);
      }
      return;
    }

    // Fallback to static mapping
    const skillMap = {
      0: 'kick_ability',
      1: null,
      2: null,
      3: null,
      4: null
    };
    
    const skillId = skillMap[slotIndex];
    if (skillId && !isOnCooldown(skillId)) {
      storeSkill(skillId);
      activateSkill(slotIndex);
      setCooldown(skillId, Date.now() + 3000);
    }
  };

  /**
   * Keyboard listener for skill activation (1-5 keys)
   */
  useEffect(() => {
    const handleSkillKey = (e) => {
      const key = e.key;
      if (['1', '2', '3', '4', '5'].includes(key)) {
        const index = parseInt(key) - 1;
        triggerSkill(index);
      }
    };

    window.addEventListener('keydown', handleSkillKey);
    return () => window.removeEventListener('keydown', handleSkillKey);
  }, []);

  return {
    activeSkills,
    activateSkill,
    triggerSkill
  };
}