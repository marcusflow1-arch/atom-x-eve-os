import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Play, Star, Heart } from 'lucide-react';
import GameHubTabs from '@/components/game/GameHubTabs';
import GameHeroHeader from '@/components/game/GameHeroHeader';

export default function GameHub() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [designMode, setDesignMode] = useState('default'); // 'default' | 'minimal' | 'dark'
  const [isOwned, setIsOwned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const fetchedGame = await base44.entities.Game.get(gameId);
        setGame(fetchedGame);
      } catch (err) {
        console.error('Failed to fetch game:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white">Game not found</p>
      </div>
    );
  }

  const handlePlayClick = () => {
    if (isOwned) {
      // Launch game logic
      alert('Launching ' + game.title);
    } else {
      // Open purchase modal
      alert('Open purchase modal for ' + game.title);
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
  };

  const handleAddLibrary = () => {
    setIsOwned(!isOwned);
  };

  const handleDesignToggle = () => {
    const modes = ['default', 'minimal', 'dark'];
    const nextMode = modes[(modes.indexOf(designMode) + 1) % modes.length];
    setDesignMode(nextMode);
  };

  return (
    <div className={`fixed inset-0 overflow-hidden ${designMode === 'dark' ? 'bg-black' : 'bg-slate-900'}`}>
      {/* Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Design Mode Toggle */}
      <button
        onClick={handleDesignToggle}
        className="absolute top-6 left-6 z-50 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors"
      >
        Design: {designMode}
      </button>

      {/* Main Content */}
      <div className="h-full overflow-y-auto">
        {/* Hero Header */}
        <GameHeroHeader
          game={game}
          isOwned={isOwned}
          isFavorite={isFavorite}
          designMode={designMode}
          onPlay={handlePlayClick}
          onFavorite={handleFavoriteToggle}
          onAddLibrary={handleAddLibrary}
        />

        {/* Tab Navigation */}
        <GameHubTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          game={game}
          designMode={designMode}
          isOwned={isOwned}
        />
      </div>
    </div>
  );
}