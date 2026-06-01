import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Play, Clock, Trophy, Star, Download,
  Radio, Heart, Settings, Users, Zap, ChevronUp, Filter
} from 'lucide-react';

const FILTERS = ['All', 'Playing', 'Installed', 'New'];

const ALL_GAMES = [
  { id: 'cyberpunk', title: 'Cyberpunk 2088', genre: 'RPG / Action', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200', status: 'Playing', progress: 72, playtime: '48.2h', achievements: '18/50', rating: 9.4, players: '2.1M', description: 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality. Every choice echoes through a fractured future.', tags: ['Open World', 'Story Rich', 'Cyberpunk'] },
  { id: 'neon-legends', title: 'Neon Legends', genre: 'Action / Brawler', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200', status: 'In Progress', progress: 45, playtime: '12.8h', achievements: '6/30', rating: 8.7, players: '880K', description: 'Battle across neon-lit arenas in fast-paced combat. Unlock legendary fighters and dominate online leaderboards.', tags: ['Fighting', 'Multiplayer', 'Competitive'] },
  { id: 'stellar-odyssey', title: 'Stellar Odyssey', genre: 'Space Sim', thumb: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200', status: 'Installed', progress: 10, playtime: '3.1h', achievements: '2/40', rating: 8.1, players: '320K', description: 'Chart unexplored galaxies, build starships, and forge alliances with alien civilizations across the cosmos.', tags: ['Space', 'Exploration', 'Sci-Fi'] },
  { id: 'shadow-realm', title: 'Shadow Realm', genre: 'Fantasy RPG', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200', status: 'New', progress: 0, playtime: '0h', achievements: '0/45', rating: 9.1, players: '1.4M', description: 'A dark fantasy epic where ancient gods clash and mortal heroes rise. Shape the fate of a world on the edge of oblivion.', tags: ['Dark Fantasy', 'RPG', 'Souls-like'] },
  { id: 'apex-surge', title: 'Apex Surge', genre: 'Battle Royale', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200', status: 'Installed', progress: 33, playtime: '20.5h', achievements: '9/25', rating: 8.5, players: '3.8M', description: 'Drop into high-stakes arenas where only the most skilled survive. Craft your loadout and outsmart 99 rivals.', tags: ['Battle Royale', 'FPS', 'Competitive'] },
  { id: 'mythforge', title: 'MythForge Online', genre: 'MMORPG', thumb: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200', status: 'Playing', progress: 88, playtime: '210h', achievements: '44/50', rating: 9.6, players: '5.2M', description: 'A massive living world of mythic quests, guild wars, and ever-evolving lore. Your legend is never finished.', tags: ['MMORPG', 'PvP', 'Crafting', 'Guild'] },
  { id: 'dragon-siege', title: 'Dragon Siege', genre: 'Strategy', thumb: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=300', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200', status: 'New', progress: 5, playtime: '1.2h', achievements: '1/20', rating: 8.3, players: '420K', description: 'Command armies, manage resources, and build your empire across a war-torn continent.', tags: ['Strategy', 'RTS'] },
  { id: 'void-runner', title: 'Void Runner', genre: 'Platformer', thumb: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=300', image: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=1200', status: 'Installed', progress: 60, playtime: '8.4h', achievements: '12/30', rating: 7.9, players: '180K', description: 'Race through procedurally generated voids with fluid movement mechanics and breathtaking level design.', tags: ['Platformer', 'Roguelite'] },
  { id: 'iron-alliance', title: 'Iron Alliance', genre: 'FPS / Tactical', thumb: 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=300', image: 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=1200', status: 'Installed', progress: 20, playtime: '5.7h', achievements: '3/35', rating: 8.0, players: '650K', description: 'Team-based tactical shooter where communication and strategy win battles.', tags: ['FPS', 'Tactical', 'Team'] },
  { id: 'nova-drift', title: 'Nova Drift', genre: 'Arcade', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', status: 'New', progress: 0, playtime: '0h', achievements: '0/15', rating: 7.5, players: '90K', description: 'Hyper-kinetic space shooter with a deep upgrade tree and endless wave survival.', tags: ['Arcade', 'Space', 'Survival'] },
  { id: 'chrono-breach', title: 'Chrono Breach', genre: 'Puzzle / Adventure', thumb: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=300', image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200', status: 'Playing', progress: 55, playtime: '14h', achievements: '10/28', rating: 9.0, players: '1.1M', description: 'Time-manipulation puzzles meet narrative adventure in this mind-bending journey through fractured timelines.', tags: ['Puzzle', 'Adventure', 'Story'] },
  { id: 'storm-knights', title: 'Storm Knights', genre: 'Action RPG', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200', status: 'Installed', progress: 40, playtime: '18.3h', achievements: '14/40', rating: 8.6, players: '780K', description: 'Hack-and-slash action RPG with a deep loot system and relentless boss encounters.', tags: ['Action RPG', 'Hack and Slash', 'Loot'] },
];

export default function LibraryLandingPage({ games, onClose }) {
  const gamesList = (games && games.length > 0) ? games : ALL_GAMES;

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);
  const [wishlisted, setWishlisted] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const gridScrollRef = useRef(null);

  const handleGridScroll = (e) => setShowScrollTop(e.target.scrollTop > 100);
  const scrollToTop = () => gridScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const filtered = useMemo(() => {
    let result = [...gamesList];
    if (search) result = result.filter(g =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.genre.toLowerCase().includes(search.toLowerCase())
    );
    if (activeFilter !== 'All') {
      result = result.filter(g =>
        activeFilter === 'Playing'
          ? (g.status === 'Playing' || g.status === 'In Progress')
          : g.status === activeFilter
      );
    }
    return result;
  }, [search, activeFilter, gamesList]);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'rgba(5,8,14,0.92)' }}>
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Full Library</span>
        <span className="text-white/20 text-[10px]">{filtered.length} games</span>
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 text-white/25 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search library..."
            className="w-44 bg-white/[0.06] border border-white/[0.07] rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/15"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-medium transition-all ${
                activeFilter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'bg-white/[0.04] text-white/30 border border-white/[0.06] hover:text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.05] border border-white/[0.08] text-white/30 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Body: grid + detail panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Game Grid */}
        <div
          ref={gridScrollRef}
          onScroll={handleGridScroll}
          className="overflow-y-auto flex-1 min-w-0"
          style={{ scrollbarWidth: 'none' }}
        >
          <div
            className="grid p-3 gap-2"
            style={{ gridTemplateColumns: selectedGame ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)' }}
          >
            {filtered.map((game, i) => {
              const isSelected = selectedGame?.id === game.id;
              return (
                <motion.button
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  onClick={() => setSelectedGame(isSelected ? null : game)}
                  className={`relative rounded-lg overflow-hidden group cursor-pointer text-left transition-all ${
                    isSelected ? 'ring-2 ring-cyan-400/60' : 'hover:ring-1 hover:ring-white/20'
                  }`}
                  style={{ aspectRatio: '2/3' }}
                >
                  {/* Cover art */}
                  <img
                    src={game.thumb || game.image}
                    alt={game.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Status badge */}
                  {(game.status === 'Playing' || game.status === 'In Progress') && (
                    <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                  )}
                  {game.status === 'New' && (
                    <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded text-[7px] font-bold text-emerald-300 bg-emerald-500/25 border border-emerald-400/30">
                      NEW
                    </div>
                  )}

                  {/* Title at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[9px] font-semibold leading-tight truncate">{game.title}</p>
                  </div>

                  {/* Hover play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-white/20">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No games found</p>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Game Detail Panel */}
        <AnimatePresence>
          {selectedGame && (
            <motion.div
              key={selectedGame.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              className="flex-shrink-0 flex flex-col overflow-hidden border-l border-white/[0.06]"
              style={{ width: '220px' }}
            >
              {/* Hero image */}
              <div className="relative flex-shrink-0" style={{ height: '140px' }}>
                <img
                  src={selectedGame.image || selectedGame.thumb}
                  alt={selectedGame.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'brightness(0.6) saturate(1.2)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05080e] via-[#05080e]/20 to-transparent" />
                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white/60" />
                </button>
                <div className="absolute bottom-2 left-3 right-3">
                  <h2 className="text-white text-xs font-black leading-tight">{selectedGame.title}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-white/35 text-[8px]">{selectedGame.genre}</span>
                    {selectedGame.rating && (
                      <>
                        <span className="w-px h-1.5 bg-white/20" />
                        <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                        <span className="text-amber-300 text-[8px] font-bold">{selectedGame.rating}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Play button */}
              <div className="px-3 py-2.5 border-b border-white/[0.05] flex-shrink-0">
                <button
                  className="w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.35), rgba(99,102,241,0.25))', border: '1px solid rgba(34,211,238,0.4)' }}
                >
                  <Play className="w-3 h-3 fill-white" />
                  Play Now
                </button>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 border-b border-white/[0.05] flex-shrink-0">
                {[
                  { icon: Radio, label: 'Stream', color: 'text-purple-400' },
                  { icon: Trophy, label: 'Achieve', color: 'text-amber-400' },
                  { icon: Settings, label: 'Settings', color: 'text-white/40' },
                ].map(({ icon: Icon, label, color }, i) => (
                  <button
                    key={label}
                    className={`flex flex-col items-center gap-1 py-2 transition-colors hover:bg-white/[0.04] ${i < 2 ? 'border-r border-white/[0.05]' : ''}`}
                  >
                    <Icon className={`w-3 h-3 ${color}`} />
                    <span className="text-white/30 text-[7px]">{label}</span>
                  </button>
                ))}
              </div>

              {/* Update / Remove */}
              <div className="px-3 py-2 flex gap-2 border-b border-white/[0.05] flex-shrink-0">
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] text-white/45 border border-white/[0.07] hover:bg-white/[0.05] transition-colors">
                  <Download className="w-2.5 h-2.5" />
                  Update
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] text-red-400/60 border border-white/[0.07] hover:bg-red-500/10 transition-colors">
                  <X className="w-2.5 h-2.5" />
                  Remove
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 border-b border-white/[0.05] flex-shrink-0">
                {[
                  { label: 'Playtime', value: selectedGame.playtime || '0h' },
                  { label: 'Achievements', value: selectedGame.achievements || '0/0' },
                  { label: 'Last Played', value: '2d ago' },
                  { label: 'Progress', value: `${selectedGame.progress || 0}%` },
                ].map(({ label, value }, i) => (
                  <div key={label} className={`flex flex-col px-3 py-2 gap-0.5 ${i % 2 === 0 ? 'border-r border-white/[0.05]' : ''} ${i < 2 ? 'border-b border-white/[0.05]' : ''}`}>
                    <span className="text-white/20 text-[7px] uppercase tracking-wider">{label}</span>
                    <span className="text-white text-[10px] font-bold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Scrollable extra content */}
              <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {/* Latest Update */}
                <div>
                  <p className="text-white/20 text-[7px] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
                    Latest Update
                  </p>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.1)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/60 text-[9px] font-semibold">Patch 1.2.0</span>
                      <span className="text-white/20 text-[8px]">Today</span>
                    </div>
                    <p className="text-white/30 text-[8px] leading-relaxed">New content & balance changes for all classes.</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <p className="text-white/20 text-[7px] uppercase tracking-widest mb-1.5">Recent Activity</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: Trophy, color: 'text-amber-400', text: 'Unlocked "First Strike"', time: '2h ago' },
                      { icon: Users, color: 'text-blue-400', text: 'Friend started playing', time: '4h ago' },
                      { icon: Zap, color: 'text-purple-400', text: 'Weekly event started', time: '1d ago' },
                    ].map(({ icon: Icon, color, text, time }, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${color}`} />
                        <p className="text-white/30 text-[8px] flex-1 truncate">{text}</p>
                        <span className="text-white/15 text-[7px] flex-shrink-0">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {selectedGame.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedGame.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[7px] text-white/25 border border-white/[0.06]"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="h-3" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={scrollToTop}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] text-white/50 hover:text-white transition-all"
            style={{ background: 'rgba(10,14,24,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ChevronUp className="w-3 h-3" />
            Scroll to Top
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}