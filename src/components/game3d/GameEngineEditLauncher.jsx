import React, { useState, useEffect } from 'react';
import { Pencil, X, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EngineViewport from '../engine/EngineViewport';
import EngineEditStudio from '../engine/EngineEditStudio';

/**
 * Game Viewer engine entry point.
 * Opens the full editor directly from the Game button route, not Admin.
 * The editor uses the same Three.js builder + edit studio used by Atom XE Engine.
 */
export default function GameEngineEditLauncher() {
  const [open, setOpen] = useState(false);
  const [sceneApi, setSceneApi] = useState(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target?.matches?.('input, textarea, select')) return;
      if (event.key.toLowerCase() === 'f2') setOpen((value) => !value);
      if (event.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open Atom XE Game Editor"
        className="fixed top-[72px] left-1/2 z-[80] -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white pointer-events-auto"
      >
        <span className="inline-flex items-center gap-1.5"><Pencil className="h-3 w-3" /> Edit</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#070a10] text-white">
      <div className="absolute inset-0 p-2">
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className="absolute left-1/2 top-3 z-[220] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-1.5 text-[10px] shadow-2xl backdrop-blur-xl">
            <span className="mr-2 inline-flex items-center gap-1.5 text-orange-300"><Cpu className="h-3 w-3" /> GAME WORLD EDITOR</span>
            <span className="text-white/35">F2 toggles editor</span>
          </div>

          <div className="absolute inset-0 p-2">
            <EngineViewport
              onSceneReady={(api) => {
                setSceneApi(api);
                if (api?.scene && !api.scene.getObjectByName('Terrain')) {
                  api.createTerrain?.({ size: 50, segments: 80, addFoliage: false, color: 0x173126 });
                }
              }}
            />
          </div>

          {sceneApi && (
            <EngineEditStudio
              sceneApi={sceneApi}
              onClose={() => {
                setOpen(false);
                setSceneApi(null);
              }}
            />
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => { setOpen(false); setSceneApi(null); }}
            className="absolute right-3 top-3 z-[230] h-8 w-8 rounded-full border border-white/10 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white"
            title="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
