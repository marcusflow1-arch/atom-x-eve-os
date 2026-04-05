import React from 'react';
import { GripVertical, Users } from 'lucide-react';

export default function LunaLeftRail({ isEnvironmentActive, onToggleEnvironment }) {
  return (
    <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
      <div className="mt-12 px-2 flex flex-col items-center w-full">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">Recently<br />Played</span>
        <div className="w-8 h-px bg-white/20 mb-3" />

        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map((i) =>
          <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 mb-6 px-2 flex flex-col items-center w-full gap-3">
        

        

        <button
          onClick={onToggleEnvironment}
          className={`min-h-[64px] w-full rounded-2xl border px-2 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-center transition-all ${
          isEnvironmentActive ?
          'border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15' :
          'border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'}`
          }>
          
          {isEnvironmentActive ? 'Environment Enabled' : 'Environment Disabled'}
        </button>

        

        
      </div>

      <div className="w-8 h-px bg-white/20 mb-3" />

      <div className="mt-auto px-2 pb-6 flex flex-col items-center w-full">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">Friends</span>
        <div className="w-8 h-px bg-white/20 mb-3" />
        <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
          <Users className="w-4 h-4 text-white/50" />
        </div>
      </div>
    </div>);

}