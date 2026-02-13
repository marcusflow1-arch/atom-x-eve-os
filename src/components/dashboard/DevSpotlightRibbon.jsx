import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Flame, Star, Zap, Users } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';

function FeaturedDevCard({ dev, game, card, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const rarityAccent =
    card.rarity === 'Legendary' ? { color: 'text-amber-300', border: 'border-amber-500/30', glow: 'rgba(251,191,36,0.15)' } :
    card.rarity === 'Epic' ? { color: 'text-purple-300', border: 'border-purple-500/30', glow: 'rgba(168,85,247,0.15)' } :
    card.rarity === 'Rare' ? { color: 'text-blue-300', border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.15)' } :
    { color: 'text-slate-300', border: 'border-white/10', glow: 'rgba(255,255,255,0.05)' };

  return (
    <motion.div
      onClick={() => onClick(card)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -3 }}
      className={`relative w-full rounded-xl overflow-hidden cursor-pointer border ${rarityAccent.border}`}
      style={{
        background: 'rgba(12, 16, 24, 0.7)',
        backdropFilter: 'blur(24px)',
        boxShadow: isHovered
          ? `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${rarityAccent.glow}`
          : '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'box-shadow 0.4s ease, border-color 0.3s ease'
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Card icon */}
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"
             style={{ boxShadow: `inset 0 0 12px ${rarityAccent.glow}` }}>
          <span className="text-xl">{card.icon}</span>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-xs leading-tight truncate ${rarityAccent.color}`}>{card.name}</p>
          <p className="text-white/35 text-[9px] truncate">{game.title}</p>
        </div>
        {/* Rarity dot */}
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${rarityAccent.border} ${rarityAccent.color} flex-shrink-0`}
              style={{ background: 'rgba(0,0,0,0.3)' }}>
          {card.rarity?.charAt(0)}
        </span>
      </div>
    </motion.div>
  );
}

function DevLogoChip({ dev, isActive, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(dev)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0 border transition-all ${
        isActive
          ? 'bg-white/10 border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
          : 'bg-transparent border-transparent hover:bg-white/5'
      }`}
    >
      <img src={dev.logo} alt={dev.name} className="w-5 h-5 rounded-full border border-white/15" />
      <span className={`text-[10px] font-semibold ${isActive ? 'text-white' : 'text-white/40'}`}>{dev.name}</span>
    </motion.button>
  );
}

export default function DevSpotlightRibbon({ onOpenOverlay }) {
  const scrollRef = useRef(null);
  const [activeDev, setActiveDev] = useState(null);

  // Build featured cards - one highlight per developer or filtered by activeDev
  const featuredCards = [];
  const devs = activeDev ? DEV_SPOTLIGHT_DATA.filter(d => d.id === activeDev.id) : DEV_SPOTLIGHT_DATA;
  devs.forEach(dev => {
    dev.games.forEach(game => {
      game.cards.forEach(card => {
        featuredCards.push({
          ...card,
          dev,
          game,
          image: card.image || game.cover
        });
      });
    });
  });

  if (featuredCards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }} />
          <span className="text-white/70 text-xs font-bold tracking-wide">Dev Spotlight</span>
        </div>
        <button
          onClick={onOpenOverlay}
          className="flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-cyan-400 transition-colors group"
        >
          All
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Developer filter chips - compact */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <button
          onClick={() => setActiveDev(null)}
          className={`text-[9px] px-2 py-1 rounded-full font-semibold transition-all ${
            !activeDev ? 'bg-white/10 text-white' : 'text-white/30 hover:bg-white/5 hover:text-white/50'
          }`}
        >
          All
        </button>
        {DEV_SPOTLIGHT_DATA.map(dev => (
          <button
            key={dev.id}
            onClick={() => setActiveDev(activeDev?.id === dev.id ? null : dev)}
            className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-full font-semibold transition-all ${
              activeDev?.id === dev.id ? 'bg-white/10 text-white' : 'text-white/30 hover:bg-white/5 hover:text-white/50'
            }`}
          >
            <img src={dev.logo} alt="" className="w-3.5 h-3.5 rounded-full" />
            {dev.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Stacked card list - vertical for narrow column */}
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {featuredCards.slice(0, 8).map(card => (
          <FeaturedDevCard
            key={card.id}
            dev={card.dev}
            game={card.game}
            card={card}
            onClick={onOpenOverlay}
          />
        ))}
      </div>
    </motion.div>
  );
}