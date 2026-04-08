import React from 'react';
import { Play, Users, Library, Gift, Tv } from 'lucide-react';

const bottomItems = [
  { key: 'friends', label: 'FRIENDS', icon: Users },
  { key: 'library', label: 'LIBRARY', icon: Library },
  { key: 'rewards', label: 'REWARDS', icon: Gift },
  { key: 'entertainment', label: 'ENTERTAIN', icon: Tv },
];

export default function LunaLeftRail({ isEnvironmentActive, onToggleEnvironment }) {
  return (
    <div className="w-[88px] min-w-[88px] h-full self-stretch border-r border-white/10 bg-black/30 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center pt-10 pb-4 px-2">
        <span className="text-[9px] uppercase tracking-[0.18em] text-white/50 font-bold text-center mb-1 leading-tight">Recently Played</span>
        <div className="w-8 h-px bg-white/20 mb-3" />

        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-10 h-10 rounded-xl border flex items-center justify-center ${i === 4 ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
              <span className={`text-lg font-bold ${i === 4 ? 'text-amber-200/70' : 'text-white/30'}`}>?</span>
            </div>
          ))}
        </div>

        <div className="mt-3 w-8 h-px bg-white/20" />

        <button
          onClick={onToggleEnvironment}
          className={`mt-3 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isEnvironmentActive ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.18)]' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
          title="Launch"
        >
          <Play className="w-4 h-4 ml-0.5" />
        </button>

        <div className="mt-3 w-8 h-px bg-white/20" />

        <div className="mt-3 w-full flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <span className="text-white/30 text-lg font-bold">?</span>
          </div>
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/35 text-center leading-tight">Top Widget</span>
        </div>

        <div className="mt-2 w-8 h-px bg-white/20" />

        <div className="mt-auto w-full flex flex-col items-center gap-2 pb-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className="w-full flex flex-col items-center gap-1 text-white/45 hover:text-white transition-colors"
                type="button"
              >
                <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[7px] uppercase tracking-[0.18em] leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}