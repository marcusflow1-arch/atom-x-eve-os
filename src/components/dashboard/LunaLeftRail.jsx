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

        <div className="mt-3 mb-3 ml-2 w-8 h-px bg-white/20" />
      </div>

      


















      

      <div className="bg-white/20 mb-2 ml-2 mt-1 w-8 h-px" />

      





      
    </div>);

}