import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GameDetailPanel from '../components/game/GameDetailPanel';
import { createPageUrl } from '@/utils';

export default function GameDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const query = new URLSearchParams(location.search);
  const gameId = query.get('id');
  const from = query.get('from') || 'store';

  const handleClose = () => {
    const backUrl = createPageUrl(from === 'library' ? 'Library' : 'Store');
    navigate(backUrl);
  };

  return (
    <GameDetailPanel 
      gameId={gameId} 
      onClose={handleClose}
      showBackButton={true}
      from={from}
    />
  );
}