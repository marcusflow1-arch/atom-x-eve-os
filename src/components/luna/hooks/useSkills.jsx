import { useState, useEffect } from 'react';

/**
 * Hook for managing skills and ability hotbar
 * @returns {Object} Skill state and handlers
 */
export function useSkills() {
  const [activeSkills, setActiveSkills] = useState([false, false, false, false, false]);

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
    const assigned = window.LUNA_HOTBAR?.[slotIndex];
    
    if (assigned && window.LUNA_ACTION_STATE) {
      const skillFromCardType = { ability: 'kick_ability' };
      const derived = skillFromCardType[assigned.type] || 'kick_ability';
      window.LUNA_ACTION_STATE.skill = derived;
      activateSkill(slotIndex);
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
    if (skillId && window.LUNA_ACTION_STATE) {
      window.LUNA_ACTION_STATE.skill = skillId;
      activateSkill(slotIndex);
    }
  };

  /**
   * Initialize global state objects
   */
  useEffect(() => {
    if (!window.LUNA_ACTION_STATE) {
      window.LUNA_ACTION_STATE = { attack: false, skill: null };
    }
    if (!window.LUNA_COOLDOWNS) {
      window.LUNA_COOLDOWNS = {};
    }
    if (!window.LUNA_HOTBAR) {
      window.LUNA_HOTBAR = {};
    }
  }, []);

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