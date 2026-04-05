import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import AuraLeftSidebar from '@/components/streaming/AuraLeftSidebar';

export default function Aura() {
  const navigate = useNavigate();

  return (
    <GlassPageFrame bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
      <AuraLeftSidebar />

      {/* 95% Main Area */}
      <div className="flex-1 relative h-full overflow-y-auto">
        {/* Main Content */}
        <div className="pt-20 pb-28 min-h-screen">
          <StreamingGamesLive />
        </div>

      </div>
    </div>
    </GlassPageFrame>
  );
}