import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GameDetailPanel from '../components/game/GameDetailPanel';
import { createPageUrl } from '@/utils';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import StoreBottomNav from '@/components/store/StoreBottomNav';

export default function GameDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('store');
  
  const query = new URLSearchParams(location.search);
  const gameId = query.get('id');
  const from = query.get('from') || 'store';

  const handleClose = () => {
    const backUrl = createPageUrl(from === 'library' ? 'Library' : 'Store');
    navigate(backUrl);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'store') navigate(createPageUrl('Store'));
    else if (tab === 'marketplace') navigate(createPageUrl('Store') + '?mode=marketplace');
    else if (tab === 'trading') navigate(createPageUrl('Store') + '?mode=trading');
    else if (tab === 'overview') navigate(createPageUrl('Store') + '?mode=overview');
  };

  return (
    <GlassPageFrame
      bottomContent={
        <StoreBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      }
    >
      <div className="fixed overflow-hidden" style={{ top: '64px', left: 0, right: 0, bottom: '48px' }}>
        <GameDetailPanel 
          gameId={gameId} 
          onClose={handleClose}
          showBackButton={true}
          from={from}
        />
      </div>
    </GlassPageFrame>
  );
}