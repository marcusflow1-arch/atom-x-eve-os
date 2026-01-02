import { useState, useEffect } from 'react';

/**
 * Hook for managing store navigation state (keyboard + wheel)
 * @param {Array} genreData - Array of genre objects with items
 * @param {boolean} loading - Loading state
 * @param {string} viewMode - Current view mode ('cross' or 'classic')
 * @param {Function} onNavigate - Navigation callback
 * @returns {Object} Navigation state and active items
 */
export function useStoreNavigation(genreData, loading, viewMode, onNavigate) {
  const [activeGenreIndex, setActiveGenreIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const currentGenre = genreData[activeGenreIndex];
  const activeGame = currentGenre?.items[activeGameIndex];

  // Keyboard + Wheel Navigation
  useEffect(() => {
    if (loading || genreData.length === 0 || isNavigating || viewMode !== 'cross') return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        if (activeGenreIndex > 0) {
          setActiveGenreIndex(prev => prev - 1);
          setActiveGameIndex(0);
        }
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        if (activeGenreIndex < genreData.length - 1) {
          setActiveGenreIndex(prev => prev + 1);
          setActiveGameIndex(0);
        }
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        if (activeGameIndex > 0) {
          setActiveGameIndex(prev => prev - 1);
        }
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        if (activeGameIndex < genreData[activeGenreIndex].items.length - 1) {
          setActiveGameIndex(prev => prev + 1);
        }
      } else if (key === 'enter' && activeGame) {
        e.preventDefault();
        if (onNavigate) onNavigate(activeGame.id);
      }
    };

    let lastWheelTime = 0;
    const WHEEL_COOLDOWN = 150;

    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastWheelTime < WHEEL_COOLDOWN) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        // Horizontal navigation
        if (e.deltaX > 0 || (e.shiftKey && e.deltaY > 0)) {
          if (activeGameIndex < genreData[activeGenreIndex].items.length - 1) {
            setActiveGameIndex(prev => prev + 1);
            lastWheelTime = now;
          }
        } else if (e.deltaX < 0 || (e.shiftKey && e.deltaY < 0)) {
          if (activeGameIndex > 0) {
            setActiveGameIndex(prev => prev - 1);
            lastWheelTime = now;
          }
        }
      } else {
        // Vertical navigation
        if (e.deltaY > 0) {
          if (activeGenreIndex < genreData.length - 1) {
            setActiveGenreIndex(prev => prev + 1);
            setActiveGameIndex(0);
            lastWheelTime = now;
          }
        } else if (e.deltaY < 0) {
          if (activeGenreIndex > 0) {
            setActiveGenreIndex(prev => prev - 1);
            setActiveGameIndex(0);
            lastWheelTime = now;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [activeGenreIndex, activeGameIndex, genreData, loading, isNavigating, viewMode]);

  return {
    activeGenreIndex,
    activeGameIndex,
    currentGenre,
    activeGame,
    setActiveGenreIndex,
    setActiveGameIndex,
    setIsNavigating
  };
}