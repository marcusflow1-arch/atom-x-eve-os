import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import RecentlyWatchedPanel from '@/components/streaming/aura/RecentlyWatchedPanel';

export default function Aura() {
  const navigate = useNavigate();
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
      <RecentlyWatchedPanel visible={sidebarVisible} onToggle={toggleSidebar} />

      {/* Main Area */}
      <div className={`flex-1 relative h-full overflow-y-auto transition-all ${sidebarVisible ? 'pl-[140px]' : 'pl-6'}`}>
        {/* Main Content */}
        <div className="pt-20 pb-28 min-h-screen">
          <StreamingGamesLive />
        </div>

      </div>
    </div>
    </GlassPageFrame>
  );
}