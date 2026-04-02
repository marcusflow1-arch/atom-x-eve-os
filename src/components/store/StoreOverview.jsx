import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Flame, Star, Zap, Trophy, Clock, ChevronRight, 
  Play, Sparkles, TrendingUp, Gift, Calendar, Crown,
  Gamepad2, Eye, Heart, Bookmark
} from 'lucide-react';

const FEATURED_GAMES = [
  { id: 1, title: 'Cyber Nexus 2089', genre: 'Sci-Fi RPG', price: '$49.99', tag: 'NEW RELEASE', color: 'from-cyan-600 to-blue-800', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', rating: 4.9, desc: 'An open-world cyberpunk adventure where your AI companion shapes every decision.' },
  { id: 2, title: 'Void Hunters', genre: 'Action', price: '$34.99', tag: 'HOT', color: 'from-orange-600 to-red-800', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80', rating: 4.7, desc: 'Hunt monsters across dimensions with ever-evolving weaponry.' },
  { id: 3, title: 'Arcane Depths', genre: 'Fantasy RPG', price: '$39.99', tag: 'TRENDING', color: 'from-purple-600 to-indigo-800', img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=800&q=80', rating: 4.8, desc: 'Descend into an infinite dungeon with roguelike mechanics and deep lore.' },
];

const TRIVIA_GAMES = [
  { id: 1, q: 'Which game sold 10 million copies in 3 days?', a: 'GTA V', genre: 'Trivia', icon: '🎮' },
  { id: 2, q: 'What year was the first Pac-Man released?', a: '1980', genre: 'History', icon: '👾' },
  { id: 3, q: 'Which console had the best-selling game of all time?', a: 'Nintendo DS', genre: 'Quiz', icon: '🏆' },
  { id: 4, q: 'What does RPG stand for?', a: 'Role-Playing Game', genre: 'Basics', icon: '⚔️' },
];

const POPULAR_BOX_GAMES = [
  { id: 1, title: 'Iron Legion', genre: 'Strategy', price: '$29.99', players: '142K', img: 'https://images.unsplash.com/photo-1548686304-89d188a80029?auto=format&fit=crop&w=400&q=80', heat: 95 },
  { id: 2, title: 'Neon Drift', genre: 'Racing', price: '$24.99', players: '89K', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=400&q=80', heat: 88 },
  { id: 3, title: 'Shadow Protocol', genre: 'Stealth', price: '$44.99', players: '203K', img: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?auto=format&fit=crop&w=400&q=80', heat: 99 },
  { id: 4, title: 'Mech Wars X', genre: 'Action', price: '$19.99', players: '67K', img: 'https://images.unsplash.com/photo-1535223289429-462dc3d42c23?auto=format&fit=crop&w=400&q=80', heat: 76 },
  { id: 5, title: 'Crystal Realms', genre: 'Puzzle', price: '$12.99', players: '54K', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80', heat: 71 },
  { id: 6, title: 'Ocean Odyssey', genre: 'Adventure', price: '$34.99', players: '117K', img: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400&q=80', heat: 83 },
];

const COMING_SOON = [
  { id: 1, title: 'Project Eclipse', eta: 'Q2 2026', wishlist: '421K', img: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=600&q=80' },
  { id: 2, title: 'Titan Fall: Origins', eta: 'Summer 2026', wishlist: '289K', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80' },
  { id: 3, title: 'Realm Breaker', eta: 'Fall 2026', wishlist: '185K', img: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=600&q=80' },
];

function TriviaCard({ item, isRevealed, onReveal }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onReveal}
      className="relative p-5 rounded-2xl border border-white/10 cursor-pointer overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div className="text-3xl mb-3">{item.icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70 mb-2 block">{item.genre}</span>
      <p className="text-white/80 text-sm font-medium leading-snug mb-3">{item.q}</p>
      <AnimatePresence>
        {isRevealed ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-cyan-500/20 border border-cyan-400/30 rounded-lg px-3 py-1.5">
            <span className="text-cyan-300 text-sm font-bold">{item.a}</span>
          </motion.div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-center">
            <span className="text-white/30 text-xs">Tap to reveal</span>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StoreOverview({ onClose }) {
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [revealedTrivia, setRevealedTrivia] = useState({});
  const [wishlisted, setWishlisted] = useState({});

  useEffect(() => {
    const t = setInterval(() => setFeaturedIdx(i => (i + 1) % FEATURED_GAMES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const featured = FEATURED_GAMES[featuredIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #080c12 0%, #0f1520 40%, #0a0d14 100%)' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-[68px] right-4 z-[60] w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div className="px-6 py-4 pb-32 space-y-10 max-w-[1600px] mx-auto">

        {/* ── SECTION 1: GIANT FEATURED HERO ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Featured</span>
          </div>
          <div className="relative h-[320px] rounded-3xl overflow-hidden group cursor-pointer">
            <AnimatePresence mode="wait">
              <motion.img
                key={featured.id}
                src={featured.img}
                alt={featured.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className={`absolute inset-0 bg-gradient-to-r ${featured.color} opacity-50`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">{featured.tag}</span>
                  <span className="text-white/50 text-xs">{featured.genre}</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-2">{featured.title}</h2>
                <p className="text-white/60 text-sm max-w-md">{featured.desc}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-yellow-400"><Star className="w-3.5 h-3.5 fill-current" /><span className="text-sm font-bold">{featured.rating}</span></div>
                  <span className="text-green-400 font-bold text-lg">{featured.price}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-all">
                  <Play className="w-4 h-4" /> Buy Now
                </button>
                <button className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all border border-white/10">
                  <Eye className="w-4 h-4" /> Preview
                </button>
              </div>
            </div>

            {/* Dots */}
            <div className="absolute top-4 right-4 flex gap-1.5">
              {FEATURED_GAMES.map((_, i) => (
                <button key={i} onClick={() => setFeaturedIdx(i)} className={`rounded-full transition-all ${i === featuredIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 2: POPULAR RIGHT NOW — BOX GRID ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Popular Right Now</span>
            </div>
            <button className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors">View All <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {POPULAR_BOX_GAMES.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-cyan-400/40 transition-all"
              >
                <div className="aspect-[3/4] relative">
                  <img src={game.img} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  {/* Heat badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 rounded-full px-1.5 py-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${game.heat > 90 ? 'bg-red-500' : game.heat > 80 ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                    <span className="text-[10px] text-white/80 font-bold">{game.heat}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-xs truncate">{game.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/40 text-[10px]">{game.players} playing</span>
                      <span className="text-green-400 text-[10px] font-bold">{game.price}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: EVENT PROMOTION BANNER ── */}
        <section>
          <motion.div
            whileHover={{ scale: 1.005 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #0f0a1e 100%)' }}
          >
            {/* Animated orbs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl" />
            <div className="absolute inset-0 border border-purple-500/20 rounded-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-purple-400">Limited Event</span>
                  <h3 className="text-2xl font-black text-white mt-1">Spring Chaos Festival</h3>
                  <p className="text-white/50 text-sm mt-1">Up to 75% off 300+ titles. Exclusive bundles. New achievements unlocked daily.</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" /> Ends in
                </div>
                <div className="flex gap-2">
                  {[['14', 'Days'], ['06', 'Hours'], ['33', 'Mins']].map(([val, label]) => (
                    <div key={label} className="text-center bg-white/10 border border-white/10 rounded-xl px-3 py-2 min-w-[52px]">
                      <div className="text-2xl font-black text-white">{val}</div>
                      <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
                <button className="mt-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold px-6 py-2 rounded-full text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
                  Shop Event
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SECTION 4 + 5: TRIVIA + COMING SOON side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* TRIVIA CARDS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Daily Gaming Trivia</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TRIVIA_GAMES.map(item => (
                <TriviaCard
                  key={item.id}
                  item={item}
                  isRevealed={!!revealedTrivia[item.id]}
                  onReveal={() => setRevealedTrivia(p => ({ ...p, [item.id]: true }))}
                />
              ))}
            </div>
          </section>

          {/* COMING SOON — Tall card stack */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Coming Soon</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {COMING_SOON.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative h-[110px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-blue-400/40 transition-all"
                >
                  <img src={game.img} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-between px-5">
                    <div>
                      <p className="text-white font-bold text-base">{game.title}</p>
                      <p className="text-blue-400 text-xs mt-0.5">{game.eta}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-white/40 text-xs justify-end">
                        <Heart className="w-3 h-3" /> {game.wishlist}
                      </div>
                      <button
                        onClick={() => setWishlisted(p => ({ ...p, [game.id]: !p[game.id] }))}
                        className={`mt-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${wishlisted[game.id] ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' : 'bg-white/10 border-white/10 text-white/60 hover:text-white'}`}
                      >
                        {wishlisted[game.id] ? '✓ Wishlisted' : '+ Wishlist'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* ── SECTION 6: TOP CHARTS — Ranked list ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Top Charts This Week</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {POPULAR_BOX_GAMES.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-amber-400/20 hover:bg-white/[0.02] transition-all cursor-pointer group"
              >
                <span className={`text-2xl font-black w-8 text-right flex-shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-white/20'}`}>
                  {idx + 1}
                </span>
                <img src={game.img} alt={game.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{game.title}</p>
                  <p className="text-white/40 text-xs">{game.genre} · {game.players} playing</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm">{game.price}</p>
                  </div>
                  <Bookmark className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SECTION 7: QUICK DEALS — Horizontal pill row ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-400">Flash Deals</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { title: 'Dungeon Crawler Bundle', pct: '-60%', from: '$79.99', to: '$31.99', color: 'from-emerald-900/60 to-teal-900/60', border: 'border-emerald-500/30' },
              { title: 'Space Explorer Pack', pct: '-45%', from: '$49.99', to: '$27.49', color: 'from-blue-900/60 to-indigo-900/60', border: 'border-blue-500/30' },
              { title: 'Horror Mega Bundle', pct: '-70%', from: '$99.99', to: '$29.99', color: 'from-red-900/60 to-rose-900/60', border: 'border-red-500/30' },
              { title: 'Indie Spotlight', pct: '-50%', from: '$39.99', to: '$19.99', color: 'from-purple-900/60 to-pink-900/60', border: 'border-purple-500/30' },
              { title: 'Strategy Classics', pct: '-40%', from: '$59.99', to: '$35.99', color: 'from-amber-900/60 to-orange-900/60', border: 'border-amber-500/30' },
            ].map((deal, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className={`flex-shrink-0 w-52 p-4 rounded-2xl border ${deal.border} bg-gradient-to-br ${deal.color} cursor-pointer transition-all`}
              >
                <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full mb-3 inline-block">{deal.pct}</span>
                <p className="text-white font-bold text-sm mb-2 leading-snug">{deal.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs line-through">{deal.from}</span>
                  <span className="text-green-400 font-black text-base">{deal.to}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
}