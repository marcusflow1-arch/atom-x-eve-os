import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-hot-toast';

const LayoutEditContext = createContext();

export const useLayoutEdit = () => useContext(LayoutEditContext);

export const LayoutEditProvider = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  
  // State to track changes before saving
  const [activePageId, setActivePageId] = useState(null);
  const [pendingLayout, setPendingLayout] = useState(null);

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

  const saveCurrentLayout = async () => {
    if (!user || !activePageId || !pendingLayout) return;
    
    try {
      const records = await base44.entities.UserLayout.filter({ 
        user_id: user.id, 
        page_id: activePageId 
      });
      
      if (records.length > 0) {
        await base44.entities.UserLayout.update(records[0].id, {
          layout_order: pendingLayout
        });
      } else {
        await base44.entities.UserLayout.create({
          user_id: user.id,
          page_id: activePageId,
          layout_order: pendingLayout,
          hidden_items: []
        });
      }
      toast.success('Layout saved!');
      setIsEditing(false);
      // Optional: Refresh/invalidate queries if needed, but the local state usually updates
    } catch (error) {
      console.error("Failed to save layout", error);
      toast.error('Failed to save layout');
    }
  };

  const updatePendingLayout = (pageId, newOrder) => {
    setActivePageId(pageId);
    setPendingLayout(newOrder);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // If turning off without saving, maybe reset? 
      // For now, simple toggle. User should use Save/Cancel buttons.
      setIsEditing(false);
    } else {
      setIsEditing(true);
      toast('Edit Mode Enabled - Drag to reorder!', { icon: '✏️' });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setPendingLayout(null);
    toast('Edit cancelled', { icon: '↩️' });
  };

  return (
    <LayoutEditContext.Provider value={{ 
      isEditing, 
      toggleEditMode, 
      saveCurrentLayout, 
      loadLayout,
      updatePendingLayout,
      cancelEdit 
    }}>
      {children}
    </LayoutEditContext.Provider>
  );
};