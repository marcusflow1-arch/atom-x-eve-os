import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, User, Trees, ChevronLeft, ChevronRight, Trophy, Package } from 'lucide-react';

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
  const [mode, setMode] = useState('achievements');
  const [dlcIndex, setDlcIndex] = useState(0);
  const [dlcExpanded, setDlcExpanded] = useState(false);

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

  const currentDlc = dlcItems[dlcIndex] || null;
  const dlcCards = currentDlc?.achievements?.map(a => ({
    name: a.name,
    type: a.type || 'Ability',
    description: a.description || '',
    edition: currentDlc.name,
  })) || [];

  const sourceCards = mode === 'achievements' ? achievementCards : dlcCards;

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

  const handleModeToggle = () => {
    if (mode === 'achievements') {
      setMode('dlc');
      setDlcIndex(0);
      setActiveFilter('All');
      setDlcExpanded(false);
    } else {
      setMode('achievements');
      setActiveFilter('All');
      setDlcExpanded(false);
    }
  };

  return (
    <div className="flex gap-0">
      {/* LEFT SIDEBAR: Vertical line + label + filters */}
      <div className="flex flex-col items-center flex-shrink-0 relative mr-0">
        {/* Vertical label: ACHIEVEMENTS */}
        <div className="flex flex-col items-center">
          <span
            className="text-[9px] font-black uppercase tracking-[0.35em] text-white/50"
            style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', letterSpacing: '0.35em' }}
          >
            {mode === 'achievements' ? 'Achievements' : 'Expansion'}
          </span>
        </div>

        {/* Vertical glowing line */}
        <div className="w-px flex-1 min-h-[40px] bg-gradient-to-b from-cyan-500/60 via-white/20 to-transparent my-2" />

        {/* Filter buttons stacked vertically */}
        <div className="flex flex-col items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`w-8 h-8 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border flex items-center justify-center ${
                  isActive
                    ? `${tab.color} bg-white/10 border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.15)]`
                    : 'text-white/30 bg-white/[0.03] border-transparent hover:text-white/60 hover:bg-white/5'
                }`}
                title={tab.label}
              >
                {tab.label.charAt(0)}
              </button>
            );
          })}
        </div>

        {/* Bottom fade of vertical line */}
        <div className="w-px flex-1 min-h-[10px] bg-gradient-to-b from-white/10 to-transparent mt-2" />
      </div>

      {/* T-JUNCTION: Horizontal line connecting sidebar to card area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar: horizontal line + mode toggle + DLC expansions */}
        <div className="flex items-center gap-0 mb-3">
          {/* Horizontal line from T */}
          <div className="h-px w-6 bg-gradient-to-r from-cyan-500/60 to-white/20 flex-shrink-0" />

          {/* Mode Toggle: REG. / DLC */}
          <div className="flex items-center gap-0 flex-shrink-0">
            <button
              onClick={handleModeToggle}
              className={`relative px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-y border-l rounded-l-full ${
                mode === 'achievements'
                  ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30'
                  : 'text-white/30 bg-white/[0.03] border-white/10 hover:text-white/50'
              }`}
            >
              Reg.
            </button>
            <button
              onClick={handleModeToggle}
              className={`relative px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-y border-r rounded-r-full ${
                mode === 'dlc'
                  ? 'text-orange-300 bg-orange-500/15 border-orange-500/30'
                  : 'text-white/30 bg-white/[0.03] border-white/10 hover:text-white/50'
              }`}
            >
              <Package className="w-3 h-3 inline mr-1 -mt-0.5" />
              DLC
            </button>
          </div>

          {/* DLC Expansion selector (appears when in DLC mode) */}
          <AnimatePresence>
            {mode === 'dlc' && dlcItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 ml-3 overflow-hidden"
              >
                {/* Connecting line segment */}
                <div className="h-px w-4 bg-gradient-to-r from-orange-500/40 to-white/10 flex-shrink-0" />

                {/* DLC Cycle Controls */}
                <button
                  onClick={() => cycleDlc(-1)}
                  className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <ChevronLeft className="w-2.5 h-2.5 text-white/50" />
                </button>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={dlcIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[11px] font-semibold text-orange-300/90 tracking-wide whitespace-nowrap min-w-[120px] text-center"
                  >
                    {currentDlc?.name}
                  </motion.span>
                </AnimatePresence>
                <button
                  onClick={() => cycleDlc(1)}
                  className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <ChevronRight className="w-2.5 h-2.5 text-white/50" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extending horizontal line to the right */}
          <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent ml-3" />
        </div>

        {/* Card Strip */}
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
    </div>
  );
}