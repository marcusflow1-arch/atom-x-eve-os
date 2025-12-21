import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Target, ChevronLeft, ChevronRight,
  Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
  Play, Sparkles, Trophy, Crown, Eye
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

// Mock pinned games - Luna style
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring: Nightreign', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
  { id: 5, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', lastPlayed: '2 days ago', progress: 55 },
  { id: 6, title: 'Dragon Age', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', lastPlayed: '5 days ago', progress: 78 },
];

// Upcoming cards with achievement-style design
const upcomingCards = [
  { 
    id: 1, 
    name: 'Void Slasher', 
    type: 'Ability', 
    rarity: 'Legendary', 
    game: 'Elden Ring: Nightreign', 
    icon: '⚔️',
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-amber-500/50',
    description: 'A devastating attack that rips through dimensional barriers, dealing massive damage to all enemies in a cone. Gains power based on your AI companion\'s aggression level.',
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
    color: 'from-cyan-500 to-blue-500',
    borderColor: 'border-purple-400',
    glowColor: 'shadow-purple-500/50',
    description: 'Advanced nano-tech protection from the Night City underworld. Absorbs incoming damage and converts it to energy for your next attack.',
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
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-blue-400',
    glowColor: 'shadow-blue-500/50',
    description: 'Channel the Weave to amplify magical abilities. Each spell cast increases your magic power by 5% for 10 seconds, stacking up to 5 times.',
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
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-purple-400',
    glowColor: 'shadow-purple-500/50',
    description: 'Burst of speed through the neon-lit streets. Become untargetable for 2 seconds while dashing, leaving a trail of energy that damages enemies.',
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
    color: 'from-red-500 to-orange-500',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-amber-500/50',
    description: 'Unleash the fury of an ancient dragon, breathing fire in a massive area. Burns enemies for additional damage over time.',
    stats: { Power: 120, Area: 'Large', Burn: '6s' },
    unlockCondition: 'Defeat 10 dragons across all games'
  },
];

const rarityStyles = {
  Common: { border: 'border-slate-400', glow: '', bg: 'from-slate-600 to-slate-700', text: 'text-slate-300' },
  Rare: { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', bg: 'from-blue-600 to-blue-800', text: 'text-blue-300' },
  Epic: { border: 'border-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', bg: 'from-purple-600 to-purple-800', text: 'text-purple-300' },
  Legendary: { border: 'border-amber-400', glow: 'shadow-[0_0_25px_rgba(251,191,36,0.5)]', bg: 'from-amber-500 to-orange-600', text: 'text-amber-300' },
};

// Left Panel Component - Pinned Games (Luna Style)
function PinnedGamesPanel({ activeTab, setActiveTab }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Tab Navigation with Sliding Box */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex">
          <motion.div
            className="absolute top-0 bottom-0 w-1/2 bg-white/[0.1] backdrop-blur-xl rounded-xl border border-white/20"
            animate={{ x: activeTab === 'pinned' ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="relative flex">
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 z-10 ${
              activeTab === 'pinned' ? 'text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Pin className="w-4 h-4" />
            Pinned Games
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 z-10 ${
              activeTab === 'cards' ? 'text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Cards to Come
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'pinned' ? (
          <motion.div
            key="pinned"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Horizontal Scrolling Games - Luna Style */}
            <div className="relative">
              {/* Scroll Buttons */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => scroll(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {pinnedGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-44 group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-cyan-400/50 transition-all duration-300">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-cyan-500/80 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-7 h-7 text-white ml-1" />
                        </div>
                      </div>

                      {/* Game Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-bold text-sm mb-1 truncate">{game.title}</p>
                        <p className="text-white/50 text-xs mb-2">{game.lastPlayed}</p>
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                            style={{ width: `${game.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add Game Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pinnedGames.length * 0.1 }}
                  className="flex-shrink-0 w-44"
                >
                  <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center mb-2 transition-colors">
                      <Plus className="w-6 h-6 text-white/40 group-hover:text-cyan-400" />
                    </div>
                    <p className="text-white/40 text-sm font-semibold group-hover:text-white/60">Add Game</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// Cards Preview Component - Achievement Style
function CardsPreviewPanel({ activeTab, selectedCard, setSelectedCard }) {
  if (activeTab !== 'cards') return null;

  const style = selectedCard ? rarityStyles[selectedCard.rarity] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-6"
    >
      {/* Enlarged Card Preview */}
      {selectedCard && (
        <div className="flex gap-6 mb-6">
          {/* Card Display - Achievement Style */}
          <motion.div
            key={selectedCard.id}
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-48 aspect-[3/4] rounded-2xl border-2 ${style.border} ${style.glow} overflow-hidden flex-shrink-0 relative`}
            style={{ perspective: '1000px' }}
          >
            {/* Card Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${style.bg}`} />
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            
            {/* Card Content */}
            <div className="relative h-full flex flex-col p-4">
              {/* Rarity Badge */}
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                  {selectedCard.rarity}
                </span>
                <span className="text-white/60 text-[10px]">{selectedCard.type}</span>
              </div>

              {/* Icon */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-6xl drop-shadow-lg">{selectedCard.icon}</div>
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-1">{selectedCard.name}</h3>
                <p className="text-white/60 text-xs">{selectedCard.game}</p>
              </div>
            </div>

            {/* Corner Decorations */}
            <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${style.border} rounded-tl-xl`} />
            <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${style.border} rounded-tr-xl`} />
            <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${style.border} rounded-bl-xl`} />
            <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${style.border} rounded-br-xl`} />
          </motion.div>

          {/* Card Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white">{selectedCard.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${style.text} bg-white/10`}>
                {selectedCard.rarity}
              </span>
            </div>
            <p className="text-white/40 text-sm mb-4">{selectedCard.type} • {selectedCard.game}</p>
            
            <p className="text-white/80 text-sm leading-relaxed mb-4">{selectedCard.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Object.entries(selectedCard.stats).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-white/40 text-xs mb-1">{key}</p>
                  <p className="text-white font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Unlock Condition */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <p className="text-white/60 text-xs uppercase tracking-wider">How to Unlock</p>
              </div>
              <p className="text-white text-sm">{selectedCard.unlockCondition}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cards Row */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {upcomingCards.map((card, index) => {
          const cardStyle = rarityStyles[card.rarity];
          const isSelected = selectedCard?.id === card.id;
          
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedCard(card)}
              className={`flex-shrink-0 w-28 aspect-[3/4] rounded-xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isSelected 
                  ? `${cardStyle.border} ${cardStyle.glow} scale-105` 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cardStyle.bg} opacity-${isSelected ? '100' : '60'}`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
              
              <div className="relative h-full flex flex-col items-center justify-center p-2">
                <div className="text-3xl mb-2">{card.icon}</div>
                <p className="text-white text-xs font-bold text-center truncate w-full">{card.name}</p>
                <p className={`text-[10px] ${cardStyle.text}`}>{card.rarity}</p>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1">
                  <Eye className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Right Panel Component - Feed Updates
function FeedUpdatesPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2">
      {/* Time & Date */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
        <div className="text-4xl font-bold text-white mb-1 font-mono tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-base text-white/60">{formatDate(currentTime)}</div>
      </div>

      {/* Platform Updates */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex-1">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          What's New
        </h2>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold uppercase">Season 2 Live</span>
            </div>
            <p className="text-white font-semibold mb-1">New Battle Pass Available</p>
            <p className="text-white/60 text-sm">50+ new rewards including legendary cards</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                ⚔️
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Void Slasher Coming Soon</p>
                <p className="text-white/50 text-xs">New legendary ability from Elden Ring</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-lg">
                🎮
              </div>
              <div>
                <p className="text-white font-semibold text-sm">5 New Games Added</p>
                <p className="text-white/50 text-xs">Including classic RPG titles</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-lg">
                🏆
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Clan Wars Event</p>
                <p className="text-white/50 text-xs">Compete for exclusive rewards</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-lg">
                🔥
              </div>
              <div>
                <p className="text-white font-semibold text-sm">AI Training Update</p>
                <p className="text-white/50 text-xs">Your AI now learns faster</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Quick View */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Today's Goals
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>
            <span className="text-white/70 line-through">Complete 3 achievements</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-white/30" />
            <span className="text-white">Reach RPG level 20</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-white/30" />
            <span className="text-white">Win 5 battles</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Export
export default function FocusModePanel() {
  const [activeTab, setActiveTab] = useState('pinned');
  const [selectedCard, setSelectedCard] = useState(upcomingCards[0]);

  return (
    <div className="h-full flex gap-6">
      {/* Left Side - Under 3D Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <PinnedGamesPanel activeTab={activeTab} setActiveTab={setActiveTab} />
        <CardsPreviewPanel 
          activeTab={activeTab} 
          selectedCard={selectedCard} 
          setSelectedCard={setSelectedCard} 
        />
      </div>

      {/* Right Side - Feed Updates */}
      <div className="w-80 flex-shrink-0">
        <FeedUpdatesPanel />
      </div>
    </div>
  );
}