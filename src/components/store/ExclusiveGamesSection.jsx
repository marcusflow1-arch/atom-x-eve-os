import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Star, Trophy, Package, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Mock data for exclusives - in real app, this would come from /api/store/exclusives
const exclusiveGames = [
  {
    id: 'cyberpunk_2088_dlc',
    title: 'Cyberpunk 2088: Phantom Liberty',
    tagline: 'Return to Night City in this cyberpunk epic',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=320&h=180&fit=crop',
    isFeaturedBadge: true,
    releaseDate: '2024-01-15',
    storeSlug: 'cyberpunk-2088-phantom-liberty'
  },
  {
    id: 'elder_scrolls_vi',
    title: 'Elder Scrolls VI: Legends',
    tagline: 'Epic fantasy adventure awaits in Tamriel',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=320&h=180&fit=crop',
    isFeaturedBadge: false,
    releaseDate: '2024-02-20',
    storeSlug: 'elder-scrolls-vi-legends'
  },
  {
    id: 'half_life_3',
    title: 'Half-Life 3: Reconstructed',
    tagline: 'The legendary sequel finally arrives',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=320&h=180&fit=crop',
    isFeaturedBadge: true,
    releaseDate: '2024-03-10',
    storeSlug: 'half-life-3-reconstructed'
  },
  {
    id: 'ai_dungeon_master',
    title: 'AI Dungeon Master Pro',
    tagline: 'Infinite adventures powered by advanced AI',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=320&h=180&fit=crop',
    isFeaturedBadge: false,
    releaseDate: '2024-04-05',
    storeSlug: 'ai-dungeon-master-pro'
  }
];

// Mock data for game details - in real app, this would come from /api/store/game-details/:id
const gameDetailsData = {
  'cyberpunk_2088_dlc': {
    achievements: [
      { id: 'a1', name: 'Night City Legend', description: 'Complete all main story missions', rarity: 'Legendary', earnedByUser: false, iconUrl: '🏆' },
      { id: 'a2', name: 'Corpo Infiltrator', description: 'Successfully infiltrate Arasaka Tower', rarity: 'Epic', earnedByUser: true, iconUrl: '🕴️' },
      { id: 'a3', name: 'Street Samurai', description: 'Master all cybernetic combat skills', rarity: 'Rare', earnedByUser: false, iconUrl: '⚔️' }
    ],
    collectibles: [
      { id: 'c1', name: 'Phantom Liberty Badge', rarity: 'Epic', imageUrl: '🎖️', available: true },
      { id: 'c2', name: 'Johnny Silverhand\'s Guitar', rarity: 'Legendary', imageUrl: '🎸', available: false },
      { id: 'c3', name: 'Militech Rifle', rarity: 'Rare', imageUrl: '🔫', available: true }
    ],
    news: [
      { id: 'n1', title: 'New DLC Update Available', excerpt: 'Phantom Liberty gets major content update with new missions', link: '#' }
    ]
  },
  'elder_scrolls_vi': {
    achievements: [
      { id: 'a4', name: 'Dragonborn Ascended', description: 'Unlock all dragon shouts', rarity: 'Legendary', earnedByUser: false, iconUrl: '🐲' },
      { id: 'a5', name: 'Master Thief', description: 'Steal 1000 gold without detection', rarity: 'Epic', earnedByUser: true, iconUrl: '💰' }
    ],
    collectibles: [
      { id: 'c4', name: 'Dragon Claw Key', rarity: 'Legendary', imageUrl: '🗝️', available: true },
      { id: 'c5', name: 'Daedric Sword', rarity: 'Epic', imageUrl: '⚔️', available: false }
    ],
    news: [
      { id: 'n2', title: 'Elder Scrolls VI Beta', excerpt: 'Join the closed beta for the next chapter', link: '#' }
    ]
  },
  'half_life_3': {
    achievements: [
      { id: 'a6', name: 'Freeman\'s Return', description: 'Complete Chapter 1 of Half-Life 3', rarity: 'Common', earnedByUser: true, iconUrl: '👨‍🔬' },
      { id: 'a7', name: 'Gravity Gun Master', description: 'Defeat 100 enemies using gravity gun', rarity: 'Rare', earnedByUser: false, iconUrl: '🔫' }
    ],
    collectibles: [
      { id: 'c6', name: 'HEV Suit Mark V', rarity: 'Legendary', imageUrl: '🥽', available: true },
      { id: 'c7', name: 'Crowbar of Legend', rarity: 'Epic', imageUrl: '🔨', available: true }
    ],
    news: [
      { id: 'n3', title: 'Half-Life 3 Launch Event', excerpt: 'Join us for the official launch celebration', link: '#' }
    ]
  },
  'ai_dungeon_master': {
    achievements: [
      { id: 'a8', name: 'Master Storyteller', description: 'Create 50 unique adventures', rarity: 'Epic', earnedByUser: false, iconUrl: '📚' },
      { id: 'a9', name: 'AI Whisperer', description: 'Successfully train custom AI model', rarity: 'Legendary', earnedByUser: false, iconUrl: '🤖' }
    ],
    collectibles: [
      { id: 'c8', name: 'Mystic Dice Set', rarity: 'Rare', imageUrl: '🎲', available: true },
      { id: 'c9', name: 'AI Core Fragment', rarity: 'Epic', imageUrl: '💎', available: false }
    ],
    news: [
      { id: 'n4', title: 'AI Updates Rolling Out', excerpt: 'Enhanced storytelling capabilities now available', link: '#' }
    ]
  }
};

const FeaturedCarousel = ({ games, selectedGameId, onGameSelect, onPrev, onNext }) => {
  const scrollRef = useRef(null);

  const scrollToGame = useCallback((gameId) => {
    const gameIndex = games.findIndex(g => g.id === gameId);
    if (scrollRef.current && gameIndex !== -1) {
      const cardWidth = 280;
      scrollRef.current.scrollTo({
        left: gameIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  }, [games]);

  useEffect(() => {
    scrollToGame(selectedGameId);
  }, [selectedGameId, scrollToGame]);

  return (
    <div className="relative">
      <button
        onClick={onPrev}
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
        aria-label="Previous game"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game) => (
          <motion.div
            key={game.id}
            className={`flex-shrink-0 w-[260px] cursor-pointer transition-all duration-300 ${
              selectedGameId === game.id ? 'scale-105' : 'hover:scale-[1.02]'
            }`}
            onClick={() => onGameSelect(game.id)}
            whileHover={{ y: -2 }}
          >
            <div className={`relative rounded-xl overflow-hidden border-2 transition-all ${
              selectedGameId === game.id 
                ? 'border-yellow-400/60 shadow-lg shadow-yellow-400/20' 
                : 'border-slate-600/30 hover:border-slate-500/50'
            }`}>
              <img
                src={game.thumbnailUrl}
                alt={game.title}
                className="w-full h-[146px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{game.title}</h3>
                <p className="text-slate-300 text-xs line-clamp-1">{game.tagline}</p>
              </div>
              
              {game.isFeaturedBadge && (
                <div className="absolute top-2 right-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    <Crown className="w-3 h-3 inline mr-1" />
                    FEATURED
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
        aria-label="Next game"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

const GameDetailsPanel = ({ gameId, gameDetails, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50 animate-pulse" />
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  if (!gameDetails) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a game to view details</p>
        </div>
      </div>
    );
  }

  const { achievements, collectibles, news } = gameDetails;

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Latest Achievements
        </h4>
        <div className="space-y-2">
          {achievements.slice(0, 3).map((achievement) => (
            <div key={achievement.id} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <span className="text-lg">{achievement.iconUrl}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-white text-sm font-medium truncate">{achievement.name}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      achievement.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-300' :
                      achievement.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' :
                      achievement.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{achievement.description}</p>
                  {achievement.earnedByUser && (
                    <div className="mt-2">
                      <span className="text-green-400 text-xs font-medium">✓ Unlocked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" />
          Rare Collectibles
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {collectibles.slice(0, 4).map((item) => (
            <div key={item.id} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
              <div className="text-center">
                <div className="text-2xl mb-2">{item.imageUrl}</div>
                <h5 className="text-white text-xs font-medium truncate">{item.name}</h5>
                <span className={`text-xs px-1 py-0.5 rounded-full mt-1 inline-block ${
                  item.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-300' :
                  item.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {item.rarity}
                </span>
                {!item.available && (
                  <div className="mt-1">
                    <span className="text-red-400 text-xs">Coming Soon</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {news && news.length > 0 && (
        <div>
          <h4 className="text-white font-semibold mb-3">Latest News</h4>
          <div className="space-y-2">
            {news.map((newsItem) => (
              <div key={newsItem.id} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                <h5 className="text-white text-sm font-medium mb-1">{newsItem.title}</h5>
                <p className="text-slate-400 text-xs">{newsItem.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ExclusiveGamesSection({ 
  fetchFeaturedGames, 
  fetchGameDetails, 
  preloadOnHover = false 
}) {
  const [isOpen, setIsOpen] = useState(true); // Default open for better UX
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gamesLoaded, setGamesLoaded] = useState(false);
  const contentId = "exclusives-content";
  const firstInteractiveRef = useRef(null);

  // Load game details when selection changes
  useEffect(() => {
    if (selectedGameId && isOpen) {
      setLoading(true);
      // Simulate API call - in real app would use fetchGameDetails
      setTimeout(() => {
        const details = gameDetailsData[selectedGameId];
        setGameDetails(details);
        setLoading(false);
      }, 300);
    }
  }, [selectedGameId, isOpen, fetchGameDetails]);

  // Initialize with first game when opened
  useEffect(() => {
    if (isOpen && !gamesLoaded) {
      setSelectedGameId(exclusiveGames[0]?.id);
      setGamesLoaded(true);
    }
  }, [isOpen, gamesLoaded]);

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
  };

  const handlePrev = () => {
    const currentIndex = exclusiveGames.findIndex(g => g.id === selectedGameId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : exclusiveGames.length - 1;
    setSelectedGameId(exclusiveGames[prevIndex].id);
  };

  const handleNext = () => {
    const currentIndex = exclusiveGames.findIndex(g => g.id === selectedGameId);
    const nextIndex = currentIndex < exclusiveGames.length - 1 ? currentIndex + 1 : 0;
    setSelectedGameId(exclusiveGames[nextIndex].id);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  };

  return (
    <section className="w-full px-6 py-12" role="region" aria-labelledby="exclusives-title">
      <style>{`
        .glow-text {
          text-shadow: 0 2px 10px rgba(243, 178, 26, 0.4);
        }
        .glow-underline {
          background: linear-gradient(90deg, transparent, #f3b21a, transparent);
          height: 2px;
          width: 100%;
          filter: blur(1px);
          box-shadow: 0 0 10px rgba(243, 178, 26, 0.4);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Collapsible Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
        onMouseEnter={preloadOnHover ? () => {/* preload logic */} : undefined}
      >
        <div 
          className="cursor-pointer select-none"
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-controls={contentId}
          aria-expanded={isOpen}
          role="button"
        >
          <h2 
            id="exclusives-title"
            className="text-4xl font-bold text-yellow-400 glow-text mb-2"
          >
            EXCLUSIVES GAMEPLAY
          </h2>
          <p className="text-yellow-300 text-lg mb-4 flex items-center justify-center gap-2">
            EDITOR CHOICE
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </p>
        </div>
        <div className="glow-underline mx-auto max-w-md"></div>
      </motion.div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left Box - Featured Games Preview */}
              <div 
                className="bg-gradient-to-b from-slate-800/65 to-slate-900/55 rounded-2xl p-6 border border-slate-700/50 relative"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(24,34,48,0.65), rgba(10,16,26,0.55))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                }}
              >
                <h3 className="text-white font-semibold mb-4 text-center">Featured Games Preview</h3>
                <FeaturedCarousel
                  games={exclusiveGames}
                  selectedGameId={selectedGameId}
                  onGameSelect={handleGameSelect}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              </div>

              {/* Right Box - Game Details */}
              <div 
                className="bg-gradient-to-b from-slate-800/65 to-slate-900/55 rounded-2xl p-6 border border-slate-700/50 min-h-[400px]"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(24,34,48,0.65), rgba(10,16,26,0.55))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                }}
              >
                <h3 className="text-white font-semibold mb-4 text-center">
                  {gameDetails ? `${exclusiveGames.find(g => g.id === selectedGameId)?.title} Details` : 'Game Details'}
                </h3>
                <GameDetailsPanel 
                  gameId={selectedGameId} 
                  gameDetails={gameDetails} 
                  loading={loading}
                />
              </div>
            </motion.div>

            {/* Achievement News & Collectibles Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold text-lg">Achievement News & Collectibles</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  className="bg-gradient-to-b from-slate-800/65 to-slate-900/55 rounded-2xl p-6 border border-slate-700/50"
                  style={{ 
                    background: 'linear-gradient(180deg, rgba(24,34,48,0.65), rgba(10,16,26,0.55))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                  }}
                >
                  <div className="text-center mb-6">
                    <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <h4 className="text-white font-semibold">Latest Achievements</h4>
                    <p className="text-slate-400 text-sm">Discover new challenges</p>
                  </div>
                </div>

                <div 
                  className="bg-gradient-to-b from-slate-800/65 to-slate-900/55 rounded-2xl p-6 border border-slate-700/50"
                  style={{ 
                    background: 'linear-gradient(180deg, rgba(24,34,48,0.65), rgba(10,16,26,0.55))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                  }}
                >
                  <div className="text-center mb-6">
                    <Trophy className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <h4 className="text-white font-semibold">Rare Collectibles</h4>
                    <p className="text-slate-400 text-sm">Limited edition items</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Featured Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex justify-center mt-6"
            >
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg"
                style={{ 
                  filter: 'drop-shadow(0 12px 24px rgba(219,166,10,0.18))',
                  boxShadow: '0 4px 20px rgba(243, 178, 26, 0.3)'
                }}
              >
                <Crown className="w-5 h-5 inline mr-2" />
                FEATURED
                <span className="text-sm font-normal ml-2">EDITOR'S PICK</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}