import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Globe, Users, Lock, Star } from 'lucide-react';

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

// ─── Card thumbnail ────────────────────────────────────────────────────────────
function CardItem({ card, onSelect, isSelected }) {
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.Ability;
  const rc = RARITY_COLOR[card.rarity] || '#aaa';

  return (
    <motion.div
      onClick={() => !card.locked && onSelect(card)}
      whileHover={{ scale: card.locked ? 1 : 1.04 }}
      className={`flex flex-col items-center p-2 rounded-xl transition-all ${card.locked ? 'cursor-default' : 'cursor-pointer'}`}
      style={{
        opacity: card.locked ? 0.45 : 1,
        background: isSelected ? `${rc}18` : 'rgba(255,255,255,0.04)',
        border: isSelected ? `1px solid ${rc}55` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isSelected ? `0 0 14px ${rc}22` : 'none',
      }}
    >
      {/* Icon circle */}
      <div className="relative w-10 h-10 rounded-full flex items-center justify-center mb-1"
        style={{ background: `${cfg.color}18`, boxShadow: `0 0 10px ${cfg.color}28` }}>
        <span className="text-xl leading-none">{card.icon}</span>
        {card.locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Lock className="w-3 h-3 text-white/40" />
          </div>
        )}
      </div>
      {/* Rarity badge */}
      <span className="text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full mb-0.5"
        style={{ color: rc, background: `${rc}18`, border: `1px solid ${rc}30` }}>
        {card.rarity}
      </span>
      {/* Name */}
      <p className="text-[9px] font-bold text-white text-center leading-tight truncate w-full px-0.5">{card.name}</p>
      <p className="text-[8px] text-white/35 text-center">{card.type}</p>
    </motion.div>
  );
}

// ─── Left preview panel ────────────────────────────────────────────────────────
function CardPreview({ card }) {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-3xl opacity-30">🃏</span>
        </div>
        <p className="text-white/25 text-xs text-center leading-relaxed">Select a card<br />to preview it here</p>
      </div>
    );
  }

  const rc = RARITY_COLOR[card.rarity] || '#aaa';
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.Ability;
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={card.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center px-4 py-5 h-full overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${rc}22, ${rc}0a)`,
            border: `1px solid ${rc}40`,
            boxShadow: `0 0 30px ${rc}28`,
          }}>
          <span className="text-4xl leading-none">{card.icon}</span>
        </div>

        {/* Name */}
        <h3 className="text-white font-black text-sm text-center leading-tight mb-2">{card.name}</h3>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: rc, background: `${rc}18`, border: `1px solid ${rc}35` }}>
            {card.rarity}
          </span>
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}28` }}>
            <Icon className="w-2.5 h-2.5" />
            {card.type}
          </span>
          {!card.locked
            ? <span className="flex items-center gap-1 text-[8px] font-bold text-green-400 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
                <Star className="w-2.5 h-2.5 fill-green-400" /> Unlocked
              </span>
            : <span className="text-[8px] font-bold text-white/30 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                🔒 Locked
              </span>
          }
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-3 flex-shrink-0" style={{ background: `linear-gradient(to right, transparent, ${rc}35, transparent)` }} />

        {/* Description */}
        <p className="text-white/55 text-[10px] leading-relaxed text-center mb-3">{card.desc}</p>

        {/* Stats */}
        {(card.type === 'Equipment' || card.type === 'Ability') && (
          <div className="w-full grid grid-cols-2 gap-1.5 mb-3">
            {(card.type === 'Equipment'
              ? [{ label: 'ATK Bonus', val: '+80' }, { label: 'Effect', val: 'Burn' }]
              : [{ label: 'Power', val: 'High' }, { label: 'Cooldown', val: '8s' }]
            ).map(s => (
              <div key={s.label} className="rounded-lg px-2.5 py-1.5 flex flex-col"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[7px] text-white/35 uppercase tracking-wider">{s.label}</span>
                <span className="text-white font-bold text-[10px] mt-0.5">{s.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          className="w-full py-2 rounded-xl font-black text-[10px] uppercase tracking-wider mt-auto flex-shrink-0"
          style={{
            background: card.locked ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${rc}cc, ${rc}88)`,
            color: card.locked ? 'rgba(255,255,255,0.25)' : '#000',
            border: `1px solid ${rc}40`,
            boxShadow: card.locked ? 'none' : `0 0 14px ${rc}35`,
            cursor: card.locked ? 'not-allowed' : 'pointer',
          }}
        >
          {card.locked ? '🔒 Achievement Required' : `Equip ${card.type}`}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GameContentCards({ selectedGame }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCard, setSelectedCard] = useState(null);

  const filtered = activeFilter === 'All' ? MOCK_CARDS : MOCK_CARDS.filter(c => c.type === activeFilter);

  return (
    <div
      className="w-[52%] flex flex-col border-r border-white/8 min-h-0 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)' }}
    >
      {/* Filter pills */}
      <div className="flex items-center justify-center flex-wrap gap-1 px-3 py-2.5 border-b border-white/8 flex-shrink-0">
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

      {/* 50/50 body */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT — card detail preview (50%) */}
        <div className="w-1/2 flex-shrink-0 border-r border-white/8 overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.15)' }}>
          <CardPreview card={selectedCard} />
        </div>

        {/* RIGHT — scrollable card grid (50%) */}
        <div className="w-1/2 flex-shrink-0 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'none' }}>
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((card, i) => (
              <CardItem
                key={`${card.name}-${i}`}
                card={card}
                onSelect={setSelectedCard}
                isSelected={selectedCard?.name === card.name}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-8 text-white/25 text-xs">No cards found</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}