import React from 'react';
import DiscoverStreamingList from '../components/streaming/DiscoverStreamingList';
import LibrarySidebar from '../components/streaming/LibrarySidebar';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';

export default function Discover() {
  return (
    <GlassPageFrame bottomContent={<AuraBottomNav />}>
      <div className="min-h-screen w-full relative">
        <LibrarySidebar />
        <DiscoverStreamingList />
      </div>
    </GlassPageFrame>
  );
}