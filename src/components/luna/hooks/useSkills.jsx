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
  const triggerSkill = (slotIndex, source = 'luna_skill_bar') => {
    const assigned = getHotbarItem(slotIndex);
    
    if (assigned) {
      // One event connects the existing dashboard hotbar to AI Battle. The battle
      // layer still validates turn/AP/cooldown and the locked server snapshot.
      window.dispatchEvent(new CustomEvent('lunaSkillSlotActivated', {
        detail: { slotIndex, card: assigned, source },
      }));

      const cardName = String(assigned.card_name || assigned.title || assigned.name || '').toLowerCase();
      const isGetsuga = cardName.includes('getsuga tensh') || (cardName.includes('ichigo') && cardName.includes('getsuga'));

      // Getsuga Tensho stays visually bound to logical Skill Slot 1. During the
      // current test, keyboard 4 can trigger Slot 1; the slot identity never changes.
      if (slotIndex === 0 && isGetsuga) {
        const skillId = 'getsuga_tensho';
        if (!isOnCooldown(skillId)) {
          storeSkill(skillId);
          activateSkill(slotIndex, 7000);
          setCooldown(skillId, Date.now() + 8000);
          window.dispatchEvent(new CustomEvent('lunaGetsugaTenshoProc', {
            detail: { slotIndex, card: assigned, source },
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
   * Keyboard listener for the four dashboard skill slots.
   * Temporary Getsuga test rule: when Getsuga occupies Slot 1, key 4 fires that
   * logical slot and key 1 is suppressed. Otherwise normal 1→1 ... 4→4 applies.
   */
  useEffect(() => {
    const handleSkillKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const key = e.key;
      if (!['1','2','3','4'].includes(key)) return;

      const slotOne = getHotbarItem(0);
      const slotOneName = String(slotOne?.card_name || slotOne?.title || slotOne?.name || '').toLowerCase();
      const getsugaInSlotOne = slotOneName.includes('getsuga tensh') || (slotOneName.includes('ichigo') && slotOneName.includes('getsuga'));
      if (getsugaInSlotOne) {
        if (key === '1') return;
        if (key === '4') {
          triggerSkill(0, 'keyboard_4_test');
          return;
        }
      }

      triggerSkill(Number(key) - 1, 'keyboard');
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