import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingCart, Store, Star, Trophy, Zap, Shield, User,
  Database, Check, ChevronDown, Play, Tag, Calendar, Users
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MOCK_ACHIEVEMENTS = [
  { name: 'First Blood', icon: '⚔️', rarity: 'Common', description: 'Win your first match' },
  { name: 'Speed Runner', icon: '⚡', rarity: 'Rare', description: 'Complete act 1 in under 2 hours' },
  { name: 'Collector', icon: '💎', rarity: 'Epic', description: 'Collect 50 unique items' },
  { name: 'Unstoppable', icon: '🔥', rarity: 'Legendary', description: 'Win 10 matches in a row' },
  { name: 'Shadow Walker', icon: '👻', rarity: 'Uncommon', description: 'Complete a mission undetected' },
  { name: 'Master Crafter', icon: '🛠️', rarity: 'Rare', description: 'Craft 20 unique items' },
];

const RARITY_COLORS = {
  Common: 'text-slate-300 border-slate-500/30 bg-slate-800/40',
  Uncommon: 'text-green-400 border-green-500/30 bg-green-900/20',
  Rare: 'text-blue-400 border-blue-500/30 bg-blue-900/20',
  Epic: 'text-purple-400 border-purple-500/30 bg-purple-900/20',
  Legendary: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20',
};

const MOCK_DLC = [
  { id: 'dlc1', name: 'Neural Expansion Pack', price: 14.99, description: 'Unlock advanced abilities and 10 new story missions.', tags: ['Abilities', 'Story'] },
  { id: 'dlc2', name: 'Void Arsenal', price: 9.99, description: 'Stealth-focused equipment and void manipulation powers.', tags: ['Equipment', 'Stealth'] },
  { id: 'dlc3', name: 'Season Pass: Year One', price: 29.99, description: 'All future DLC releases for the first year.', tags: ['All Access', 'XP Boost'] },
];

export default function SearchGameQuickView({ game: initialGame, gameId, onClose, onGoToStore }) {
  const [game, setGame] = useState(initialGame || null);
  const [loading, setLoading] = useState(!initialGame);
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' | 'content'
  const [expandedDLC, setExpandedDLC] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart, isPurchased } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const owned = game ? isPurchased(game.id) : false;

  useEffect(() => {
    if (initialGame) { setGame(initialGame); return; }
    if (!gameId) return;
    base44.entities.Game.get(gameId).then(setGame).finally(() => setLoading(false));
  }, [gameId, initialGame]);

  const handleBuy = () => {
    if (!game) return;
    addToCart({ id: game.id, type: 'game', title: game.title, price: game.price, image: game.cover_image, genre: game.genre });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleGoToStore = () => {
    onClose();
    if (onGoToStore) onGoToStore(game.id);
    else navigate(createPageUrl(`GameDetail?id=${game.id}`));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
        <div className="relative z-10 text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (!game) return null;

  const dlc = MOCK_DLC;
  const achievements = MOCK_ACHIEVEMENTS;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(15,20,30,0.98) 0%, rgba(10,14,22,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Background cover art */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img src={game.cover_image} alt="" className="absolute top-0 right-0 w-1/2 h-full object-cover opacity-10 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f141e] via-[#0f141e]/90 to-transparent" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-start gap-5 p-6 border-b border-white/8 flex-shrink-0">
            {/* Cover Thumbnail */}
            <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-xl">
              <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
            </div>

            {/* Game Info */}
            <div className="flex-1 min-w-0 space-y-2 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{game.title}</h2>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {game.genre && (
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full">{game.genre}</span>
                    )}
                    {game.original_year && (
                      <span className="flex items-center gap-1 text-xs text-white/40"><Calendar className="w-3 h-3" />{game.original_year}</span>
                    )}
                    {game.rating && (
                      <span className="flex items-center gap-1 text-xs text-yellow-400"><Star className="w-3 h-3 fill-current" />{game.rating}</span>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="flex-shrink-0 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
                {game.description || 'Experience a world transformed by technology and ancient power. Master unique abilities, collect rare artifacts, and forge your destiny.'}
              </p>

              {/* Price + Actions */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                {/* Price */}
                <div className="text-xl font-black text-white">
                  {game.price ? `$${game.price.toFixed(2)}` : 'Free'}
                </div>

                {/* Store Button */}
                <button
                  onClick={handleGoToStore}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 text-white text-sm font-semibold transition-all"
                >
                  <Store className="w-4 h-4" />
                  Store Page
                </button>

                {/* Buy / Owned Button */}
                {owned ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold">
                    <Check className="w-4 h-4" />
                    In Library
                  </div>
                ) : (
                  <button
                    onClick={handleBuy}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
                      addedToCart
                        ? 'bg-green-500 text-white scale-95'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white hover:scale-105'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {addedToCart ? 'Added!' : 'Buy Now'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="relative z-10 flex items-center gap-1 px-6 pt-4 pb-0 flex-shrink-0 border-b border-white/8">
            {[
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'content', label: 'Content & DLC', icon: Tag },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-t-lg ${
                  activeTab === id ? 'text-white bg-white/8' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {activeTab === id && (
                  <motion.div layoutId="qv-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="relative z-10 flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence mode="wait">

              {/* ACHIEVEMENTS TAB */}
              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {achievements.map((ach, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:bg-white/5 ${RARITY_COLORS[ach.rarity]}`}
                      >
                        <span className="text-2xl flex-shrink-0">{ach.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{ach.name}</p>
                          <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{ach.description}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 inline-block ${RARITY_COLORS[ach.rarity].split(' ')[0]}`}>{ach.rarity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { label: 'Total Achievements', value: achievements.length, icon: Trophy },
                      { label: 'Avg. Completion', value: '34%', icon: Users },
                      { label: 'Rarest', value: 'Legendary', icon: Star },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-white/40">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase tracking-wider">{label}</span>
                        </div>
                        <span className="text-lg font-bold text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CONTENT & DLC TAB */}
              {activeTab === 'content' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* What's New */}
                  <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> What's New</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400 flex-shrink-0" /> New map: Void Citadel added</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400 flex-shrink-0" /> Balance patch v1.4.2 — improved AI</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400 flex-shrink-0" /> Cross-platform multiplayer enabled</li>
                    </ul>
                  </div>

                  {/* DLC List */}
                  <div>
                    <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Available DLC</h4>
                    <div className="space-y-2">
                      {dlc.map((item) => {
                        const isExp = expandedDLC === item.id;
                        return (
                          <div key={item.id} className="rounded-xl border border-white/8 overflow-hidden">
                            <div
                              className="flex items-center gap-4 p-3.5 bg-white/3 hover:bg-white/6 cursor-pointer transition-colors"
                              onClick={() => setExpandedDLC(isExp ? null : item.id)}
                            >
                              <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10">
                                <img src={game.cover_image} alt="" className="w-full h-full object-cover opacity-50" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                <div className="flex gap-1.5 mt-0.5">
                                  {item.tags.map(t => (
                                    <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/8 text-white/50 rounded">{t}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-bold text-white">${item.price}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart({ id: item.id, type: 'dlc', title: item.name, price: item.price, image: game.cover_image, gameTitle: game.title, gameId: game.id });
                                  }}
                                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                                >
                                  + Cart
                                </button>
                                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            <AnimatePresence>
                              {isExp && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 py-3 border-t border-white/6 bg-black/20">
                                    <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}