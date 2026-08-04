import React, { useRef } from 'react';
import { Trophy, Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

export default function ProgressionTrack({ genre }) {
  const scrollRef = useRef(null);
  const currentLevel = genre?.level || 0;
  const levels = Array.from({ length: 20 }, (_, i) => i + 1);

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <h3 className="text-white font-bold text-sm">Progression Track</h3>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => scrollBy(-1)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/40 text-xs">20 Levels of {genre?.name} Mastery</span>
          <button
            onClick={() => scrollBy(1)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex items-stretch gap-3 overflow-x-auto pb-1">
          {levels.map((lvl) => {
            const isEarned = lvl <= currentLevel;
            return (
              <div
                key={lvl}
                className="flex-shrink-0 w-[68px] rounded-xl p-2 flex flex-col items-center gap-2"
                style={{
                  background: isEarned ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isEarned ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Lvl {lvl}</span>
                <div className="w-full h-14 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-950 flex items-center justify-center">
                  <span className="text-[9px] text-white/40">Reward</span>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: isEarned ? 'rgba(34,211,238,0.9)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {isEarned ? <Check className="w-3 h-3 text-slate-900" /> : <Lock className="w-2.5 h-2.5 text-white/40" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}