import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FarmHub from '@/components/farm/FarmHub';
import FarmGameView from '@/components/farm/FarmGameView';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import ForumBottomNav from '@/components/community/ForumBottomNav';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function FarmPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('hub');
  const [selectedGame, setSelectedGame] = useState(null);
  const [games, setGames] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let rows;
        try { rows = await base44.entities.Game.list('-original_year', 1000); }
        catch (_) { rows = await base44.entities.Game.list('-original_year', 250); }
        if (!cancelled) setGames(rows || []);
      } catch (error) {
        console.error('Failed to load Farm Hub games', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const gameId = searchParams.get('gameId');
    if (!gameId) {
      setView('hub');
      return;
    }
    if (!games.length) return;
    const game = games.find((item) => String(item.id) === String(gameId));
    if (game) {
      setSelectedGame(game);
      setView('game');
    } else {
      setSearchParams({}, { replace: true });
      setSelectedGame(null);
      setView('hub');
    }
  }, [games, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedGame) return;
    try {
      const stored = JSON.parse(localStorage.getItem('recent_farm_games') || '[]');
      const next = [{
        id: selectedGame.id,
        name: selectedGame.title,
        image: selectedGame.cover_image || selectedGame.banner_image || selectedGame.image || '',
      }, ...stored.filter((item) => item.id !== selectedGame.id && item.name !== selectedGame.title)].slice(0, 8);
      localStorage.setItem('recent_farm_games', JSON.stringify(next));
      window.dispatchEvent(new Event('recentFarmGamesUpdated'));
    } catch (error) {
      console.warn('Could not save recent Farm Hub game', error);
    }
  }, [selectedGame]);

  const handleSelectGame = (game) => {
    if (!game?.id) return;
    setSelectedGame(game);
    setSearchParams({ gameId: game.id });
    setView('game');
  };

  const handleBackToHub = () => {
    setSearchParams({});
    setView('hub');
    setTimeout(() => setSelectedGame(null), 220);
  };

  const handleTabSelect = (tabId) => {
    if (tabId === 'hub') navigate(createPageUrl('Community'));
    if (tabId === 'farm_hub') handleBackToHub();
  };

  return (
    <PageErrorBoundary pageName="Farm">
      <GlassPageFrame bottomContent={<ForumBottomNav activeTab="farm_hub" onTabSelect={handleTabSelect} />}>
        <div
          className="relative min-h-screen overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
        >
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute left-1/4 top-0 h-[620px] w-[620px] rounded-full bg-blue-400/[0.055] blur-[155px]" />
            <div className="absolute bottom-0 right-1/4 h-[520px] w-[520px] rounded-full bg-cyan-300/[0.045] blur-[125px]" />
          </div>

          <div className="relative z-10 flex h-screen pt-16">
            <div className="relative z-40 h-full w-[5%] min-w-[80px] flex-shrink-0 border-r border-white/[0.16] bg-black/20 shadow-[5px_0_18px_rgba(0,0,0,0.42)] backdrop-blur-sm">
              <div className="absolute -right-3 top-1/2 z-50 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/50 shadow-lg backdrop-blur-md" aria-hidden="true">
                <ChevronLeft className="h-4 w-4 -ml-1" />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <AnimatePresence mode="wait">
                {view === 'hub' ? (
                  <motion.div
                    key="hub"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
                    transition={{ duration: 0.24 }}
                    className="flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,.14)_transparent] [scrollbar-width:thin]"
                  >
                    <div className="mx-auto w-full max-w-[1600px]">
                      <FarmHub games={games} onSelectGame={handleSelectGame} />
                    </div>
                  </motion.div>
                ) : selectedGame ? (
                  <motion.div
                    key={`game-${selectedGame.id}`}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.24 }}
                    className="h-full flex-1 overflow-hidden"
                  >
                    <FarmGameView game={selectedGame} onBack={handleBackToHub} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </GlassPageFrame>
    </PageErrorBoundary>
  );
}
