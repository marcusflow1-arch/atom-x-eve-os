import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';

export default function Aura() {
  const navigate = useNavigate();

  return (
    <GlassPageFrame bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="w-full min-h-screen bg-[#0f1419] relative">
      {/* Main Content */}
      <div className="pt-20 pb-24">
        <StreamingGamesLive />
      </div>

      {/* Sidebars & Overlays */}
      <LibrarySidebar />
    </div>
    </GlassPageFrame>
  );
}