import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Globe, Users, X, Star, Lock } from 'lucide-react';

const SECTIONS = [
  { id: 'abilities',    label: 'Abilities',    icon: Zap,    color: '#a78bfa' },
  { id: 'equipment',   label: 'Equipment',    icon: Shield, color: '#60a5fa' },
  { id: 'environments',label: 'Environments', icon: Globe,  color: '#34d399' },
  { id: 'companions',  label: 'Companions',   icon: Users,  color: '#f97316' },
];

const MOCK_CARDS = {
  abilities: [
    { id: 'a1', name: 'Shadow Strike',  icon: '⚡', rarity: 'epic',      desc: 'Dash behind enemy and deal 3x damage.', locked: false },
    { id: 'a2', name: 'Fireball',       icon: '🔥', rarity: 'rare',      desc: 'Launch a blazing projectile.', locked: false },
    { id: 'a3', name: 'Time Warp',      icon: '🌀', rarity: 'legendary', desc: 'Slow time for 5 seconds.', locked: true },
    { id: 'a4', name: 'Ice Barrier',    icon: '❄️', rarity: 'uncommon',  desc: 'Create a protective ice wall.', locked: false },
    { id: 'a5', name: 'Void Pulse',     icon: '💜', rarity: 'mythical',  desc: 'Emit a void energy burst.', locked: true },
    { id: 'a6', name: 'Holy Light',     icon: '✨', rarity: 'rare',      desc: 'Heal nearby allies.', locked: false },
  ],
  equipment: [
    { id: 'e1', name: 'Plasma Sword',   icon: '⚔️', rarity: 'epic',      desc: '+80 ATK, causes burn on hit.', locked: false },
    { id: 'e2', name: 'Dragon Helm',    icon: '🪖', rarity: 'legendary', desc: '+200 DEF, fire resistance.', locked: true },
    { id: 'e3', name: 'Ghost Cape',     icon: '🧥', rarity: 'rare',      desc: '+40 Speed, invisibility 3s.', locked: false },
    { id: 'e4', name: 'Iron Gauntlets', icon: '🥊', rarity: 'uncommon',  desc: '+30 ATK, +15 DEF.', locked: false },
    { id: 'e5', name: 'Void Boots',     icon: '👢', rarity: 'epic',      desc: 'Phase through obstacles.', locked: true },
    { id: 'e6', name: 'Aether Shield',  icon: '🛡️', rarity: 'mythical',  desc: 'Absorbs 500 damage.', locked: true },
  ],
  environments: [
    { id: 'v1', name: 'Cyber City',     icon: '🌆', rarity: 'rare',      desc: 'Neon-lit urban battlefield.', locked: false },
    { id: 'v2', name: 'Void Realm',     icon: '🌌', rarity: 'legendary', desc: 'Endless dark dimension.', locked: true },
    { id: 'v3', name: 'Crystal Caves',  icon: '💎', rarity: 'epic',      desc: 'Glimmering underground arena.', locked: false },
    { id: 'v4', name: 'Lava Fields',    icon: '🌋', rarity: 'uncommon',  desc: 'Volcanic hazard zone.', locked: false },
    { id: 'v5', name: 'Arctic Tundra',  icon: '🏔️', rarity: 'rare',      desc: 'Frozen wasteland skybox.', locked: true },
    { id: 'v6', name: 'Sky Citadel',    icon: '☁️', rarity: 'mythical',  desc: 'Floating fortress above clouds.', locked: true },
  ],
  companions: [
    { id: 'c1', name: 'Luna',           icon: '🤖', rarity: 'legendary', desc: 'AI companion with tactical insight.', locked: false },
    { id: 'c2', name: 'Shadow Fox',     icon: '🦊', rarity: 'epic',      desc: 'Stealth scout with +20% crit.', locked: false },
    { id: 'c3', name: 'Iron Golem',     icon: '🗿', rarity: 'rare',      desc: 'Tank companion, absorbs hits.', locked: true },
    { id: 'c4', name: 'Storm Eagle',    icon: '🦅', rarity: 'uncommon',  desc: 'Air support, reveals enemies.', locked: false },
    { id: 'c5', name: 'Void Wraith',    icon: '👻', rarity: 'mythical',  desc: 'Phases through walls, haunts foes.', locked: true },
    { id: 'c6', name: 'Blaze Wolf',     icon: '🐺', rarity: 'epic',      desc: 'Fire aura, charges at enemies.', locked: true },
  ],
};

const RARITY_COLORS = {
  common:    { bg: 'rgba(160,160,160,0.12)', border: 'rgba(160,160,160,0.25)', text: '#aaa',     glow: 'rgba(160,160,160,0.2)' },
  uncommon:  { bg: 'rgba(80,200,120,0.10)',  border: 'rgba(80,200,120,0.3)',   text: '#50c878',  glow: 'rgba(80,200,120,0.2)' },
  rare:      { bg: 'rgba(80,140,255,0.10)',  border: 'rgba(80,140,255,0.35)',  text: '#5b8dff',  glow: 'rgba(80,140,255,0.25)' },
  epic:      { bg: 'rgba(160,80,255,0.10)',  border: 'rgba(160,80,255,0.35)',  text: '#a050ff',  glow: 'rgba(160,80,255,0.25)' },
  legendary: { bg: 'rgba(255,180,40,0.10)',  border: 'rgba(255,180,40,0.4)',   text: '#ffb828',  glow: 'rgba(255,180,40,0.3)' },
  mythical:  { bg: 'rgba(255,80,160,0.10)',  border: 'rgba(255,80,160,0.4)',   text: '#ff50a0',  glow: 'rgba(255,80,160,0.3)' },
};

export default function GameContentCards({ selectedGame }) {
  const [activeSection, setActiveSection] = useState('abilities');
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = MOCK_CARDS[activeSection] || [];
  const section = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="w-[52%] flex flex-col border-r border-white/8 min-h-0">
      {/* Section tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/8 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => { setActiveSection(sec.id); setSelectedCard(null); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all flex-shrink-0 border"
              style={{
                background: isActive ? `${sec.color}22` : 'rgba(255,255,255,0.04)',
                border: isActive ? `1px solid ${sec.color}55` : '1px solid rgba(255,255,255,0.08)',
                color: isActive ? sec.color : 'rgba(255,255,255,0.45)',
                boxShadow: isActive ? `0 0 8px ${sec.color}33` : 'none',
              }}
            >
              <Icon className="w-2.5 h-2.5" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-2.5 relative" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-3 gap-2">
          {cards.map((card) => {
            const rc = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;
            return (
              <motion.button
                key={card.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCard(card)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl p-2.5 border cursor-pointer transition-all relative overflow-hidden"
                style={{
                  background: card.locked ? 'rgba(255,255,255,0.02)' : rc.bg,
                  border: card.locked ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${rc.border}`,
                  boxShadow: card.locked ? 'none' : `0 0 10px ${rc.glow}`,
                  opacity: card.locked ? 0.45 : 1,
                  aspectRatio: '3/4',
                  minHeight: '70px',
                }}
              >
                {card.locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] rounded-xl z-10">
                    <Lock className="w-3.5 h-3.5 text-white/30" />
                  </div>
                )}
                <span className="text-2xl leading-none">{card.icon}</span>
                <p
                  className="text-[9px] font-bold text-center leading-tight px-1 w-full truncate"
                  style={{ color: card.locked ? 'rgba(255,255,255,0.2)' : rc.text }}
                >
                  {card.name}
                </p>
                <span
                  className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{
                    background: rc.glow,
                    color: rc.text,
                    border: `1px solid ${rc.border}`,
                  }}
                >
                  {card.rarity}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Card detail popup */}
        <AnimatePresence>
          {selectedCard && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl z-20"
                onClick={() => setSelectedCard(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute inset-4 rounded-2xl z-30 flex flex-col items-center justify-center p-5 border"
                style={{
                  background: 'linear-gradient(135deg, rgba(10,14,22,0.98), rgba(15,20,35,0.98))',
                  border: `1px solid ${(RARITY_COLORS[selectedCard.rarity] || RARITY_COLORS.common).border}`,
                  boxShadow: `0 0 30px ${(RARITY_COLORS[selectedCard.rarity] || RARITY_COLORS.common).glow}`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>

                <span className="text-5xl mb-3">{selectedCard.icon}</span>
                <h4
                  className="text-sm font-black text-center mb-1"
                  style={{ color: (RARITY_COLORS[selectedCard.rarity] || RARITY_COLORS.common).text }}
                >
                  {selectedCard.name}
                </h4>
                <span
                  className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-3"
                  style={{
                    background: (RARITY_COLORS[selectedCard.rarity] || RARITY_COLORS.common).glow,
                    color: (RARITY_COLORS[selectedCard.rarity] || RARITY_COLORS.common).text,
                    border: `1px solid ${(RARITY_COLORS[selectedCard.rarity] || RARITY_COLORS.common).border}`,
                  }}
                >
                  {selectedCard.rarity} · {section?.label}
                </span>
                <p className="text-white/60 text-[10px] text-center leading-relaxed">{selectedCard.desc}</p>

                {selectedCard.locked && (
                  <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                    <Lock className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-[9px] font-bold">Locked — Complete achievement to unlock</span>
                  </div>
                )}

                {!selectedCard.locked && (
                  <div className="mt-3 flex items-center gap-1 text-green-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[9px] font-bold">Unlocked</span>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}