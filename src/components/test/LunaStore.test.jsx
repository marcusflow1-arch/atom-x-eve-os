import { describe, it, expect, beforeEach } from 'vitest';
import useLunaStore from '../luna/useLunaStore';

describe('Luna Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useLunaStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useLunaStore.getState();

    expect(state.equipment.weapon).toBe(null);
    expect(state.actions.attack).toBe(false);
    expect(state.actions.skill).toBe(null);
    expect(state.cooldowns).toEqual({});
    expect(state.hotbar).toEqual({});
  });

  it('should set weapon correctly', () => {
    const { setWeapon } = useLunaStore.getState();
    
    setWeapon('sword_of_the_abyss');
    
    expect(useLunaStore.getState().equipment.weapon).toBe('sword_of_the_abyss');
  });

  it('should trigger attack action', () => {
    const { triggerAttack } = useLunaStore.getState();
    
    triggerAttack();
    
    const state = useLunaStore.getState();
    expect(state.actions.attack).toBe(true);
    expect(state.actions.skill).toBe(null);
  });

  it('should trigger skill action', () => {
    const { triggerSkill } = useLunaStore.getState();
    
    triggerSkill('kick_ability');
    
    const state = useLunaStore.getState();
    expect(state.actions.skill).toBe('kick_ability');
    expect(state.actions.attack).toBe(false);
  });

  it('should manage cooldowns correctly', () => {
    const { setCooldown, isOnCooldown } = useLunaStore.getState();
    
    const futureTimestamp = Date.now() + 5000;
    setCooldown('fireball', futureTimestamp);
    
    expect(isOnCooldown('fireball')).toBe(true);
    expect(isOnCooldown('other_skill')).toBe(false);
  });

  it('should assign cards to hotbar', () => {
    const { assignToHotbar, getHotbarItem } = useLunaStore.getState();
    
    const mockCard = { id: 1, title: 'Test Card', type: 'ability' };
    assignToHotbar(0, mockCard);
    
    expect(getHotbarItem(0)).toEqual(mockCard);
  });

  it('should clear hotbar slot', () => {
    const { assignToHotbar, clearHotbarSlot, getHotbarItem } = useLunaStore.getState();
    
    const mockCard = { id: 1, title: 'Test Card' };
    assignToHotbar(0, mockCard);
    clearHotbarSlot(0);
    
    expect(getHotbarItem(0)).toBeUndefined();
  });

  it('should reset entire state', () => {
    const store = useLunaStore.getState();
    
    // Modify state
    store.setWeapon('test_weapon');
    store.triggerAttack();
    store.assignToHotbar(0, { id: 1 });
    store.setCooldown('skill', Date.now() + 1000);
    
    // Reset
    store.reset();
    
    const state = useLunaStore.getState();
    expect(state.equipment.weapon).toBe(null);
    expect(state.actions.attack).toBe(false);
    expect(state.actions.skill).toBe(null);
    expect(state.cooldowns).toEqual({});
    expect(state.hotbar).toEqual({});
  });
});