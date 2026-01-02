import { useState } from 'react';

/**
 * Memory system for cycling background scenes
 * @param {Function} onBackgroundChange - Callback when background changes
 * @returns {Object} Memory state and handlers
 */
export function useMemorySystem(onBackgroundChange) {
  const MEMORIES = [
    { id: 1, url: null, name: 'Default Void' },
    { id: 2, url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600', name: 'Cyberpunk District' },
    { id: 3, url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600', name: 'Highlands Battle' },
    { id: 4, url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=1600', name: 'Deep Space' }
  ];

  const [activeMemoryIndex, setActiveMemoryIndex] = useState(0);

  /**
   * Cycle to next or previous memory
   * @param {'next' | 'prev'} direction - Direction to cycle
   */
  const cycleMemory = (direction) => {
    let nextIndex = direction === 'next' 
      ? activeMemoryIndex + 1 
      : activeMemoryIndex - 1;
      
    if (nextIndex >= MEMORIES.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = MEMORIES.length - 1;
    
    setActiveMemoryIndex(nextIndex);
    
    if (onBackgroundChange) {
      onBackgroundChange(MEMORIES[nextIndex].url);
    }
  };

  /**
   * Set memory by index
   * @param {number} index - Memory index
   */
  const setMemory = (index) => {
    if (index >= 0 && index < MEMORIES.length) {
      setActiveMemoryIndex(index);
      if (onBackgroundChange) {
        onBackgroundChange(MEMORIES[index].url);
      }
    }
  };

  return {
    memories: MEMORIES,
    activeMemoryIndex,
    activeMemory: MEMORIES[activeMemoryIndex],
    cycleMemory,
    setMemory
  };
}