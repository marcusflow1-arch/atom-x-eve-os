import React, { useEffect, useState } from 'react';
import { Pencil, X, Cpu } from 'lucide-react';
import GameWorldEditDock from './hud/GameWorldEditDock';

/**
 * Game Viewer engine entry point.
 * The editor stays inside the existing Game Viewer world. It never replaces
 * the live 3D scene with a second viewport or a full-screen editor.
 *
 * Layout when open:
 *   80% = the existing live GameWorld3D scene
 *   20% = liquid-glass editor dock
 */
export default function GameEngineEditLauncher() {
  const [open, setOpen] = useState(false);

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
    <>
      <div className="fixed left-1/2 top-3 z-[122] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/65 px-3 py-1.5 text-[10px] shadow-xl backdrop-blur-2xl">
        <span className="mr-2 inline-flex items-center gap-1.5 text-orange-300"><Cpu className="h-3 w-3" /> GAME WORLD EDITOR</span>
        <span className="text-white/35">Live world · F2 toggles</span>
      </div>

      <GameWorldEditDock onClose={() => setOpen(false)} />

      <button
        onClick={() => setOpen(false)}
        title="Close editor"
        className="fixed right-[21vw] top-4 z-[123] rounded-full border border-white/10 bg-black/35 p-2 text-white/55 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );
}
