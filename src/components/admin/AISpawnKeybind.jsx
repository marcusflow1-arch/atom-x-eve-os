import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';

export default function AISpawnKeybind({ spawnKey, onChange }) {
  const [capturing, setCapturing] = useState(false);

  const handleCapture = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(e.code);
    setCapturing(false);
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
        <Keyboard className="w-3 h-3" />
        Spawn Keybind
      </label>
      <p className="text-slate-400 text-[11px] mb-3">
        Press this key during gameplay to spawn this AI model into the 3D scene near the player.
      </p>
      <div className="flex items-center gap-3">
        {capturing ? (
          <div
            className="flex-1 bg-purple-900/30 border-2 border-purple-500 text-purple-300 rounded-lg px-4 py-3 text-sm text-center animate-pulse cursor-pointer"
            tabIndex={0}
            autoFocus
            onKeyDown={handleCapture}
            onBlur={() => setCapturing(false)}
          >
            Press any key...
          </div>
        ) : (
          <button
            onClick={() => setCapturing(true)}
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm text-left hover:border-purple-500/50 transition-colors"
          >
            {spawnKey ? (
              <span className="flex items-center gap-2">
                <kbd className="px-3 py-1 bg-slate-700 rounded text-purple-300 text-xs font-mono">{spawnKey}</kbd>
                <span className="text-slate-400 text-xs">Click to change</span>
              </span>
            ) : (
              <span className="text-slate-400">Click to assign spawn key...</span>
            )}
          </button>
        )}
        {spawnKey && (
          <button
            onClick={() => onChange('')}
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-900/20 border border-red-500/30"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}