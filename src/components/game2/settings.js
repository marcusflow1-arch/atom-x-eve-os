// Game 2 player settings: chosen in the main menu (Settings), stored in this browser, read by the engine when a match
// starts (Game: mouse sensitivity / invert, volumes, field of view, render quality, FPS readout).
export const SETTINGS_KEY = 'atomxe.game2.settings.v1';

export const DEFAULT_SETTINGS = Object.freeze({
  sensitivity: 1,      // x the engine's base mouse sensitivity (0.0022 rad / px)
  invertY: false,
  masterVolume: 0.7,   // sound effects master gain (the engine's default)
  musicVolume: 0.5,    // battle theme
  fov: 62,             // degrees, base camera field of view
  quality: 'balanced', // render resolution cap: performance 1x · balanced 1.5x · sharp 2x device pixels
  showFps: false,
  menuMotion: true,    // the live duel behind the main menu
});

export const QUALITY_DPR = Object.freeze({ performance: 1, balanced: 1.5, sharp: 2 });

const clamp = (v, a, b, d) => (Number.isFinite(Number(v)) ? Math.max(a, Math.min(b, Number(v))) : d);

// any stored / user value -> a complete, valid settings object
export function normalizeSettings(raw = {}) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const D = DEFAULT_SETTINGS;
  return {
    sensitivity: clamp(s.sensitivity, 0.25, 3, D.sensitivity),
    invertY: s.invertY === true,
    masterVolume: clamp(s.masterVolume, 0, 1, D.masterVolume),
    musicVolume: clamp(s.musicVolume, 0, 1, D.musicVolume),
    fov: clamp(s.fov, 50, 90, D.fov),
    quality: Object.hasOwn(QUALITY_DPR, s.quality) ? s.quality : D.quality,
    showFps: s.showFps === true,
    menuMotion: s.menuMotion !== false,
  };
}

export function loadSettings(storage = globalThis.localStorage) {
  try { return normalizeSettings(JSON.parse(storage?.getItem(SETTINGS_KEY) || '{}')); } catch { return normalizeSettings(); }
}

export function saveSettings(value, storage = globalThis.localStorage) {
  const s = normalizeSettings(value);
  try { storage?.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* private mode: the settings last for this visit */ }
  return s;
}
