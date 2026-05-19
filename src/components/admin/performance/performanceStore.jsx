// ─── Performance Store ────────────────────────────────────────────────────
// Central source of truth for graphics quality, debug flags, and live FPS.
//
// Settings are persisted to localStorage and mirrored to `window.__perfSettings`
// so non-React systems (TerrainArea, the renderer, etc.) can read the
// current values synchronously without importing zustand.
//
// Presets:
//   low / medium / high / ultra / adaptive
//
// Adaptive mode watches live FPS and steps the effective preset down when
// FPS drops below a target threshold (and back up when it recovers).

import { create } from 'zustand';

const STORAGE_KEY = 'base24_perf_v1';

// Concrete preset values used by the engine.
export const PRESETS = {
  low: {
    renderDistance: 90,
    foliageDensity: 0.35,
    treeDensity: 0.55,
    shadowQuality: 'off',     // off | low | medium | high
    textureScale: 0.5,
    particleScale: 0.4,
    lodBias: 0.6,             // <1 = LOD kicks in sooner
    chunkSize: 32,
  },
  medium: {
    renderDistance: 130,
    foliageDensity: 0.65,
    treeDensity: 0.8,
    shadowQuality: 'low',
    textureScale: 0.75,
    particleScale: 0.7,
    lodBias: 0.85,
    chunkSize: 48,
  },
  high: {
    renderDistance: 180,
    foliageDensity: 1.0,
    treeDensity: 1.0,
    shadowQuality: 'medium',
    textureScale: 1.0,
    particleScale: 1.0,
    lodBias: 1.0,
    chunkSize: 64,
  },
  ultra: {
    renderDistance: 240,
    foliageDensity: 1.4,
    treeDensity: 1.2,
    shadowQuality: 'high',
    textureScale: 1.0,
    particleScale: 1.4,
    lodBias: 1.2,
    chunkSize: 80,
  },
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preset: state.preset,
      highPerfMode: state.highPerfMode,
      debug: state.debug,
    }));
  } catch {}
}

// Build the effective settings object (preset values + flags) and publish
// it to window so non-React systems can read it.
function publish(state) {
  const baseKey = state.preset === 'adaptive' ? state.adaptivePreset : state.preset;
  const base = PRESETS[baseKey] || PRESETS.medium;
  const effective = {
    ...base,
    preset: state.preset,
    effectivePreset: baseKey,
    highPerfMode: state.highPerfMode,
    debug: { ...state.debug },
  };
  if (typeof window !== 'undefined') {
    window.__perfSettings = effective;
    window.dispatchEvent(new CustomEvent('perfSettingsChanged', { detail: effective }));
  }
  return effective;
}

const persisted = loadPersisted() || {};

export const usePerformanceStore = create((set, get) => ({
  preset: persisted.preset || 'adaptive',
  adaptivePreset: 'high',       // current step inside adaptive mode
  highPerfMode: persisted.highPerfMode ?? true,
  debug: persisted.debug || {
    showFPS: false,
    showColliders: false,
    showChunks: false,
    showVRAM: false,
  },

  // Live telemetry
  fps: 0,
  frameTimeMs: 0,
  vramEstimateMB: 0,

  setPreset: (preset) => {
    set({ preset });
    publish(get());
    persist(get());
  },

  setHighPerfMode: (v) => {
    set({ highPerfMode: !!v });
    publish(get());
    persist(get());
  },

  setDebug: (key, value) => {
    set((s) => ({ debug: { ...s.debug, [key]: !!value } }));
    publish(get());
    persist(get());
  },

  reportFrame: (fps, frameTimeMs) => {
    set({ fps, frameTimeMs });
    // Adaptive scaling: nudge the effective preset based on sustained FPS.
    const s = get();
    if (s.preset !== 'adaptive') return;
    const order = ['low', 'medium', 'high', 'ultra'];
    const idx = order.indexOf(s.adaptivePreset);
    if (idx < 0) return;
    if (fps < 40 && idx > 0) {
      set({ adaptivePreset: order[idx - 1] });
      publish(get());
    } else if (fps > 58 && idx < order.length - 1) {
      set({ adaptivePreset: order[idx + 1] });
      publish(get());
    }
  },

  setVRAMEstimate: (mb) => set({ vramEstimateMB: mb }),
}));

// Publish initial settings once on module load so consumers see something
// even before the panel is opened.
publish(usePerformanceStore.getState());