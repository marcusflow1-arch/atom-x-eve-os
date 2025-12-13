import { create } from 'zustand';

const useAvatarStore = create((set) => ({
  equipped: {
    head: 'none',
    body: 'base',
    accessory: 'none',
    hand: 'none'
  },
  
  equipItem: (category, itemId) => set((state) => ({
    equipped: {
      ...state.equipped,
      [category]: itemId
    }
  })),
  
  unequipItem: (category) => set((state) => ({
    equipped: {
      ...state.equipped,
      [category]: 'none'
    }
  })),
  
  resetAll: () => set({
    equipped: {
      head: 'none',
      body: 'base',
      accessory: 'none',
      hand: 'none'
    }
  })
}));

export default useAvatarStore;