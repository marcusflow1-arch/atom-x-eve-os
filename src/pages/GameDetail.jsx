import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreBottomNav from '@/components/store/StoreBottomNav';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import GameHubTabs from '@/components/game/GameHubTabs';

export default function GameDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStoreTab, setActiveStoreTab] = useState('store');
  const [game, setGame] = useState(null);
  const query = new URLSearchParams(location.search);
  const gameId = query.get('id');
  const from = query.get('from') || 'store';

  const handleClose = () => navigate(createPageUrl(from === 'library' ? 'Library' : 'Store'));

  const handleStoreTabChange = (tabId) => {
    setActiveStoreTab(tabId);
    if (tabId === 'store') navigate(createPageUrl('Store'));
    else if (tabId === 'marketplace') navigate(createPageUrl('Store?mode=marketplace'));
    else if (tabId === 'trading') navigate(createPageUrl('Store?mode=trading'));
    else if (tabId === 'devcards') navigate(createPageUrl('Store?mode=devcards'));
    else if (tabId === 'overview') navigate(createPageUrl('Store'));
  };

  const handleGameLoaded = useCallback((loadedGame) => {
    setGame(loadedGame);
  }, []);

  if (!gameId) return <div className="h-screen flex items-center justify-center bg-[#0d0d0d] text-white/40">No game selected.</div>;

  return (
    <GlassPageFrame
      showTriggerTab={true}
      gameData={game}
      topContent={null}
      bottomContent={<StoreBottomNav activeTab={activeStoreTab} onTabChange={handleStoreTabChange} />}
    >
      <GameHubTabs gameId={gameId} onClose={handleClose} onGameLoaded={handleGameLoaded} />
    </GlassPageFrame>
  );
}
