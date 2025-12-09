import React from 'react';
import SeasonalPassContent from '../components/dashboard/SeasonalPassContent';

export default function SeasonalPass() {
  return (
    <div className="h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden relative">
       <div className="absolute top-4 left-20 z-50 flex items-center gap-2">
            <span className="text-white font-bold text-lg tracking-wider uppercase drop-shadow-lg">Season Pass 1 Awaken</span>
       </div>
       <SeasonalPassContent />
    </div>
  );
}