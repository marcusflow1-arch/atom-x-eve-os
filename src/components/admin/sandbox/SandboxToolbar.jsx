// ─── Sandbox Toolbar ──────────────────────────────────────────────────────
// Tool mode (move/rotate/scale), snap toggles, and quick actions on the
// currently selected placement.

import React from 'react';
import { Move, RotateCw, Maximize2, Copy, Trash2, Lock, Unlock } from 'lucide-react';
import { useSandboxStore } from './sandboxStore';

const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

export default function SandboxToolbar() {
  const tool = useSandboxStore((s) => s.tool);
  const setTool = useSandboxStore((s) => s.setTool);
  const gridSnap = useSandboxStore((s) => s.gridSnap);
  const setGridSnap = useSandboxStore((s) => s.setGridSnap);
  const gridSize = useSandboxStore((s) => s.gridSize);
  const setGridSize = useSandboxStore((s) => s.setGridSize);
  const rotSnap = useSandboxStore((s) => s.rotSnap);
  const setRotSnap = useSandboxStore((s) => s.setRotSnap);
  const rotSnapDeg = useSandboxStore((s) => s.rotSnapDeg);
  const setRotSnapDeg = useSandboxStore((s) => s.setRotSnapDeg);
  const groundSnap = useSandboxStore((s) => s.groundSnap);
  const setGroundSnap = useSandboxStore((s) => s.setGroundSnap);

  const selectedId = useSandboxStore((s) => s.selectedId);
  const placements = useSandboxStore((s) => s.placements);
  const selected = placements.find((p) => p.id === selectedId);
  const duplicate = useSandboxStore((s) => s.duplicatePlacement);
  const del = useSandboxStore((s) => s.deletePlacement);
  const toggleLock = useSandboxStore((s) => s.toggleLock);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-wrap items-center gap-2">
      {/* Tools */}
      <div className="flex items-center gap-1">
        <ToolButton active={tool === 'move'} onClick={() => setTool('move')} icon={Move} label="Move" />
        <ToolButton active={tool === 'rotate'} onClick={() => setTool('rotate')} icon={RotateCw} label="Rotate" />
        <ToolButton active={tool === 'scale'} onClick={() => setTool('scale')} icon={Maximize2} label="Scale" />
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Snaps */}
      <label className="flex items-center gap-1.5 text-xs text-slate-300">
        <input type="checkbox" checked={gridSnap} onChange={(e) => setGridSnap(e.target.checked)} />
        Grid
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={gridSize}
          onChange={(e) => setGridSize(e.target.value)}
          disabled={!gridSnap}
          className="w-14 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs disabled:opacity-50"
        />
      </label>

      <label className="flex items-center gap-1.5 text-xs text-slate-300">
        <input type="checkbox" checked={rotSnap} onChange={(e) => setRotSnap(e.target.checked)} />
        Rot°
        <input
          type="number"
          step="1"
          min="1"
          value={rotSnapDeg}
          onChange={(e) => setRotSnapDeg(e.target.value)}
          disabled={!rotSnap}
          className="w-14 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs disabled:opacity-50"
        />
      </label>

      <label className="flex items-center gap-1.5 text-xs text-slate-300">
        <input type="checkbox" checked={groundSnap} onChange={(e) => setGroundSnap(e.target.checked)} />
        Ground Snap
      </label>

      <div className="w-px h-6 bg-slate-700" />

      {/* Selection actions */}
      <div className="flex items-center gap-1">
        <ToolButton
          active={false}
          onClick={() => selected && duplicate(selected.id)}
          icon={Copy}
          label="Duplicate"
        />
        <ToolButton
          active={false}
          onClick={() => selected && toggleLock(selected.id)}
          icon={selected?.locked ? Lock : Unlock}
          label={selected?.locked ? 'Unlock' : 'Lock'}
        />
        <button
          onClick={() => selected && del(selected.id)}
          disabled={!selected}
          title="Delete"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}