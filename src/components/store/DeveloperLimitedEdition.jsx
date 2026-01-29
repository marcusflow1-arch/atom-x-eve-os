import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Sparkles, X, ScrollText, Code, Gamepad2, Info, ShoppingCart, Check, Network, Video, Play, Shield, Zap, TrendingUp, Bolt, Wind, Eye, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';
import { useCart } from '../CartContext';

// --- SKILL TREE CONSTANTS & COMPONENTS ---

const POWER_TREE_NODES = [
  { 
    id: 'power_root', name: 'Core Activation', description: 'Unlock the card\'s latent power potential.', type: 'core', cost: 0, tier: 0, offsetX: 0, offsetY: 0,
    perks: [{name: 'Base Energy', icon: 'zap'}, {name: 'Starter Kit', icon: 'box'}]
  },
  { 
    id: 'power_atk1', name: 'Attack Boost I', description: 'Increase base attack power by 10%.', type: 'stat', cost: 100, tier: 1, branch: 'left', offsetX: -60, offsetY: 70, parent: 'power_root',
    perks: [{name: '+2% Dmg', icon: 'sword'}, {name: 'Sharpness', icon: 'triangle'}]
  },
  { 
    id: 'power_def1', name: 'Defense Boost I', description: 'Increase base defense by 10%.', type: 'stat', cost: 100, tier: 1, branch: 'right', offsetX: 60, offsetY: 70, parent: 'power_root',
    perks: [{name: '+2% Armor', icon: 'shield'}, {name: 'Hardened', icon: 'square'}]
  },
  { 
    id: 'power_crit', name: 'Critical Strike', description: 'Gain 15% critical hit chance.', type: 'ability', cost: 250, tier: 2, branch: 'left', offsetX: -60, offsetY: 140, parent: 'power_atk1',
    perks: [{name: '+5% Crit Dmg', icon: 'target'}, {name: 'Precision', icon: 'eye'}]
  },
  { 
    id: 'power_res', name: 'Resilience', description: 'Reduce all incoming damage by 8%.', type: 'ability', cost: 250, tier: 2, branch: 'right', offsetX: 60, offsetY: 140, parent: 'power_def1',
    perks: [{name: '+5% HP', icon: 'heart'}, {name: 'Recovery', icon: 'plus'}]
  },
  { 
    id: 'power_ult', name: 'Overwhelming Force', description: 'Ultimate: All stats increased by 25%.', type: 'ultimate', cost: 1000, tier: 3, offsetX: 0, offsetY: 210, parent: ['power_crit', 'power_res'],
    perks: [{name: 'God Mode', icon: 'crown'}, {name: 'Omnipotence', icon: 'star'}]
  },
];

const getNodeIcon = (type) => {
  switch (type) {
    case 'core': return <Sparkles className="w-4 h-4" />;
    case 'stat': return <TrendingUp className="w-4 h-4" />;
    case 'ability': return <Zap className="w-4 h-4" />;
    case 'ultimate': return <Bolt className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
};

const getNodeColor = (type) => {
  switch (type) {
    case 'core': return 'from-purple-500 to-purple-700';
    case 'stat': return 'from-blue-500 to-blue-700';
    case 'ability': return 'from-indigo-500 to-indigo-700';
    case 'ultimate': return 'from-orange-500 to-red-600';
    default: return 'from-slate-500 to-slate-700';
  }
};

function SkillNode({ node, isUnlocked, isLocked, onClick }) {
  const colorGradient = getNodeColor(node.type);
  
  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        onClick={() => onClick(node)}
        disabled={isLocked}
        whileHover={{ scale: isLocked ? 1 : 1.15 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 z-10
          ${isUnlocked ? 'cursor-pointer' : !isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}
        `}
      >
        <div className={`
          absolute inset-0 rounded-lg transition-all duration-300
          ${isUnlocked 
            ? `bg-gradient-to-br ${colorGradient} shadow-lg` 
            : !isLocked 
              ? 'bg-slate-700/80 border-2 border-dashed border-white/30' 
              : 'bg-slate-900/60 border border-white/10'
          }
        `} />
        
        <div className={`relative z-10 ${isUnlocked ? 'text-white' : !isLocked ? 'text-white/60' : 'text-white/20'}`}>
          {getNodeIcon(node.type)}
        </div>
      </motion.button>
    </div>
  );
}

function ConnectionLine({ fromX, fromY, toX, toY, isUnlocked }) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  
  return (
    <div
      className="absolute origin-left"
      style={{
        left: fromX + 20, 
        top: fromY + 20,
        width: length,
        height: 2,
        transform: `rotate(${angle}rad)`,
        transformOrigin: '0 50%',
        zIndex: 0
      }}
    >
      <div className={`w-full h-full transition-colors duration-500 ${isUnlocked ? 'bg-purple-500/40' : 'bg-white/5'}`} />
    </div>
  );
}

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
  const { addToCart, isPurchased } = useCart();
  const [currentDeveloperIndex, setCurrentDeveloperIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState('skill_tree');
  
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
    setJustAdded(false);
  };

  const handleBuyCard = () => {
    if (!selectedCard) return;
    
    // Calculate price based on rarity
    const rarityPrices = {
      'Mythic': 95000,
      'Legendary': 75000,
      'Epic': 45000,
      'Rare': 25000,
      'Common': 10000
    };
    
    const price = rarityPrices[selectedCard.rarity] || 25000;
    
    addToCart({
      id: `dev_card_${selectedCard.id}`,
      title: selectedCard.name,
      price: price / 1000, // Convert AGP to USD for cart
      image: selectedCard.image,
      type: 'limited_card',
      rarity: selectedCard.rarity,
      game: currentGame.title,
      developer: currentDeveloper.name,
      cardType: selectedCard.type
    });
    
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <h3 className="text-2xl font-bold text-white tracking-wide">Devs Limited Cards</h3>
      </div>

      {/* 1. Developer Navigation - NO BOX */}
      <div className="mb-6">
        <div className="flex overflow-x-auto gap-2 hover:overflow-x-scroll scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {DEVELOPERS.map((dev, index) => (
            <button
              key={dev.id}
              onClick={() => handleSelectDeveloper(index)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl transition-all duration-300 border ${
                currentDeveloperIndex === index 
                  ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white' 
                  : 'bg-transparent border-white/5 text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                currentDeveloperIndex === index ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/50'
              }`}>
                {dev.logo}
              </div>
              <span className="text-[13px] font-bold tracking-wide">{dev.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Left Side - Card Display & Buy Button */}
        <div className="w-[280px] flex-shrink-0 flex flex-col">
          <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Limited Edition Cards
          </h4>

          {/* Card Display - NO BOX */}
          <div className="flex-1 flex items-center justify-center relative mb-4">
            {selectedCard && (
              <>
                <LargeCardDisplay card={selectedCard} />
                {isPurchased(`dev_card_${selectedCard.id}`) && (
                  <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-bold">Owned</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Buy Button */}
          <div className="flex justify-center">
            <motion.button 
              onClick={handleBuyCard}
              disabled={!selectedCard}
              whileHover={{ scale: selectedCard ? 1.05 : 1 }}
              whileTap={{ scale: selectedCard ? 0.95 : 1 }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                selectedCard 
                  ? justAdded
                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                    : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Middle - Split Container */}
        <div className="flex-1 flex gap-6">
          {/* Condensed Info (35%) */}
          <div className="w-[35%] flex flex-col border-r border-white/10 pr-6">
            {/* Card Information Header */}
            {selectedCard && (
              <div className="mb-3 pb-4 border-b border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">{selectedCard.name}</h2>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">{selectedCard.type}</Badge>
                      <Badge className={`${rarityColors[selectedCard.rarity]?.bg} ${rarityColors[selectedCard.rarity]?.text} border-none text-[10px]`}>{selectedCard.rarity}</Badge>
                    </div>
                    <span className="text-amber-400/80 text-[10px] block mt-1">{selectedCard.tag}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-3">
                  <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Statistics</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      Power: 50 + (selectedCard.id * 7) % 50,
                      Defense: 30 + (selectedCard.id * 11) % 40,
                      Speed: 20 + (selectedCard.id * 13) % 30,
                    }).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-[9px] text-white/40 uppercase mb-0.5">{key}</div>
                        <div className="text-base font-bold text-white">{value}</div>
                        <div className="w-full h-0.5 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${value > 70 ? 'bg-green-500' : value > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Abilities */}
                <div className="mb-3">
                  <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Abilities</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-white font-semibold text-xs">Primary Effect</h4>
                        <p className="text-white/60 text-[10px] line-clamp-2">Enhances {selectedCard.type.toLowerCase()} capabilities by {20 + (selectedCard.id * 3) % 30}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lore */}
                <div>
                  <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Lore</h3>
                  <p className="text-white/70 text-xs italic leading-relaxed line-clamp-3">
                    This {selectedCard.rarity.toLowerCase()} {selectedCard.type.toLowerCase()} was forged in the depths of legendary battles.
                  </p>
                </div>
              </div>
            )}
            
            {/* Select Card Header */}
            <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-3 h-3 text-purple-400" />
              Select Card
            </h4>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
               {currentGame?.limitedCards.map((card) => {
                  const isSelected = selectedCard?.id === card.id;
                  const rarity = rarityColors[card.rarity] || rarityColors.Common;
                  return (
                    <motion.div
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-shrink-0 w-16 aspect-[2.5/3.5] rounded-md overflow-hidden cursor-pointer border-2 transition-all relative ${
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

          {/* New Subpages Section */}
          <div className="flex-1 flex flex-col h-full">
            {/* Subpage Tabs */}
            <div className="flex items-center gap-6 mb-6 border-b border-white/10 pb-2 h-[52px]">
              <button
                onClick={() => setActiveSubPage('skill_tree')}
                className={`flex items-center gap-2 text-sm font-bold transition-all relative h-full ${
                  activeSubPage === 'skill_tree' ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Network className="w-4 h-4" />
                Skill Tree
                {activeSubPage === 'skill_tree' && (
                  <motion.div layoutId="subTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
                )}
              </button>
              <button
                onClick={() => setActiveSubPage('live_view')}
                className={`flex items-center gap-2 text-sm font-bold transition-all relative h-full ${
                  activeSubPage === 'live_view' ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                Live View
                {activeSubPage === 'live_view' && (
                  <motion.div layoutId="subTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeSubPage === 'skill_tree' ? (
                  <motion.div
                    key="skill_tree"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 p-4 flex flex-col overflow-y-auto custom-scrollbar"
                  >
                    <div className="flex flex-col items-center min-h-full pb-10">
                      
                      {/* Tree Container */}
                      <div className="relative w-[300px] h-[300px] mb-8 mt-4 flex-shrink-0">
                        {/* Render Connections */}
                        {POWER_TREE_NODES.map(node => {
                          if (!node.parent) return null;
                          const parents = Array.isArray(node.parent) ? node.parent : [node.parent];
                          const nodePos = { x: node.offsetX + 130, y: node.offsetY };
                          
                          return parents.map(parentId => {
                            const parent = POWER_TREE_NODES.find(n => n.id === parentId);
                            if (!parent) return null;
                            const parentPos = { x: parent.offsetX + 130, y: parent.offsetY };
                            // Mock unlocked state for visual demo
                            const isUnlocked = ['power_root', 'power_atk1', 'power_def1'].includes(parentId);
                            
                            return (
                              <ConnectionLine
                                key={`${parentId}-${node.id}`}
                                fromX={parentPos.x}
                                fromY={parentPos.y}
                                toX={nodePos.x}
                                toY={nodePos.y}
                                isUnlocked={isUnlocked}
                              />
                            );
                          });
                        })}

                        {/* Render Nodes */}
                        {POWER_TREE_NODES.map(node => {
                          // Mock unlocked state
                          const isUnlocked = ['power_root', 'power_atk1', 'power_def1'].includes(node.id);
                          const isLocked = !isUnlocked && !['power_crit', 'power_res'].includes(node.id);
                          
                          return (
                            <div 
                              key={node.id}
                              className="absolute"
                              style={{ 
                                left: node.offsetX + 130, 
                                top: node.offsetY 
                              }}
                            >
                              <SkillNode 
                                node={node} 
                                isUnlocked={isUnlocked}
                                isLocked={isLocked}
                                onClick={() => {}}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Perks Section (Below Tree) */}
                      <div className="w-full max-w-sm mt-auto">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-px bg-white/10 flex-1" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active Perks</span>
                          <div className="h-px bg-white/10 flex-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <Zap className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">Power Surge</div>
                              <div className="text-[9px] text-white/50">+15% Damage</div>
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">Iron Skin</div>
                              <div className="text-[9px] text-white/50">+10% Armor</div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="live_view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 bg-black flex items-center justify-center group"
                  >
                    {/* Placeholder Video View */}
                    <img 
                      src={currentGame?.cover} 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm group-hover:scale-105 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                    
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all cursor-pointer shadow-2xl">
                        <Play className="w-6 h-6 text-white fill-current ml-1" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-bold tracking-wider">Watch Demonstration</h3>
                        <p className="text-white/50 text-xs mt-1">See {selectedCard?.name} in action</p>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/40">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        LIVE PREVIEW
                      </div>
                      <span>00:45 / 02:30</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side - Games List */}
        <div className="w-[280px] flex-shrink-0 flex flex-col">
          <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Gamepad2 className="w-3 h-3 text-cyan-400" />
            {currentDeveloper.name} Games
          </h4>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
            {currentDeveloper.games.map((game, index) => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(index)}
                className={`w-full group flex items-center gap-3 transition-all text-left p-2 rounded-lg ${
                  index === selectedGameIndex 
                    ? 'bg-cyan-500/10 border-l-2 border-cyan-500' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
                  <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm truncate">{game.title}</h4>
                  <p className="text-white/50 text-xs">{game.year}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}