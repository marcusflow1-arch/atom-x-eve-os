import React, { createContext, useState, useContext } from 'react';

const DashboardModeContext = createContext();

export const useDashboardMode = () => {
  const context = useContext(DashboardModeContext);
  if (!context) {
    return {
      mode: 'ai',
      toggleMode: () => {},
      setMode: () => {}
    };
  }
  return context;
};

export const DashboardModeProvider = ({ children }) => {
  const [mode, setMode] = useState('ai');

  const toggleMode = () => {
    setMode(prev => prev === 'ai' ? 'user' : 'ai');
  };

  return (
    <DashboardModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </DashboardModeContext.Provider>
  );
};