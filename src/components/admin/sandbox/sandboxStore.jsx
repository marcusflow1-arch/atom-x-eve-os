// ─── Sandbox Editor Store ─────────────────────────────────────────────────
// Holds the in-editor working state: placements, selection, current tool,
// snap settings. Persistence (save/load) is handled by SandboxScene entity
// records — the store just tracks the current dirty buffer.

import { create } from 'zustand';

const TOOL_MOVE = 'move';

function newId() {
  return `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSandboxStore = create((set, get) => ({
  // Active scene id from SandboxScene entity (null = unsaved)
  activeSceneId: null,
  activeSceneName: 'Untitled Scene',
  isDirty: false,

  placements: [], // [{ id, assetKey, x, y, z, rotX, rotY, rotZ, scaleX, scaleY, scaleZ, locked, collides, colliderRadius }]
  selectedId: null,

  tool: TOOL_MOVE,     // 'move' | 'rotate' | 'scale'
  gridSnap: false,
  gridSize: 1,
  rotSnap: false,
  rotSnapDeg: 15,
  groundSnap: true,

  // ─── Terrain (per-scene) ────────────────────────────────────────────
  groundColor: '#4a6a3e',
  groundSize: 200,

  // ─── Scene actions ──────────────────────────────────────────────────
  loadScene(scene) {
    set({
      activeSceneId: scene?.id || null,
      activeSceneName: scene?.name || 'Untitled Scene',
      placements: Array.isArray(scene?.placements) ? scene.placements.map((p) => ({ ...p })) : [],
      groundColor: scene?.ground_color || '#4a6a3e',
      groundSize: scene?.ground_size || 200,
      selectedId: null,
      isDirty: false,
    });
  },
  resetScene() {
    set({
      activeSceneId: null,
      activeSceneName: 'Untitled Scene',
      placements: [],
      groundColor: '#4a6a3e',
      groundSize: 200,
      selectedId: null,
      isDirty: false,
    });
  },
  setGroundColor(v) { set({ groundColor: v || '#4a6a3e', isDirty: true }); },
  setGroundSize(v) {
    const n = Number(v);
    set({ groundSize: Number.isFinite(n) && n > 0 ? n : 200, isDirty: true });
  },
  markSaved(sceneId, sceneName) {
    set({ activeSceneId: sceneId, activeSceneName: sceneName, isDirty: false });
  },

  // ─── Placement actions ──────────────────────────────────────────────
  addPlacement(assetKey, opts = {}) {
    const meta = opts.meta || {};
    const p = {
      id: newId(),
      assetKey,
      x: opts.x ?? 0,
      y: opts.y ?? 0,
      z: opts.z ?? 0,
      rotX: 0,
      rotY: opts.rotY ?? 0,
      rotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      locked: false,
      collides: meta.collides ?? true,
      colliderRadius: meta.defaultColliderRadius ?? 0.5,
    };
    set((s) => ({ placements: [...s.placements, p], selectedId: p.id, isDirty: true }));
    return p.id;
  },
  updatePlacement(id, patch) {
    set((s) => ({
      placements: s.placements.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      isDirty: true,
    }));
  },
  deletePlacement(id) {
    set((s) => ({
      placements: s.placements.filter((p) => p.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      isDirty: true,
    }));
  },
  duplicatePlacement(id) {
    const src = get().placements.find((p) => p.id === id);
    if (!src) return null;
    const copy = { ...src, id: newId(), x: src.x + 1, z: src.z + 1, locked: false };
    set((s) => ({ placements: [...s.placements, copy], selectedId: copy.id, isDirty: true }));
    return copy.id;
  },
  toggleLock(id) {
    set((s) => ({
      placements: s.placements.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p)),
      isDirty: true,
    }));
  },
  select(id) {
    set({ selectedId: id });
  },
  clearSelection() {
    set({ selectedId: null });
  },

  // ─── Tool + snap actions ────────────────────────────────────────────
  setTool(tool) { set({ tool }); },
  setGridSnap(v) { set({ gridSnap: !!v }); },
  setGridSize(v) { set({ gridSize: Math.max(0.1, Number(v) || 1) }); },
  setRotSnap(v) { set({ rotSnap: !!v }); },
  setRotSnapDeg(v) { set({ rotSnapDeg: Math.max(1, Number(v) || 15) }); },
  setGroundSnap(v) { set({ groundSnap: !!v }); },
}));

// Convenience selector — current selected placement object
export function useSelectedPlacement() {
  return useSandboxStore((s) => s.placements.find((p) => p.id === s.selectedId) || null);
}