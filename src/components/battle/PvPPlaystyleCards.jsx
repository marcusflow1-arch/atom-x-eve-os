import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crosshair, Trophy, Globe, ChevronLeft, Zap, Shield, Users, Star, Target, Crown, Flame } from 'lucide-react';

const PLAYSTYLES = [
  {
    id: 'fighting',
    name: 'Fighting',
    icon: Swords,
    accentColor: 'from-red-500 to-orange-500',
    accentText: 'text-red-400',
    description: 'Close-quarters combat across multiple martial arts disciplines',
    montageImages: [
      { game: 'Street Fighter', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=80' },
      { game: 'Tenkaichi', image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1920&q=80' },
      { game: 'Tekken', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1920&q=80' },
      { game: 'Mortal Kombat', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&q=80' },
    ],
    styles: [
      { name: 'Z-Arena Style', desc: '3D fly-around combat, destructible environments', origin: 'Tenkaichi' },
      { name: 'Hyper Versus', desc: 'Team-based tag combat with massive combos', origin: 'MvC / Street Fighter' },
      { name: 'Iron Fist', desc: 'Grounded technical martial arts, spacing & punishment', origin: 'Tekken' },
      { name: 'Fatality Rush', desc: 'Brutal finisher-based fighting with environmental kills', origin: 'Mortal Kombat' },
      { name: 'Platform Brawl', desc: 'Multi-player arena brawling with items & hazards', origin: 'Smash Bros' },
      { name: 'Anime Clash', desc: 'High-speed aerial combat with cinematic specials', origin: 'Naruto / Dragon Ball' },
    ]
  },
  {
    id: 'shooter',
    name: 'Shooter',
    icon: Crosshair,
    accentColor: 'from-emerald-500 to-cyan-500',
    accentText: 'text-emerald-400',
    description: 'Tactical and arena-based ranged combat warfare',
    montageImages: [
      { game: 'Halo', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80' },
      { game: 'Call of Duty', image: 'https://images.unsplash.com/photo-1533236897111-3e94666b2edf?w=1920&q=80' },
      { game: 'Battlefield', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80' },
      { game: 'Valorant', image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=1920&q=80' },
    ],
    styles: [
      { name: 'Tac-Shooter', desc: 'Precise 5v5 objective combat, one life per round', origin: 'Valorant / CS' },
      { name: 'Arena Quake', desc: 'Fast movement, power weapons, jump pads', origin: 'Halo / Quake' },
      { name: 'Warzone', desc: 'Large-scale vehicular warfare with squads', origin: 'Battlefield' },
      { name: 'Survival Zone', desc: 'Drop in, loot up, be the last one standing', origin: 'Battle Royale' },
      { name: 'Run & Gun', desc: 'Fast-paced respawn combat with killstreaks', origin: 'Call of Duty' },
      { name: 'Extraction', desc: 'Loot high-value zones and extract before time runs out', origin: 'Tarkov / DMZ' },
    ]
  },
  {
    id: 'racing',
    name: 'Racing',
    icon: Zap,
    accentColor: 'from-yellow-500 to-amber-500',
    accentText: 'text-yellow-400',
    description: 'High-speed vehicular competition across diverse tracks',
    montageImages: [
      { game: 'Twisted Metal', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1920&q=80' },
      { game: 'Forza Horizon', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80' },
      { game: 'Midnight Club', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1920&q=80' },
      { game: 'Need for Speed', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&q=80' },
    ],
    styles: [
      { name: 'Street Circuit', desc: 'Illegal street races through neon-lit cities', origin: 'Midnight Club / NFS' },
      { name: 'Open World Rally', desc: 'Cross-country racing across diverse biomes', origin: 'Forza Horizon' },
      { name: 'Vehicular Combat', desc: 'Armed vehicles in demolition arenas', origin: 'Twisted Metal' },
      { name: 'Sim Racing', desc: 'Realistic physics, pit strategy, endurance races', origin: 'Gran Turismo' },
      { name: 'Kart Chaos', desc: 'Item-based racing with power-ups and shortcuts', origin: 'Mario Kart' },
      { name: 'Drift King', desc: 'Score-based drifting through technical courses', origin: 'Initial D' },
    ]
  },
  {
    id: 'cards',
    name: 'Cards',
    icon: Crown,
    accentColor: 'from-purple-500 to-violet-500',
    accentText: 'text-purple-400',
    description: 'Strategic card-based dueling and deck building',
    montageImages: [
      { game: 'Yu-Gi-Oh!', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=1920&q=80' },
      { game: 'Pokémon TCG', image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1920&q=80' },
      { game: 'Wizard101', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80' },
      { game: 'Hearthstone', image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1920&q=80' },
    ],
    styles: [
      { name: 'Duel Masters', desc: 'Head-to-head card battles with summoned creatures', origin: 'Yu-Gi-Oh!' },
      { name: 'Creature Clash', desc: 'Elemental creature battles with type advantages', origin: 'Pokémon TCG' },
      { name: 'Spell Wars', desc: 'Wizard dueling with spell decks and mana systems', origin: 'Wizard101' },
      { name: 'Tavern Brawl', desc: 'Hero-based card combat with random modifiers', origin: 'Hearthstone' },
      { name: 'Triple Triad', desc: 'Grid-based card placement with capture mechanics', origin: 'Final Fantasy' },
      { name: 'Deck Raid', desc: 'Co-op deck building against AI bosses', origin: 'WoW TCG' },
    ]
  },
  {
    id: 'mmo',
    name: 'MMO',
    icon: Globe,
    accentColor: 'from-blue-500 to-indigo-500',
    accentText: 'text-blue-400',
    description: 'Turn-based and action RPG combat systems',
    montageImages: [
      { game: 'Final Fantasy', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&q=80' },
      { game: 'KOTOR', image: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=1920&q=80' },
      { game: 'Expedition 33', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80' },
      { game: 'World of Warcraft', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=80' },
    ],
    styles: [
      { name: 'ATB Combat', desc: 'Active Time Battle — wait for gauge, then strike', origin: 'Final Fantasy' },
      { name: 'Force Tactics', desc: 'Pause-based tactical combat with abilities', origin: 'KOTOR' },
      { name: 'Expedition Turn', desc: 'Pure turn-based party combat with positioning', origin: 'Expedition 33' },
      { name: 'Tab Target', desc: 'Classic MMO rotation-based combat with cooldowns', origin: 'WoW / FFXIV' },
      { name: 'Action MMORPG', desc: 'Real-time dodge and combo-based MMO combat', origin: 'Black Desert' },
      { name: 'Raid Boss', desc: 'Multi-party coordinated boss encounters', origin: 'WoW / Destiny' },
    ]
  },
];

// Montage background that cycles through images
function MontageBackground({ images, isActive }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isActive) { setCurrentIndex(0); return; }
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isActive, images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={`${currentIndex}-${images[currentIndex].game}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.35, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIndex].image}
            alt={images[currentIndex].game}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80" />

      {/* Current game name ticker */}
      {isActive && (
        <motion.div
          key={images[currentIndex].game}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-6 right-6 z-20"
        >
          <span className="text-white/20 text-[10px] font-mono tracking-[0.3em] uppercase">
            {images[currentIndex].game}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Inner view: styles list for a selected playstyle
function PlaystyleQueueView({ playstyle, onBack, onQueue }) {
  const [selectedStyles, setSelectedStyles] = useState([]);

  const toggleStyle = (styleName) => {
    setSelectedStyles(prev =>
      prev.includes(styleName) ? prev.filter(s => s !== styleName) : [...prev, styleName]
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs tracking-widest uppercase">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${playstyle.accentColor} flex items-center justify-center`}>
              <playstyle.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-light text-white tracking-wider uppercase">{playstyle.name}</h2>
              <p className="text-white/30 text-xs">{playstyle.description}</p>
            </div>
          </div>
        </div>

        {selectedStyles.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onQueue(selectedStyles)}
            className="px-8 py-3 bg-white text-black font-medium text-xs tracking-widest uppercase rounded-full hover:bg-gray-200 transition-colors flex items-center gap-3"
          >
            <Swords className="w-4 h-4" />
            Queue ({selectedStyles.length})
          </motion.button>
        )}
      </div>

      {/* Styles Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <p className="text-white/20 text-xs tracking-widest uppercase mb-6">Select one or more fighting styles to queue into</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {playstyle.styles.map((style, i) => {
            const isSelected = selectedStyles.includes(style.name);
            return (
              <motion.button
                key={style.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => toggleStyle(style.name)}
                className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'bg-white/[0.08] border-white/25 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                }`}
              >
                {/* Selection indicator */}
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  isSelected ? 'bg-white border-white' : 'border-white/15'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>

                <h4 className="text-white font-medium text-base mb-1.5 tracking-wide pr-8">{style.name}</h4>
                <p className="text-white/40 text-xs leading-relaxed mb-3">{style.desc}</p>
                <span className={`text-[10px] tracking-widest uppercase ${playstyle.accentText} opacity-60`}>
                  Inspired by {style.origin}
                </span>

                {/* Subtle accent glow when selected */}
                {isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${playstyle.accentColor} opacity-[0.04] pointer-events-none`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main PvP component
export default function PvPPlaystyleCards({ onBack, onQueue }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedPlaystyle, setSelectedPlaystyle] = useState(null);
  const [inQueue, setInQueue] = useState(null); // { playstyle, styles }

  if (inQueue) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-32 h-32 relative mb-12">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border border-white/20 animate-spin opacity-40" style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
          <div className="absolute inset-4 rounded-full border border-orange-500/20 opacity-60" style={{ borderTopColor: 'transparent', borderRightColor: 'transparent', animation: 'spin 2s linear infinite reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords className="w-8 h-8 text-white/80 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-light text-white mb-2 tracking-wider uppercase">Searching for Opponent</h2>
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mb-6" />
        <p className="text-white/40 text-sm mb-2 font-light">
          Playstyle: <span className="text-orange-400">{inQueue.playstyle}</span>
        </p>
        <p className="text-white/20 text-xs mb-12">{inQueue.styles.join(' • ')}</p>
        <button
          onClick={() => setInQueue(null)}
          className="px-10 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 hover:border-red-500/30 rounded-full transition-all duration-300 text-xs tracking-widest uppercase"
        >
          Abort Sequence
        </button>
      </div>
    );
  }

  if (selectedPlaystyle) {
    return (
      <PlaystyleQueueView
        playstyle={selectedPlaystyle}
        onBack={() => setSelectedPlaystyle(null)}
        onQueue={(styles) => setInQueue({ playstyle: selectedPlaystyle.name, styles })}
      />
    );
  }

  const hoveredPlaystyle = PLAYSTYLES.find(p => p.id === hoveredId);

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Montage Background */}
      <AnimatePresence>
        {hoveredPlaystyle && (
          <MontageBackground
            key={hoveredPlaystyle.id}
            images={hoveredPlaystyle.montageImages}
            isActive={true}
          />
        )}
      </AnimatePresence>

      {/* Default dark bg when nothing hovered */}
      {!hoveredPlaystyle && <div className="absolute inset-0 bg-[#050505]" />}

      {/* Header */}
      <div className="relative z-20 p-8 pb-4 flex-shrink-0">
        <div className="text-center mb-2">
          <h2 className="text-3xl font-thin text-white mb-2 tracking-[0.2em] uppercase">PvP Arena</h2>
          <div className="h-px w-20 bg-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-xs tracking-wide">Choose your playstyle — hover to preview the experience</p>
        </div>
      </div>

      {/* Cards Row */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-8 pb-12">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide max-w-full px-4">
          {PLAYSTYLES.map((ps, i) => {
            const isHovered = hoveredId === ps.id;
            return (
              <motion.div
                key={ps.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onMouseEnter={() => setHoveredId(ps.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedPlaystyle(ps)}
                className={`relative flex-shrink-0 w-52 h-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 border ${
                  isHovered
                    ? 'scale-105 border-white/25 shadow-[0_0_40px_rgba(255,255,255,0.08)]'
                    : 'border-white/8 hover:border-white/15'
                }`}
                style={{
                  background: isHovered
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Card gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-b ${ps.accentColor} transition-opacity duration-500 ${isHovered ? 'opacity-[0.12]' : 'opacity-[0.03]'}`} />

                {/* Card content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                    isHovered ? 'bg-white/10 scale-110' : 'bg-white/[0.03]'
                  }`} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <ps.icon className={`w-7 h-7 transition-colors duration-300 ${isHovered ? 'text-white' : 'text-white/40'}`} />
                  </div>

                  {/* Name */}
                  <h3 className={`text-lg font-light tracking-widest uppercase mb-2 transition-colors duration-300 ${isHovered ? 'text-white' : 'text-white/70'}`}>
                    {ps.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed transition-colors duration-300 ${isHovered ? 'text-white/50' : 'text-white/25'}`}>
                    {ps.description}
                  </p>

                  {/* Style count */}
                  <div className={`mt-auto pt-4 text-[10px] tracking-widest uppercase transition-colors duration-300 ${isHovered ? 'text-white/40' : 'text-white/15'}`}>
                    {ps.styles.length} Styles
                  </div>

                  {/* Enter indicator on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 left-0 right-0 flex justify-center"
                      >
                        <span className="text-[10px] text-white/40 tracking-widest uppercase px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
                          Click to Enter
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom glow line */}
                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${ps.accentColor} transition-opacity duration-500 ${isHovered ? 'opacity-60' : 'opacity-0'}`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}