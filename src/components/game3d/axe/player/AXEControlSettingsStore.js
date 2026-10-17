// Player control settings for Game 3D, saved per signed-in user (not per character: a control
// preference follows the player). Shown in the Esc Settings menu (PauseMenu.jsx).
//
//   clickToMove: false by default. WASD is always on; click-to-move is the option the player
//                switches on (AXEClickToMove.js).
//
// Key: axe_control_settings_v1::<userId> (characterStorage.userScopedKey). Reloads when the
// signed-in user changes.

import { subscribeCharacterChange, userScopedKey } from '../../characterStorage';

export const AXE_CONTROL_SETTINGS_KEY = 'axe_control_settings_v1';
export const AXE_CONTROL_SETTINGS_DEFAULTS = Object.freeze({ clickToMove: false });

const listeners = new Set();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(userScopedKey(AXE_CONTROL_SETTINGS_KEY)) || 'null');
    if (saved?.v === 1) return { clickToMove: saved.clickToMove === true };
  } catch {}
  return { ...AXE_CONTROL_SETTINGS_DEFAULTS };
}

let settings = load();

function emit() {
  const snapshot = getAXEControlSettings();
  listeners.forEach((fn) => { try { fn(snapshot); } catch {} });
}

subscribeCharacterChange(() => { settings = load(); emit(); });

export function getAXEControlSettings() { return { ...settings }; }

export function isAXEClickToMoveEnabled() { return settings.clickToMove === true; }

export function setAXEClickToMoveEnabled(enabled) {
  settings = { ...settings, clickToMove: enabled === true };
  try { localStorage.setItem(userScopedKey(AXE_CONTROL_SETTINGS_KEY), JSON.stringify({ v: 1, ...settings })); } catch {}
  emit();
  return settings.clickToMove;
}

export function subscribeAXEControlSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
