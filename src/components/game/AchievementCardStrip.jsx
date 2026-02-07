import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, User, Database, Trees, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

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

export default function AchievementCardStrip({ achievementCards, onSelectCard }) {
  const scrollRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Scroll wheel -> horizontal scroll when hovering over the strip
  const handleWheel = useCallback((e) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    // Scroll up (negative deltaY) -> scroll right, scroll down (positive deltaY) -> scroll left
    const amount = e.deltaY < 0 ? 300 : -300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // Filter cards based on active filter
  const filteredCards = activeFilter === 'All'
    ? achievementCards
    : achievementCards.filter(c => c.type === activeFilter);

  // Group cards by type, preserving order: All, Ability, Equipment, Companion, Environment
  const types = ['Ability', 'Equipment', 'Companion', 'Environment'];

  const flatCards = activeFilter === 'All'
    ? types.flatMap(type => {
        const cards = filteredCards.filter(c => c.type === type);
        if (cards.length === 0) return [];
        return cards.map((card, idx) => ({ ...card, _showLabel: idx === 0 }));
      })
    : filteredCards.map((card, idx) => ({ ...card, _showLabel: idx === 0 }));

  return (
    <div className="space-y-4">
      {/* Centered Title */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-cyan-400" />
          <h3 className="text-lg font-bold text-white tracking-wider">Achievement Cards</h3>
        </div>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* Filter Tabs: All, Ability, Equipment, Companion, Environment */}
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

      {/* Horizontal scrolling strip with arrows + wheel scroll */}
      <div
        className="relative group/strip"
        onWheel={handleWheel}
      >
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        {/* Right arrow */}
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
          {flatCards.map((card, i) => {
            const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.Ability;
            return (
              <div key={`${card.name}-${i}`} className="flex-shrink-0 flex flex-col items-center">
                {/* Type label above the first card of each group */}
                {card._showLabel && (
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${cfg.color} mb-1.5`}>
                    {card.type}
                  </span>
                )}
                {!card._showLabel && <div className="h-[18px]" />}
                <CardItem card={card} onSelect={onSelectCard} />
              </div>
            );
          })}
          {flatCards.length === 0 && (
            <div className="w-full text-center py-6 text-white/30 text-sm">
              No {activeFilter} cards found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}