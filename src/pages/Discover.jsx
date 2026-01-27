import React from 'react';
import BottomQuickBar from '../components/streaming/BottomQuickBar';
import DiscoverStreamingList from '../components/streaming/DiscoverStreamingList';

export default function Discover() {
  return (
    <div className="min-h-screen w-full">
      <DiscoverStreamingList />
      <BottomQuickBar />
    </div>
  );
}