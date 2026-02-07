import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, User, Database, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

const TYPE_CONFIG = {
  Ability: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  Equipment: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  Companion: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  Teacher: { icon: Database, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

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

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Group cards by type, preserving order
  const types = ['Ability', 'Equipment', 'Companion', 'Teacher'];
  const allCards = types.flatMap(type => {
    const cards = achievementCards.filter(c => c.type === type);
    if (cards.length === 0) return [];
    return [{ _label: type }, ...cards];
  });

  // Build flat list with label markers on the FIRST card of each type
  const flatCards = types.flatMap(type => {
    const cards = achievementCards.filter(c => c.type === type);
    if (cards.length === 0) return [];
    return cards.map((card, idx) => ({ ...card, _showLabel: idx === 0 }));
  });

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

      {/* Horizontal scrolling strip with arrows */}
      <div className="relative group/strip">
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
        </div>
      </div>
    </div>
  );
}