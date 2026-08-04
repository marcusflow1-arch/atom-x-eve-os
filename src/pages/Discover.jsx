import React from 'react';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import RecentlyWatchedPanel from '@/components/streaming/aura/RecentlyWatchedPanel';
import DiscoverHub from '@/components/streaming/discover/DiscoverHub';
import { useSidebarVisible } from '../hooks/useSidebarVisible';

export default function Discover() {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <RecentlyWatchedPanel visible={sidebarVisible} onToggle={toggleSidebar} />
        <div className={`flex-1 relative h-full overflow-y-auto transition-all ${sidebarVisible ? 'pl-[140px]' : 'pl-6'}`}>
          <DiscoverHub />
        </div>
      </div>
    </GlassPageFrame>
  );
}