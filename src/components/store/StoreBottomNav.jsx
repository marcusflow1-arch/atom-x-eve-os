import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Store, ShoppingBag, ArrowRightLeft, Search, ShoppingCart, X, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function GameSearchPopup({ games, searchTerm, onNavigate, onClose }) {
  const filtered = games.filter(g =>
    g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'linear-gradient(160deg, rgba(0,0,0,0.85) 0%, rgba(5,5,10,0.90) 100%)',
        backdropFilter: 'blur(50px) saturate(200%)',
        WebkitBackdropFilter: 'blur(50px) saturate(200%)',
        boxShadow: '0 -12px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          <span className="text-white/50 text-xs uppercase tracking-widest font-bold">Search Results</span>
          {filtered.length > 0 && <span className="text-cyan-400 text-xs font-bold">· {filtered.length}</span>}
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
          <X className="w-3 h-3 text-white/60" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-white/30 text-sm">No games found for "{searchTerm}"</div>
      ) : (
        <div className="overflow-x-auto px-5 pb-4 pt-2" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-3 min-w-min">
            {filtered.map(game => (
              <motion.div
                key={game.id}
                onClick={() => { onNavigate(game.id); onClose(); }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-all border border-transparent hover:border-cyan-400/30 group min-w-[120px]"
              >
                <img src={game.cover_image} alt={game.title} className="w-16 h-24 rounded-lg object-cover" />
                <div className="text-center">
                  <p className="text-white/80 text-xs font-bold truncate group-hover:text-white">{game.title}</p>
                  <p className="text-white/35 text-[10px]">{game.genre || 'Unknown'}</p>
                  <span className="text-green-400 font-bold text-xs">${game.price ?? '0'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StoreBottomNav({ activeTab, onTabChange, games = [], onNavigateToGame, cartCount = 0, onToggleVoiceSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    setShowPopup(searchTerm.trim().length > 0);
  }, [searchTerm]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'trading', label: 'Trading Post', icon: ArrowRightLeft },
  ];

  return (
    <div className="relative flex items-center justify-between w-full">
      <AnimatePresence>
        {showPopup && (
          <GameSearchPopup
            games={games}
            searchTerm={searchTerm}
            onNavigate={onNavigateToGame}
            onClose={() => { setShowPopup(false); setSearchTerm(''); }}
          />
        )}
      </AnimatePresence>

      {/* Tabs - Center */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search - Right */}
      <div className="flex items-center gap-2 ml-auto">
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
        >
          <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-36"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-white/30 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
          {onToggleVoiceSearch && (
            <button onClick={onToggleVoiceSearch} className="text-white/30 hover:text-white transition-colors">
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Link
          to={createPageUrl('Cart')}
          className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/20 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-white/80" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
          )}
        </Link>
      </div>
    </div>
  );
}