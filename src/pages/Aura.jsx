import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import { BookOpen } from 'lucide-react';

export default function Aura() {
  const navigate = useNavigate();

  return (
    <GlassPageFrame bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
      {/* 5% Left Area for Global Icons */}
      <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
        
        {/* Recently Played Section */}
        <div className="flex flex-col items-center w-full px-2 mt-4">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">Recently<br/>Played</span>
          <div className="w-8 h-px bg-white/20 mb-4" />
          
          <div className="flex flex-col gap-3 w-full items-center">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <span className="text-white/30 text-lg font-bold">?</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Toggle Quest Book */}
        <button 
          onClick={() => window.dispatchEvent(new Event('toggleQuestBook'))}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group shadow-lg mb-4"
          title="Toggle Quest Book"
        >
          <BookOpen className="w-5 h-5 text-white/50 group-hover:text-amber-400 transition-colors" />
        </button>
      </div>

      {/* 95% Main Area */}
      <div className="flex-1 relative h-full overflow-y-auto">
        {/* Main Content */}
        <div className="pt-20 pb-24 min-h-screen">
          <StreamingGamesLive />
        </div>

      </div>
    </div>
    </GlassPageFrame>
  );
}