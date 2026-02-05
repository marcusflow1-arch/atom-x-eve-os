import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ChevronRight, Star, Sparkles, ShoppingCart, Check, 
  Gamepad2, Zap, TrendingUp, Shield, Activity, 
  Info, Cpu, Layers, Sword, Share2, Crown, 
  Flame, Crosshair, Hexagon, Fingerprint
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../CartContext';

// Developer Data (Existing data structure)
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
  Mythic: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
  Legendary: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  Epic: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Rare: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  Common: { bg: 'bg-slate-700/50', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' }
};

// 3D Card Visual Component
function Card3D({ card }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-150, 150], [15, -15]);
  const rotateY = useTransform(mouseX, [-150, 150], [-15, 15]);
  const shineX = useTransform(mouseX, [-150, 150], [0, 100]);

  const rarity = rarityColors[card.rarity] || rarityColors.Common;

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cX = e.clientX - rect.left - rect.width / 2;
    const cY = e.clientY - rect.top - rect.height / 2;
    x.set(cX);
    y.set(cY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="relative group w-[280px] h-[400px] perspective-1000 mx-auto" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.div
        className="w-full h-full rounded-2xl relative z-10 overflow-hidden shadow-2xl border bg-black/40 backdrop-blur-xl"
        style={{
          rotateX, rotateY, transformStyle: "preserve-3d",
          borderColor: card.rarity === 'Mythic' ? 'rgba(239,68,68,0.5)' : 
                       card.rarity === 'Legendary' ? 'rgba(249,115,22,0.5)' : 
                       'rgba(255,255,255,0.1)',
          boxShadow: `0 0 40px ${rarity.glow.replace('shadow-', '').replace('/50', '/30')}`
        }}
      >
        <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        
        {/* Holographic Shine */}
        <motion.div 
          className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light"
          style={{
            background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.3) ${val}%, transparent 100%)`)
          }}
        />

        <div className="absolute bottom-6 left-6 right-6 z-30">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-xs w-full justify-center shadow-lg backdrop-blur-md mb-2`}>
            {card.rarity}
          </Badge>
          <div className="flex justify-between items-center text-xs text-white/60 font-mono">
            <span>#{String(card.id).padStart(4, '0')}</span>
            <span>EDITION 1</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Stat Bar Component
const StatBar = ({ label, value, color }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-white/50 font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white font-bold">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

export default function DeveloperLimitedEdition() {
  const { addToCart, isPurchased } = useCart();
  const [currentDevIndex, setCurrentDevIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  const currentDev = DEVELOPERS[currentDevIndex];
  const currentGame = currentDev?.games[selectedGameIndex] || currentDev?.games[0];

  // Auto-select first card
  useEffect(() => {
    if (currentGame?.limitedCards?.length > 0) {
      setSelectedCard(currentGame.limitedCards[0]);
    } else {
      setSelectedCard(null);
    }
  }, [currentDevIndex, selectedGameIndex]);

  const handleBuy = () => {
    if (!selectedCard) return;
    const priceMap = { 'Mythic': 95000, 'Legendary': 75000, 'Epic': 45000, 'Rare': 25000, 'Common': 10000 };
    const price = priceMap[selectedCard.rarity] || 25000;
    
    addToCart({
      id: `dev_card_${selectedCard.id}`,
      title: selectedCard.name,
      price: price / 1000,
      image: selectedCard.image,
      type: 'limited_card',
      rarity: selectedCard.rarity,
      game: currentGame.title,
      developer: currentDev.name,
      cardType: selectedCard.type
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const rarityInfo = selectedCard ? (rarityColors[selectedCard.rarity] || rarityColors.Common) : rarityColors.Common;

  return (
    <div className="w-full mb-12">
      {/* 1. Developer Selector (Top Nav) */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Dev Limited Cards
        </h2>
        
        <div className="flex gap-2">
          {DEVELOPERS.map((dev, idx) => (
            <button
              key={dev.id}
              onClick={() => { setCurrentDevIndex(idx); setSelectedGameIndex(0); }}
              className={`
                px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border
                ${currentDevIndex === idx 
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {dev.logo}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Unified Glass Container */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]/40 backdrop-blur-xl">
        {/* Dynamic Background Mesh */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        {/* Inner Content */}
        <div className="relative z-10 grid lg:grid-cols-12 gap-0 min-h-[600px]">
          
          {/* LEFT: Visual Showcase (5 Cols) */}
          <div className="lg:col-span-5 p-8 flex flex-col items-center justify-center relative border-r border-white/5">
            {selectedCard && (
              <>
                <Card3D card={selectedCard} />
                
                {/* Visual Footer */}
                <div className="mt-8 flex gap-4 w-full max-w-[280px]">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 flex flex-col items-center gap-1 transition-all group">
                    <Activity className="w-4 h-4 text-white/40 group-hover:text-cyan-400" />
                    <span className="text-[10px] text-white/40 font-mono uppercase">Inspect</span>
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 flex flex-col items-center gap-1 transition-all group">
                    <Share2 className="w-4 h-4 text-white/40 group-hover:text-purple-400" />
                    <span className="text-[10px] text-white/40 font-mono uppercase">Share</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Data Spec Sheet (7 Cols) */}
          <div className="lg:col-span-7 p-8 flex flex-col">
            
            {/* Header: Developer & Game */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">{currentDev.name}</span>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-white/40 text-xs font-bold tracking-widest uppercase">Official Drop</span>
                </div>
                <h1 className="text-4xl font-black text-white leading-none mb-2">{selectedCard?.name || "Select Card"}</h1>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-white/20 text-white/60">{selectedCard?.type}</Badge>
                  <span className="text-white/30 text-sm">for</span>
                  <span className="text-white font-medium">{currentGame.title}</span>
                </div>
              </div>

              {/* Game Switcher */}
              <div className="flex gap-2">
                {currentDev.games.map((game, idx) => (
                  <button
                    key={game.id}
                    onClick={() => { setSelectedGameIndex(idx); }}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${selectedGameIndex === idx ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={game.cover} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Spec Grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-8 flex-1">
              
              {/* Stats Column */}
              <div>
                <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Performance Metrics
                </h4>
                <StatBar label="Power Output" value={85} color="bg-red-500" />
                <StatBar label="Durability" value={62} color="bg-blue-500" />
                <StatBar label="Rarity Index" value={94} color="bg-yellow-500" />
                <StatBar label="Synergy" value={78} color="bg-purple-500" />
              </div>

              {/* Abilities Column */}
              <div>
                <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Core Abilities
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-cyan-400">
                      <Hexagon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold">Primary Effect</div>
                      <p className="text-white/50 text-xs leading-snug">Enhances {selectedCard?.type.toLowerCase()} capabilities by 25%.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-purple-400">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold">Unique Signature</div>
                      <p className="text-white/50 text-xs leading-snug">Cannot be forged. Verified by developer blockchain signature.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lore / Description */}
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info className="w-3 h-3" /> Item Description
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                "This {selectedCard?.rarity.toLowerCase()} {selectedCard?.type.toLowerCase()} was forged in the depths of legendary battles. Those who wield this card gain access to powers beyond ordinary comprehension."
              </p>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
              <div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Market Price</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">75,000</span>
                  <span className="text-cyan-400 font-bold text-sm">AGP</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    In Stock
                  </div>
                  <div className="text-white/40 text-xs">Only 12 remaining</div>
                </div>
                
                <button
                  onClick={handleBuy}
                  disabled={justAdded}
                  className={`
                    h-12 px-8 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center gap-2 transition-all
                    ${justAdded 
                      ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                      : 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    }
                  `}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> Purchase
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Card Selector Strip (Bottom) */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-3 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
          {currentGame?.limitedCards.map((card) => (
            <button
              key={card.id}
              onClick={() => { setSelectedCard(card); setJustAdded(false); }}
              className={`
                w-12 h-16 rounded-lg overflow-hidden border-2 transition-all relative group
                ${selectedCard?.id === card.id 
                  ? 'border-white scale-110 shadow-lg z-10' 
                  : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                }
              `}
            >
              <img src={card.image} className="w-full h-full object-cover" />
              {selectedCard?.id === card.id && (
                <div className="absolute inset-0 bg-white/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}