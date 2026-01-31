import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-hot-toast';

const LayoutEditContext = createContext();

export const useLayoutEdit = () => useContext(LayoutEditContext);

export const LayoutEditProvider = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentLayouts, setCurrentLayouts] = useState({});
  const { user } = useAuth();

  // Load layout for a specific page
  const loadLayout = async (pageId, defaultOrder) => {
    if (!user) return defaultOrder;
    try {
      const records = await base44.entities.UserLayout.filter({ 
        user_id: user.id, 
        page_id: pageId 
      });
      if (records.length > 0) {
        return records[0].layout_order;
      }
    } catch (error) {
      console.error("Failed to load layout", error);
    }
    return defaultOrder;
  };

  const saveLayout = async (pageId, newOrder) => {
    if (!user) return;
    try {
      const records = await base44.entities.UserLayout.filter({ 
        user_id: user.id, 
        page_id: pageId 
      });
      
      if (records.length > 0) {
        await base44.entities.UserLayout.update(records[0].id, {
          layout_order: newOrder
        });
      } else {
        await base44.entities.UserLayout.create({
          user_id: user.id,
          page_id: pageId,
          layout_order: newOrder,
          hidden_items: []
        });
      }
      toast.success('Layout saved!');
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save layout", error);
      toast.error('Failed to save layout');
    }
  };

  const toggleEditMode = () => setIsEditing(prev => !prev);
  const cancelEdit = () => {
    setIsEditing(false);
    toast('Edit cancelled', { icon: '↩️' });
  };

  return (
    <LayoutEditContext.Provider value={{ 
      isEditing, 
      toggleEditMode, 
      saveLayout, 
      loadLayout,
      cancelEdit 
    }}>
      {children}
    </LayoutEditContext.Provider>
  );
};