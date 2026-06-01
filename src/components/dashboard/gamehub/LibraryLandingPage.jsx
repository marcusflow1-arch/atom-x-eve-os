import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, X, Play, Clock, Trophy, ChevronUp, Star,
  Download, Radio, Heart, Settings, Users, ChevronRight, Zap
} from 'lucide-react';

const FILTERS = ['All', 'Playing', 'Installed', 'New', 'Favorites'];

const SORT_OPTIONS = ['Alphabetical', 'Last Played', 'Play Time', 'Achievements'];

export default function LibraryLandingPage({ games = [], onClose }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Last Played');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [wishlisted, setWishlisted] = useState({});
  const scrollRef = useRef(null);

  const handleScroll = (e) => setShowScrollTop(e.target.scrollTop > 150);
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const mockGames = games.length > 0 ? games : [
    { id: 'cyberpunk', title: 'Cyberpunk 2088', genre: 'RPG / Action', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200', status: 'Playing', progress: 72, playtime: '48.2h', achievements: '18/50', rating: 9.4, players: '2.1M', description: 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality.', tags: ['Open World', 'Story Rich', 'Cyberpunk'] },
    { id: 'neon-legends', title: 'Neon Legends', genre: 'Action / Brawler', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200', status: 'In Progress', progress: 45, playtime: '12.8h', achievements: '6/30', rating: 8.7, players: '880K', description: 'Battle across neon-lit arenas in fast-paced combat.', tags: ['Fighting', 'Multiplayer'] },
    { id: 'stellar-odyssey', title: 'Stellar Odyssey', genre: 'Space Sim', thumb: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200', status: 'Installed', progress: 10, playtime: '3.1h', achievements: '2/40', rating: 8.1, players: '320K', description: 'Chart unexplored galaxies and forge alliances.', tags: ['Space', 'Exploration'] },
    { id: 'shadow-realm', title: 'Shadow Realm', genre: 'Fantasy RPG', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200', status: 'New', progress: 0, playtime: '0h', achievements: '0/45', rating: 9.1, players: '1.4M', description: 'A dark fantasy epic where ancient gods clash.', tags: ['Dark Fantasy', 'RPG'] },
    { id: 'apex-surge', title: 'Apex Surge', genre: 'Battle Royale', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200', status: 'Installed', progress: 33, playtime: '20.5h', achievements: '9/25', rating: 8.5, players: '3.8M', description: 'Drop into high-stakes arenas where only the most skilled survive.', tags: ['Battle Royale', 'FPS'] },
    { id: 'mythforge', title: 'MythForge Online', genre: 'MMORPG', thumb: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200', status: 'Playing', progress: 88, playtime: '210h', achievements: '44/50', rating: 9.6, players: '5.2M', description: 'A massive living world of mythic quests and guild wars.', tags: ['MMORPG', 'PvP', 'Guild'] },
    { id: 'dragon-siege', title: 'Dragon Siege', genre: 'Strategy', thumb: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=300', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200', status: 'New', progress: 5, playtime: '1.2h', achievements: '1/20', rating: 8.3, players: '420K', description: 'Command armies and build your empire.', tags: ['Strategy', 'RTS'] },
    { id: 'void-runner', title: 'Void Runner', genre: 'Platformer', thumb: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=300', image: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=1200', status: 'Installed', progress: 60, playtime: '8.4h', achievements: '12/30', rating: 7.9, players: '180K', description: 'Race through procedurally generated voids.', tags: ['Platformer', 'Roguelite'] },
  ];

  const filtered = useMemo(() => {
    let result = [...mockGames];
    if (search) result = result.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.genre.toLowerCase().includes(search.toLowerCase()));
    if (activeFilter !== 'All') result = result.filter(g => g.status === activeFilter || (activeFilter === 'Playing' && (g.status === 'Playing' || g.status === 'In Progress')));
    if (sortBy === 'Alphabetical') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [search, activeFilter, sortBy, mockGames]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* LEFT: Game List Panel */}
      <motion.div
        animate={{ width: selectedGame ? '220px' : '100%' }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{ minWidth: selectedGame ? '220px' : undefined }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 flex-shrink-0 border-b border-white/[0.05]">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3 h-3 text-white/25 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-white/[0.06] border border-white/[0.07] rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/15"
            />
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border ${showFilter ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' : 'bg-white/[0.05] border-white/[0.08] text-white/40 hover:text-white'}`}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/[0.05] border border-white/[0.08] text-white/30 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 overflow-hidden border-b border-white/[0.05]"
            >
              <div className="px-4 py-3 space-y-3">
                {/* Status Filters */}
                <div>
                  <p className="text-white/20 text-[8px] uppercase tracking-widest mb-1.5">Status</p>
                  <div className="flex flex-wrap gap-1">
                    {FILTERS.map(f => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-medium transition-all ${activeFilter === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-white/[0.05] text-white/35 border border-white/[0.07] hover:text-white/60'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Sort */}
                <div>
                  <p className="text-white/20 text-[8px] uppercase tracking-widest mb-1.5">Sort By</p>
                  <div className="flex flex-wrap gap-1">
                    {SORT_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-medium transition-all ${sortBy === s ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' : 'bg-white/[0.05] text-white/35 border border-white/[0.07] hover:text-white/60'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Count */}
        <div className="px-4 py-2 flex-shrink-0">
          <p className="text-white/20 text-[9px] uppercase tracking-widest">
            {filtered.length} game{filtered.length !== 1 ? 's' : ''}
            {activeFilter !== 'All' && ` · ${activeFilter}`}
          </p>
        </div>

        {/* Game List */}
        <div
          ref={!selectedGame ? scrollRef : undefined}
          onScroll={!selectedGame ? handleScroll : undefined}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {filtered.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left ${selectedGame?.id === game.id ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}`}
            >
              {/* Thumb */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.08]">
                <img src={game.thumb || game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[11px] font-semibold truncate">{game.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${
                    game.status === 'Playing' || game.status === 'In Progress' ? 'bg-green-500/20 text-green-400' :
                    game.status === 'New' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>{game.status}</span>
                  {!selectedGame && <span className="text-white/25 text-[8px] truncate">{game.genre}</span>}
                </div>
              </div>
              {selectedGame?.id === game.id && <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />}
            </motion.button>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No games found</p>
            </div>
          )}
          <div className="h-8" />
        </div>

        {/* Scroll to top (list mode only) */}
        <AnimatePresence>
          {showScrollTop && !selectedGame && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              onClick={scrollToTop}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] text-white/50 hover:text-white transition-all"
              style={{ background: 'rgba(20,25,35,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronUp className="w-3 h-3" />
              Scroll to Top
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* RIGHT: Game Detail Panel (slides in when a game is selected) */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            key={selectedGame.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-w-0 flex flex-col overflow-hidden border-l border-white/[0.05]"
          >
            {/* Game hero */}
            <div className="relative flex-shrink-0" style={{ height: '160px' }}>
              <img
                src={selectedGame.image || selectedGame.thumb}
                alt={selectedGame.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'brightness(0.65) saturate(1.1)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18] via-[#0a0e18]/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e18]/60 to-transparent" />
              <button
                onClick={() => setSelectedGame(null)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center border border-white/10 transition-colors z-10"
              >
                <X className="w-3 h-3 text-white/70" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="text-white text-base font-black leading-tight drop-shadow-xl">{selectedGame.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/40 text-[9px]">{selectedGame.genre}</span>
                  {selectedGame.rating && (
                    <>
                      <span className="w-px h-2 bg-white/20" />
                      <div className="flex items-center gap-0.5">
                        <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                        <span className="text-amber-300 text-[9px] font-bold">{selectedGame.rating}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] flex-shrink-0">
              <button
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.2))', border: '1px solid rgba(34,211,238,0.35)' }}
              >
                <Play className="w-3 h-3 fill-current" />
                Play
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-white/50 border border-white/[0.07] hover:text-white transition-colors">
                <Radio className="w-2.5 h-2.5 text-purple-400" />
                Stream
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-white/50 border border-white/[0.07] hover:text-white transition-colors">
                <Download className="w-2.5 h-2.5" />
                Update
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setWishlisted(v => ({ ...v, [selectedGame.id]: !v[selectedGame.id] }))}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${wishlisted[selectedGame.id] ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-white/[0.04] border-white/[0.07] text-white/25 hover:text-white'}`}
              >
                <Heart className={`w-3 h-3 ${wishlisted[selectedGame.id] ? 'fill-current' : ''}`} />
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center border bg-white/[0.04] border-white/[0.07] text-white/25 hover:text-white transition-colors">
                <Settings className="w-3 h-3" />
              </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 border-b border-white/[0.05] flex-shrink-0">
              {[
                { label: 'PLAY TIME', value: selectedGame.playtime || '0h' },
                { label: 'LAST PLAYED', value: '2h ago' },
                { label: 'ACHIEVEMENTS', value: selectedGame.achievements || '0/0' },
              ].map(({ label, value }, i) => (
                <div key={i} className={`flex flex-col items-center py-2.5 gap-0.5 ${i < 2 ? 'border-r border-white/[0.05]' : ''}`}>
                  <span className="text-white/20 text-[7px] uppercase tracking-widest">{label}</span>
                  <span className="text-white text-xs font-bold">{value}</span>
                </div>
              ))}
            </div>

            {/* Completion bar */}
            <div className="px-4 py-2.5 border-b border-white/[0.04] flex-shrink-0">
              <div className="flex justify-between text-[8px] text-white/20 mb-1">
                <span>Completion</span>
                <span className="text-white/35 font-bold">{selectedGame.progress || 0}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedGame.progress || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #22d3ee, #818cf8)' }}
                />
              </div>
            </div>

            {/* Detail scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
              {selectedGame.description && (
                <p className="text-white/45 text-[10px] leading-relaxed">{selectedGame.description}</p>
              )}

              {/* Tags */}
              {selectedGame.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedGame.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] text-white/35 border border-white/[0.06]"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Recent activity */}
              <div>
                <p className="text-white/15 text-[8px] uppercase tracking-widest mb-2">Recent Activity</p>
                <div className="space-y-2">
                  {[
                    { icon: Trophy, color: 'text-amber-400', text: 'Unlocked "First Strike"', time: '2h ago' },
                    { icon: Users, color: 'text-blue-400', text: 'Friend started playing', time: '4h ago' },
                    { icon: Zap, color: 'text-purple-400', text: 'Weekly event started', time: '1d ago' },
                  ].map(({ icon: Icon, color, text, time }, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${color}`} />
                      <p className="text-white/35 text-[9px] flex-1 truncate">{text}</p>
                      <span className="text-white/15 text-[8px] flex-shrink-0">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top for detail panel */}
      <AnimatePresence>
        {showScrollTop && selectedGame && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={scrollToTop}
            className="absolute bottom-3 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] text-white/50 hover:text-white transition-all"
            style={{ background: 'rgba(20,25,35,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ChevronUp className="w-3 h-3" />
            Top
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}