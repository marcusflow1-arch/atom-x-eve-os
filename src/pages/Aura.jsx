import React, { useEffect, useState } from 'react';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import AuraStreamBrowserOverlay from '@/components/streaming/AuraStreamBrowserOverlay.jsx';
import GameStreamerHub from '@/components/streaming/aura/GameStreamerHub';
import AuraLandingHubV2 from '@/components/streaming/aura/AuraLandingHubV2';

const GAME_SELECTED_EVENT = 'atomxe:aura-game-selected';
export default function Aura() {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const [selectedGame, setSelectedGame] = useState(null);
  useEffect(() => {
    const onGameSelected = (event) => { if (event.detail) setSelectedGame(event.detail); };
    window.addEventListener(GAME_SELECTED_EVENT, onGameSelected);
    return () => window.removeEventListener(GAME_SELECTED_EVENT, onGameSelected);
  }, []);
  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
      <div className="flex-1 relative h-full overflow-y-auto pl-6"><div className="pt-20 pb-28 min-h-screen">
        {selectedGame ? <GameStreamerHub game={selectedGame} onClose={() => setSelectedGame(null)} /> : <AuraLandingHubV2 />}
      </div></div>
    </div>
    <AuraStreamBrowserOverlay />
  </GlassPageFrame>;
}
