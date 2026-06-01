import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'atom_eve_left_rail_visible';

// Keep the LibrarySidebar (which listens to `sidebarCollapseChange` / `sidebarCollapsed`)
// in sync with the rail visibility flag. When the rail is hidden, the sidebar is collapsed.
function syncLibrarySidebar(visible) {
  try { localStorage.setItem('sidebarCollapsed', String(!visible)); } catch {}
  window.dispatchEvent(new CustomEvent('sidebarCollapseChange', { detail: !visible }));
}

export function useSidebarVisible() {
  const [visible, setVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  // Ensure the LibrarySidebar reflects the initial state on mount
  useEffect(() => {
    syncLibrarySidebar(visible);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    setVisible(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      syncLibrarySidebar(next);
      return next;
    });
  }, []);

  return [visible, toggle];
}