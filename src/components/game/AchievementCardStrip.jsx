import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, User, Trees, ChevronLeft, ChevronRight, Trophy, Package, ArrowLeft } from 'lucide-react';

const TYPE_CONFIG = {
  Ability: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  Equipment: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  Companion: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  Environment: { icon: Trees, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

const FILTER_TABS = [
  { key: 'All', label: 'All', color: 'text-white' },
  { key: 'Ability', label: 'Ability', color: 'text-cyan-400' },
  { key: 'Equipment', label: 'Equipment', color: 'text-purple-400' },
  { key: 'Companion', label: 'Companion', color: 'text-green-400' },
  { key: 'Environment', label: 'Environment', color: 'text-amber-400' },
];

function CardItem({ card, onSelect }) {
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.Ability;
  const Icon = cfg.icon;

  return (
    <motion.div
      onClick={() => onSelect(card)}
      whileHover={{ scale: 1.08, y: -4 }}
      className="flex-shrink-0 w-[120px] cursor-pointer group"
    >
      <div className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:${cfg.border} transition-all mb-1.5`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-8 h-8 text-white/15 group-hover:${cfg.color} transition-colors`} />
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[10px] font-bold text-white truncate">{card.name}</p>
          <p className="text-[8px] text-white/40 truncate">{card.edition}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AchievementCardStrip({ achievementCards, dlcList, onSelectCard }) {
  const scrollRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [mode, setMode] = useState('achievements'); // 'achievements' or 'dlc'
  const [dlcIndex, setDlcIndex] = useState(0);

  // DLC items (filter out 'standard' base game entry)
  const dlcItems = (dlcList || []).filter(d => d.id !== 'standard');

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleWheel = useCallback((e) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    const amount = e.deltaY < 0 ? 300 : -300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // When in DLC mode, build cards from the current DLC's achievements
  const currentDlc = dlcItems[dlcIndex] || null;
  const dlcCards = currentDlc?.achievements?.map(a => ({
    name: a.name,
    type: a.type || 'Ability',
    description: a.description || '',
    edition: currentDlc.name,
  })) || [];

  const sourceCards = mode === 'achievements' ? achievementCards : dlcCards;

  // Filter
  const filteredCards = activeFilter === 'All'
    ? sourceCards
    : sourceCards.filter(c => c.type === activeFilter);

  const types = ['Ability', 'Equipment', 'Companion', 'Environment'];

  const flatCards = activeFilter === 'All'
    ? types.flatMap(type => {
        const cards = filteredCards.filter(c => c.type === type);
        if (cards.length === 0) return [];
        return cards.map((card, idx) => ({ ...card, _showLabel: idx === 0 }));
      }).concat(filteredCards.filter(c => !types.includes(c.type)))
    : filteredCards;

  const cycleDlc = (dir) => {
    if (dlcItems.length === 0) return;
    setDlcIndex(prev => (prev + dir + dlcItems.length) % dlcItems.length);
    setActiveFilter('All');
  };

  return (
    <div className="space-y-3">
      {/* Centered Title */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-cyan-400" />
          <h3 className="text-lg font-bold text-white tracking-wider">
            {mode === 'achievements' ? 'Achievement Cards' : 'Achievements'}
          </h3>
        </div>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* DLC Toggle Button */}
      <div className="flex items-center justify-center">
        {mode === 'achievements' ? (
          <button
            onClick={() => { setMode('dlc'); setDlcIndex(0); setActiveFilter('All'); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-orange-300 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all"
          >
            <Package className="w-3 h-3" />
            DLC
          </button>
        ) : (
          <button
            onClick={() => { setMode('achievements'); setActiveFilter('All'); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            Achievements
          </button>
        )}
      </div>

      {/* DLC Name Switcher (only in DLC mode) */}
      <AnimatePresence mode="wait">
        {mode === 'dlc' && dlcItems.length > 0 && (
          <motion.div
            key="dlc-switcher"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <button
              onClick={() => cycleDlc(-1)}
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-3 h-3 text-white/60" />
            </button>
            <AnimatePresence mode="wait">
              <motion.span
                key={dlcIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold text-orange-300 tracking-wide min-w-[160px] text-center"
              >
                {currentDlc?.name}
              </motion.span>
            </AnimatePresence>
            <button
              onClick={() => cycleDlc(1)}
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-3 h-3 text-white/60" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                isActive
                  ? `${tab.color} bg-white/10 border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.1)]`
                  : 'text-white/40 bg-transparent border-transparent hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Horizontal scrolling strip */}
      <div
        className="relative group/strip"
        onWheel={handleWheel}
      >
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-end gap-3 overflow-x-auto px-2 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {flatCards.map((card, i) => (
              <div key={`${card.name}-${i}`} className="flex-shrink-0">
                <CardItem card={card} onSelect={onSelectCard} />
              </div>
          ))}
          {flatCards.length === 0 && (
            <div className="w-full text-center py-6 text-white/30 text-sm">
              No {activeFilter !== 'All' ? activeFilter : ''} cards found{mode === 'dlc' && currentDlc ? ` in ${currentDlc.name}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}