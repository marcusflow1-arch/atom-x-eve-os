import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Hammer, Layers, Sparkles, TrendingUp, Zap, Shield, Crown, Star, ArrowUp, Info, 
  Activity, Box, ArrowLeft, Merge, ArrowLeftRight, Check, Lock, ChevronRight, Package, Flame, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ShinyCard from '@/components/shared/ShinyCard';
import { MaterialCard } from '@/components/blacksmith/MaterialSystem';
import { MarketValueDisplay, ValueBreakdown } from '@/components/blacksmith/MarketValuation';
import TradingPanel from '@/components/blacksmith/TradingPanel';
import EvolvedCardVisual, { calculateEvolutionTier, EvolutionBadge, EvolutionPreview } from '@/components/blacksmith/CardVisualEvolution';
import { NFCInfoPanel } from '@/components/blacksmith/NFCCardSync';

// Mock Data
const MOCK_CARD_STATS = {
  attack: 115,
  defense: 92,
  magic: 100,
  power: 337
};

// Upgrade System Tabs
const UPGRADE_SYSTEMS = [
  { id: 'level', name: 'Level Up', icon: TrendingUp, description: 'Increase card level for base stat boosts' },
  { id: 'enhance', name: 'Enhance', icon: Sparkles, description: 'Amplify specific stats with materials' },
  { id: 'combine', name: 'Combine', icon: Merge, description: 'Merge duplicates to increase star rating' },
  { id: 'ascend', name: 'Ascend', icon: Crown, description: 'Break level caps and unlock new potential' },
  { id: 'trade', name: 'Trade', icon: ArrowLeftRight, description: 'List on marketplace or trade with others' },
];

// Mock materials for enhancement
const MOCK_MATERIALS = [
  { id: 'gold', material_type: 'gold', name: 'Gold', icon: '🪙', quantity: 25000, rarity: 'Currency' },
  { id: 'precision_shard', material_type: 'precision_shard', quantity: 45, rarity: 'Rare' },
  { id: 'combat_core', material_type: 'combat_core', quantity: 28, rarity: 'Epic' },
  { id: 'ascension_core', material_type: 'ascension_core', quantity: 8, rarity: 'Epic' },
  { id: 'skill_catalyst', material_type: 'skill_catalyst', quantity: 35, rarity: 'Rare' },
  { id: 'fusion_currency', material_type: 'fusion_currency', quantity: 120, rarity: 'Uncommon' },
  { id: 'wildcard', material_type: 'wildcard', quantity: 5, rarity: 'Legendary' },
];

// Mock duplicate cards for combination
const generateDuplicates = (card) => {
  return Array.from({ length: 4 }, (_, i) => ({
    id: `dup-${i}`,
    ...card,
    level: Math.floor(Math.random() * 10) + 1,
  }));
};

// Overview / Card Record UI
const CardRecordView = ({ card }) => (
  <div className="flex gap-6 p-6">
    {/* Left: Card Visual - Sticky positioning to stay in view while scrolling */}
    <div className="w-[240px] flex-shrink-0 flex flex-col gap-4 sticky top-0 self-start">
      <div className="relative group perspective-1000">
         <ShinyCard className="w-full aspect-[2/3] border border-white/10 bg-slate-900 shadow-2xl rounded-xl overflow-hidden relative z-10">
            {/* Card Art Placeholder */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${card?.image || 'https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop'}')` }}>
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>
            
            {/* Card Content Overlay */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/20 text-white/90">
                     Lv. {card?.level || 1}
                  </Badge>
                  <div className="flex gap-0.5 bg-black/40 p-1 rounded-full backdrop-blur-md">
                     {Array.from({ length: 5 }).map((_, i) => (
                       <Star key={i} className={`w-3 h-3 ${i < (card?.stars || 1) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                     ))}
                  </div>
               </div>

               <div>
                  <h2 className="text-white font-black text-xl leading-none mb-1 drop-shadow-lg font-heading">
                     {card?.title || 'Unknown Card'}
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                     <Badge className="bg-orange-500 text-white border-none text-[10px] py-0 h-4">{card?.rarity || 'Legendary'}</Badge>
                     <span className="text-white/70 text-xs font-medium">{card?.series || 'Collection'}</span>
                  </div>
               </div>
            </div>
         </ShinyCard>
         {/* Background Glow */}
         <div className="absolute inset-0 bg-orange-500/20 blur-3xl -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>

      {/* Active Perks */}
      <div className="space-y-2">
         <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">Active Perks</h4>
         <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
               <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help group relative">
                  <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                     <Sparkles className="w-3 h-3 text-white/60 group-hover:text-yellow-400 transition-colors" />
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>

    {/* Right: Info */}
    <div className="flex-1 space-y-6 pb-8">
      <div className="space-y-2">
        <h3 className="text-white text-2xl font-bold flex items-center gap-3">
          <Info className="w-6 h-6 text-cyan-400" /> Card Record
        </h3>
        <p className="text-white/50 text-sm">Detailed information and history of this card.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
          <div>
            <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Description</h4>
            <p className="text-white/80 text-sm italic">"{card?.description || 'A collectible trading card with unique attributes.'}"</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-2">
            <div>
              <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Series</h4>
              <p className="text-white font-semibold">{card?.series || 'Unknown Series'}</p>
            </div>
            <div>
              <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Rarity</h4>
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none">{card?.rarity || 'Rare'}</Badge>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
            <h4 className="text-white/40 text-[10px] uppercase tracking-wider">Stats Overview</h4>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Strength</span>
                    <div className="flex items-center gap-2">
                        <Progress value={85} className="w-24 h-2" />
                        <span className="text-white font-bold text-xs">85</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Magic</span>
                    <div className="flex items-center gap-2">
                        <Progress value={62} className="w-24 h-2" />
                        <span className="text-white font-bold text-xs">62</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Defense</span>
                    <div className="flex items-center gap-2">
                        <Progress value={90} className="w-24 h-2" />
                        <span className="text-white font-bold text-xs">90</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
        <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Technical Details</h4>
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
                <span className="text-white/50 text-xs block">Card ID</span>
                <span className="text-white/80 font-mono text-xs">{card?.id || 'card-preview'}</span>
            </div>
            <div className="space-y-1">
                <span className="text-white/50 text-xs block">Type</span>
                <span className="text-white/80 text-xs">Trading Card</span>
            </div>
            <div className="space-y-1">
                <span className="text-white/50 text-xs block">Mint Date</span>
                <span className="text-white/80 text-xs">Jan 12, 2026</span>
            </div>
        </div>
      </div>
    </div>
  </div>
);

// Blacksmith UI
const BlacksmithView = ({ card }) => {
  const [activeSystem, setActiveSystem] = useState('level');
  const [cardLevel, setCardLevel] = useState(card?.level || 1);
  const [cardStars, setCardStars] = useState(card?.stars || 1);
  const [cardAscension, setCardAscension] = useState(card?.ascension || 0);
  const [enhancedStats, setEnhancedStats] = useState({ attack: 0, defense: 0, magic: 0 });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [materials, setMaterials] = useState(MOCK_MATERIALS);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  
  const duplicates = useMemo(() => generateDuplicates(card), [card]);

  // Card tilt effects
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-150, 150], [12, -12]);
  const rotateY = useTransform(mouseX, [-150, 150], [-12, 12]);
  const shineX = useTransform(mouseX, [-150, 150], [0, 100]);

  const handleCardMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  };

  const handleCardMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Legendary': return 'from-orange-500 to-amber-600';
      case 'Mythic': return 'from-red-500 to-rose-600';
      case 'Epic': return 'from-purple-500 to-violet-600';
      case 'Rare': return 'from-blue-500 to-cyan-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  // Derived stats
  const baseStats = useMemo(() => ({
    attack: 100 + (cardLevel * 15) + (cardAscension * 50) + enhancedStats.attack,
    defense: 80 + (cardLevel * 12) + (cardAscension * 40) + enhancedStats.defense,
    magic: 90 + (cardLevel * 10) + (cardAscension * 30) + enhancedStats.magic,
    power: Math.floor((100 + (cardLevel * 15) + 80 + (cardLevel * 12) + 90 + (cardLevel * 10)) * (1 + cardAscension * 0.2) * (1 + cardStars * 0.1)),
  }), [cardLevel, cardStars, cardAscension, enhancedStats]);

  const maxLevel = 10 + (cardAscension * 10);
  const levelCost = cardLevel * 100;
  const canLevelUp = cardLevel < maxLevel && materials.find(m => m.id === 'gold')?.quantity >= levelCost;

  const handleLevelUp = () => {
    if (!canLevelUp) return;
    setIsUpgrading(true);
    setTimeout(() => {
      setCardLevel(prev => prev + 1);
      setMaterials(prev => prev.map(m => m.id === 'gold' ? { ...m, quantity: m.quantity - levelCost } : m));
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 800);
  };

  const handleEnhance = (stat) => {
    const cost = 500;
    if (materials.find(m => m.id === 'gold')?.quantity < cost) return;
    setIsUpgrading(true);
    setTimeout(() => {
      setEnhancedStats(prev => ({ ...prev, [stat]: prev[stat] + 10 }));
      setMaterials(prev => prev.map(m => m.id === 'gold' ? { ...m, quantity: m.quantity - cost } : m));
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 600);
  };

  const handleCombine = () => {
    if (selectedDuplicates.length < 1) return;
    setIsUpgrading(true);
    setTimeout(() => {
      setCardStars(prev => Math.min(prev + selectedDuplicates.length, 5));
      setSelectedDuplicates([]);
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 1000);
  };

  const canAscend = cardLevel >= maxLevel && cardAscension < 5;
  const ascensionCost = (cardAscension + 1) * 5000;

  const handleAscend = () => {
    if (!canAscend || materials.find(m => m.id === 'gold')?.quantity < ascensionCost) return;
    setIsUpgrading(true);
    setTimeout(() => {
      setCardAscension(prev => prev + 1);
      setMaterials(prev => prev.map(m => m.id === 'gold' ? { ...m, quantity: m.quantity - ascensionCost } : m));
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
               <Hammer className="w-6 h-6 text-orange-400" />
            </div>
            <div>
               <h3 className="text-white font-bold text-2xl">Blacksmith</h3>
               <p className="text-white/50 text-sm">Forge your card's true potential</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            {materials.slice(0, 2).map(mat => (
              <Badge key={mat.id} variant="outline" className="h-8 px-3 bg-white/5 text-white/90 border-white/10 text-sm gap-2">
                <span>{mat.icon}</span>
                <span className="font-bold">{mat.quantity.toLocaleString()}</span>
              </Badge>
            ))}
         </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
          {/* LEFT: Card Visual */}
          <div className="w-[280px] flex-shrink-0 flex flex-col items-center justify-start pt-4">
             <div
               className="relative perspective-1000 w-full aspect-[2.5/3.5]"
               onMouseMove={handleCardMouseMove}
               onMouseLeave={handleCardMouseLeave}
             >
               {/* Success Burst Animation */}
               <AnimatePresence>
                 {showSuccess && (
                   <motion.div
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                     exit={{ scale: 2, opacity: 0 }}
                     className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/50 to-amber-500/50 z-30"
                   />
                 )}
               </AnimatePresence>

               {/* Upgrading Glow */}
               {isUpgrading && (
                 <motion.div
                   className="absolute inset-0 rounded-2xl z-20"
                   animate={{
                     boxShadow: ['0 0 30px rgba(251, 146, 60, 0.3)', '0 0 60px rgba(251, 146, 60, 0.6)', '0 0 30px rgba(251, 146, 60, 0.3)']
                   }}
                   transition={{ duration: 0.4, repeat: Infinity }}
                 />
               )}

               <EvolvedCardVisual 
                 card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension }}
                 showTierBadge={true}
               >
                 <motion.div
                   className="w-full h-full relative overflow-hidden rounded-xl border border-white/10 bg-slate-900"
                   style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                 >
                   <img src={card?.image || "https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop"} alt="" className="w-full h-full object-cover" />
                   
                   <motion.div
                     className="absolute inset-0 pointer-events-none mix-blend-overlay"
                     style={{ background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.35) ${val}%, transparent 100%)`) }}
                   />

                   {/* Overlay Stats */}
                   <div className="absolute top-4 left-3 right-3 flex items-center justify-between">
                     <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-white font-bold">Lv. {cardLevel}</Badge>
                     <div className="flex gap-0.5">
                       {Array.from({ length: 5 }).map((_, i) => (
                         <Star key={i} className={`w-3 h-3 ${i < cardStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                       ))}
                     </div>
                   </div>

                   {cardAscension > 0 && (
                     <div className="absolute top-12 left-3">
                       <Badge className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md border-purple-400/50 text-white">
                         <Crown className="w-3 h-3 mr-1" /> A{cardAscension}
                       </Badge>
                     </div>
                   )}

                   <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                     <h3 className="text-white font-bold text-lg truncate">{card?.title || 'Card Name'}</h3>
                     <Badge className={`bg-gradient-to-r ${getRarityColor(card?.rarity)} border-0 text-white text-[10px] mt-1`}>
                       {card?.rarity || "Common"}
                     </Badge>
                   </div>
                 </motion.div>
               </EvolvedCardVisual>
             </div>

             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
               <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total Power</p>
               <div className="flex items-center justify-center gap-2">
                 <Flame className="w-6 h-6 text-orange-400" />
                 <span className="text-4xl font-black text-white">{baseStats.power.toLocaleString()}</span>
               </div>
               <div className="mt-2">
                 <EvolutionBadge tier={calculateEvolutionTier({ level: cardLevel, stars: cardStars, ascension: cardAscension })} />
               </div>
             </motion.div>
          </div>

          {/* CENTER: Main Action Area */}
          <div className="flex-1 flex flex-col min-w-0">
             {/* System Tabs */}
             <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl overflow-x-auto">
               {UPGRADE_SYSTEMS.map(sys => (
                 <button
                   key={sys.id}
                   onClick={() => setActiveSystem(sys.id)}
                   className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                     activeSystem === sys.id
                       ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 border border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.1)]'
                       : 'bg-transparent text-white/40 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   <sys.icon className="w-4 h-4" />
                   <span className="font-semibold text-sm">{sys.name}</span>
                 </button>
               ))}
             </div>

             {/* Content Area */}
             <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-6 overflow-y-auto custom-scrollbar relative">
                <AnimatePresence mode="wait">
                  {/* LEVEL UP SYSTEM */}
                  {activeSystem === 'level' && (
                    <motion.div key="level" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                      <div className="flex justify-between items-end mb-6">
                         <div>
                             <h4 className="text-white font-bold text-xl">Level Up</h4>
                             <p className="text-white/50 text-sm">Boost base stats.</p>
                         </div>
                         <div className="text-right">
                             <span className="text-white/40 text-xs block">Current</span>
                             <span className="text-white font-bold text-xl">{cardLevel} <span className="text-white/40 text-sm">/ {maxLevel}</span></span>
                         </div>
                      </div>
                      
                      <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-8">
                        <motion.div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" initial={{ width: 0 }} animate={{ width: `${(cardLevel / maxLevel) * 100}%` }} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-8">
                        {Object.entries(baseStats).filter(([k]) => k !== 'power').map(([stat, value]) => (
                          <div key={stat} className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <span className="text-white/40 text-xs uppercase font-bold tracking-wider">{stat}</span>
                            <div className="text-white font-black text-2xl mt-1">{value}</div>
                            {canLevelUp && <div className="text-green-400 text-xs font-bold mt-1 flex items-center"><ArrowUp className="w-3 h-3 mr-1"/> +{stat === 'attack' ? 15 : 10}</div>}
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <Button
                          onClick={handleLevelUp}
                          disabled={!canLevelUp || isUpgrading}
                          className={`w-full h-14 text-lg font-bold rounded-xl ${canLevelUp ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white/10 text-white/30'}`}
                        >
                          {isUpgrading ? <Sparkles className="w-6 h-6 animate-spin" /> : cardLevel >= maxLevel ? 'Ascend to Continue' : `Level Up (${levelCost.toLocaleString()} 🪙)`}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ENHANCE SYSTEM */}
                  {activeSystem === 'enhance' && (
                    <motion.div key="enhance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">Enhancement</h3>
                      <p className="text-white/50 text-sm mb-6">Amplify specific stats using materials.</p>
                      <div className="space-y-4">
                        {['attack', 'defense', 'magic'].map(stat => (
                          <div key={stat} className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold capitalize">{stat}</p>
                              <p className="text-white/50 text-sm">+{enhancedStats[stat]} Enhanced</p>
                            </div>
                            <Button onClick={() => handleEnhance(stat)} disabled={isUpgrading} className="bg-purple-600 hover:bg-purple-700">
                              <Sparkles className="w-4 h-4 mr-2" /> +10 (500 🪙)
                            </Button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* COMBINE SYSTEM */}
                  {activeSystem === 'combine' && (
                    <motion.div key="combine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">Combine Duplicates</h3>
                      <p className="text-white/50 text-sm mb-6">Merge duplicates to increase star rating.</p>
                      
                      <div className="flex justify-center gap-2 mb-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-8 h-8 ${i < cardStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-6">
                        {duplicates.map((dup) => (
                          <button
                            key={dup.id}
                            onClick={() => setSelectedDuplicates(prev => prev.includes(dup.id) ? prev.filter(id => id !== dup.id) : [...prev, dup.id])}
                            className={`aspect-[2.5/3.5] rounded-lg border-2 overflow-hidden relative ${selectedDuplicates.includes(dup.id) ? 'border-yellow-400' : 'border-white/10'}`}
                          >
                            <img src={card?.image || "https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop"} className="w-full h-full object-cover opacity-60" alt="" />
                            {selectedDuplicates.includes(dup.id) && <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center"><Check className="w-8 h-8 text-yellow-400" /></div>}
                          </button>
                        ))}
                      </div>

                      <Button onClick={handleCombine} disabled={selectedDuplicates.length < 1 || cardStars >= 5 || isUpgrading} className="w-full py-6 text-lg font-bold bg-yellow-600 hover:bg-yellow-700">
                        <Merge className="w-5 h-5 mr-2" /> Combine Selected
                      </Button>
                    </motion.div>
                  )}

                  {/* ASCEND SYSTEM */}
                  {activeSystem === 'ascend' && (
                    <motion.div key="ascend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">Ascension</h3>
                      <p className="text-white/50 text-sm mb-6">Break limits. Unlock new potential.</p>
                      
                      <div className="flex justify-center gap-4 mb-8">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center ${i < cardAscension ? 'bg-purple-500' : 'bg-white/5 border border-white/10'}`}>
                            {i < cardAscension ? <Crown className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-white/30" />}
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-6">
                        <h4 className="text-purple-300 font-semibold mb-3">Next Ascension Benefits:</h4>
                        <ul className="space-y-2 text-sm text-white/70">
                          <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-purple-400" /> Level cap +10</li>
                          <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-purple-400" /> All stats +20%</li>
                        </ul>
                      </div>

                      <Button onClick={handleAscend} disabled={!canAscend || isUpgrading} className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700">
                        <Crown className="w-5 h-5 mr-2" /> Ascend ({ascensionCost.toLocaleString()} 🪙)
                      </Button>
                    </motion.div>
                  )}

                  {/* TRADE SYSTEM */}
                  {activeSystem === 'trade' && (
                    <motion.div key="trade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">Trade Card</h3>
                      <p className="text-white/50 text-sm mb-6">List on marketplace.</p>
                      
                      <div className="mb-6">
                        <ValueBreakdown card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats }} />
                      </div>

                      <Button onClick={() => setShowTradePanel(true)} className="w-full py-6 text-lg font-bold bg-cyan-600 hover:bg-cyan-700">
                        <ArrowLeftRight className="w-5 h-5 mr-2" /> Open Trade Panel
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* RIGHT: Stats & Materials (The requested "Right Hand Side") */}
          <div className="w-[260px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
             <MarketValueDisplay card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats }} />

             <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
               <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-400" /> Card Stats
               </h4>
               <div className="space-y-3">
                 {Object.entries(baseStats).map(([stat, value]) => (
                   <div key={stat} className="flex items-center justify-between">
                     <span className="text-white/60 capitalize text-sm">{stat}</span>
                     <span className="text-white font-bold">{value.toLocaleString()}</span>
                   </div>
                 ))}
               </div>
             </div>

             <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
               <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                 <Package className="w-5 h-5 text-cyan-400" /> Materials
               </h4>
               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                 {materials.filter(m => m.material_type !== 'gold').map(mat => (
                   <MaterialCard key={mat.id} material={mat.material_type} quantity={mat.quantity} size="small" />
                 ))}
               </div>
             </div>

             <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
               <h4 className="text-white font-bold mb-4">Requirements</h4>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between"><span className="text-white/60">Next Level</span><span className="text-yellow-400 font-bold">{levelCost.toLocaleString()} 🪙</span></div>
                 <div className="flex justify-between"><span className="text-white/60">Ascension</span><span className="text-purple-400 font-bold">{ascensionCost.toLocaleString()} 🪙</span></div>
               </div>
             </div>

             <EvolutionPreview card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension }} />
             <NFCInfoPanel physicalCardData={null} onScan={() => console.log('NFC')} />
          </div>
      </div>

      {/* Trade Panel Overlay */}
      <AnimatePresence>
        {showTradePanel && (
          <TradingPanel
            card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats }}
            onClose={() => setShowTradePanel(false)}
            onListCard={(listing) => {
              console.log('Listing:', listing);
              setShowTradePanel(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Skill Tree UI (Screenshot 4)
const SkillNode = ({ icon: Icon, name, sp, unlocked, color = 'purple', ultimate = false }) => {
  const colorStyles = {
    purple: {
      bg: unlocked ? 'bg-purple-500/30' : 'bg-white/10',
      border: unlocked ? 'border-purple-400/50' : 'border-white/20',
      text: unlocked ? 'text-purple-300' : 'text-white/40',
      glow: unlocked ? 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''
    },
    cyan: {
      bg: unlocked ? 'bg-cyan-500/30' : 'bg-white/10',
      border: unlocked ? 'border-cyan-400/50' : 'border-white/20',
      text: unlocked ? 'text-cyan-300' : 'text-white/40',
      glow: unlocked ? 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' : ''
    }
  };

  const styles = colorStyles[color];

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`relative ${ultimate ? 'w-16 h-16' : 'w-12 h-12'} rounded-xl ${styles.bg} ${styles.border} border-2 flex items-center justify-center cursor-pointer transition-all ${styles.glow}`}
      >
        <Icon className={`${ultimate ? 'w-7 h-7' : 'w-5 h-5'} ${styles.text}`} />
        {unlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border border-white/30">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </motion.div>
      <span className={`text-[10px] font-medium ${unlocked ? 'text-white/70' : 'text-white/30'}`}>{name}</span>
      <span className={`text-[9px] px-1.5 py-0.5 rounded ${unlocked ? (color === 'purple' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300') : 'bg-white/10 text-white/40'}`}>
        {sp} SP
      </span>
    </div>
  );
};

const SkillTreeView = ({ card }) => (
  <div className="h-full flex flex-col p-6">
    <div className="flex items-center justify-between mb-6">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
             <Layers className="w-6 h-6 text-purple-400" />
          </div>
          <div>
             <h3 className="text-white font-bold text-2xl">Ability Matrix</h3>
             <p className="text-white/50 text-sm">Unlock new abilities and passive bonuses.</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-8 px-4 bg-purple-500/10 text-purple-400 border-purple-500/20 gap-2 text-sm">
                <Zap className="w-3 h-3" /> 2,450 SP Available
            </Badge>
       </div>
    </div>

    <div className="flex-1 grid grid-cols-3 gap-6 min-h-0 overflow-y-auto custom-scrollbar">
       {/* Power Path */}
       <div className="flex flex-col gap-4 relative h-full">
          <div className="text-center p-3 rounded-t-xl bg-purple-500/10 border-t border-x border-purple-500/20">
             <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wider">Power Path</h4>
             <p className="text-white/30 text-[10px]">Raw strength & combat</p>
          </div>
          
          <div className="flex-1 rounded-b-xl rounded-t-sm bg-gradient-to-b from-purple-900/10 to-transparent border border-purple-500/20 p-6 relative overflow-hidden flex flex-col items-center gap-12">
             <div className="absolute top-0 bottom-0 w-px bg-purple-500/10 z-0" />
             
             {/* Root Node */}
             <div className="w-16 h-16 rounded-2xl bg-purple-600 shadow-[0_0_25px_rgba(168,85,247,0.6)] z-10 flex items-center justify-center border-2 border-white/20 relative group cursor-pointer hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white">
                    Thunder Strike (Active)
                </div>
             </div>

             {/* Branches */}
             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full z-10 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-500 group-hover:bg-purple-500/20 transition-all shadow-lg hover:shadow-purple-500/20">
                         <div className="w-5 h-5 rounded-full bg-purple-500/20" />
                      </div>
                      <Badge className="bg-black/50 text-purple-300 border-purple-500/20 text-[9px] font-mono">100 SP</Badge>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Neutral Path */}
       <div className="flex flex-col gap-4 relative h-full">
          <div className="text-center p-3 rounded-t-xl bg-yellow-500/10 border-t border-x border-yellow-500/20">
             <h4 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Neutral Path</h4>
             <p className="text-white/30 text-[10px]">Defense & Utility</p>
          </div>
          
          <div className="flex-1 rounded-b-xl rounded-t-sm bg-gradient-to-b from-yellow-900/10 to-transparent border border-yellow-500/20 p-6 relative overflow-hidden flex flex-col items-center gap-12">
             <div className="absolute top-0 bottom-0 w-px bg-yellow-500/10 z-0" />
             
             <div className="w-16 h-16 rounded-2xl bg-black/60 border-2 border-yellow-500/50 z-10 flex items-center justify-center relative group cursor-pointer hover:border-yellow-500 transition-colors">
                <Shield className="w-8 h-8 text-yellow-500" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white">
                    Iron Skin (Passive)
                </div>
             </div>

             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full z-10 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-2 opacity-40">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
                         <div className="w-5 h-5 rounded-full bg-white/10" />
                      </div>
                      <Badge className="bg-black/50 text-white/30 border-white/10 text-[9px] font-mono">LOCKED</Badge>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* AI Path */}
       <div className="flex flex-col gap-4 relative h-full">
          <div className="text-center p-3 rounded-t-xl bg-cyan-500/10 border-t border-x border-cyan-500/20">
             <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">AI Path</h4>
             <p className="text-white/30 text-[10px]">Adaptation & Tactics</p>
          </div>
          
          <div className="flex-1 rounded-b-xl rounded-t-sm bg-gradient-to-b from-cyan-900/10 to-transparent border border-cyan-500/20 p-6 relative overflow-hidden flex flex-col items-center gap-12">
             <div className="absolute top-0 bottom-0 w-px bg-cyan-500/10 z-0" />
             
             <div className="w-16 h-16 rounded-2xl bg-black/60 border-2 border-cyan-500/50 z-10 flex items-center justify-center relative group cursor-pointer hover:border-cyan-500 transition-colors">
                <Activity className="w-8 h-8 text-cyan-500" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white">
                    Neural Link (Passive)
                </div>
             </div>

             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full z-10 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-2 opacity-40">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
                         <div className="w-5 h-5 rounded-full bg-white/10" />
                      </div>
                      <Badge className="bg-black/50 text-white/30 border-white/10 text-[9px] font-mono">LOCKED</Badge>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  </div>
);

export default function CardEnhancementOverlay({ card, onClose }) {
  const [viewMode, setViewMode] = useState('overview'); // overview, blacksmith, skilltree

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl"
    >
      <div data-card-overlay="true" className="relative w-full h-full flex bg-slate-900/95 overflow-hidden border-0 rounded-none">
        <div className="h-full w-full flex flex-col gap-4">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between shrink-0 bg-black/20 p-2 border-b border-white/5">
             <div className="flex items-center gap-4 pl-4">
                 <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Total Power</span>
                    <div className="text-2xl font-black text-white tracking-tight flex items-center">
                       <Zap className="w-5 h-5 text-yellow-400 mr-1 fill-yellow-400" />
                       {MOCK_CARD_STATS.power}
                    </div>
                    <Badge className="bg-blue-600 text-white border border-blue-400 shadow-sm text-[10px] h-5 ml-2">
                       Rare
                    </Badge>
                 </div>
             </div>

             {/* Navigation Tabs */}
             <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                <button
                   onClick={() => setViewMode('overview')}
                   className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                      viewMode === 'overview' 
                      ? 'bg-slate-700 text-white shadow-md' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                   }`}
                >
                   <Info className="w-3.5 h-3.5" /> Record
                </button>
                <button
                   onClick={() => setViewMode('blacksmith')}
                   className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                      viewMode === 'blacksmith' 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                   }`}
                >
                   <Hammer className="w-3.5 h-3.5" /> Forge
                </button>
                <button
                   onClick={() => setViewMode('skilltree')}
                   className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                      viewMode === 'skilltree' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                   }`}
                >
                   <Layers className="w-3.5 h-3.5" /> Skills
                </button>
             </div>

             {/* Close Button */}
             <div className="pr-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-none">
                    <X className="w-4 h-4" />
                </Button>
             </div>
          </div>

          {/* Main Content Area (Full Width/Height) */}
          <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {viewMode === 'overview' && (
                  <motion.div 
                    key="overview"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="min-h-full"
                  >
                    <CardRecordView card={card} />
                  </motion.div>
                )}

                {viewMode === 'blacksmith' && (
                  <motion.div 
                    key="blacksmith"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <BlacksmithView card={card} />
                  </motion.div>
                )}

                {viewMode === 'skilltree' && (
                  <motion.div 
                    key="skilltree"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <SkillTreeView card={card} />
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}