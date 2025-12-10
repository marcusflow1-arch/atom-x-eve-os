import React, { createContext, useState, useContext } from 'react';

const DashboardModeContext = createContext();

export const useDashboardMode = () => {
  const context = useContext(DashboardModeContext);
  if (!context) {
    return {
      mode: 'ai',
      toggleMode: () => {},
      setMode: () => {},
      activeSection: 'social',
      setActiveSection: () => {}
    };
  }
  return context;
};

export const DashboardModeProvider = ({ children }) => {
  const [mode, setMode] = useState('ai');
  const [activeSection, setActiveSection] = useState('social');

  const toggleMode = () => {
    setMode(prev => prev === 'ai' ? 'user' : 'ai');
  };

  return (
    <DashboardModeContext.Provider value={{ mode, setMode, toggleMode, activeSection, setActiveSection }}>
      {children}
    </DashboardModeContext.Provider>
  );
};