import React from 'react';
import { Compass, Target } from 'lucide-react';

/**
 * Top-left HUD block: minimap + quest tracker, inspired by the reference.
 * Quest data is intentionally minimal — the in-game quest system already
 * lives in QuestDialogueBox; this is just the persistent on-screen tracker.
 */
export default function HUDMinimapQuest() {
  return (
    <div className="absolute top-4 left-4 z-20 pointer-events-none w-[230px] flex flex-col gap-3">
      {/* Minimap */}
      <div
        className="relative w-[150px] h-[150px] rounded-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(40,60,80,0.85), rgba(8,12,20,0.95))',
          border: '2px solid rgba(180,160,110,0.5)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.55), inset 0 0 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Compass ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Compass className="w-7 h-7 text-white/15" />
        </div>
        {/* Player dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
        {/* N marker */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70 tracking-widest">N</div>
        {/* Decorative quest pings */}
        <div className="absolute top-6 left-10 w-1.5 h-1.5 rounded-full bg-yellow-300/80" />
        <div className="absolute bottom-7 right-7 w-1.5 h-1.5 rounded-full bg-amber-400/70" />
      </div>

      {/* Quest tracker */}
      <div
        className="px-3 py-2.5 rounded-sm text-white"
        style={{
          background: 'linear-gradient(180deg, rgba(15,20,28,0.78), rgba(10,14,20,0.78))',
          borderLeft: '2px solid rgba(250,204,21,0.7)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Target className="w-3 h-3 text-yellow-300" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-yellow-300/90">
            Active Quest
          </span>
        </div>
        <div className="text-[12px] text-white/85 leading-snug mb-1">
          —
        </div>
        <div className="text-[11px] text-white/55 leading-snug">
          Objective —
        </div>
      </div>
    </div>
  );
}