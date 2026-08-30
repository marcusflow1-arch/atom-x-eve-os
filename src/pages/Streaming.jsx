import React from 'react';
import AuraStreamBrowserOverlay from '../components/streaming/AuraStreamBrowserOverlay';

// Independent Streaming Games destination. This page is intentionally decoupled
// from the Aura landing page and owns the complete game -> streamer flow.
export default function Streaming() {
  return (
    <div className="w-full h-screen min-h-screen overflow-hidden bg-[#0f1419]">
      <AuraStreamBrowserOverlay standalone />
    </div>
  );
}
