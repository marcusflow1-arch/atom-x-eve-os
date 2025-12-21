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
const LimitedEditionCardSmall = ({ card, onClick, isSelected }) => {
  const rarity = rarityColors[card.rarity] || rarityColors.Common;
  
  return (
    <div 
      onClick={() => onClick && onClick(card)}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
        isSelected 
          ? 'bg-white/[0.1] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
      }`}
    >
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

// Giant Card Detail Panel - Achievement Page Style
const CardDetailPanel = ({ card, onClose }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-150, 150], [15, -15]);
  const rotateY = useTransform(mouseX, [-150, 150], [-15, 15]);
  const shineX = useTransform(mouseX, [-150, 150], [0, 100]);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const cX = clientX - left - width / 2;
    const cY = clientY - top - height / 2;
    x.set(cX);
    y.set(cY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const rarity = rarityColors[card.rarity] || rarityColors.Common;

  // Mock stats for the card
  const cardStats = {
    Power: Math.floor(Math.random() * 50) + 50,
    Defense: Math.floor(Math.random() * 40) + 30,
    Speed: Math.floor(Math.random() * 30) + 20,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex gap-8 p-8">
        {/* Left: Interactive Card Display */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {/* Interactive Liquid Glass Card Container */}
          <div 
            className="relative group perspective-1000 w-[200px] aspect-[2.5/3.5]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              className="w-full h-full rounded-2xl relative z-10 overflow-hidden shadow-2xl border-2 bg-slate-900"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                borderColor: card.rarity === 'Mythic' ? 'rgba(239,68,68,0.5)' : 
                             card.rarity === 'Legendary' ? 'rgba(249,115,22,0.5)' : 
                             card.rarity === 'Epic' ? 'rgba(168,85,247,0.5)' : 'rgba(59,130,246,0.5)',
                boxShadow: `0 0 40px ${
                  card.rarity === 'Mythic' ? 'rgba(239,68,68,0.4)' : 
                  card.rarity === 'Legendary' ? 'rgba(249,115,22,0.4)' : 
                  card.rarity === 'Epic' ? 'rgba(168,85,247,0.4)' : 'rgba(59,130,246,0.4)'
                }`
              }}
            >
              {/* Card Content Layer */}
              <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0)" }}>
                <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
              </div>

              {/* Interactive Shine Layer */}
              <motion.div 
                className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                style={{
                  background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`)
                }}
              />

              {/* Glossy Overlay */}
              <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />

              {/* Rarity Badge on Card */}
              <div className="absolute bottom-3 left-3 right-3 z-30">
                <Badge className={`${rarity.bg} ${rarity.text} border-none text-xs w-full justify-center shadow-lg backdrop-blur-md`}>
                  {card.rarity}
                </Badge>
              </div>
            </motion.div>
            
            {/* Floor Reflection */}
            <div className="absolute -bottom-8 left-2 right-2 h-4 bg-black/40 blur-xl rounded-full" />
          </div>

          {/* Card Name & Type under the card */}
          <div className="mt-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">{card.name}</h3>
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{card.type}</Badge>
              <Badge className={`${rarity.bg} ${rarity.text} border-none text-xs`}>{card.rarity}</Badge>
            </div>
            <p className="text-amber-400/80 text-sm mt-2">{card.tag}</p>
          </div>
        </div>

        {/* Right: Card Information & Stats */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-cyan-400" />
              Card Record
            </h3>
            <p className="text-white/40 text-sm">Detailed information about this card</p>
          </div>

          <div className="flex-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-5 border border-white/10">
            <div className="space-y-5">
              {/* Description */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-2">Description</label>
                <p className="text-slate-300 leading-relaxed italic text-sm">
                  "A powerful {card.type.toLowerCase()} card from the {card.tag.includes('Developer') ? 'developer' : 'store'} limited edition collection. 
                  This rare item grants its holder unique abilities and bonuses in compatible games."
                </p>
              </div>

              {/* Stats Grid */}
              <div className="pt-4 border-t border-white/10">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-3">Stats</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(cardStats).map(([key, value]) => (
                    <div key={key} className="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">{key}</div>
                      <div className="text-2xl font-bold text-white mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Details */}
              <div className="pt-4 border-t border-white/10">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-3">Card Details</label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Card ID</span>
                    <span className="text-white font-mono">#{card.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Type</span>
                    <span className="text-white">{card.type}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Rarity</span>
                    <span className={rarity.text}>{card.rarity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Edition</span>
                    <span className="text-amber-400">{card.tag}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DeveloperLimitedEdition() {
  const [currentDeveloperIndex, setCurrentDeveloperIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [selectedCard, setSelectedCard] = useState(null); // For giant card display
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
    setSelectedCard(null); // Clear selected card when game changes
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const handleCloseCardDetail = () => {
    setSelectedCard(null);
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
                setSelectedCard(null);
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

      {/* Giant Card Detail Panel - Shows below developer header when card is selected */}
      <AnimatePresence>
        {selectedCard && (
          <CardDetailPanel 
            card={selectedCard} 
            onClose={handleCloseCardDetail}
          />
        )}
      </AnimatePresence>

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
                <LimitedEditionCardSmall 
                  key={card.id} 
                  card={card} 
                  onClick={handleCardClick}
                  isSelected={selectedCard?.id === card.id}
                />
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