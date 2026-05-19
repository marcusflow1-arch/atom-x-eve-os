// ─── Sandbox Scene Manager ────────────────────────────────────────────────
// Save / load / activate sandbox scenes. The "active" scene is the one
// loaded into the live game by TerrainArea at runtime.

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, FolderOpen, Plus, Star, Trash2 } from 'lucide-react';
import { useSandboxStore } from './sandboxStore';

export default function SandboxSceneManager() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');

  const activeSceneId = useSandboxStore((s) => s.activeSceneId);
  const activeSceneName = useSandboxStore((s) => s.activeSceneName);
  const isDirty = useSandboxStore((s) => s.isDirty);
  const placements = useSandboxStore((s) => s.placements);
  const groundColor = useSandboxStore((s) => s.groundColor);
  const groundSize = useSandboxStore((s) => s.groundSize);
  const loadScene = useSandboxStore((s) => s.loadScene);
  const resetScene = useSandboxStore((s) => s.resetScene);
  const markSaved = useSandboxStore((s) => s.markSaved);

  const { data: scenes = [], isLoading } = useQuery({
    queryKey: ['sandbox-scenes'],
    queryFn: () => base44.entities.SandboxScene.list('-updated_date', 50),
  });

  const saveAs = useMutation({
    mutationFn: async (name) => {
      return base44.entities.SandboxScene.create({
        name: name || `Scene ${new Date().toLocaleString()}`,
        placements,
        ground_color: groundColor,
        ground_size: groundSize,
        is_active: false,
      });
    },
    onSuccess: (scene) => {
      qc.invalidateQueries({ queryKey: ['sandbox-scenes'] });
      markSaved(scene.id, scene.name);
      setNewName('');
    },
  });

  const saveCurrent = useMutation({
    mutationFn: async () => {
      if (!activeSceneId) return saveAs.mutateAsync(activeSceneName);
      return base44.entities.SandboxScene.update(activeSceneId, {
        placements,
        ground_color: groundColor,
        ground_size: groundSize,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sandbox-scenes'] });
      if (activeSceneId) markSaved(activeSceneId, activeSceneName);
    },
  });

  const activateScene = useMutation({
    mutationFn: async (scene) => {
      // Deactivate all others, then activate this one
      const all = await base44.entities.SandboxScene.list('-updated_date', 100);
      await Promise.all(
        all
          .filter((s) => s.id !== scene.id && s.is_active)
          .map((s) => base44.entities.SandboxScene.update(s.id, { is_active: false }))
      );
      return base44.entities.SandboxScene.update(scene.id, { is_active: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sandbox-scenes'] }),
  });

  const deleteScene = useMutation({
    mutationFn: (id) => base44.entities.SandboxScene.delete(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['sandbox-scenes'] });
      if (activeSceneId === id) resetScene();
    },
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Scenes</h3>
        {isDirty && <span className="text-[10px] uppercase text-amber-400">Unsaved</span>}
      </div>

      {/* Current scene info */}
      <div className="text-xs text-slate-400">
        Editing: <span className="text-slate-200">{activeSceneName}</span>
      </div>

      {/* Quick save / save as */}
      <div className="flex gap-1">
        <button
          onClick={() => saveCurrent.mutate()}
          disabled={saveCurrent.isPending}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={resetScene}
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md"
          title="Start a new empty scene"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* Save as */}
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Save as new scene…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
        />
        <button
          onClick={() => saveAs.mutate(newName.trim() || `Scene ${scenes.length + 1}`)}
          disabled={saveAs.isPending}
          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md disabled:opacity-50"
        >
          Create
        </button>
      </div>

      {/* Saved scenes */}
      <div className="border-t border-slate-800 pt-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Saved</p>
        {isLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : scenes.length === 0 ? (
          <p className="text-xs text-slate-500">No saved scenes yet.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {scenes.map((s) => {
              const isOpen = activeSceneId === s.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${
                    isOpen ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span className="flex-1 truncate text-slate-200">
                    {s.name}
                    <span className="text-slate-500"> · {(s.placements || []).length}</span>
                  </span>
                  {s.is_active && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300">LIVE</span>
                  )}
                  <button
                    onClick={() => loadScene(s)}
                    title="Open in editor"
                    className="p-1 text-slate-300 hover:text-white"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => activateScene.mutate(s)}
                    title="Make this the active scene in-game"
                    className={`p-1 ${s.is_active ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteScene.mutate(s.id)}
                    title="Delete scene"
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}