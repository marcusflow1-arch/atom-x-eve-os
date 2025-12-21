import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Target, ChevronLeft, ChevronRight,
  Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
  Play, Sparkles, Trophy, Crown, Eye, Check, Trash2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

// Mock pinned games
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
  { id: 5, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', lastPlayed: '2 days ago', progress: 55 },
];

// Upcoming cards with achievement-style design
const upcomingCards = [
  { 
    id: 1, 
    name: 'Voidtech Slayer', 
    type: 'Ability', 
    rarity: 'Legendary', 
    game: 'Elden Ring: Nightreign', 
    icon: '⚔️',
    description: 'A devastating attack that rips through dimensional barriers, dealing massive damage to all enemies in a cone.',
    stats: { Power: 95, Cooldown: '12s', Range: 'Medium' },
    unlockCondition: 'Complete "The Eternal Night" questline'
  },
  { 
    id: 2, 
    name: 'Quantum Shield', 
    type: 'Equipment', 
    rarity: 'Epic', 
    game: 'Cyberpunk 2088', 
    icon: '🛡️',
    description: 'Advanced nano-tech protection from the Night City underworld. Absorbs incoming damage.',
    stats: { Defense: 78, Duration: '8s', Absorption: '40%' },
    unlockCondition: 'Reach Cyberpunk genre level 15'
  },
  { 
    id: 3, 
    name: 'Arcane Surge', 
    type: 'Passive', 
    rarity: 'Rare', 
    game: 'Baldur\'s Gate 3', 
    icon: '✨',
    description: 'Channel the Weave to amplify magical abilities. Each spell increases power.',
    stats: { Bonus: '+25%', Stack: '5x', Duration: '10s' },
    unlockCondition: 'Cast 1000 spells across RPG games'
  },
  { 
    id: 4, 
    name: 'Neon Rush', 
    type: 'Ability', 
    rarity: 'Epic', 
    game: 'Neon Legends', 
    icon: '⚡',
    description: 'Burst of speed through the neon-lit streets. Become untargetable while dashing.',
    stats: { Speed: '+300%', Duration: '2s', Damage: '45' },
    unlockCondition: 'Win 50 races in Action games'
  },
  { 
    id: 5, 
    name: 'Dragon\'s Breath', 
    type: 'Ability', 
    rarity: 'Legendary', 
    game: 'Dragon Age', 
    icon: '🔥',
    description: 'Unleash the fury of an ancient dragon, breathing fire in a massive area.',
    stats: { Power: 120, Area: 'Large', Burn: '6s' },
    unlockCondition: 'Defeat 10 dragons across all games'
  },
  { 
    id: 6, 
    name: 'Shadow Step', 
    type: 'Ability', 
    rarity: 'Rare', 
    game: 'Shadow Realm', 
    icon: '👁️',
    description: 'Teleport through shadows to strike from behind.',
    stats: { Range: '15m', Damage: '+50%', Cooldown: '8s' },
    unlockCondition: 'Perform 500 stealth kills'
  },
];

const rarityStyles = {
  Common: { border: 'border-slate-400', glow: '', ring: 'ring-slate-400/30', text: 'text-slate-300' },
  Rare: { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', ring: 'ring-blue-400/40', text: 'text-blue-300' },
  Epic: { border: 'border-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]', ring: 'ring-purple-400/50', text: 'text-purple-300' },
  Legendary: { border: 'border-amber-400', glow: 'shadow-[0_0_25px_rgba(251,191,36,0.6)]', ring: 'ring-amber-400/60', text: 'text-amber-300' },
};

// Achievement-style Card Component with tilt effect
function AchievementStyleCard({ card, isSelected, onClick, size = 'normal' }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const style = rarityStyles[card.rarity];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * 20,
      y: (x - 0.5) * -20
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const sizeClasses = size === 'small' 
    ? 'w-20 h-28' 
    : size === 'large' 
    ? 'w-40 h-56' 
    : 'w-28 h-40';

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isSelected ? 1.05 : 1
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${sizeClasses} relative cursor-pointer perspective-1000 flex-shrink-0`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Base */}
      <div className={`absolute inset-0 rounded-xl border-2 ${style.border} ${isSelected || isHovered ? style.glow : ''} overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 transition-shadow duration-300`}>
        {/* Animated shine line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${105 + tilt.y * 2}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex flex-col p-2">
          {/* Rarity indicator */}
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${style.text}`}>
              {card.rarity}
            </span>
            {isSelected && <Eye className="w-3 h-3 text-white/60" />}
          </div>

          {/* Icon */}
          <div className="flex-1 flex items-center justify-center">
            <span className={`${size === 'large' ? 'text-5xl' : size === 'small' ? 'text-2xl' : 'text-3xl'}`}>{card.icon}</span>
          </div>

          {/* Name */}
          <div className="text-center">
            <p className={`text-white font-bold ${size === 'large' ? 'text-sm' : 'text-[10px]'} truncate`}>{card.name}</p>
            <p className={`text-white/50 ${size === 'large' ? 'text-xs' : 'text-[8px]'} truncate`}>{card.type}</p>
          </div>
        </div>

        {/* Corner decorations */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${style.border} rounded-tl-lg`} />
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${style.border} rounded-tr-lg`} />
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${style.border} rounded-bl-lg`} />
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${style.border} rounded-br-lg`} />
      </div>
    </motion.div>
  );
}

// Time & Date Component
function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-left">
      <div className="text-3xl font-bold text-white font-mono tracking-wider">
        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm text-white/60">
        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

// Goals Component
function GoalsPanel() {
  const [goals, setGoals] = useState([
    { id: 1, text: 'Complete 5 achievements', completed: true },
    { id: 2, text: 'Reach RPG level 20', completed: false },
    { id: 3, text: 'Win 5 battles', completed: false },
  ]);

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  return (
    <div className="space-y-2">
      <h3 className="text-white font-bold text-sm flex items-center gap-2">
        <Target className="w-4 h-4 text-cyan-400" />
        Today's Goals
      </h3>
      <div className="space-y-1.5">
        {goals.map((goal) => (
          <div 
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-xs ${
              goal.completed ? 'bg-green-500/10 text-white/50' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              goal.completed ? 'bg-green-500 border-green-500' : 'border-white/30'
            }`}>
              {goal.completed && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className={goal.completed ? 'line-through' : ''}>{goal.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Game Boxes Component (next to 3D viewer)
function GameBoxes() {
  return (
    <div className="flex flex-col gap-2">
      {pinnedGames.slice(0, 4).map((game) => (
        <div 
          key={game.id}
          className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.05] backdrop-blur-sm border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group w-40"
        >
          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{game.title}</p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${game.progress}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Export
export default function FocusModePanel() {
  const [activeTab, setActiveTab] = useState('pinned');
  const [selectedCard, setSelectedCard] = useState(upcomingCards[0]);
  const scrollRef = useRef(null);

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex min-h-full">
      {/* Left Side - Viewer Adjacent Content */}
      <div className="flex flex-col gap-4 mr-6">
        {/* Time & Date */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <TimeDisplay />
        </div>

        {/* Goals */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <GoalsPanel />
        </div>

        {/* Game Boxes */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-3">
          <h3 className="text-white font-bold text-xs mb-2 flex items-center gap-1">
            <Pin className="w-3 h-3 text-cyan-400" />
            Pinned
          </h3>
          <GameBoxes />
        </div>
      </div>

      {/* Right Side - Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Navigation */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex">
            <motion.div
              className="absolute top-0 bottom-0 w-1/2 bg-white/[0.1] backdrop-blur-xl rounded-lg border border-white/20"
              animate={{ x: activeTab === 'pinned' ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <div className="relative flex">
            <button
              onClick={() => setActiveTab('pinned')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 z-10 ${
                activeTab === 'pinned' ? 'text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Pin className="w-3 h-3" />
              Pinned Games
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 z-10 ${
                activeTab === 'cards' ? 'text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              New Content
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'pinned' ? (
              <motion.div
                key="pinned"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                {/* Horizontal Scrolling Games - 35% smaller */}
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {pinnedGames.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex-shrink-0 w-24 group cursor-pointer"
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all">
                        <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/80 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-white font-bold text-[10px] truncate">{game.title}</p>
                          <div className="h-0.5 bg-white/20 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${game.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {/* Add Game */}
                  <div className="flex-shrink-0 w-24">
                    <div className="aspect-[3/4] rounded-lg border border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Plus className="w-5 h-5 text-white/40" />
                      <p className="text-white/40 text-[10px] mt-1">Add</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="cards"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto pr-2"
                ref={scrollRef}
                style={{ scrollbarWidth: 'thin' }}
              >
                {/* Selected Card Preview */}
                {selectedCard && (
                  <div className="flex gap-4 mb-4 p-3 bg-white/[0.03] rounded-xl border border-white/10">
                    <AchievementStyleCard card={selectedCard} isSelected={true} size="large" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-white">{selectedCard.name}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rarityStyles[selectedCard.rarity].text} bg-white/10`}>
                          {selectedCard.rarity}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mb-2">{selectedCard.type} • {selectedCard.game}</p>
                      <p className="text-white/70 text-xs leading-relaxed mb-3">{selectedCard.description}</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {Object.entries(selectedCard.stats).map(([key, value]) => (
                          <div key={key} className="bg-white/5 rounded-lg p-2 border border-white/10">
                            <p className="text-white/40 text-[10px]">{key}</p>
                            <p className="text-white font-bold text-xs">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <p className="text-white/50 text-[10px]">How to Unlock</p>
                        </div>
                        <p className="text-white text-xs">{selectedCard.unlockCondition}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards Grid */}
                <div className="flex flex-wrap gap-2">
                  {upcomingCards.map((card) => (
                    <AchievementStyleCard
                      key={card.id}
                      card={card}
                      isSelected={selectedCard?.id === card.id}
                      onClick={() => setSelectedCard(card)}
                      size="small"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
}