import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import GameWorldEditDock from './hud/GameWorldEditDock';

/**
 * In-world editor entry point for the Luna Dashboard -> Game Viewer.
 *
 * IMPORTANT: this never mounts a second Three.js viewport and never replaces
 * the current preview world. GameWorldEditDock reads the live scene exposed by
 * GameWorld3D (window.__gw3dScene / __gw3dCamera / __worldEnv) and edits it in
 * place. The right dock consumes only ~20% of the screen so the existing world,
 * HUD, bosses, player, terrain, sky, weather and combat remain visible.
 */
export default function GameEngineEditLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target?.matches?.('input, textarea, select')) return;
      if (event.key.toLowerCase() === 'f2') setOpen((value) => !value);
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Edit the current Game Viewer world"
          data-editor-entry="live-world"
          className="fixed left-1/2 top-[72px] z-[80] -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white pointer-events-auto"
        >
          <span className="inline-flex items-center gap-1.5"><Pencil className="h-3 w-3" /> Edit</span>
        </button>
      )}

      {open && <GameWorldEditDock onClose={() => setOpen(false)} />}
    </>
  );
}
