import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Gamepad2, Users, MessageSquare, Settings, Play, Radio, LayoutGrid } from 'lucide-react';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import BottomQuickBar from '@/components/streaming/BottomQuickBar';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

export default function Aura() {
  const navigate = useNavigate();

  return (
    <GlassPageFrame>
    <div className="w-full min-h-screen bg-[#0f1419] relative">
      {/* Main Content */}
      <div className="pt-20 pb-24">
        <StreamingGamesLive />
      </div>

      {/* Sidebars & Overlays */}
      <LibrarySidebar />
      <BottomQuickBar />
    </div>
    </GlassPageFrame>
  );
}