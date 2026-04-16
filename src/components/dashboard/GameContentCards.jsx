import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Globe, Users, ChevronLeft, ChevronRight, Trophy, Package, Lock, X, Star } from 'lucide-react';

const TYPE_CONFIG = {
  Ability:     { icon: Zap,    color: '#22d3ee', label: 'Ability' },
  Equipment:   { icon: Shield, color: '#a78bfa', label: 'Equipment' },
  Environment: { icon: Globe,  color: '#fbbf24', label: 'Environment' },
  Companion:   { icon: Users,  color: '#4ade80', label: 'Companion' },
};

const FILTER_TABS = [
  { key: 'All',         color: '#fff' },
  { key: 'Ability',     color: '#22d3ee' },
  { key: 'Equipment',   color: '#a78bfa' },
  { key: 'Environment', color: '#fbbf24' },
  { key: 'Companion',   color: '#4ade80' },
];

const MOCK_CARDS = [
  { name: 'Shadow Strike',  type: 'Ability',     rarity: 'epic',      icon: '⚡', locked: false, desc: 'Dash behind enemy and deal 3× damage.' },
  { name: 'Fireball',       type: 'Ability',     rarity: 'rare',      icon: '🔥', locked: false, desc: 'Launch a blazing projectile.' },
  { name: 'Time Warp',      type: 'Ability',     rarity: 'legendary', icon: '🌀', locked: true,  desc: 'Slow time for 5 seconds.' },
  { name: 'Ice Barrier',    type: 'Ability',     rarity: 'uncommon',  icon: '❄️', locked: false, desc: 'Create a protective ice wall.' },
  { name: 'Void Pulse',     type: 'Ability',     rarity: 'mythical',  icon: '💜', locked: true,  desc: 'Emit a void energy burst.' },
  { name: 'Plasma Sword',   type: 'Equipment',   rarity: 'epic',      icon: '⚔️', locked: false, desc: '+80 ATK, causes burn on hit.' },
  { name: 'Dragon Helm',    type: 'Equipment',   rarity: 'legendary', icon: '🪖', locked: true,  desc: '+200 DEF, fire resistance.' },
  { name: 'Ghost Cape',     type: 'Equipment',   rarity: 'rare',      icon: '🧥', locked: false, desc: '+40 Speed, invisibility 3s.' },
  { name: 'Aether Shield',  type: 'Equipment',   rarity: 'mythical',  icon: '🛡️', locked: true,  desc: 'Absorbs 500 damage.' },
  { name: 'Cyber City',     type: 'Environment', rarity: 'rare',      icon: '🌆', locked: false, desc: 'Neon-lit urban battlefield.' },
  { name: 'Void Realm',     type: 'Environment', rarity: 'legendary', icon: '🌌', locked: true,  desc: 'Endless dark dimension.' },
  { name: 'Crystal Caves',  type: 'Environment', rarity: 'epic',      icon: '💎', locked: false, desc: 'Glimmering underground arena.' },
  { name: 'Lava Fields',    type: 'Environment', rarity: 'uncommon',  icon: '🌋', locked: false, desc: 'Volcanic hazard zone.' },
  { name: 'Luna',           type: 'Companion',   rarity: 'legendary', icon: '🤖', locked: false, desc: 'AI companion with tactical insight.' },
  { name: 'Shadow Fox',     type: 'Companion',   rarity: 'epic',      icon: '🦊', locked: false, desc: 'Stealth scout with +20% crit.' },
  { name: 'Iron Golem',     type: 'Companion',   rarity: 'rare',      icon: '🗿', locked: true,  desc: 'Tank companion, absorbs hits.' },
  { name: 'Storm Eagle',    type: 'Companion',   rarity: 'uncommon',  icon: '🦅', locked: false, desc: 'Air support, reveals enemies.' },
  { name: 'Void Wraith',    type: 'Companion',   rarity: 'mythical',  icon: '👻', locked: true,  desc: 'Phases through walls, haunts foes.' },
];

const RARITY_COLOR = {
  common:    '#aaa',
  uncommon:  '#50c878',
  rare:      '#5b8dff',
  epic:      '#a050ff',
  legendary: '#ffb828',
  mythical:  '#ff50a0',
};

function CardItem({ card, onSelect }) {
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.Ability;
  const Icon = cfg.icon;

  return (
    <motion.div
      onClick={() => !card.locked && onSelect(card)}
      whileHover={{ scale: card.locked ? 1 : 1.05, y: card.locked ? 0 : -3 }}
      className={`flex-shrink-0 w-[72px] ${card.locked ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ opacity: card.locked ? 0.42 : 1 }}
    >
      <div
        className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden"
        style={{ height: 88, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {card.locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-10">
            <Lock className="w-3.5 h-3.5 text-white/30" />
          </div>
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5"
          style={{ background: `${cfg.color}18`, boxShadow: `0 0 12px ${cfg.color}30` }}
        >
          <span className="text-lg leading-none">{card.icon}</span>
        </div>
        <span
          className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{ color: RARITY_COLOR[card.rarity] || '#aaa', background: `${RARITY_COLOR[card.rarity] || '#aaa'}18`, border: `1px solid ${RARITY_COLOR[card.rarity] || '#aaa'}33` }}
        >
          {card.rarity}
        </span>
      </div>
      <div className="mt-1 text-center px-0.5">
        <p className="text-[9px] font-bold text-white leading-tight truncate">{card.name}</p>
        <p className="text-[8px] text-white/35 leading-tight">{card.type}</p>
      </div>
    </motion.div>
  );
}

export default function GameContentCards({ selectedGame }) {
  const scrollRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCard, setSelectedCard] = useState(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  const handleWheel = useCallback((e) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollBy({ left: e.deltaY < 0 ? 240 : -240, behavior: 'smooth' });
  }, []);

  const types = ['Ability', 'Equipment', 'Environment', 'Companion'];

  const filtered = activeFilter === 'All' ? MOCK_CARDS : MOCK_CARDS.filter(c => c.type === activeFilter);

  const flatCards = activeFilter === 'All'
    ? types.flatMap(type => filtered.filter(c => c.type === type))
    : filtered;

  return (
    <div
      className="w-[52%] flex flex-col border-r border-white/8 min-h-0"
      style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/8 flex-shrink-0">
        <Trophy className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-white font-bold text-[10px] uppercase tracking-widest">Achievement Cards</span>
        <span className="ml-auto text-white/30 text-[10px]">{MOCK_CARDS.filter(c => !c.locked).length}/{MOCK_CARDS.length} Unlocked</span>
      </div>

      {/* Filter pills */}
      <div className="flex items-center justify-center flex-wrap gap-1 px-3 py-2 border-b border-white/8 flex-shrink-0">
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all"
              style={isActive
                ? { background: `${tab.color}20`, border: `1px solid ${tab.color}50`, color: tab.color }
                : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.35)' }
              }
            >
              {tab.key}
            </button>
          );
        })}
      </div>

      {/* Scrollable card strip */}
      <div className="relative flex-1 min-h-0 group/strip" onWheel={handleWheel}>
        <button onClick={() => scroll('left')} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft className="w-3 h-3 text-white/70" />
        </button>
        <button onClick={() => scroll('right')} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight className="w-3 h-3 text-white/70" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-start gap-2.5 overflow-x-auto px-5 py-3 h-full"
          style={{ scrollbarWidth: 'none' }}
        >
          {flatCards.map((card, i) => (
            <CardItem key={`${card.name}-${i}`} card={card} onSelect={setSelectedCard} />
          ))}
          {flatCards.length === 0 && (
            <div className="w-full text-center py-6 text-white/25 text-xs">No cards found</div>
          )}
        </div>
      </div>

      {/* Card detail popup */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-[260px] left-0 w-[52%] z-50 px-4 pb-2"
          >
            <div
              className="rounded-2xl p-4 border flex gap-3 items-start"
              style={{
                background: 'linear-gradient(135deg, rgba(10,14,22,0.98), rgba(15,20,35,0.98))',
                border: `1px solid ${RARITY_COLOR[selectedCard.rarity] || '#aaa'}44`,
                boxShadow: `0 0 20px ${RARITY_COLOR[selectedCard.rarity] || '#aaa'}22`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <span className="text-3xl leading-none flex-shrink-0">{selectedCard.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-xs truncate">{selectedCard.name}</p>
                <p className="text-[9px] text-white/50 mt-0.5 leading-relaxed">{selectedCard.desc}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ color: RARITY_COLOR[selectedCard.rarity], background: `${RARITY_COLOR[selectedCard.rarity]}18`, border: `1px solid ${RARITY_COLOR[selectedCard.rarity]}33` }}>{selectedCard.rarity}</span>
                  <span className="text-[8px] text-white/40">· {selectedCard.type}</span>
                  <Star className="w-2.5 h-2.5 text-green-400 fill-green-400 ml-auto" />
                  <span className="text-[8px] text-green-400 font-bold">Unlocked</span>
                </div>
              </div>
              <button onClick={() => setSelectedCard(null)} className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0">
                <X className="w-3 h-3 text-white/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}