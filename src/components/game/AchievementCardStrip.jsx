import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, User, Trees, ChevronLeft, ChevronRight, Trophy, Package } from 'lucide-react';

const TYPE_CONFIG = {
  Ability:     { icon: Zap,    color: '#22d3ee', label: 'Ability' },
  Equipment:   { icon: Shield, color: '#a78bfa', label: 'Equipment' },
  Companion:   { icon: User,   color: '#4ade80', label: 'Companion' },
  Environment: { icon: Trees,  color: '#fbbf24', label: 'Environment' },
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
      whileHover={{ scale: 1.05, y: -3 }}
      className="flex-shrink-0 w-[80px] cursor-pointer group"
    >
      {/* Card body */}
      <div
        className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden transition-all"
        style={{
          height: 96,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
          style={{ background: `${cfg.color}18`, boxShadow: `0 0 12px ${cfg.color}30` }}
        >
          <Icon style={{ color: cfg.color }} className="w-5 h-5" />
        </div>
      </div>
      {/* Labels */}
      <div className="mt-1.5 text-center px-0.5">
        <p className="text-[9px] font-bold text-white leading-tight truncate">{card.name}</p>
        {card.edition && <p className="text-[8px] text-white/35 leading-tight truncate">{card.edition}</p>}
      </div>
    </motion.div>
  );
}

export default function AchievementCardStrip({ achievementCards, dlcList, onSelectCard }) {
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
    <div className="flex flex-col h-full" style={{ background: 'rgba(10,14,20,0.6)', borderRadius: 12, padding: '12px 8px 8px' }}>
      {/* Title */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">Achievement Cards</h3>
        </div>
        <div className="w-20 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
      </div>

      {/* DLC toggle */}
      <div className="flex items-center justify-center mb-2">
        <button
          onClick={() => { setMode(mode === 'dlc' ? 'achievements' : 'dlc'); setDlcIndex(0); setActiveFilter('All'); }}
          className="flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all"
          style={mode === 'dlc'
            ? { background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
          }
        >
          <Package className="w-2.5 h-2.5" />
          DLC
        </button>
      </div>

      {/* DLC name switcher */}
      <AnimatePresence>
        {mode === 'dlc' && dlcItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <button onClick={() => cycleDlc(-1)} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-3 h-3 text-white/50" />
            </button>
            <AnimatePresence mode="wait">
              <motion.span key={dlcIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="text-[10px] font-semibold text-orange-300 text-center" style={{ minWidth: 100 }}
              >
                {currentDlc?.name}
              </motion.span>
            </AnimatePresence>
            <button onClick={() => cycleDlc(1)} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight className="w-3 h-3 text-white/50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter pills */}
      <div className="flex items-center justify-center flex-wrap gap-1 mb-3">
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          const tabColors = { All: '#fff', Ability: '#22d3ee', Equipment: '#a78bfa', Companion: '#4ade80', Environment: '#fbbf24' };
          const c = tabColors[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all"
              style={isActive
                ? { background: `${c}20`, border: `1px solid ${c}50`, color: c }
                : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.35)' }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable card strip */}
      <div className="relative flex-1 min-h-0 group/strip" onWheel={handleWheel}>
        <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft className="w-3 h-3 text-white/70" />
        </button>
        <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight className="w-3 h-3 text-white/70" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-start gap-2 overflow-x-auto px-3 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', height: '100%' }}
        >
          {flatCards.map((card, i) => (
            <CardItem key={`${card.name}-${i}`} card={card} onSelect={onSelectCard} />
          ))}
          {flatCards.length === 0 && (
            <div className="w-full text-center py-4 text-white/25 text-xs">
              No cards found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}