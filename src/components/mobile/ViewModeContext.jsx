import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext(null);

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) return { viewMode: 'desktop', setViewMode: () => {}, isMobile: false, toggleViewMode: () => {} };
  return ctx;
}

function detectDevice() {
  if (typeof window === 'undefined') return 'desktop';
  // Check touch capability + screen width (phones are typically ≤ 768px CSS pixels)
  const isNarrow = window.innerWidth <= 768;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  // Mobile if narrow screen, or narrow + touch. Wide touch screens (tablets/laptops) stay desktop.
  if (isNarrow && hasTouch) return 'mobile';
  if (isNarrow) return 'mobile';
  return 'desktop';
}

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    // If user manually set a preference, respect it
    const saved = localStorage.getItem('atom_eve_view_mode');
    if (saved) return saved;
    // Otherwise auto-detect
    return detectDevice();
  });

  // On first mount, if no saved preference, auto-detect and save
  useEffect(() => {
    if (!localStorage.getItem('atom_eve_view_mode')) {
      const detected = detectDevice();
      setViewMode(detected);
      localStorage.setItem('atom_eve_view_mode', detected);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('atom_eve_view_mode', viewMode);
  }, [viewMode]);

  const toggleViewMode = () => setViewMode(v => v === 'desktop' ? 'mobile' : 'desktop');
  const isMobile = viewMode === 'mobile';

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, isMobile, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}