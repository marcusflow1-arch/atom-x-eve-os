// ─── MapBuilder Page ──────────────────────────────────────────────────
// A blank-canvas sandbox where you can walk around (WASD), drag your
// uploaded 3D models / FBX models from the side library onto the world,
// and translate/rotate/scale each placement with the gizmo.
//
// This is intentionally a standalone editor — it does NOT touch the live
// game scene, characters, or any combat systems.

import React, { useState } from 'react';
import MapBuilderLibrary from '@/components/sandbox/MapBuilderLibrary';
import MapBuilderViewport from '@/components/sandbox/MapBuilderViewport';
import { Move, RotateCw, Maximize2, Trash2, MousePointer2, Keyboard } from 'lucide-react';

export default function MapBuilder() {
  const [selection, setSelection] = useState(null);
  const [mode, setMode] = useState('translate');

  const setGizmoMode = (m) => {
    setMode(m);
    window.__mapBuilder?.setMode(m);
  };

  const deleteSelected = () => {
    window.__mapBuilder?.remove();
  };

  return (
    <div className="fixed inset-0 top-16 bg-slate-950 flex">
      {/* Left: asset library */}
      <div className="w-72 flex-shrink-0">
        <MapBuilderLibrary />
      </div>

      {/* Right: viewport + floating controls */}
      <div className="flex-1 relative">
        <MapBuilderViewport onSelectionChange={setSelection} />

        {/* Top toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 shadow-2xl">
          <button
            onClick={() => setGizmoMode('translate')}
            disabled={!selection}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'translate' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Move (T)"
          >
            <Move className="w-4 h-4" /> Move
          </button>
          <button
            onClick={() => setGizmoMode('rotate')}
            disabled={!selection}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'rotate' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Rotate (R)"
          >
            <RotateCw className="w-4 h-4" /> Rotate
          </button>
          <button
            onClick={() => setGizmoMode('scale')}
            disabled={!selection}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'scale' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Scale (G)"
          >
            <Maximize2 className="w-4 h-4" /> Scale
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button
            onClick={deleteSelected}
            disabled={!selection}
            className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        {/* Bottom-left controls hint */}
        <div className="absolute bottom-4 left-4 px-4 py-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-xs text-slate-300 max-w-sm">
          <div className="flex items-center gap-2 text-cyan-300 font-bold mb-2">
            <Keyboard className="w-4 h-4" />
            Controls
          </div>
          <div className="space-y-1 leading-relaxed">
            <div><span className="text-white font-mono">WASD</span> — walk · <span className="text-white font-mono">Shift</span> — run</div>
            <div><span className="text-white font-mono">Right-click + drag</span> — look around</div>
            <div><span className="text-white font-mono">Left-click</span> object — select</div>
            <div><span className="text-white font-mono">T</span> move · <span className="text-white font-mono">R</span> rotate · <span className="text-white font-mono">G</span> scale · <span className="text-white font-mono">Del</span> remove</div>
            <div className="text-slate-400 italic pt-1">Drag assets from the library onto the ground to place them.</div>
          </div>
        </div>

        {/* Selection badge */}
        {selection && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs">
            <MousePointer2 className="w-4 h-4" />
            Selected: <span className="font-mono text-white">{selection.id}</span>
          </div>
        )}
      </div>
    </div>
  );
}