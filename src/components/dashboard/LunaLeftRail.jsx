import React from 'react';

export default function LunaLeftRail({ isEnvironmentActive, onToggleEnvironment }) {
  return (
    <div className="w-[80px] min-w-[80px] h-full self-stretch border-r border-white/10 bg-black/30 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center pt-12 pb-4 px-2">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">Recently<br />Played</span>
        <div className="w-8 h-px bg-white/20 mb-3" />

        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          ))}
        </div>

        <div className="mt-3 w-8 h-px bg-white/20" />

        <div className="mt-auto w-full flex flex-col items-center gap-3 pb-2">
          <button
            onClick={onToggleEnvironment}
            className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center transition-all ${isEnvironmentActive ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.18)]' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
            title="Toggle environment"
          >
            <span className="text-[9px] font-bold tracking-wider leading-none">LAUNCH</span>
          </button>

          <div className="w-8 h-px bg-white/20" />
        </div>
      </div>
    </div>
  );
}