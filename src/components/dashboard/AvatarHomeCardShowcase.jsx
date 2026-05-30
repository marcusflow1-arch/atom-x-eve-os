import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Sword, Star, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Lock } from 'lucide-react';

const CARDS = [
  {
    id: 'f1', name: 'Shadow Wraith', icon: '👻', rarity: 'Legendary', game: 'Resident Evil', genre: 'Fear',
    image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=600',
    power: 94, defense: 42, speed: 78,
    ability: 'Phantom Strike',
    abilityDesc: 'Deals 3× damage from stealth. Targets cannot detect you for 8 seconds after activation.',
    passive: 'Wraith Form — reduces incoming damage by 18% when HP drops below 30%.',
    lore: 'Born from the ashes of forgotten souls, the Shadow Wraith haunts the corridors of the Spencer Mansion, feeding on fear itself.',
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.4)',
  },
  {
    id: 's1', name: 'Plasma Rifle', icon: '🔫', rarity: 'Legendary', game: 'Doom', genre: 'Shooter',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    power: 99, defense: 12, speed: 55,
    ability: 'Overcharge Burst',
    abilityDesc: 'Fires a concentrated plasma blast dealing 580 energy damage in a cone. Cooldown: 12s.',
    passive: 'Heat Sink — each consecutive hit increases damage by 8%, stacking up to 5×.',
    lore: 'Forged in the furnaces of Mars, this weapon has ended more demon invasions than any soldier alive can count.',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.4)',
  },
  {
    id: 'r1', name: 'Dragon Flame', icon: '🔥', rarity: 'Legendary', game: 'Witcher', genre: 'RPG',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600',
    power: 88, defense: 30, speed: 62,
    ability: 'Igni Surge',
    abilityDesc: 'Channels ancient Witcher magic to release a torrent of dragon fire, igniting all enemies in range for 6s.',
    passive: 'Ember Core — fire damage ignores 40% of enemy fire resistance.',
    lore: 'Crafted by the last dragon mage of Kovir, its flame burns with the memory of the Conjunction of Spheres.',
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.4)',
  },
  {
    id: 'sf1', name: 'Warp Drive', icon: '🚀', rarity: 'Legendary', game: 'Mass Effect', genre: 'Sci-Fi',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600',
    power: 70, defense: 58, speed: 99,
    ability: 'Mass Relay Jump',
    abilityDesc: 'Teleports your unit 600m in any direction instantly. Can pass through solid terrain.',
    passive: 'Element Zero Core — reduces all cooldowns by 22% while this card is active.',
    lore: 'Recovered from the ruins of the Cerberus research station Horizon, this drive core rewrites the rules of space travel.',
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.4)',
  },
  {
    id: 'a3', name: 'Adrenaline', icon: '🔥', rarity: 'Legendary', game: 'Bayonetta', genre: 'Action',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
    power: 82, defense: 25, speed: 96,
    ability: 'Witch Time',
    abilityDesc: 'Dodge at the last millisecond to trigger bullet-time, slowing all enemies by 90% for 4 seconds.',
    passive: 'Umbra Climax — at max combo, all attacks deal double damage and auto-trigger Witch Time.',
    lore: 'An Umbra Witch never runs out of tricks. When death closes in, time itself bows to her will.',
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.4)',
  },
  {
    id: 'rc1', name: 'Turbo Boost', icon: '🏎️', rarity: 'Legendary', game: 'Need for Speed', genre: 'Racing',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600',
    power: 77, defense: 18, speed: 100,
    ability: 'NOS Overload',
    abilityDesc: 'Activates all nitrous reserves simultaneously for a 3.2× speed multiplier lasting 8 seconds.',
    passive: 'Slipstream Draft — following another racer within 2m grants continuous speed stacking.',
    lore: 'Underground legend says this engine was reverse-engineered from a spacecraft that crashed in the Nevada desert in 1987.',
    color: '#facc15',
    glowColor: 'rgba(250,204,21,0.4)',
  },
];

const RARITY_COLORS = {
  Common: '#94a3b8',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
};

const StatBar = ({ label, value, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] text-white/40 uppercase tracking-wider w-10 flex-shrink-0">{label}</span>
    <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
    <span className="text-[9px] font-bold w-5 text-right" style={{ color }}>{value}</span>
  </div>
);

export default function AvatarHomeCardShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const intervalRef = useRef(null);

  const card = CARDS[activeIndex];

  const go = (dir) => {
    setActiveIndex(i => (i + dir + CARDS.length) % CARDS.length);
  };

  // Auto-cycle
  useEffect(() => {
    intervalRef.current = setInterval(() => go(1), 6000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const resetCycle = (dir) => {
    clearInterval(intervalRef.current);
    go(dir);
    intervalRef.current = setInterval(() => go(1), 6000);
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ minHeight: '512px' }}>

      {/* Full-bleed background image — blurred, tinted */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${card.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${card.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(28px) saturate(1.4)',
            transform: 'scale(1.1)',
          }}
        />
      </AnimatePresence>

      {/* Dark overlay gradient */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.75) 100%)`,
      }} />

      {/* Glow pulse behind active card */}
      <motion.div
        key={`glow-${card.id}`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.25, scale: 1.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4 }}
        className="absolute pointer-events-none"
        style={{
          left: '26%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: card.glowColor,
          filter: 'blur(60px)',
        }}
      />

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 flex h-full w-full items-center px-8 gap-8" style={{ minHeight: '512px' }}>

        {/* Left Nav Arrow */}
        <button
          onClick={() => resetCycle(-1)}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>

        {/* ─── Card Visual ─── */}
        <div className="flex-shrink-0 relative" style={{ width: 160 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 24, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              exit={{ opacity: 0, y: -24, rotateY: 15 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: 160,
                height: 220,
                boxShadow: `0 0 40px ${card.glowColor}, 0 20px 60px rgba(0,0,0,0.6)`,
                border: `1px solid ${card.color}55`,
              }}
            >
              <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.9) 100%)` }} />
              {/* Liquid glass sheen */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
              }} />
              {/* Rarity badge */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                style={{ background: `${card.color}33`, border: `1px solid ${card.color}66`, color: card.color }}>
                {card.rarity}
              </div>
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-5xl drop-shadow-2xl" style={{ filter: `drop-shadow(0 0 12px ${card.glowColor})` }}>{card.icon}</span>
              </div>
              {/* Name at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-bold text-sm leading-tight">{card.name}</p>
                <p className="text-white/50 text-[9px]">{card.game}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex gap-1.5 justify-center mt-3">
            {CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => { clearInterval(intervalRef.current); setActiveIndex(i); intervalRef.current = setInterval(() => go(1), 6000); }}
                className="transition-all rounded-full"
                style={{
                  width: i === activeIndex ? 16 : 5,
                  height: 5,
                  background: i === activeIndex ? card.color : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* ─── Card Info — liquid glass, open layout ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${card.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col gap-4 min-w-0"
          >
            {/* Name + genre */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                  style={{ background: `${card.color}22`, color: card.color, border: `1px solid ${card.color}44` }}>
                  {card.genre}
                </span>
                <span className="text-white/30 text-[9px]">{card.game}</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-none tracking-tight" style={{
                textShadow: `0 0 30px ${card.glowColor}`,
              }}>{card.name}</h2>
            </div>

            {/* Lore — no box, just text floating */}
            <p className="text-white/50 text-[11px] leading-relaxed max-w-sm italic" style={{
              textShadow: '0 1px 8px rgba(0,0,0,0.8)',
            }}>"{card.lore}"</p>

            {/* Stats — minimal liquid bars */}
            <div className="flex flex-col gap-1.5 max-w-[220px]">
              <StatBar label="PWR" value={card.power} color={card.color} />
              <StatBar label="DEF" value={card.defense} color="#64748b" />
              <StatBar label="SPD" value={card.speed} color="#22d3ee" />
            </div>

            {/* Ability — glass pill, not a box */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3" style={{ color: card.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.color }}>{card.ability}</span>
              </div>
              <p className="text-white/60 text-[11px] leading-relaxed max-w-xs">{card.abilityDesc}</p>
            </div>

            {/* Passive */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-white/40" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Passive</span>
              </div>
              <p className="text-white/40 text-[11px] leading-relaxed max-w-xs">{card.passive}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ─── Right column: mini card strip ─── */}
        <div className="flex-shrink-0 flex flex-col gap-2 items-center">
          {CARDS.map((c, i) => (
            <motion.button
              key={c.id}
              onClick={() => { clearInterval(intervalRef.current); setActiveIndex(i); intervalRef.current = setInterval(() => go(1), 6000); }}
              onHoverStart={() => setHoveredCard(i)}
              onHoverEnd={() => setHoveredCard(null)}
              whileHover={{ scale: 1.08, x: -4 }}
              className="relative rounded-xl overflow-hidden transition-all flex-shrink-0"
              style={{
                width: 52,
                height: 70,
                opacity: i === activeIndex ? 1 : 0.45,
                border: i === activeIndex ? `1.5px solid ${c.color}` : '1px solid rgba(255,255,255,0.08)',
                boxShadow: i === activeIndex ? `0 0 12px ${c.glowColor}` : 'none',
              }}
            >
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
              <span className="absolute bottom-1 left-0 right-0 text-center text-[7px] text-white font-bold truncate px-1">{c.name}</span>
              {i === activeIndex && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Right Nav Arrow */}
        <button
          onClick={() => resetCycle(1)}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
        <Star className="w-2.5 h-2.5 text-white/20" />
        <span className="text-[8px] text-white/20 uppercase tracking-[0.25em]">AI Avatar Collection</span>
        <Star className="w-2.5 h-2.5 text-white/20" />
      </div>
    </div>
  );
}