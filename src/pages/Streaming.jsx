import React from 'react';
import StreamingGamesLive from '../components/streaming/StreamingGamesLive';
import BottomQuickBar from '../components/streaming/BottomQuickBar';

export default function Streaming() {
  return (
    <div className="w-full h-full min-h-screen">
      <StreamingGamesLive />
      <BottomQuickBar />
    </div>
  );
}