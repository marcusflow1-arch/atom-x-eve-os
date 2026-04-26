import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Mic, MicOff, Library, ChevronLeft, ChevronRight,
  Home, Play, ShoppingCart, ShoppingBag, Package, Sparkles,
  Newspaper, Trophy, Star, Flame, Zap, Shield, Sword, Target,
  Crown, Gem, Skull, Award, Lock,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/CartContext';

// ─── Constants (same as LunaBottomNav) ────────────────────────────────────────

const MOCK_DEVELOPERS = [
  { id: 1, name: 'Naughty Dog',           logo: 'https://via.placeholder.com/120?text=Naughty+Dog' },
  { id: 2, name: 'Rockstar Games',         logo: 'https://via.placeholder.com/120?text=Rockstar' },
  { id: 3, name: 'CD Projekt Red',         logo: 'https://via.placeholder.com/120?text=CD+Projekt' },
  { id: 4, name: 'FromSoftware',           logo: 'https://via.placeholder.com/120?text=FromSoftware' },
  { id: 5, name: 'Valve',                  logo: 'https://via.placeholder.com/120?text=Valve' },
  { id: 6, name: 'Epic Games',             logo: 'https://via.placeholder.com/120?text=Epic' },
  { id: 7, name: 'Activision Blizzard',    logo: 'https://via.placeholder.com/120?text=Activision' },
  { id: 8, name: 'Electronic Arts',        logo: 'https://via.placeholder.com/120?text=EA' },
  { id: 9, name: 'Take-Two Interactive',   logo: 'https://via.placeholder.com/120?text=Take-Two' },
  { id: 10, name: 'Ubisoft',               logo: 'https://via.placeholder.com/120?text=Ubisoft' },
  { id: 11, name: 'Microsoft Game Studios',logo: 'https://via.placeholder.com/120?text=Microsoft' },
  { id: 12, name: 'Sony Interactive',      logo: 'https://via.placeholder.com/120?text=Sony' },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1,  title: 'First Blood',   desc: 'Get your first kill',               icon: Sword,  unlocked: true,  rarity: 'common' },
  { id: 2,  title: 'Survivor',      desc: 'Complete without dying',            icon: Shield, unlocked: true,  rarity: 'uncommon' },
  { id: 3,  title: 'On Fire',       desc: '5 kills in a row',                  icon: Flame,  unlocked: true,  rarity: 'rare' },
  { id: 4,  title: 'Sharpshooter', desc: '100 headshots',                      icon: Target, unlocked: false, rarity: 'rare' },
  { id: 5,  title: 'Power Surge',   desc: 'All abilities in one match',        icon: Zap,    unlocked: false, rarity: 'epic' },
  { id: 6,  title: 'Champion',      desc: 'Win 50 ranked matches',             icon: Crown,  unlocked: false, rarity: 'epic' },
  { id: 7,  title: 'Legendary',     desc: 'Max prestige level',                icon: Gem,    unlocked: false, rarity: 'legendary' },
  { id: 8,  title: 'Ghost',         desc: 'Mission undetected',                icon: Skull,  unlocked: true,  rarity: 'uncommon' },
  { id: 9,  title: 'Ace',           desc: 'Win a 1v5',                         icon: Award,  unlocked: false, rarity: 'legendary' },
  { id: 10, title: 'Veteran',       desc: 'Play 200 matches',                  icon: Trophy, unlocked: true,  rarity: 'common' },
  { id: 11, title: 'Speed Demon',   desc: 'Campaign under 4 hours',            icon: Zap,    unlocked: false, rarity: 'epic' },
  { id: 12, title: 'Collector',     desc: 'Unlock all skins',                  icon: Star,   unlocked: false, rarity: 'rare' },
];

const RARITY_STYLES = {
  common:    { glow: 'rgba(160,160,160,0.3)', border: 'rgba(180,180,180,0.3)', text: '#aaa' },
  uncommon:  { glow: 'rgba(80,200,120,0.35)', border: 'rgba(80,200,120,0.35)', text: '#50c878' },
  rare:      { glow: 'rgba(80,140,255,0.4)',  border: 'rgba(80,140,255,0.4)',  text: '#5b8dff' },
  epic:      { glow: 'rgba(160,80,255,0.4)',  border: 'rgba(160,80,255,0.4)',  text: '#a050ff' },
  legendary: { glow: 'rgba(255,180,40,0.45)', border: 'rgba(255,180,40,0.45)', text: '#ffb828' },
};

const GENRE_FILTERS = [
  { id: 'action', label: 'Action' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'rpg', label: 'RPG' },
  { id: 'shooting', label: 'Shooter' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'horror', label: 'Horror' },
  { id: 'sports', label: 'Sports' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'simulation', label: 'Simulation' },
];

const SHOWCASE_LABELS = ['Trending', 'New Release', 'Top Rated', 'Staff Pick', 'Fan Favorite'];

// ─── Studio Carousel ──────────────────────────────────────────────────────────

function StudioCarousel({ games }) {
  const [idx, setIdx] = useState(0);
  const pool = games.slice(0, 10);

  useEffect(() => {
    if (!pool.length) return;
    const t = setInterval(() => setIdx(p => (p + 1) % pool.length), 3500);
    return () => clearInterval(t);
  }, [pool.length]);

  const game = pool[idx];
  if (!game) return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Flame className="w-8 h-8 text-white/10" />
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={game.id + idx}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <img src={game.banner_image || game.cover_image} alt={game.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute top-3 left-4">
            <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 rounded-full px-2.5 py-0.5">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-orange-300 text-[9px] font-bold uppercase tracking-wider">{SHOWCASE_LABELS[idx % SHOWCASE_LABELS.length]}</span>
            </div>
          </div>
          <div className="absolute bottom-3 left-4 right-10">
            <h3 className="text-white font-black text-sm truncate drop-shadow-lg">{game.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white/50 text-[9px]">{game.genre}</span>
              {game.price > 0 && <span className="text-green-400 font-bold text-[9px]">${game.price}</span>}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── The full extension panels (top Gaming Studios + bottom game grid) ─────────

function SearchExtension({ searchTerm, onClose }) {
  const [games, setGames] = useState([]);
  const [selectedDev, setSelectedDev] = useState(null);
  const [devSearch, setDevSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentRow, setCurrentRow] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => { base44.entities.Game.list().then(setGames); }, []);
  useEffect(() => { setShowTrailer(false); }, [selectedGame]);

  const filteredDevs = useMemo(() =>
    MOCK_DEVELOPERS.filter(d => d.name.toLowerCase().includes(devSearch.toLowerCase())),
    [devSearch]
  );

  const items = useMemo(() => {
    let all = games.map(g => ({ ...g, displayTitle: g.title, displayImage: g.cover_image || g.banner_image }));
    if (selectedDev) {
      let filtered = all.filter((_, i) => i % MOCK_DEVELOPERS.length === (selectedDev.id - 1) % MOCK_DEVELOPERS.length);
      if (!filtered.length) filtered = all.filter((_, i) => i % 3 === selectedDev.id % 3);
      all = filtered.length ? filtered : all;
    }
    if (selectedGenre) all = all.filter(g => g.genre?.toLowerCase().includes(selectedGenre));
    if (searchTerm?.trim()) {
      const t = searchTerm.trim().toLowerCase();
      all = all.filter(g => g.displayTitle?.toLowerCase().includes(t) || g.genre?.toLowerCase().includes(t));
    }
    return all;
  }, [games, selectedDev, selectedGenre, searchTerm]);

  const itemsPerRow = 7;
  const totalRows = Math.max(1, Math.ceil(items.length / itemsPerRow));
  const currentItems = items.slice(currentRow * itemsPerRow, (currentRow + 2) * itemsPerRow);

  const handleWheel = (e) => {
    if (e.deltaY > 0) setCurrentRow(p => Math.min(p + 1, totalRows - 1));
    else setCurrentRow(p => Math.max(p - 1, 0));
  };

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Blurred backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[33]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* ── TOP PANEL: Gaming Studios ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed right-0 z-[34]"
        style={{
          top: '64px',
          left: '5%',
          height: '200px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.90) 80%, transparent 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="w-full h-full max-w-[1400px] mx-auto flex overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedGame ? (
              /* Game selected — trailer + screenshots left, actions + achievements right */
              <motion.div key="game-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex">
                {/* LEFT */}
                <div className="w-[55%] h-full flex gap-2 px-4 py-3 overflow-hidden">
                  <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer">
                    <img src={selectedGame.banner_image || selectedGame.cover_image || selectedGame.displayImage} alt={selectedGame.displayTitle} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-3"><span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Official Trailer</span></div>
                  </div>
                  <div className="flex flex-col gap-2 w-24">
                    {[selectedGame.cover_image, ...(selectedGame.screenshots || []), 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'].filter(Boolean).slice(0, 3).map((img, i) => (
                      <div key={i} className="flex-1 rounded-lg overflow-hidden border border-white/10 relative">
                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* RIGHT */}
                <div className="flex-1 h-full flex flex-col px-4 py-3 gap-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-white font-black text-sm truncate">{selectedGame.displayTitle}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[8px] text-cyan-300 font-bold uppercase">{selectedGame.genre || 'Action'}</span>
                          {selectedGame.price > 0 && <span className="text-green-400 font-black text-xs">${selectedGame.price}</span>}
                        </div>
                      </div>
                      <button onClick={() => setSelectedGame(null)} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/10 flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addToCart({ id: selectedGame.id, title: selectedGame.displayTitle, price: selectedGame.price || 0, cover_image: selectedGame.displayImage, type: 'game' })} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                        <ShoppingCart className="w-3 h-3" /> Buy ${selectedGame.price || '0.00'}
                      </button>
                      <button onClick={() => navigate(createPageUrl('GameDetail') + '?id=' + selectedGame.id + '&from=library')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[10px] font-semibold transition-all">
                        <ShoppingBag className="w-3 h-3" /> Store Page
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mb-1.5 flex-shrink-0">Achievements</p>
                    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {MOCK_ACHIEVEMENTS.map((ach) => {
                          const Icon = ach.icon;
                          const colors = { 1: '#22d3ee', 2: '#a78bfa', 3: '#fb923c', 4: '#f87171', 5: '#facc15', 6: '#fbbf24', 7: '#c084fc', 8: '#94a3b8', 9: '#22d3ee', 10: '#fbbf24', 11: '#a78bfa', 12: '#4ade80' };
                          const c = colors[ach.id] || '#22d3ee';
                          return (
                            <div key={ach.id} className="flex flex-col items-center justify-center gap-1 rounded-xl p-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${c}18`, boxShadow: `0 0 10px ${c}30` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: c }} />
                              </div>
                              <p className="text-white/50 text-[7px] font-bold text-center truncate w-full px-0.5">{ach.title}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Default — Studios list + spotlight */
              <motion.div key="studios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex">
                {/* LEFT 50% — Studios */}
                <div className="w-1/2 flex flex-col h-full px-6 py-3">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <h3 className="text-xs font-black text-white tracking-widest uppercase">Gaming Studios</h3>
                    <div className="relative w-44">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                      <input type="text" placeholder="Search studios..." value={devSearch} onChange={e => setDevSearch(e.target.value)} className="w-full pl-8 pr-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] placeholder-white/35 focus:outline-none focus:border-cyan-400/50 transition-all" />
                    </div>
                  </div>
                  <div className="grid overflow-y-auto flex-1" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', scrollbarWidth: 'none', minHeight: '80px' }}>
                    {filteredDevs.map(dev => (
                      <div key={dev.id} onClick={() => setSelectedDev(selectedDev?.id === dev.id ? null : dev)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${selectedDev?.id === dev.id ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08] hover:border-white/10'}`}>
                        <img src={dev.logo} alt={dev.name} className="w-7 h-7 rounded-md object-cover bg-white/10 flex-shrink-0" />
                        <p className={`text-[9px] font-semibold leading-tight line-clamp-2 ${selectedDev?.id === dev.id ? 'text-cyan-300' : 'text-white/75'}`}>{dev.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* RIGHT 50% — Spotlight */}
                <div className="w-1/2 h-full relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    {selectedDev ? (
                      <motion.div key={selectedDev.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
                        {(() => {
                          const devGames = games.filter((_, i) => i % MOCK_DEVELOPERS.length === (selectedDev.id - 1) % MOCK_DEVELOPERS.length);
                          const latest = [...devGames].sort((a, b) => (b.original_year || 0) - (a.original_year || 0))[0];
                          const banner = latest?.banner_image || latest?.cover_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200';
                          return (
                            <>
                              <img src={banner} alt={selectedDev.name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.2) 100%)' }} />
                              <div className="absolute inset-0 flex flex-col justify-center px-6 gap-3">
                                <div className="flex items-center gap-3">
                                  <img src={selectedDev.logo} alt={selectedDev.name} className="w-10 h-10 rounded-xl border border-white/20 object-cover bg-white/10 flex-shrink-0" />
                                  <div>
                                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Developer</p>
                                    <h2 className="text-white font-black text-base tracking-wide">{selectedDev.name}</h2>
                                    <span className="text-white/50 text-[9px]">{devGames.length} game{devGames.length !== 1 ? 's' : ''} in library</span>
                                  </div>
                                </div>
                                {latest && (
                                  <div>
                                    <p className="text-cyan-400/80 text-[9px] font-bold uppercase tracking-widest mb-1.5">Latest Release</p>
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/15 flex-shrink-0">
                                        <img src={latest.cover_image || latest.banner_image} alt={latest.title} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-white font-bold text-xs truncate">{latest.title}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[8px] text-cyan-300 font-bold uppercase">{latest.genre || 'Action'}</span>
                                          {latest.price > 0 && <span className="text-green-400 font-black text-[9px]">${latest.price}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    ) : (
                      <motion.div key="carousel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                        <StudioCarousel games={games} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── BOTTOM PANEL: Game grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed bottom-[48px] right-0 z-[34] p-6 flex flex-col justify-end"
        style={{
          left: '5%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
          backdropFilter: 'blur(12px)',
        }}
        onWheel={handleWheel}
      >
        {/* Filter bar */}
        <div className="w-full max-w-[1400px] mx-auto mb-3 px-2 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Library className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold text-xs uppercase tracking-widest">Store Library</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 flex-shrink-0 text-white/40 text-[10px]">
            <span>{currentRow + 1}/{totalRows}</span>
            <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button onClick={() => setCurrentRow(p => Math.max(0, p - 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setCurrentRow(p => Math.min(totalRows - 1, p + 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

        {/* Two-row game grid */}
        <div className="flex flex-col gap-3 w-full max-w-[1400px] mx-auto px-2">
          {[0, 1].map(offset => {
            const start = (currentRow + offset) * itemsPerRow;
            const row = items.slice(start, start + itemsPerRow);
            return (
              <div key={offset} className="flex gap-4 w-full">
                {Array.from({ length: itemsPerRow }).map((_, i) => {
                  const item = row[i];
                  if (!item) return (
                    <div key={`empty-${offset}-${i}`} className="flex-1 aspect-[16/9] rounded-xl border border-white/10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white/20 text-4xl font-light">?</span>
                    </div>
                  );
                  return (
                    <div
                      key={item.id || i}
                      className={`flex-1 relative cursor-pointer group transition-all duration-300 ${selectedGame?.id === item.id ? 'ring-2 ring-cyan-400' : ''}`}
                      onClick={() => { setSelectedGame(item); setCurrentRow(0); setSelectedItem(null); }}
                    >
                      <div className="aspect-[16/9] rounded-xl overflow-hidden relative shadow-lg border border-white/10 group-hover:border-cyan-400/50">
                        <img src={item.displayImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.displayTitle} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 text-center">
                          <p className="text-white text-xs font-bold truncate tracking-wide">{item.displayTitle}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Full game detail overlay (double-click) ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed z-[100]"
            style={{ top: '72px', bottom: '240px', left: '80px', right: '24px' }}
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" onClick={() => setSelectedItem(null)} />
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(10,14,22,0.97) 0%, rgba(8,12,20,0.99) 100%)', backdropFilter: 'blur(24px)' }}>
              <div className="flex items-center gap-5 px-6 py-4 border-b border-white/8 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
                  <img src={selectedItem.displayImage || selectedItem.cover_image} alt={selectedItem.displayTitle} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-black text-xl truncate">{selectedItem.displayTitle}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[10px] text-cyan-300 font-bold uppercase">{selectedItem.genre || 'Action'}</span>
                    {selectedItem.price > 0 && <span className="text-green-400 font-black text-sm ml-1">${selectedItem.price}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => navigate(createPageUrl('GameDetail') + '?id=' + selectedItem.id + '&from=library')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all">
                    <ShoppingBag className="w-4 h-4" /> Store Page
                  </button>
                  <button onClick={() => addToCart({ id: selectedItem.id, title: selectedItem.displayTitle, price: selectedItem.price || 0, cover_image: selectedItem.displayImage, type: 'game' })} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm transition-all">
                    <ShoppingCart className="w-4 h-4" /> Buy — ${selectedItem.price || '0.00'}
                  </button>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white border border-white/10 ml-2 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Body */}
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <div className="w-[48%] flex flex-col border-r border-white/8 min-h-0">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 flex-shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-xs uppercase tracking-widest text-white">Achievements</span>
                    <span className="ml-auto text-white/30 text-xs">{MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length}/{MOCK_ACHIEVEMENTS.length} Unlocked</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5 content-start" style={{ scrollbarWidth: 'none' }}>
                    {MOCK_ACHIEVEMENTS.map((ach) => {
                      const s = RARITY_STYLES[ach.rarity];
                      const Icon = ach.icon;
                      return (
                        <div key={ach.id} className="flex items-center gap-3 rounded-xl p-3 border transition-all" style={{ background: ach.unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', border: ach.unlocked ? `1px solid ${s.border}` : '1px solid rgba(255,255,255,0.06)', opacity: ach.unlocked ? 1 : 0.45 }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ach.unlocked ? s.glow : 'rgba(255,255,255,0.04)', border: `1px solid ${ach.unlocked ? s.border : 'rgba(255,255,255,0.06)'}` }}>
                            {ach.unlocked ? <Icon className="w-4 h-4" style={{ color: s.text }} /> : <Lock className="w-3.5 h-3.5 text-white/20" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: ach.unlocked ? s.text : 'rgba(255,255,255,0.25)' }}>{ach.title}</p>
                            <p className="text-[10px] text-white/30 truncate">{ach.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-bold text-xs uppercase tracking-widest">Content & Updates</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
                    <div className="rounded-xl overflow-hidden border border-white/8 relative" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.06))' }}>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">Latest Update</span>
                          <span className="text-white/25 text-[10px]">2 days ago</span>
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Season 4: Cyber Dawn</h4>
                        <p className="text-white/50 text-xs leading-relaxed">New maps, weapon balance fixes, cybernetic implants added to marketplace.</p>
                      </div>
                    </div>
                    {[{ name: 'Neon District Pack', desc: '3 new maps + exclusive skins', price: 9.99 }, { name: 'Cyber Armory Bundle', desc: 'Weapon skins & gear set', price: 14.99 }, { name: 'Season Pass Vol.4', desc: 'Full season content unlock', price: 24.99 }].map((dlc) => (
                      <div key={dlc.name} className="flex items-center gap-3 rounded-xl p-3 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-purple-400" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{dlc.name}</p>
                          <p className="text-white/35 text-[10px]">{dlc.desc}</p>
                        </div>
                        <button onClick={() => addToCart({ id: selectedItem.id + '-' + dlc.name, title: dlc.name, price: dlc.price, type: 'dlc' })} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/20 transition-all">${dlc.price}</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function GlobalGameSearch() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Also respond to global events (from LunaBottomNav wiring)
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleChange = (e) => { setSearchTerm(e.detail?.value || ''); setOpen(true); };
    window.addEventListener('globalSearchOpen', handleOpen);
    window.addEventListener('globalSearchChange', handleChange);
    return () => {
      window.removeEventListener('globalSearchOpen', handleOpen);
      window.removeEventListener('globalSearchChange', handleChange);
    };
  }, []);

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => { setSearchTerm(e.results[0][0].transcript); setOpen(true); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  return (
    <>
      {/* Search pill trigger */}
      <div
        className="relative flex-shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer transition-all"
        style={{
          background: open ? 'rgba(34,211,238,0.08)' : 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(16px)',
          border: open ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(255,255,255,0.10)',
          minWidth: '220px',
        }}
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          placeholder="Search games..."
          onChange={(e) => { setSearchTerm(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
        />
        {open ? (
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); setSearchTerm(''); }} className="flex-shrink-0 text-white/40 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); handleMic(); }} className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/40 hover:text-white'}`}>
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Full extension UI */}
      <AnimatePresence>
        {open && (
          <SearchExtension
            key="extension"
            searchTerm={searchTerm}
            onClose={() => { setOpen(false); setSearchTerm(''); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}