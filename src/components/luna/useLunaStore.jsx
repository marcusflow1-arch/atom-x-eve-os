import { create } from 'zustand';

/**
 * Luna state store - replaces all window.LUNA_* globals
 * Manages equipment, actions, cooldowns, and animation bindings
 */
const useLunaStore = create((set, get) => ({
  // Equipment State
  equipment: {
    weapon: null
  },
  setWeapon: (weapon) => set((state) => ({
    equipment: { ...state.equipment, weapon }
  })),

  // Action State
  actions: {
    attack: false,
    skill: null
  },
  triggerAttack: () => set({ actions: { attack: true, skill: null } }),
  triggerSkill: (skillId) => set({ actions: { attack: false, skill: skillId } }),
  clearActions: () => set({ actions: { attack: false, skill: null } }),

  // Cooldowns
  cooldowns: {},
  setCooldown: (skillId, timestamp) => set((state) => ({
    cooldowns: { ...state.cooldowns, [skillId]: timestamp }
  })),
  isOnCooldown: (skillId) => {
    const cooldowns = get().cooldowns;
    return Date.now() < (cooldowns[skillId] || 0);
  },

  // Animation Bindings
  animationBindings: {
    idle: "idle",
    weapon_idle: {
      sword_of_the_abyss: "sort_afk"
    },
    weapon_attack: {
      sword_of_the_abyss: "sword_attack"
    },
    skills: {
      kick_ability: "kick"
    }
  },
  setAnimationBinding: (category, key, value) => set((state) => ({
    animationBindings: {
      ...state.animationBindings,
      [category]: {
        ...state.animationBindings[category],
        [key]: value
      }
    }
  })),

  // Hotbar (Skill Assignments) — one compact foreground row at a time.
  // The three persistent rows live in the Skill Book service; the dashboard
  // store only mirrors the currently active row for rendering/keyboard input.
  hotbar: {},
  activeSkillRow: 0,
  setActiveSkillRow: (row) => set({ activeSkillRow: Math.max(0, Math.min(2, Number(row) || 0)) }),
  assignToHotbar: (slotIndex, card) => set((state) => ({
    hotbar: { ...state.hotbar, [slotIndex]: card }
  })),
  clearHotbarSlot: (slotIndex) => set((state) => {
    const newHotbar = { ...state.hotbar };
    delete newHotbar[slotIndex];
    return { hotbar: newHotbar };
  }),
  getHotbarItem: (slotIndex) => get().hotbar[slotIndex],

  // General State (for bridge compatibility)
  equippedWeapon: null,
  setEquippedWeapon: (weapon) => set({ equippedWeapon: weapon }),

  // Reset entire state
  reset: () => set({
    equipment: { weapon: null },
    actions: { attack: false, skill: null },
    cooldowns: {},
    hotbar: {},
    equippedWeapon: null
  })
}));

export default useLunaStore;