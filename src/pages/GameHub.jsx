import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import GameHubTabs from '@/components/game/GameHubTabs';
import GameHeroHeader from '@/components/game/GameHeroHeader';
import { getCachedGame, cacheGame, normalizeGameMetadata } from '@/lib/gameMetadataCache';

export default function GameHub() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const cached = getCachedGame(gameId);
  const [game, setGame] = useState(cached ? normalizeGameMetadata(cached) : null);
  const [loading, setLoading] = useState(!cached);
  const [activeTab, setActiveTab] = useState('overview');
  const [designMode, setDesignMode] = useState('default');
  const [isOwned, setIsOwned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!gameId) return undefined;
    const fetchGame = async () => {
      try {
        const fetchedGame = await base44.entities.Game.get(gameId);
        if (!cancelled && fetchedGame) setGame(cacheGame(fetchedGame));
      } catch (err) {
        console.error('Failed to refresh game metadata:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    // Cached metadata renders immediately; the network refresh happens silently in the background.
    fetchGame();
    return () => { cancelled = true; };
  }, [gameId]);

  if (loading && !game) return <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (!game) return <div className="fixed inset-0 bg-black flex items-center justify-center"><p className="text-white">Game not found</p></div>;

  const handlePlayClick = () => alert(isOwned ? 'Launching ' + game.title : 'Open purchase modal for ' + game.title);
  const handleFavoriteToggle = () => setIsFavorite(v => !v);
  const handleAddLibrary = () => setIsOwned(v => !v);
  const handleDesignToggle = () => { const modes=['default','minimal','dark']; setDesignMode(modes[(modes.indexOf(designMode)+1)%modes.length]); };

  return (
    <div className={`fixed inset-0 overflow-hidden ${designMode === 'dark' ? 'bg-black' : 'bg-slate-900'}`}>
      <button onClick={() => navigate(-1)} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-5 h-5 text-white" /></button>
      <button onClick={handleDesignToggle} className="absolute top-6 left-6 z-50 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors">Design: {designMode}</button>
      <div className="h-full overflow-y-auto">
        <GameHeroHeader game={game} isOwned={isOwned} isFavorite={isFavorite} designMode={designMode} onPlay={handlePlayClick} onFavorite={handleFavoriteToggle} onAddLibrary={handleAddLibrary} />
        <GameHubTabs activeTab={activeTab} onTabChange={setActiveTab} game={game} designMode={designMode} isOwned={isOwned} />
      </div>
    </div>
  );
}
