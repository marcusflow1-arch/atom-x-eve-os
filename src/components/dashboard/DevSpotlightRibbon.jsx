import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Rocket, Sparkles } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';

function RibbonCard({ card, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onClick={() => onClick(card)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.04, y: -4 }}
      className="relative flex-shrink-0 w-44 h-24 rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isHovered
          ? '0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 15px rgba(255, 255, 255, 0.04)'
          : 'inset 0 0 10px rgba(255, 255, 255, 0.03)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      <img src={card.image} alt={card.name} className="w-full h-full object-cover absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
        />
      )}

      <div className="relative p-2.5 h-full flex flex-col justify-end">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider self-start mb-1 ${
          card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300' :
          card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' :
          card.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-300' :
          'bg-white/10 text-white/60'
        }`}>{card.rarity}</span>
        <p className="text-white text-[11px] font-bold leading-tight truncate">{card.name}</p>
        <p className="text-white/40 text-[9px] truncate">{card.developerName}</p>
      </div>
    </motion.div>
  );
}

export default function DevSpotlightRibbon({ onOpenOverlay }) {
  const scrollRef = useRef(null);

  // Flatten all cards from all developers/games for the ribbon
  const allCards = DEV_SPOTLIGHT_DATA.flatMap(dev =>
    dev.games.flatMap(game =>
      game.cards.map(card => ({
        ...card,
        developerName: dev.name,
        gameTitle: game.title,
        image: card.image || game.cover
      }))
    )
  ).slice(0, 12);

  if (allCards.length === 0) {
    return (
      <div className="w-full py-3 px-4 rounded-xl text-white/20 text-xs text-center border border-white/5"
           style={{ background: 'rgba(255,255,255,0.02)' }}>
        No developer releases available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="w-full rounded-2xl p-4 pointer-events-auto"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 24px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.4))' }} />
          <span className="text-white/80 text-sm font-bold tracking-wide">Developer Spotlight</span>
          <span className="text-white/20 text-[9px] font-mono">NEW</span>
        </div>
        <button
          onClick={onOpenOverlay}
          className="flex items-center gap-1 text-white/40 hover:text-cyan-400 text-[10px] font-semibold transition-colors group"
        >
          View All
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {allCards.map(card => (
          <RibbonCard key={card.id} card={card} onClick={onOpenOverlay} />
        ))}
      </div>
    </motion.div>
  );
}