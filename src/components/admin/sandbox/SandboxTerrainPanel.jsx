// ─── Sandbox Terrain Panel ────────────────────────────────────────────────
// Edits the scene-level terrain settings (ground color + size) that are
// applied to the live game world by TerrainArea when the scene is active.

import React from 'react';
import { Mountain } from 'lucide-react';
import { useSandboxStore } from './sandboxStore';

export default function SandboxTerrainPanel() {
  const groundColor = useSandboxStore((s) => s.groundColor);
  const groundSize = useSandboxStore((s) => s.groundSize);
  const setGroundColor = useSandboxStore((s) => s.setGroundColor);
  const setGroundSize = useSandboxStore((s) => s.setGroundSize);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Mountain className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">Terrain</h3>
      </div>

      <label className="flex items-center justify-between gap-2 text-xs text-slate-300">
        Ground color
        <input
          type="color"
          value={groundColor || '#4a6a3e'}
          onChange={(e) => setGroundColor(e.target.value)}
          className="w-12 h-7 bg-transparent border border-slate-700 rounded cursor-pointer"
        />
      </label>

      <label className="flex items-center justify-between gap-2 text-xs text-slate-300">
        Ground size
        <input
          type="number"
          step="10"
          min="20"
          max="1000"
          value={groundSize || 200}
          onChange={(e) => setGroundSize(e.target.value)}
          className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs"
        />
      </label>

      <p className="text-[10px] text-slate-500 leading-relaxed">
        Saved with the scene. When this scene is set LIVE, these settings are pushed to game mode automatically.
      </p>
    </div>
  );
}