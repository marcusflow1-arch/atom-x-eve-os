import React from 'react';
import BottomQuickBar from '../components/streaming/BottomQuickBar';
import DiscoverStreamingList from '../components/streaming/DiscoverStreamingList';
import LibrarySidebar from '../components/streaming/LibrarySidebar';

export default function Discover() {
  return (
    <div className="min-h-screen w-full relative">
      <LibrarySidebar />
      <DiscoverStreamingList />
      <BottomQuickBar />
    </div>
  );
}