import { useCallback, useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'atom_eve_left_rail_visible';
const COLLAPSED_KEY = 'sidebarCollapsed';
let fallbackVisible = true;

function readVisible() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    const collapsed = localStorage.getItem(COLLAPSED_KEY);
    return collapsed === null ? fallbackVisible : collapsed !== 'true';
  } catch { return fallbackVisible; }
}

function persist(visible) {
  fallbackVisible = visible;
  try {
    localStorage.setItem(STORAGE_KEY, String(visible));
    localStorage.setItem(COLLAPSED_KEY, String(!visible));
  } catch {}
}

function publish(visible) {
  persist(visible);
  window.dispatchEvent(new CustomEvent('sidebarCollapseChange', { detail: !visible }));
}

function subscribe(onChange) {
  const onCollapse = event => {
    if (typeof event.detail !== 'boolean') return;
    persist(!event.detail);
    onChange();
  };
  const onStorage = event => {
    if (event.key === STORAGE_KEY) publish(event.newValue !== 'false');
    else if (event.key === COLLAPSED_KEY) publish(event.newValue !== 'true');
    else if (event.key === null) publish(true);
  };
  window.addEventListener('sidebarCollapseChange', onCollapse);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('sidebarCollapseChange', onCollapse);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSidebarVisible() {
  const visible = useSyncExternalStore(subscribe, readVisible, () => true);
  useEffect(() => { publish(readVisible()); }, []);
  const toggle = useCallback(() => publish(!readVisible()), []);
  return [visible, toggle];
}
