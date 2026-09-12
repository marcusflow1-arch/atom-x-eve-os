import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import FarmHub from '@/components/farm/FarmHub';
import FarmGameView from '@/components/farm/FarmGameView';
import FarmBottomNav from '@/components/farm/FarmBottomNav';
import FarmGameBrowserOverlay from '@/components/farm/FarmGameBrowserOverlay';
import '@/components/farm/farmHub.css';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import { base44 } from '@/api/base44Client';

export default function FarmPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('hub');
  const [selectedGame, setSelectedGame] = useState(null);
  const [games, setGames] = useState([]);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

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
    setBrowserOpen(false);
    setSearchParams({ gameId: game.id });
    setView('game');
  };

  const handleBackToHub = () => {
    setSearchParams({});
    setSelectedGame(null);
    setView('hub');
  };

  const handleBottomTab = (tab) => {
    if (view === 'game') handleBackToHub();
    setActiveSection(tab);
  };

  return <PageErrorBoundary pageName="Farm">
    <GlassPageFrame bottomContent={<FarmBottomNav activeTab={activeSection} onBrowseGames={() => setBrowserOpen(true)} onTabSelect={handleBottomTab} />}>
      <div className="farm-hub relative h-screen w-full overflow-hidden bg-[#020617] text-white">
        <AnimatePresence mode="wait">
          {view === 'hub' ? <motion.div key="hub" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
            <FarmHub games={games} onSelectGame={handleSelectGame} activeSection={activeSection} />
          </motion.div> : selectedGame ? <motion.div key={`game-${selectedGame.id}`} className="absolute inset-[64px_0_53px] overflow-hidden bg-[#020617]" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
            <FarmGameView game={selectedGame} onBack={handleBackToHub} />
          </motion.div> : null}
        </AnimatePresence>

        <FarmGameBrowserOverlay open={browserOpen} games={games} onClose={() => setBrowserOpen(false)} onSelectGame={handleSelectGame} />
      </div>
    </GlassPageFrame>
  </PageErrorBoundary>;
}
