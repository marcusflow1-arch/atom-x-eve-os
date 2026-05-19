// ─── Sandbox Hierarchy ────────────────────────────────────────────────────
// List of all placed objects in the current scene. Click to select, lock to
// prevent edits, delete to remove.

import React from 'react';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { useSandboxStore } from './sandboxStore';
import { getAssetMeta } from './sandboxAssetCatalog';

export default function SandboxHierarchy() {
  const placements = useSandboxStore((s) => s.placements);
  const selectedId = useSandboxStore((s) => s.selectedId);
  const select = useSandboxStore((s) => s.select);
  const toggleLock = useSandboxStore((s) => s.toggleLock);
  const del = useSandboxStore((s) => s.deletePlacement);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200">Hierarchy</h3>
        <span className="text-xs text-slate-500">{placements.length} objects</span>
      </div>

      {placements.length === 0 ? (
        <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-700 rounded">
          No objects placed yet.<br />Drag assets from the library.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {placements.map((p) => {
            const meta = getAssetMeta(p.assetKey);
            const isSel = selectedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => select(p.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                  isSel
                    ? 'bg-blue-600/30 border border-blue-500 text-white'
                    : 'bg-slate-800/60 border border-transparent hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span className="text-base">{meta?.icon || '◻️'}</span>
                <span className="flex-1 truncate">
                  {meta?.name || p.assetKey} <span className="text-slate-500">#{p.id.slice(-4)}</span>
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(p.id); }}
                  className="text-slate-400 hover:text-white"
                  title={p.locked ? 'Unlock' : 'Lock'}
                >
                  {p.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); del(p.id); }}
                  className="text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}