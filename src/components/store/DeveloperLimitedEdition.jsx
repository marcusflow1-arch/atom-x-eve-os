import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Sparkles, X, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';

// Developer data with their games and limited edition cards
const DEVELOPERS = [
  {
    id: 'ubisoft',
    name: 'Ubisoft',
    games: [
      {
        id: 'ac-shadows',
        title: "Assassin's Creed Shadows",
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        genre: 'Action RPG',
        year: 2024,
        description: 'Set in feudal Japan, become a legendary shinobi or powerful samurai in this epic dual-protagonist story.',
        limitedCards: [
          { id: 1, name: 'Shadow Strike', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 2, name: 'Samurai Armor', type: 'Equipment', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 3, name: 'Spirit Hawk', type: 'Companion', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      {
        id: 'fc7',
        title: 'Far Cry 7',
        cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
        genre: 'FPS',
        year: 2025,
        description: 'Survive and fight back against a ruthless militia in this intense first-person shooter.',
        limitedCards: [
          { id: 4, name: 'Guerrilla Tactics', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 5, name: 'Tactical Vest', type: 'Equipment', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      {
        id: 'division3',
        title: 'The Division 3',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        genre: 'Looter Shooter',
        year: 2025,
        description: 'Reclaim New York in this tactical action RPG set in a devastated urban landscape.',
        limitedCards: [
          { id: 6, name: 'Pulse Scanner', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'cdpr',
    name: 'CD Projekt Red',
    games: [
      {
        id: 'cyberpunk-2',
        title: 'Cyberpunk 2088',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        genre: 'Action RPG',
        year: 2088,
        description: 'Return to Night City in this next-generation cyberpunk experience.',
        limitedCards: [
          { id: 7, name: 'Neural Hack', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 8, name: 'Chrome Arms', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 9, name: 'Drone Companion', type: 'Companion', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      {
        id: 'witcher4',
        title: 'The Witcher 4',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        genre: 'Action RPG',
        year: 2026,
        description: 'A new saga begins in the world of The Witcher.',
        limitedCards: [
          { id: 10, name: 'Igni Mastery', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 11, name: 'Silver Sword', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'bethesda',
    name: 'Bethesda',
    games: [
      {
        id: 'tes6',
        title: 'Elder Scrolls VI',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        genre: 'Open World RPG',
        year: 2027,
        description: 'The next chapter in the Elder Scrolls saga awaits.',
        limitedCards: [
          { id: 12, name: 'Dragonborn Shout', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 13, name: 'Daedric Armor', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      {
        id: 'starfield2',
        title: 'Starfield: Shattered Space',
        cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop',
        genre: 'Space RPG',
        year: 2025,
        description: 'Explore the mysteries of the Shattered Space expansion.',
        limitedCards: [
          { id: 14, name: 'Gravity Well', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'rockstar',
    name: 'Rockstar Games',
    games: [
      {
        id: 'gta6',
        title: 'GTA VI',
        cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
        genre: 'Action Adventure',
        year: 2025,
        description: 'Return to Vice City in the most anticipated game of the decade.',
        limitedCards: [
          { id: 15, name: 'Heist Master', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 16, name: 'Supercar Keys', type: 'Equipment', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'fromsoft',
    name: 'FromSoftware',
    games: [
      {
        id: 'elden-ring-dlc',
        title: 'Elden Ring: Nightreign',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        genre: 'Action RPG',
        year: 2025,
        description: 'Face the darkness in this epic expansion to Elden Ring.',
        limitedCards: [
          { id: 17, name: 'Voidtech Slayer', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 18, name: 'Miquella\'s Blessing', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 19, name: 'Nightreign Armor', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      {
        id: 'armored-core',
        title: 'Armored Core VI',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        genre: 'Mech Action',
        year: 2023,
        description: 'Build and pilot mechs in intense combat.',
        limitedCards: [
          { id: 20, name: 'Core Overload', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'ea',
    name: 'Electronic Arts',
    games: [
      {
        id: 'mass-effect',
        title: 'Mass Effect 5',
        cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop',
        genre: 'Sci-Fi RPG',
        year: 2027,
        description: 'The next chapter in the legendary Mass Effect saga.',
        limitedCards: [
          { id: 21, name: 'Biotic Charge', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'square',
    name: 'Square Enix',
    games: [
      {
        id: 'ff17',
        title: 'Final Fantasy XVII',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
        genre: 'JRPG',
        year: 2028,
        description: 'A new fantasy adventure awaits.',
        limitedCards: [
          { id: 22, name: 'Ultima Magic', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 23, name: 'Chocobo Mount', type: 'Companion', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'capcom',
    name: 'Capcom',
    games: [
      {
        id: 're10',
        title: 'Resident Evil 10',
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        genre: 'Survival Horror',
        year: 2026,
        description: 'Terror reaches new heights in this next installment.',
        limitedCards: [
          { id: 24, name: 'Last Stand', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'konami',
    name: 'Konami',
    games: [
      {
        id: 'mgs-delta',
        title: 'Metal Gear Solid Δ',
        cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
        genre: 'Stealth Action',
        year: 2025,
        description: 'The legendary Snake Eater remade for a new generation.',
        limitedCards: [
          { id: 25, name: 'CQC Master', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'sony',
    name: 'Sony Interactive',
    games: [
      {
        id: 'gow-ragnarok2',
        title: 'God of War: Ragnarok II',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        genre: 'Action Adventure',
        year: 2027,
        description: 'The saga of Kratos continues.',
        limitedCards: [
          { id: 26, name: 'Spartan Rage', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 27, name: 'Leviathan Axe', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'nintendo',
    name: 'Nintendo',
    games: [
      {
        id: 'zelda-next',
        title: 'The Legend of Zelda: Echoes',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
        genre: 'Action Adventure',
        year: 2026,
        description: 'A new adventure in the land of Hyrule.',
        limitedCards: [
          { id: 28, name: 'Triforce Power', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'activision',
    name: 'Activision',
    games: [
      {
        id: 'cod-next',
        title: 'Call of Duty: Black Ops 7',
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        genre: 'FPS',
        year: 2026,
        description: 'The next chapter in the Black Ops saga.',
        limitedCards: [
          { id: 29, name: 'Tactical Nuke', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'valve',
    name: 'Valve',
    games: [
      {
        id: 'hl3',
        title: 'Half-Life 3',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        genre: 'FPS',
        year: 2030,
        description: 'The wait is finally over.',
        limitedCards: [
          { id: 30, name: 'Gravity Gun', type: 'Equipment', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'bungie',
    name: 'Bungie',
    games: [
      {
        id: 'marathon',
        title: 'Marathon',
        cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop',
        genre: 'Extraction Shooter',
        year: 2025,
        description: 'A new extraction shooter experience.',
        limitedCards: [
          { id: 31, name: 'Runner Sprint', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'insomniac',
    name: 'Insomniac Games',
    games: [
      {
        id: 'spiderman3',
        title: "Marvel's Spider-Man 3",
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        genre: 'Action Adventure',
        year: 2027,
        description: 'Swing through New York in the next Spider-Man adventure.',
        limitedCards: [
          { id: 32, name: 'Web Strike', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
];

const TOTAL_DEVELOPERS = 15;

const rarityColors = {
  Mythic: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300' },
  Legendary: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300' },
  Epic: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-300' },
  Rare: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300' },
  Common: { bg: 'bg-slate-700/50', border: 'border-slate-500', text: 'text-slate-300' }
};

// Limited Edition Card for the right panel
const LimitedEditionCardSmall = ({ card }) => {
  const rarity = rarityColors[card.rarity] || rarityColors.Common;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">{card.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] px-1.5 py-0">{card.type}</Badge>
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[9px] px-1.5 py-0`}>{card.rarity}</Badge>
        </div>
        <p className="text-[10px] text-amber-400/80 mt-1">{card.tag}</p>
      </div>
    </div>
  );
};

export default function DeveloperLimitedEdition() {
  const [currentDeveloperIndex, setCurrentDeveloperIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const containerRef = useRef(null);

  const currentDeveloper = DEVELOPERS[currentDeveloperIndex];
  const currentGame = currentDeveloper?.games[selectedGameIndex] || currentDeveloper?.games[0];

  const handlePrevDeveloper = () => {
    setDirection(-1);
    setCurrentDeveloperIndex((prev) => (prev === 0 ? DEVELOPERS.length - 1 : prev - 1));
    setSelectedGameIndex(0);
  };

  const handleNextDeveloper = () => {
    setDirection(1);
    setCurrentDeveloperIndex((prev) => (prev === DEVELOPERS.length - 1 ? 0 : prev + 1));
    setSelectedGameIndex(0);
  };

  const handleSelectGame = (index) => {
    setSelectedGameIndex(index);
  };

  // Animation variants for liquid glass slide
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="mb-12">
      {/* Developer Selector Header */}
      <div 
        className="relative rounded-2xl p-6 mb-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Background shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 animate-pulse" style={{ animationDuration: '3s' }} />
        
        <div className="relative flex items-center justify-center gap-8">
          {/* Left Arrow */}
          <button 
            onClick={handlePrevDeveloper}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 border border-white/10"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Developer Name */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h2
              key={currentDeveloper.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="text-3xl md:text-4xl font-bold text-white min-w-[300px] text-center"
            >
              {currentDeveloper.name}
            </motion.h2>
          </AnimatePresence>

          {/* Right Arrow */}
          <button 
            onClick={handleNextDeveloper}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 border border-white/10"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress Dots - 15 dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: TOTAL_DEVELOPERS }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentDeveloperIndex ? 1 : -1);
                setCurrentDeveloperIndex(index);
                setSelectedGameIndex(0);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentDeveloperIndex 
                  ? 'bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`${currentDeveloper.id}-${selectedGameIndex}`}
          custom={direction}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex gap-6"
        >
          {/* Left - Game Display Box */}
          <div 
            className="flex-1 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Game Cover */}
            <div className="relative h-64 overflow-hidden">
              <img 
                src={currentGame?.cover} 
                alt={currentGame?.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              
              {/* Game Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Developer Limited Edition Rewards
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{currentGame?.title}</h3>
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <span>{currentGame?.genre}</span>
                  <span>•</span>
                  <span>{currentGame?.year}</span>
                </div>
              </div>
            </div>

            {/* Game Description */}
            <div className="p-6">
              <p className="text-white/70 text-sm leading-relaxed mb-6">{currentGame?.description}</p>
              
              {/* Other Games by Developer */}
              {currentDeveloper.games.length > 1 && (
                <div>
                  <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                    Other Games by {currentDeveloper.name}
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {currentDeveloper.games.map((game, index) => (
                      <button
                        key={game.id}
                        onClick={() => handleSelectGame(index)}
                        className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedGameIndex 
                            ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        <div className="relative aspect-video">
                          <img 
                            src={game.cover} 
                            alt={game.title} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40" />
                        </div>
                        <div className="p-1.5 bg-slate-900/80">
                          <p className="text-[10px] text-white font-medium truncate">{game.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Limited Edition Cards Panel */}
          <div 
            className="w-80 flex-shrink-0 rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Limited Edition Cards
            </h4>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
              {currentGame?.limitedCards.map((card) => (
                <LimitedEditionCardSmall key={card.id} card={card} />
              ))}
              
              {(!currentGame?.limitedCards || currentGame.limitedCards.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">No limited edition cards available</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}