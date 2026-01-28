import React from 'react';
import StreamingGamesLive from '../components/streaming/StreamingGamesLive';
import BottomQuickBar from '../components/streaming/BottomQuickBar';
import LibrarySidebar from '../components/streaming/LibrarySidebar';

export default function Streaming() {
  return (
    <div className="w-full h-full min-h-screen">
      <StreamingGamesLive />
      <LibrarySidebar />
      <BottomQuickBar />
    </div>
  );
}