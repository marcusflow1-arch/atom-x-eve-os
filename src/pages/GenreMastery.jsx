import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, Globe, Rocket, Crown, Swords, Map, Ghost, Monitor,
  ChevronDown, Gamepad2, X, Layers, Trophy, Scroll, Library, Users, ChevronLeft, DollarSign, Search, Mic, ArrowLeftRight
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import SidebarOverlays from '@/components/dashboard/SidebarOverlays';
import GenreGameDetail from '@/components/genremastery/GenreGameDetail';
import SkillTreeContent from '@/components/genremastery/SkillTreeContent';
import AchievementsContent from '@/components/genremastery/AchievementsContent';
import GenreBottomNav from '@/components/genremastery/GenreBottomNav';
import BlackMarketContent from '@/components/dashboard/BlackMarketContent';
import TradingPostOverlayContent from '@/components/dashboard/TradingPostOverlayContent';
import AlpineGenreSidebar from '@/components/genremastery/AlpineGenreSidebar';
import AlpineGamesBrowser from '@/components/genremastery/AlpineGamesBrowser';
import '@/styles/alpine-genre-mastery.css';

const GENRES = [
  { id: 'mmorpg', name: 'MMORPG', short: 'MMO', icon: Globe, color: 'from-purple-500 to-indigo-600', accent: 'text-purple-400', xpType: 'Social XP', level: 42, maxLevel: 50, rank: 'Warlord', xp: 92, skillPoints: 5, paths: ['Synergy', 'Raid', 'Trade'], matchGenres: ['mmo', 'mmorpg'] },
  { id: 'scifi', name: 'Sci-Fi', short: 'SCI', icon: Rocket, color: 'from-cyan-500 to-blue-600', accent: 'text-cyan-400', xpType: 'Tech XP', level: 28, maxLevel: 50, rank: 'Pilot', xp: 78, skillPoints: 3, paths: ['Cybernetics', 'Spaceflight', 'Hacking'], matchGenres: ['sci-fi', 'scifi', 'sci_fi'] },
  { id: 'fantasy', name: 'Fantasy', short: 'FAN', icon: Crown, color: 'from-amber-400 to-orange-500', accent: 'text-amber-400', xpType: 'Magic XP', level: 15, maxLevel: 50, rank: 'Mage', xp: 45, skillPoints: 1, paths: ['Sorcery', 'Enchanting', 'Lore'], matchGenres: ['fantasy', 'rpg'] },
  { id: 'action', name: 'Action', short: 'ACT', icon: Swords, color: 'from-red-500 to-rose-600', accent: 'text-red-400', xpType: 'Combat XP', level: 33, maxLevel: 50, rank: 'Warrior', xp: 60, skillPoints: 2, paths: ['Combo', 'Reflex', 'Power'], matchGenres: ['action', 'fighting'] },
  { id: 'shooter', name: 'Shooter', short: 'FPS', icon: Crosshair, color: 'from-emerald-500 to-green-600', accent: 'text-emerald-400', xpType: 'Aim XP', level: 50, maxLevel: 50, rank: 'Sniper', xp: 99, skillPoints: 8, paths: ['Precision', 'Tactics', 'Loadout'], matchGenres: ['shooter', 'shooting', 'fps'] },
  { id: 'adventure', name: 'Adventure', short: 'ADV', icon: Map, color: 'from-yellow-400 to-orange-400', accent: 'text-yellow-400', xpType: 'Discovery XP', level: 12, maxLevel: 50, rank: 'Explorer', xp: 30, skillPoints: 1, paths: ['Survival', 'Navigation', 'Crafting'], matchGenres: ['adventure', 'open_world'] },
  { id: 'fear', name: 'Fear', short: 'HOR', icon: Ghost, color: 'from-slate-800 to-gray-900', accent: 'text-slate-400', xpType: 'Sanity XP', level: 5, maxLevel: 50, rank: 'Survivor', xp: 15, skillPoints: 0, paths: ['Stealth', 'Willpower', 'Investigation'], matchGenres: ['horror', 'survival'] },
  { id: 'simulation', name: 'Simulation', short: 'SIM', icon: Monitor, color: 'from-blue-400 to-indigo-400', accent: 'text-blue-400', xpType: 'Logic XP', level: 20, maxLevel: 50, rank: 'Architect', xp: 55, skillPoints: 2, paths: ['Management', 'Efficiency', 'Design'], matchGenres: ['simulation', 'strategy'] },
];

function GenreScrollTabs({ genres, selectedGenre, onSelect }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY > 0 ? 80 : -80;
    };

    const handleKeyDown = (e) => {
      if (!el.matches(':hover')) return;
      if (e.key === 'd' || e.key === 'D') { el.scrollLeft += 80; }
      if (e.key === 'a' || e.key === 'A') { el.scrollLeft -= 80; }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex-1 min-w-0 relative">
      {/* Left fade mask */}
      <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(8,12,18,0.9), transparent)' }} />
      {/* Right fade mask */}
      <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(8,12,18,0.9), transparent)' }} />

      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth px-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap border transition-all text-xs font-semibold flex-shrink-0 ${
              selectedGenre?.id === g.id
                ? 'bg-white/12 border-white/20 text-white'
                : 'bg-transparent border-transparent text-white/45 hover:bg-white/5 hover:text-white/70'
            }`}
          >
            {g.icon && React.createElement(g.icon, { className: 'w-3.5 h-3.5' })}
            <span>{g.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GenreMastery({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [rightPanel, setRightPanel] = useState(() => {
    const m = new URLSearchParams(window.location.search).get('mode');
    return m === 'achievements' || m === 'skilltree' ? m : 'games';
  }); // 'games', 'skilltree', or 'achievements'
  const [marketView, setMarketView] = useState('cards'); // 'cards' | 'blackmarket' | 'tradingpost'
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const dropdownRef = useRef(null);

  const { data: allGames = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games-for-genre-mastery'],
    queryFn: () => base44.entities.Game.list(),
  });

  const genreGames = useMemo(() => {
    if (!allGames || !selectedGenre) return [];
    return allGames.filter(game => {
      const gameGenre = (game.genre || '').toLowerCase();
      return selectedGenre.matchGenres?.some(mg => gameGenre.includes(mg));
    });
  }, [allGames, selectedGenre]);

  const gameData = useMemo(() => {
    return genreGames.map(game => ({
      ...game,
      questCount: Math.floor(Math.random() * 30) + 10,
      achievementCards: Math.floor(Math.random() * 20) + 5,
      totalXP: Math.floor(Math.random() * 5000) + 1000,
      completionRate: Math.floor(Math.random() * 60) + 10,
      communityCompletions: Math.floor(Math.random() * 500) + 50,
    }));
  }, [genreGames]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const cardOverlayOpen = document.querySelector('[data-card-overlay="true"]');
        if (cardOverlayOpen) return;

        if (onClose) onClose();
        else navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onClose]);

  useEffect(() => {
    document.body.classList.add('alpine-mist-active');
    return () => document.body.classList.remove('alpine-mist-active');
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setGenreDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync panel with ?mode= from the navigation drawer
  useEffect(() => {
    const m = new URLSearchParams(location.search).get('mode');
    if (m === 'achievements' || m === 'skilltree') setRightPanel(m);
  }, [location.search]);

  // Reset selected game when switching to skill tree
  useEffect(() => {
    if (rightPanel === 'skilltree') setSelectedGame(null);
  }, [rightPanel]);

  // Reset selected game when genre changes
  useEffect(() => {
    setSelectedGame(null);
  }, [selectedGenre]);

  useEffect(() => {
    if (marketView !== 'cards') {
      setSelectedGame(null);
    }
  }, [marketView]);

  return (
    <GlassPageFrame
      sidebarVisible={sidebarVisible}
      onSidebarToggle={toggleSidebar}
      bottomContent={<div className="alpine-bottom-nav"><GenreBottomNav activeTab={rightPanel} onTabSelect={setRightPanel} marketView={marketView} cardSearchQuery={cardSearchQuery} onCardSearch={setCardSearchQuery} /></div>}
    >
      <div className="alpine-cards-page">
        <SidebarOverlays className="absolute top-[64px] left-6 right-6 bottom-[53px] z-[80]" />
        <div className="alpine-workspace">
          <AlpineGenreSidebar
            genres={GENRES}
            selectedGenre={selectedGenre}
            onSelectGenre={setSelectedGenre}
            gameCount={gameData.length}
            marketView={marketView}
            onMarketView={setMarketView}
          />

          <main className="alpine-center">
            <AnimatePresence mode="wait">
              {marketView === 'blackmarket' ? (
                <motion.div key="blackmarket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <BlackMarketContent cardSearchQuery={cardSearchQuery} onCardSearch={setCardSearchQuery} selectedGame={selectedGame} />
                </motion.div>
              ) : marketView === 'tradingpost' ? (
                <motion.div key="tradingpost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <TradingPostOverlayContent cardSearchQuery={cardSearchQuery} onCardSearch={setCardSearchQuery} selectedGame={selectedGame} />
                </motion.div>
              ) : rightPanel === 'achievements' ? (
                <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <AchievementsContent genre={selectedGenre} selectedGame={selectedGame} onSelectGame={(game) => { setSelectedGame(game); setRightPanel('achievements'); }} games={gameData} />
                </motion.div>
              ) : rightPanel === 'skilltree' ? (
                <motion.div key="skilltree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <SkillTreeContent genre={selectedGenre} />
                </motion.div>
              ) : selectedGame ? (
                <motion.div key={`game-${selectedGame.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <GenreGameDetail game={selectedGame} genre={selectedGenre} onClose={() => setSelectedGame(null)} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 rounded-2xl bg-slate-300 flex items-center justify-center mb-6"><Gamepad2 className="w-10 h-10 text-slate-600" /></div>
                  <h2 className="text-xl font-bold text-slate-700 mb-2">Select a Game</h2>
                  <p className="text-slate-500 text-sm max-w-sm">Choose a game from the {selectedGenre.name} library to explore its quests, achievement cards, and community progress.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <AlpineGamesBrowser
            games={gameData}
            loading={gamesLoading}
            selectedGame={selectedGame}
            rightPanel={rightPanel}
            onSelectGame={(game) => { setSelectedGame(game); if (rightPanel === 'skilltree') setRightPanel('games'); }}
          />
        </div>
      </div>
    </GlassPageFrame>
  );
}