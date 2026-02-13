import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Flame } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';

function FeaturedDevCard({ dev, game, card, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  const rarityAccent =
    card.rarity === 'Legendary' ? { color: 'text-amber-300', bg: 'from-amber-500/30 via-orange-500/10 to-transparent', border: 'border-amber-500/30', glow: 'rgba(251,191,36,0.15)' } :
    card.rarity === 'Epic' ? { color: 'text-purple-300', bg: 'from-purple-500/30 via-purple-500/10 to-transparent', border: 'border-purple-500/30', glow: 'rgba(168,85,247,0.15)' } :
    card.rarity === 'Rare' ? { color: 'text-blue-300', bg: 'from-blue-500/30 via-blue-500/10 to-transparent', border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.15)' } :
    { color: 'text-slate-300', bg: 'from-slate-500/20 via-slate-500/5 to-transparent', border: 'border-white/10', glow: 'rgba(255,255,255,0.05)' };

  return (
    <motion.div
      onClick={() => onClick(card)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -6 }}
      className={`relative flex-shrink-0 w-[260px] h-[150px] rounded-2xl overflow-hidden cursor-pointer border ${rarityAccent.border}`}
      style={{
        background: 'rgba(12, 16, 24, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: isHovered
          ? `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${rarityAccent.glow}`
          : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'box-shadow 0.4s ease, border-color 0.3s ease'
      }}
    >
      <img src={card.image || game.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      <div className={`absolute inset-0 bg-gradient-to-br ${rarityAccent.bg} opacity-60`} />

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(${110 + (mousePos.x - 0.5) * 40}deg, transparent ${mousePos.x * 100 - 25}%, rgba(255,255,255,0.12) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 25}%)`
          }}
        />
      )}

      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={dev.logo} alt={dev.name} className="w-6 h-6 rounded-full border border-white/20 shadow-md" />
            <span className="text-white/50 text-[10px] font-semibold truncate max-w-[100px]">{dev.name}</span>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${rarityAccent.border} ${rarityAccent.color}`}
                style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
            {card.rarity}
          </span>
        </div>

        <div>
          <div className="flex items-end gap-3">
            <span className="text-3xl drop-shadow-lg">{card.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm leading-tight ${rarityAccent.color}`} style={{ textShadow: `0 0 20px ${rarityAccent.glow}` }}>
                {card.name}
              </p>
              <p className="text-white/40 text-[10px] truncate">{game.title} • {card.type}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-white/30 text-[9px]">{card.tag}</span>
            <span className="text-cyan-400 text-[10px] font-bold">{card.price}</span>
          </div>
        </div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">Developer Spotlight</h3>
            <p className="text-white/25 text-[10px]">Recently released cards from studios</p>
          </div>
        </div>
        <button
          onClick={onOpenOverlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all border border-white/10 text-white/50 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 group"
        >
          Browse All
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Developer filter chips */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveDev(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0 border transition-all text-[10px] font-semibold ${
            !activeDev
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-transparent border-transparent text-white/40 hover:bg-white/5'
          }`}
        >
          <Flame className="w-3 h-3" />
          All Studios
        </motion.button>
        {DEV_SPOTLIGHT_DATA.map(dev => (
          <DevLogoChip key={dev.id} dev={dev} isActive={activeDev?.id === dev.id} onClick={(d) => setActiveDev(activeDev?.id === d.id ? null : d)} />
        ))}
      </div>

      {/* Cards horizontal scroll */}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {featuredCards.map(card => (
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