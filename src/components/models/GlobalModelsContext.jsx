import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const GlobalModelsContext = createContext();

export const useGlobalModels = () => {
  const context = useContext(GlobalModelsContext);
  if (!context) {
    throw new Error('useGlobalModels must be used within GlobalModelsProvider');
  }
  return context;
};

export const GlobalModelsProvider = ({ children }) => {
  const [activeModelId, setActiveModelId] = useState(null);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['globalModels'],
    queryFn: () => base44.entities.Model3D.filter({ is_global: true }, '-created_date'),
    refetchInterval: 10000,
  });

  const activeModel = models.find(m => m.id === activeModelId);

  return (
    <GlobalModelsContext.Provider value={{ 
      models, 
      isLoading, 
      activeModel, 
      activeModelId,
      setActiveModelId 
    }}>
      {children}
    </GlobalModelsContext.Provider>
  );
};