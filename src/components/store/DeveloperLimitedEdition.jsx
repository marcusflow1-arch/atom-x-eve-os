import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Sparkles, X, ScrollText, Code, Gamepad2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';

// Developer data with their games and limited edition cards
const DEVELOPERS = [
  {
    id: 'ubisoft',
    name: 'Ubisoft',
    logo: 'UBI',
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
    logo: 'CDPR',
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
    logo: 'BETH',
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
    logo: 'R*',
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
    logo: 'FS',
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
    logo: 'EA',
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
    logo: 'SQEX',
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
    logo: 'CAP',
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
    logo: 'KON',
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
    logo: 'SONY',
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
];

const rarityColors = {
  Mythic: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300' },
  Legendary: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300' },
  Epic: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-300' },
  Rare: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300' },
  Common: { bg: 'bg-slate-700/50', border: 'border-slate-500', text: 'text-slate-300' }
};

// Large Card Display Component
function LargeCardDisplay({ card }) {
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

  return (
    <div 
      className="relative group perspective-1000 w-[220px] aspect-[2.5/3.5]"
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
          boxShadow: `0 0 50px ${
            card.rarity === 'Mythic' ? 'rgba(239,68,68,0.4)' : 
            card.rarity === 'Legendary' ? 'rgba(249,115,22,0.4)' : 
            card.rarity === 'Epic' ? 'rgba(168,85,247,0.4)' : 'rgba(59,130,246,0.4)'
          }`
        }}
      >
        <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0)" }}>
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        </div>

        <motion.div 
          className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
          style={{
            background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`)
          }}
        />

        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />

        <div className="absolute bottom-3 left-3 right-3 z-30">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-xs w-full justify-center shadow-lg backdrop-blur-md`}>
            {card.rarity}
          </Badge>
        </div>
      </motion.div>
      
      <div className="absolute -bottom-8 left-4 right-4 h-4 bg-black/40 blur-xl rounded-full" />
      
      <div className="mt-10 text-center">
        <h3 className="text-lg font-bold text-white mb-1">{card.name}</h3>
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">{card.type}</Badge>
        </div>
      </div>
    </div>
  );
}

// Compact Card Detail Panel
function CardDetailPanelCompact({ card }) {
  const rarity = rarityColors[card.rarity] || rarityColors.Common;
  
  const cardStats = {
    Power: 50 + (card.id * 7) % 50,
    Defense: 30 + (card.id * 11) % 40,
    Speed: 20 + (card.id * 13) % 30,
    Synergy: 15 + (card.id * 5) % 35,
    Durability: 40 + (card.id * 9) % 40,
  };

  const abilities = [
    { name: 'Primary Effect', description: `Enhances ${card.type.toLowerCase()} capabilities by ${20 + (card.id * 3) % 30}%` },
    { name: 'Passive Bonus', description: `Grants bonus experience in related genre activities` },
  ];

  const lore = `This ${card.rarity.toLowerCase()} ${card.type.toLowerCase()} was forged in the depths of legendary battles. Those who wield this card gain access to powers beyond ordinary comprehension.`;

  return (
    <div className="flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{card.name}</h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">{card.type}</Badge>
                <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px]`}>{card.rarity}</Badge>
                <span className="text-amber-400/80 text-[10px]">{card.tag}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px]">Card ID</p>
              <p className="text-white font-mono text-sm">#{String(card.id).padStart(4, '0')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            Statistics
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(cardStats).map(([key, value]) => (
              <div key={key} className="bg-black/30 p-2 rounded-lg border border-white/5 text-center">
                <div className="text-[8px] text-slate-400 uppercase">{key}</div>
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="w-full h-0.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${value > 70 ? 'bg-green-500' : value > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Abilities
          </h3>
          <div className="space-y-1.5">
            {abilities.map((ability, index) => (
              <div key={index} className="bg-black/20 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-xs">{ability.name}</h4>
                  <p className="text-white/60 text-[10px] truncate">{ability.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <ScrollText className="w-3 h-3 text-cyan-400" />
            Lore
          </h3>
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <p className="text-slate-300 text-xs italic leading-relaxed">{lore}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeveloperLimitedEdition() {
  const [currentDeveloperIndex, setCurrentDeveloperIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  
  const currentDeveloper = DEVELOPERS[currentDeveloperIndex];
  const currentGame = currentDeveloper?.games[selectedGameIndex] || currentDeveloper?.games[0];

  // Auto-select first card on initial load or developer switch
  useEffect(() => {
    if (currentGame?.limitedCards?.length > 0) {
      setSelectedCard(currentGame.limitedCards[0]);
    } else {
      setSelectedCard(null);
    }
  }, [currentDeveloperIndex, selectedGameIndex]);

  const handleSelectDeveloper = (index) => {
    setCurrentDeveloperIndex(index);
    setSelectedGameIndex(0);
  };

  const handleSelectGame = (index) => {
    setSelectedGameIndex(index);
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  return (
    <div className="mb-12">
      {/* 1. Developer Navigation - Tabbed Layout */}
      <div 
        className="relative rounded-2xl p-2 mb-6 overflow-hidden flex flex-col gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.5) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex overflow-x-auto gap-2 px-2 py-2 scrollbar-hide">
          {DEVELOPERS.map((dev, index) => (
            <button
              key={dev.id}
              onClick={() => handleSelectDeveloper(index)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 border ${
                currentDeveloperIndex === index 
                  ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white' 
                  : 'bg-transparent border-white/5 text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                currentDeveloperIndex === index ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/50'
              }`}>
                {dev.logo}
              </div>
              <span className="text-sm font-bold tracking-wide">{dev.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 h-[500px]">
        {/* Left Side - Card Display & Card Selector */}
        <div className="w-[22%] flex-shrink-0 flex flex-col gap-3">
          <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Limited Edition Cards
          </h4>

          {/* Card Display Box - Translucent */}
          <div 
            className="flex-1 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Ambient Background Glow for Selected Developer */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-50" />
            
            {selectedCard && <LargeCardDisplay card={selectedCard} />}
          </div>

          {/* Card Selector - Horizontal Scroller */}
          <div className="h-[80px] rounded-xl border border-white/10 bg-white/5 p-2 flex gap-2 overflow-x-auto scrollbar-hide">
             {currentGame?.limitedCards.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const rarity = rarityColors[card.rarity] || rarityColors.Common;
                return (
                  <motion.div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 h-full aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative ${
                      isSelected 
                        ? `${rarity.border} ring-2 ring-white/20` 
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={card.image} className="w-full h-full object-cover" />
                  </motion.div>
                );
             })}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-white/10 self-stretch" />

        {/* Middle - Card Details */}
        <div className="flex-1 min-w-0 self-stretch">
          {selectedCard ? (
            <div 
              className="rounded-2xl p-6 h-full overflow-y-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.5) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CardDetailPanelCompact card={selectedCard} />
            </div>
          ) : (
            <div 
              className="rounded-2xl p-4 h-full flex items-center justify-center border border-white/5"
              style={{ background: 'rgba(15, 23, 42, 0.4)' }}
            >
              <p className="text-white/40 text-sm">Select a card to view details</p>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-white/10 self-stretch" />

        {/* Right Side - Games List */}
        <div className="w-[220px] flex-shrink-0">
          <div 
            className="rounded-2xl p-4 h-full flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gamepad2 className="w-3 h-3 text-cyan-400" />
              {currentDeveloper.name} Games
            </h4>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
              {currentDeveloper.games.map((game, index) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(index)}
                  className={`w-full group relative overflow-hidden rounded-xl border transition-all text-left ${
                    index === selectedGameIndex 
                      ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="aspect-video w-full relative">
                    <img src={game.cover} alt={game.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="text-white font-bold text-xs truncate leading-tight">{game.title}</h4>
                      <p className="text-[9px] text-white/60">{game.year}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
               <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>Total Collections</span>
                  <span>{currentDeveloper.games.length}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}