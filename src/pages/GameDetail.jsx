import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GameDetailPanel from '../components/game/GameDetailPanel';
import { createPageUrl } from '@/utils';
import StoreBottomNav from '@/components/store/StoreBottomNav';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

export default function GameDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStoreTab, setActiveStoreTab] = useState('store');
  
  const query = new URLSearchParams(location.search);
  const gameId = query.get('id');
  const from = query.get('from') || 'store';

  const handleClose = () => {
    const backUrl = createPageUrl(from === 'library' ? 'Library' : 'Store');
    navigate(backUrl);
  };

  const handleStoreTabChange = (tabId) => {
    setActiveStoreTab(tabId);
    if (tabId === 'store') navigate(createPageUrl('Store'));
    else if (tabId === 'marketplace') navigate(createPageUrl('Store?mode=marketplace'));
    else if (tabId === 'trading') navigate(createPageUrl('Store?mode=trading'));
    else if (tabId === 'devcards') navigate(createPageUrl('Store?mode=devcards'));
    else if (tabId === 'overview') navigate(createPageUrl('Store'));
  };

  return (
    <GlassPageFrame
      showTriggerTab={true}
      topContent={null}
      bottomContent={
        <StoreBottomNav
          activeTab={activeStoreTab}
          onTabChange={handleStoreTabChange}
        />
      }
    >
      <GameDetailPanel 
        gameId={gameId} 
        onClose={handleClose}
        showBackButton={true}
        from={from}
      />
    </GlassPageFrame>
  );
}