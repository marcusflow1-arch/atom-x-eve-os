import React from 'react';
import DiscoverStreamingList from '../components/streaming/DiscoverStreamingList';
import LibrarySidebar from '../components/streaming/LibrarySidebar';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import AuraLeftSidebar from '@/components/streaming/AuraLeftSidebar';

export default function Discover() {
  return (
    <GlassPageFrame bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <AuraLeftSidebar />
        <div className="flex-1 relative h-full overflow-y-auto">
          <div className="min-h-full w-full relative">
            <LibrarySidebar />
            <DiscoverStreamingList />
          </div>
        </div>
      </div>
    </GlassPageFrame>
  );
}