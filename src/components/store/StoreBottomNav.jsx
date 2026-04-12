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
      className="absolute bottom-full left-0 right-0 mb-2 mx-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(15,20,30,0.97) 0%, rgba(10,14,22,0.98) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
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
        <div className="flex gap-4 overflow-x-auto px-5 pb-5 pt-2" style={{ scrollbarWidth: 'none' }}>
          {filtered.map(game => (
            <motion.button
              key={game.id}
              onClick={() => { onNavigate(game.id); onClose(); }}
              whileHover={{ y: -4, scale: 1.04 }}
              className="flex-shrink-0 flex flex-col gap-2 group cursor-pointer"
              style={{ width: '90px' }}
            >
              <div className="relative rounded-xl overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition-all" style={{ width: '90px', height: '120px' }}>
                <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <span className="text-green-400 font-black text-xs">${game.price ?? '0'}</span>
                </div>
              </div>
              <p className="text-white/75 text-[10px] font-semibold text-center leading-tight line-clamp-2 group-hover:text-white transition-colors">{game.title}</p>
            </motion.button>
          ))}
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
      {/* Tabs - centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all border ${
                isActive
                  ? 'bg-white/15 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Right: Search + Cart */}
      <div className="flex items-center gap-2 ml-4">
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