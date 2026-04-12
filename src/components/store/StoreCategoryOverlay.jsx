import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Star, ChevronRight, Flame, Sparkles, TrendingUp, Trophy, Gem, Clock, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import WishlistButton from './WishlistButton';

const CATEGORIES = [
  { id: 'recommended', label: 'Recommended', icon: Sparkles, color: 'from-purple-500 to-pink-500', accent: 'text-purple-300', filter: (games) => [...games].sort(() => Math.random() - 0.5).slice(0, 20) },
  { id: 'new_releases', label: 'New Releases', icon: Clock, color: 'from-cyan-500 to-blue-500', accent: 'text-cyan-300', filter: (games) => [...games].sort((a, b) => (b.original_year || 0) - (a.original_year || 0)).slice(0, 20) },
  { id: 'top_rated', label: 'Top Rated', icon: Trophy, color: 'from-yellow-500 to-orange-500', accent: 'text-yellow-300', filter: (games) => [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 20) },
  { id: 'trending', label: 'Trending', icon: Flame, color: 'from-red-500 to-orange-500', accent: 'text-red-300', filter: (games) => [...games].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 20) },
  { id: 'hidden_gems', label: 'Hidden Gems', icon: Gem, color: 'from-green-500 to-teal-500', accent: 'text-green-300', filter: (games) => games.filter(g => (g.rating || 0) < 4 && (g.rating || 0) > 3).slice(0, 20) },
];

function GameDetailPanel({ game, onBack }) {
  const { addToCart } = useCart();
  if (!game) return null;

  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Banner */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        <img
          src={game.banner_image || game.cover_image}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        {/* Title row over banner */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end gap-4">
            <img src={game.cover_image} alt="" className="w-16 h-20 object-cover rounded-lg border border-white/20 shadow-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-xl leading-tight truncate">{game.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/50 text-xs">{game.genre}</span>
                {game.rating && (
                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{game.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'none' }}>
        {/* Price + actions */}
        <div className="flex items-center gap-3">
          <span className="text-green-400 font-black text-2xl">${game.price || '0.00'}</span>
          <button
            onClick={() => addToCart({ id: game.id, title: game.title, image: game.cover_image, price: game.price || 0, type: 'game' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-sm font-bold hover:bg-cyan-500/30 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
          <WishlistButton game={game} />
        </div>

        {/* Description */}
        {game.description && (
          <div>
            <h3 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-2">About</h3>
            <p className="text-white/70 text-sm leading-relaxed">{game.description}</p>
          </div>
        )}

        {/* Tags */}
        {game.tags && game.tags.length > 0 && (
          <div>
            <h3 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {game.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* System Requirements */}
        {game.system_requirements && Object.keys(game.system_requirements).length > 0 && (
          <div>
            <h3 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-2">System Requirements</h3>
            <div className="space-y-1">
              {Object.entries(game.system_requirements).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-white/30 text-xs capitalize w-20 flex-shrink-0">{key}:</span>
                  <span className="text-white/60 text-xs">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <div>
            <h3 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-2">Screenshots</h3>
            <div className="grid grid-cols-2 gap-2">
              {game.screenshots.slice(0, 4).map((src, i) => (
                <img key={i} src={src} alt="" className="rounded-lg object-cover w-full h-24 border border-white/10" />
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {game.status && (
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs capitalize">{game.status.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function StoreCategoryOverlay({ category, games, onClose }) {
  const [selectedGame, setSelectedGame] = useState(null);

  const cat = CATEGORIES.find(c => c.id === category);
  const filteredGames = useMemo(() => cat ? cat.filter(games) : [], [cat, games]);

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (selectedGame) setSelectedGame(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedGame, onClose]);

  if (!cat) return null;
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(10,14,20,0.98) 0%, rgba(15,20,30,0.99) 100%)', backdropFilter: 'blur(30px)' }}
    >
      {/* ═══ LEFT: Game List (15% when game selected, 100% when not) ═══ */}
      <motion.div
        animate={{ width: selectedGame ? '15%' : '100%' }}
        transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
        className="h-full flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: selectedGame ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/8 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          {!selectedGame && (
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-lg">{cat.label}</h2>
              <p className="text-white/35 text-xs">{filteredGames.length} games</p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {selectedGame && (
              <button
                onClick={() => setSelectedGame(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/20 flex items-center justify-center transition-all"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 text-white/50 hover:text-red-300" />
            </button>
          </div>
        </div>

        {/* Game list */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
              <Icon className="w-10 h-10 opacity-30" />
              <p className="text-sm">No games found</p>
            </div>
          ) : (
            <div className={selectedGame ? 'space-y-0' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4'}>
              {filteredGames.map((game) =>
                selectedGame ? (
                  /* Compact list row when game selected */
                  <motion.button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-l-2 ${
                      selectedGame?.id === game.id
                        ? `border-l-cyan-400 bg-white/8 text-white`
                        : 'border-l-transparent text-white/50 hover:text-white hover:bg-white/4'
                    }`}
                  >
                    <img src={game.cover_image} alt="" className="w-7 h-9 object-cover rounded flex-shrink-0 border border-white/10" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold leading-tight line-clamp-2">{game.title}</p>
                    </div>
                  </motion.button>
                ) : (
                  /* Grid card when no game selected */
                  <motion.div
                    key={game.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => setSelectedGame(game)}
                    className="group aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/30 shadow-lg relative bg-slate-900 transition-all"
                  >
                    <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-bold text-sm leading-tight truncate">{game.title}</h4>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-white/40">{game.genre}</span>
                        <span className="text-green-400 font-bold">${game.price}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ RIGHT: Game Detail (85%) ═══ */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '85%' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
            className="h-full flex-1 overflow-hidden"
            style={{ background: 'rgba(8, 12, 18, 0.6)' }}
          >
            <AnimatePresence mode="wait">
              <GameDetailPanel key={selectedGame.id} game={selectedGame} onBack={() => setSelectedGame(null)} />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { CATEGORIES };