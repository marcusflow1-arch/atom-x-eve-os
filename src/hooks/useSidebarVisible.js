import { useState, useCallback } from 'react';

const STORAGE_KEY = 'atom_eve_left_rail_visible';

export function useSidebarVisible() {
  const [visible, setVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setVisible(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return [visible, toggle];
}