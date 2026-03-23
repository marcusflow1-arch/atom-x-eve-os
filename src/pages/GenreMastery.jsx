import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, Globe, Rocket, Crown, Swords, Map, Ghost, Monitor,
  ChevronDown, Gamepad2, X, Layers, Trophy, Scroll, Library, Users, ChevronLeft
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import GenreGameDetail from '@/components/genremastery/GenreGameDetail';
import SkillTreeContent from '@/components/genremastery/SkillTreeContent';
import AchievementsContent from '@/components/genremastery/AchievementsContent';
import GenreBottomNav from '@/components/genremastery/GenreBottomNav';

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
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [rightPanel, setRightPanel] = useState('games'); // 'games', 'skilltree', or 'achievements'
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => setIsSidebarCollapsed(e.detail);
    window.addEventListener('sidebarCollapseChange', handler);
    return () => window.removeEventListener('sidebarCollapseChange', handler);
  }, []);

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
        if (onClose) onClose();
        else navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onClose]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setGenreDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset selected game when switching to skill tree
  useEffect(() => {
    if (rightPanel === 'skilltree') setSelectedGame(null);
  }, [rightPanel]);

  // Reset selected game when genre changes
  useEffect(() => {
    setSelectedGame(null);
  }, [selectedGenre]);

  return (
    <GlassPageFrame bottomContent={<GenreBottomNav activeTab={rightPanel} onTabSelect={setRightPanel} />}>
      <div className="flex w-full h-full">
        {/* 5% Left Sidebar for Global Icons */}
        <div className={`transition-all duration-500 ${isSidebarCollapsed ? 'w-0 min-w-0 border-none opacity-0' : 'w-[5%] min-w-[80px] border-r border-white/10'} flex-shrink-0 relative z-50 flex flex-col items-center bg-black/20 backdrop-blur-sm`}>
            {!isSidebarCollapsed && (
                <button
                    onClick={() => {
                        localStorage.setItem('sidebarCollapsed', 'true');
                        window.dispatchEvent(new CustomEvent('sidebarCollapseChange', { detail: true }));
                    }}
                    className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-black/60 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white text-white/50 transition-colors backdrop-blur-md z-50 shadow-lg"
                    title="Collapse Sidebar"
                >
                    <ChevronLeft className="w-4 h-4 -ml-1" />
                </button>
            )}
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 h-screen text-white font-sans overflow-hidden relative flex flex-col"
          style={{
            backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/fed9dc2c3_unnamed4.jpg')`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#050505'
          }}
        >
          {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className={`absolute inset-0 bg-gradient-to-br ${selectedGenre.color} opacity-[0.06] z-0`} />

        {/* ═══ SUB-NAV BAR (below global header) ═══ */}
        <div className="relative z-10 flex-shrink-0 mt-16">
          <div className="flex items-center px-6 py-2 gap-0"
            style={{
              background: 'rgba(8, 12, 18, 0.5)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Left: Genre Progression label */}
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0 mr-4 select-none">
              Genre Progression
            </span>

            {/* Fade divider left */}
            <div className="flex-shrink-0 w-px h-8 mx-3 relative">
              <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
            </div>

            {/* Center: Scrollable genre tabs */}
            <GenreScrollTabs
              genres={GENRES}
              selectedGenre={selectedGenre}
              onSelect={setSelectedGenre}
            />

          </div>
        </div>

        {/* ═══ MAIN CONTENT: Games List + Right Panel ═══ */}
        <div className="flex-1 flex min-h-0 relative z-10">
          {/* LEFT: Games List (always visible) */}
          <div
            className="h-full flex flex-col overflow-hidden flex-shrink-0"
            style={{
              width: '320px',
              minWidth: '320px',
              background: 'rgba(10, 14, 20, 0.65)',
              backdropFilter: 'blur(30px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* List Header */}
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedGenre.color} flex items-center justify-center`}>
                  <Gamepad2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">{selectedGenre.name} Games</h2>
                  <p className="text-white/35 text-[10px]">{gameData.length} game{gameData.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Games */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {gamesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : gameData.length === 0 ? (
                <div className="text-center py-12 text-white/25">
                  <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No games in this genre yet</p>
                </div>
              ) : (
                gameData.map((game) => (
                  <motion.button
                    key={game.id}
                    onClick={() => { setSelectedGame(game); if (rightPanel === 'skilltree') setRightPanel('games'); }}

                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                      selectedGame?.id === game.id && rightPanel === 'games'
                        ? 'bg-white/10 border-white/15'
                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/6'
                    }`}
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                      {game.cover_image ? (
                        <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                          <Gamepad2 className="w-4 h-4 text-white/25" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xs font-semibold truncate">{game.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/30 text-[10px] flex items-center gap-0.5"><Scroll className="w-2.5 h-2.5" />{game.questCount}</span>
                        <span className="text-yellow-400/50 text-[10px] flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5" />{game.achievementCards}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${selectedGenre.color}`} style={{ width: `${game.completionRate}%` }} />
                        </div>
                        <span className="text-white/20 text-[9px]">{game.completionRate}%</span>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Game Detail OR Skill Tree */}
          <div className="flex-1 h-full overflow-hidden"
            style={{
              background: 'rgba(8, 12, 18, 0.55)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AnimatePresence mode="wait">
              {rightPanel === 'achievements' ? (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <AchievementsContent
                    genre={selectedGenre}
                    selectedGame={selectedGame}
                    onSelectGame={(game) => { setSelectedGame(game); setRightPanel('achievements'); }}
                    games={gameData}
                  />
                </motion.div>
              ) : rightPanel === 'skilltree' ? (
                <motion.div
                  key="skilltree"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <SkillTreeContent genre={selectedGenre} />
                </motion.div>
              ) : selectedGame ? (
                <motion.div
                  key={`game-${selectedGame.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <GenreGameDetail
                    game={selectedGame}
                    genre={selectedGenre}
                    onClose={() => setSelectedGame(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center px-8"
                >
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedGenre.color} opacity-20 flex items-center justify-center mb-6`}>
                    <Gamepad2 className="w-10 h-10 text-white/40" />
                  </div>
                  <h2 className="text-xl font-bold text-white/30 mb-2">Select a Game</h2>
                  <p className="text-white/20 text-sm max-w-sm">
                    Choose a game from the {selectedGenre.name} library to explore its quests, achievement cards, and community progress.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    </GlassPageFrame>
  );
}