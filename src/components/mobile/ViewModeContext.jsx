import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext(null);

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) return { viewMode: 'desktop', setViewMode: () => {}, isMobile: false, toggleViewMode: () => {} };
  return ctx;
}

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('atom_eve_view_mode') || 'desktop';
  });

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