import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Flame, Star, Zap, Trophy, Clock, ChevronRight, ChevronLeft,
  Play, Sparkles, TrendingUp, Gift, Calendar, Crown,
  Gamepad2, Eye, Heart, Bookmark, Tag, Percent
} from 'lucide-react';

const FEATURED_GAMES = [
  { id: 1, title: 'Cyber Nexus 2089', genre: 'Sci-Fi RPG', price: '$49.99', tag: 'NEW RELEASE', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=90', rating: 4.9, desc: 'An open-world cyberpunk adventure where your AI companion shapes every decision.', tags: ['RPG', 'Open World', 'Sci-Fi', 'Action'] },
  { id: 2, title: 'Void Hunters', genre: 'Action', price: '$34.99', originalPrice: '$59.99', discount: '-40%', tag: 'TOP SELLER', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1600&q=90', rating: 4.7, desc: 'Hunt monsters across dimensions with ever-evolving weaponry.', tags: ['Action', 'Co-op', 'Multiplayer'] },
  { id: 3, title: 'Arcane Depths', genre: 'Fantasy RPG', price: '$39.99', tag: 'TRENDING', img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=1600&q=90', rating: 4.8, desc: 'Descend into an infinite dungeon with roguelike mechanics and deep lore.', tags: ['Roguelike', 'Fantasy', 'Dark', 'RPG'] },
];

const POPULAR_GAMES = [
  { id: 1, title: 'Iron Legion', genre: 'Strategy', price: '$29.99', players: '142K', img: 'https://images.unsplash.com/photo-1548686304-89d188a80029?auto=format&fit=crop&w=400&q=80', heat: 95 },
  { id: 2, title: 'Neon Drift', genre: 'Racing', price: '$24.99', players: '89K', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=400&q=80', heat: 88 },
  { id: 3, title: 'Shadow Protocol', genre: 'Stealth', price: '$44.99', players: '203K', img: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?auto=format&fit=crop&w=400&q=80', heat: 99 },
  { id: 4, title: 'Mech Wars X', genre: 'Action', price: '$19.99', players: '67K', img: 'https://images.unsplash.com/photo-1535223289429-462dc3d42c23?auto=format&fit=crop&w=400&q=80', heat: 76 },
  { id: 5, title: 'Crystal Realms', genre: 'Puzzle', price: '$12.99', players: '54K', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80', heat: 71 },
  { id: 6, title: 'Ocean Odyssey', genre: 'Adventure', price: '$34.99', players: '117K', img: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400&q=80', heat: 83 },
];

const CATEGORIES = [
  { label: 'Action', img: 'https://images.unsplash.com/photo-1535223289429-462dc3d42c23?auto=format&fit=crop&w=400&q=80', color: 'from-red-900/80' },
  { label: 'Racing', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80', color: 'from-orange-900/80' },
  { label: 'Sci-Fi', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', color: 'from-cyan-900/80' },
  { label: 'RPG', img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=400&q=80', color: 'from-purple-900/80' },
  { label: 'Simulation', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=400&q=80', color: 'from-blue-900/80' },
  { label: 'Horror', img: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?auto=format&fit=crop&w=400&q=80', color: 'from-slate-900/80' },
];

const DEALS = [
  { id: 1, title: 'Ghostrunner II', discount: '-75%', originalPrice: '$29.99', price: '$7.49', type: "TODAY'S DEAL", img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
  { id: 2, title: 'The Bazaar', discount: '-50%', originalPrice: '$19.99', price: '$9.99', type: 'MIDWEEK DEAL', expiry: 'Ends Apr 8 @ 1PM', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80' },
  { id: 3, title: 'LORT Chronicles', discount: '-35%', originalPrice: '$14.99', price: '$9.74', type: 'MIDWEEK DEAL', expiry: 'Ends Apr 8 @ 1PM', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=600&q=80' },
  { id: 4, title: 'Crashlands 2', discount: '-60%', originalPrice: '$24.99', price: '$9.99', type: "TODAY'S DEAL", img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' },
];

const NEW_TRENDING = [
  { id: 1, title: "Darwin's Paradox", price: '$24.99', tags: ['Action', 'Adventure', 'Platformer'], date: 'Apr 2, 2026', img: 'https://images.unsplash.com/photo-1535223289429-462dc3d42c23?auto=format&fit=crop&w=300&q=80' },
  { id: 2, title: 'Breath of Fire IV', price: '$4.99', originalPrice: '$9.99', discount: '-50%', tags: ['RPG', 'JRPG', 'Party Based'], date: 'Apr 1, 2026', img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=300&q=80' },
  { id: 3, title: 'Resident Evil 3 Nemesis', price: '$4.99', originalPrice: '$9.99', discount: '-50%', tags: ['Survival Horror', 'Action', 'Adventure'], date: 'Apr 1, 2026', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=300&q=80' },
  { id: 4, title: 'Shadow Protocol', price: '$44.99', tags: ['Stealth', 'Action', 'Thriller'], date: 'Mar 31, 2026', img: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?auto=format&fit=crop&w=300&q=80' },
  { id: 5, title: 'Tombwalker', price: '$19.99', originalPrice: '$24.99', discount: '-20%', tags: ['Souls-like', 'Metroidvania'], date: 'Mar 31, 2026', img: 'https://images.unsplash.com/photo-1548686304-89d188a80029?auto=format&fit=crop&w=300&q=80' },
  { id: 6, title: 'GRIMF II', price: '$23.79', originalPrice: '$27.99', discount: '-15%', tags: ['Metroidvania', 'Action RPG'], date: 'Mar 31, 2026', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80' },
];

const TRIVIA = [
  { id: 1, q: 'Which game sold 10M copies in 3 days?', a: 'GTA V', icon: '🎮' },
  { id: 2, q: 'What year was first Pac-Man released?', a: '1980', icon: '👾' },
  { id: 3, q: 'Best-selling console game of all time?', a: 'Wii Sports', icon: '🏆' },
  { id: 4, q: 'What does RPG stand for?', a: 'Role-Playing Game', icon: '⚔️' },
];

function SectionHeader({ icon: Icon, color, label, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function StoreOverview({ onClose }) {
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [revealed, setRevealed] = useState({});
  const [wishlisted, setWishlisted] = useState({});
  const [hovered, setHovered] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const t = setInterval(() => setFeaturedIdx(i => (i + 1) % FEATURED_GAMES.length), 5500);
    return () => clearInterval(t);
  }, []);

  const feat = FEATURED_GAMES[featuredIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0a0e16 0%, #0d1420 60%, #080c12 100%)' }}
    >
      <button
        onClick={onClose}
        className="fixed top-[68px] right-4 z-[60] w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div className="pb-28 space-y-8 max-w-[1600px] mx-auto px-5 pt-4">

        {/* ══ 1. FEATURED HERO ══ */}
        <section>
          <div className="relative h-[340px] rounded-2xl overflow-hidden cursor-pointer select-none" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={feat.id}
                src={feat.img}
                alt={feat.title}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute inset-0 flex items-end p-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">{feat.tag}</span>
                  <span className="text-white/40 text-xs">{feat.genre}</span>
                </div>
                <h2 className="text-5xl font-black text-white leading-none mb-2 tracking-tight">{feat.title}</h2>
                <p className="text-white/55 text-sm max-w-sm mb-4 leading-relaxed">{feat.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {feat.tags.map(t => (
                    <span key={t} className="text-[10px] text-cyan-300/70 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md font-medium">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-bold">{feat.rating}</span>
                  </div>
                  {feat.originalPrice && <span className="text-white/30 text-sm line-through">{feat.originalPrice}</span>}
                  <span className="text-2xl font-black text-white">{feat.price}</span>
                  {feat.discount && <span className="bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-md">{feat.discount}</span>}
                </div>
                <div className="flex gap-3 mt-5">
                  <button className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-white/90 transition-all">
                    <Play className="w-4 h-4 fill-current" /> Add to Cart
                  </button>
                  <button className="flex items-center gap-2 bg-white/8 text-white/80 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-white/15 transition-all border border-white/10">
                    <Eye className="w-4 h-4" /> View Page
                  </button>
                </div>
              </div>

              {/* Right thumbnail strip */}
              <div className="hidden lg:flex flex-col gap-2 ml-8">
                {FEATURED_GAMES.map((g, i) => (
                  <button key={g.id} onClick={() => setFeaturedIdx(i)} className={`relative w-28 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === featuredIdx ? 'border-white scale-105' : 'border-white/20 opacity-50 hover:opacity-80'}`}>
                    <img src={g.img} alt={g.title} className="w-full h-full object-cover" />
                    {i === featuredIdx && <div className="absolute inset-0 bg-white/10" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
              {FEATURED_GAMES.map((_, i) => (
                <button key={i} onClick={() => setFeaturedIdx(i)} className={`rounded-full transition-all ${i === featuredIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ══ 2. POPULAR RIGHT NOW ══ */}
        <section>
          <SectionHeader icon={TrendingUp} color="text-cyan-400" label="Popular Right Now">
            <button className="flex items-center gap-1 text-white/35 hover:text-white/70 text-xs transition-colors font-medium">See More <ChevronRight className="w-3.5 h-3.5" /></button>
          </SectionHeader>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {POPULAR_GAMES.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -5 }}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              >
                <div className="aspect-[2/3] relative">
                  <img src={game.img} alt={game.title} className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                  <div className={`absolute top-2 left-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black ${game.heat > 90 ? 'bg-red-500/90 text-white' : game.heat > 80 ? 'bg-orange-500/90 text-white' : 'bg-white/20 text-white/70'}`}>
                    <Flame className="w-2.5 h-2.5" />{game.heat}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white font-bold text-[11px] truncate leading-tight">{game.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-white/40 text-[9px]">{game.players}</span>
                      <span className="text-green-400 text-[10px] font-black">{game.price}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ 3. DEALS & EVENTS ══ */}
        <section>
          <SectionHeader icon={Percent} color="text-green-400" label="Deals &amp; Events">
            <button className="flex items-center gap-1 text-white/35 hover:text-white/70 text-xs transition-colors font-medium">Browse More <ChevronRight className="w-3.5 h-3.5" /></button>
          </SectionHeader>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {DEALS.map((deal, idx) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="relative h-36">
                  <img src={deal.img} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-black/70 text-white/60 px-2 py-0.5 rounded">{deal.type}</span>
                  </div>
                </div>
                <div className="p-3 bg-[#0d1520]">
                  <p className="text-white font-bold text-sm truncate mb-1">{deal.title}</p>
                  {deal.expiry && <p className="text-white/35 text-[10px] mb-2">{deal.expiry}</p>}
                  <div className="flex items-center gap-2">
                    <span className="bg-[#4c6b22] text-[#a4d007] font-black text-sm px-2 py-0.5 rounded">{deal.discount}</span>
                    <span className="text-white/30 text-xs line-through">{deal.originalPrice}</span>
                    <span className="text-white font-black text-sm ml-auto">{deal.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ 4. BROWSE BY CATEGORY ══ */}
        <section>
          <SectionHeader icon={Tag} color="text-purple-400" label="Browse by Category" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.label}
                whileHover={{ scale: 1.04 }}
                className="relative h-20 rounded-xl overflow-hidden cursor-pointer group"
              >
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-80" />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                <div className="absolute inset-0 flex items-end p-2.5">
                  <span className="text-white font-black text-xs uppercase tracking-widest drop-shadow-lg">{cat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ 5. NEW & TRENDING + TRIVIA side by side ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* New & Trending list */}
          <section>
            <SectionHeader icon={Flame} color="text-orange-400" label="New &amp; Trending">
              <div className="flex gap-1">
                {['New & Trending', 'Top Sellers', 'Upcoming'].map((tab, i) => (
                  <button key={tab} className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all ${i === 0 ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'}`}>{tab}</button>
                ))}
              </div>
            </SectionHeader>
            <div className="rounded-xl overflow-hidden border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {NEW_TRENDING.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  onMouseEnter={() => setHovered(game.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-white/5 last:border-0 ${hovered === game.id ? 'bg-white/[0.06]' : ''}`}
                >
                  <img src={game.img} alt={game.title} className="w-16 h-10 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{game.title}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {game.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] text-white/35 bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/30 text-[10px]">{game.date}</p>
                    {game.discount && (
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="bg-[#4c6b22] text-[#a4d007] font-black text-[10px] px-1.5 py-0.5 rounded">{game.discount}</span>
                        <span className="text-white font-bold text-sm">{game.price}</span>
                      </div>
                    )}
                    {!game.discount && <p className="text-white font-bold text-sm mt-0.5">{game.price}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Trivia panel */}
          <section>
            <SectionHeader icon={Sparkles} color="text-yellow-400" label="Daily Trivia" />
            <div className="flex flex-col gap-2.5">
              {TRIVIA.map(item => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 3 }}
                  onClick={() => setRevealed(p => ({ ...p, [item.id]: true }))}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-white/75 text-xs leading-snug mb-2">{item.q}</p>
                    <AnimatePresence>
                      {revealed[item.id] ? (
                        <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-yellow-400 font-bold text-sm">{item.a}</motion.span>
                      ) : (
                        <span className="text-white/20 text-[10px] italic">tap to reveal</span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* ══ 6. TOP CHARTS — Cinematic ranked cards ══ */}
        <section>
          <SectionHeader icon={Crown} color="text-amber-400" label="Top Charts This Week">
            <button className="flex items-center gap-1 text-white/35 hover:text-white/70 text-xs transition-colors font-medium">Full Charts <ChevronRight className="w-3.5 h-3.5" /></button>
          </SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {POPULAR_GAMES.map((game, idx) => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.02 }}
                className="group relative h-20 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-amber-400/20 transition-all"
              >
                <img src={game.img} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-400 scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                <div className="relative z-10 h-full flex items-center px-4 gap-4">
                  <span className={`text-3xl font-black w-9 text-right flex-shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-white/15'}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{game.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/35 text-[10px]">{game.genre}</span>
                      <span className="text-white/20 text-[10px]">·</span>
                      <span className="text-white/35 text-[10px]">{game.players} playing</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white font-black text-sm">{game.price}</span>
                    <div className={`w-2 h-2 rounded-full ${game.heat > 90 ? 'bg-red-500' : game.heat > 80 ? 'bg-orange-400' : 'bg-yellow-400'} shadow-lg`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ 7. FLASH DEALS — Full-art horizontal scroll ══ */}
        <section>
          <SectionHeader icon={Zap} color="text-green-400" label="Flash Deals">
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Limited time</span>
            </div>
          </SectionHeader>
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { title: 'Dungeon Crawler Bundle', pct: '-60%', from: '$79.99', to: '$31.99', img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=600&q=80' },
              { title: 'Space Explorer Pack', pct: '-45%', from: '$49.99', to: '$27.49', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80' },
              { title: 'Horror Mega Bundle', pct: '-70%', from: '$99.99', to: '$29.99', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=600&q=80' },
              { title: 'Indie Spotlight', pct: '-50%', from: '$39.99', to: '$19.99', img: 'https://images.unsplash.com/photo-1535223289429-462dc3d42c23?auto=format&fit=crop&w=600&q=80' },
              { title: 'Strategy Classics', pct: '-40%', from: '$59.99', to: '$35.99', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=600&q=80' },
              { title: 'RPG Legends', pct: '-55%', from: '$44.99', to: '$20.24', img: 'https://images.unsplash.com/photo-1548686304-89d188a80029?auto=format&fit=crop&w=600&q=80' },
            ].map((deal, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6 }}
                className="relative flex-shrink-0 w-52 h-64 rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-green-400/30 transition-all"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              >
                <img src={deal.img} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#4c6b22] text-[#a4d007] font-black text-sm px-2.5 py-1 rounded-lg">{deal.pct}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-sm mb-2 leading-snug">{deal.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/35 text-xs line-through">{deal.from}</span>
                    <span className="text-white font-black text-lg">{deal.to}</span>
                  </div>
                  <button className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-all border border-white/10">
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
}