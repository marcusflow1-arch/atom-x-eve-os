import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ChevronRight, Star, Sparkles, ShoppingCart, Check, 
  Gamepad2, Zap, TrendingUp, Shield, Activity, 
  Info, Cpu, Layers, Sword, Share2, Crown, 
  Flame, Crosshair, Hexagon, Fingerprint, Network, Video, Play, Bolt
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../CartContext';

// Developer Data
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

// 3D Card Component
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
    <div className="relative group w-[220px] aspect-[2.5/3.5] perspective-1000 mx-auto" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
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

        <div className="absolute bottom-4 left-3 right-3 z-30">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] w-full justify-center shadow-lg backdrop-blur-md mb-1`}>
            {card.rarity}
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}

// Stat Bar Component
const StatBar = ({ label, value, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-[10px] mb-0.5">
      <span className="text-white/50 font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white font-bold">{value}%</span>
    </div>
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
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
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'skilltree'

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

  return (
    <div className="w-full mb-12">
      {/* 1. Developer Selector (Horizontal Scroll) */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {DEVELOPERS.map((dev, idx) => (
            <button
              key={dev.id}
              onClick={() => { setCurrentDevIndex(idx); setSelectedGameIndex(0); }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap
                ${currentDevIndex === idx 
                  ? 'bg-white/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                  : 'bg-transparent border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className={currentDevIndex === idx ? 'text-cyan-400' : ''}>{dev.logo}</span>
              <span>{dev.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Layout - 3 Column Flex */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT: Card Visual & Buy */}
        <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4">
          <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Limited Edition
          </h4>
          
          <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative">
            {selectedCard && (
              <>
                <Card3D card={selectedCard} />
                
                {isPurchased(`dev_card_${selectedCard.id}`) && (
                  <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 shadow-lg z-20">
                    <Check className="w-3 h-3 text-white" />
                    <span className="text-white text-[10px] font-bold">Owned</span>
                  </div>
                )}

                <div className="mt-6 w-full">
                  <button
                    onClick={handleBuy}
                    disabled={justAdded}
                    className={`
                      w-full h-10 rounded-lg font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all
                      ${justAdded 
                        ? 'bg-green-500 text-white' 
                        : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      }
                    `}
                  >
                    {justAdded ? (
                      <>Added <Check className="w-3 h-3" /></>
                    ) : (
                      <>Purchase <ShoppingCart className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* MIDDLE: Info & Specs */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Header Area */}
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">{currentDev.name}</Badge>
                <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Official Drop</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-1">{selectedCard?.name || "Select Card"}</h2>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span>{selectedCard?.type}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{currentGame.title}</span>
              </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Price</div>
               <div className="flex items-baseline justify-end gap-1">
                 <span className="text-2xl font-black text-white">75k</span>
                 <span className="text-cyan-400 font-bold text-xs">AGP</span>
               </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/5">
            <button 
              onClick={() => setActiveTab('stats')}
              className={`pb-2 text-sm font-bold transition-all relative ${activeTab === 'stats' ? 'text-white' : 'text-white/40 hover:text-white'}`}
            >
              Specifications
              {activeTab === 'stats' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('skilltree')}
              className={`pb-2 text-sm font-bold transition-all relative ${activeTab === 'skilltree' ? 'text-white' : 'text-white/40 hover:text-white'}`}
            >
              Skill Tree
              {activeTab === 'skilltree' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-6 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'stats' ? (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-8"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Performance
                    </h4>
                    <StatBar label="Power Output" value={85} color="bg-red-500" />
                    <StatBar label="Durability" value={62} color="bg-blue-500" />
                    <StatBar label="Synergy" value={78} color="bg-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Core Ability
                    </h4>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Hexagon className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-bold text-sm">Primary Effect</span>
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed">
                        Enhances {selectedCard?.type.toLowerCase()} capabilities by 25%. Passive regeneration active when out of combat.
                      </p>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Lore</h4>
                      <p className="text-white/50 text-[10px] italic leading-relaxed">
                        "Forged in the depths of legendary battles. Those who wield this card gain access to powers beyond ordinary comprehension."
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="skilltree"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center h-full min-h-[200px]"
                >
                  <div className="text-center">
                    <Network className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Skill Tree Visualization</p>
                    <p className="text-white/20 text-xs">Unlock card to view progression path</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Selector Strip */}
          <div className="mt-auto">
            <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">Select Edition</h4>
            <div className="flex gap-2">
              {currentGame?.limitedCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => { setSelectedCard(card); setJustAdded(false); }}
                  className={`
                    w-10 h-14 rounded overflow-hidden border transition-all relative
                    ${selectedCard?.id === card.id 
                      ? 'border-white scale-105 shadow-lg opacity-100' 
                      : 'border-white/10 opacity-50 hover:opacity-100'
                    }
                  `}
                >
                  <img src={card.image} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Games List */}
        <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-4">
          <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-3 h-3 text-cyan-400" />
            {currentDev.name} Games
          </h4>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar max-h-[500px]">
            {currentDev.games.map((game, index) => (
              <button
                key={game.id}
                onClick={() => setSelectedGameIndex(index)}
                className={`
                  w-full group flex items-center gap-3 transition-all text-left p-2 rounded-xl border
                  ${index === selectedGameIndex 
                    ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                  }
                `}
              >
                <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 relative">
                  <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                  {index === selectedGameIndex && <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold truncate ${index === selectedGameIndex ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {game.title}
                  </h4>
                  <p className="text-white/30 text-[10px] mt-0.5">{game.year}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-white/10 text-white/40">
                      {game.limitedCards.length} Cards
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}