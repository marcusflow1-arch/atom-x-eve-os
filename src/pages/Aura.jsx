import React from 'react';
import { createPageUrl } from '@/utils';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import AuraStreamBrowserOverlay from '@/components/streaming/AuraStreamBrowserOverlay.jsx';

export default function Aura() {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <div className="flex-1 relative h-full overflow-y-auto pl-6">
          <div className="pt-20 pb-28 min-h-screen">
            <StreamingGamesLive />
          </div>
        </div>
      </div>
      <AuraStreamBrowserOverlay />
    </GlassPageFrame>
  );
}
