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
      <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"></div>

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