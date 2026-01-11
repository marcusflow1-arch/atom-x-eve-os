import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { 
  X, Hammer, TrendingUp, Layers, Sparkles, Star, Zap, 
  ArrowUp, Merge, Crown, ChevronRight, Lock, Check, Flame, ArrowLeftRight, Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialInventory, MaterialCard, MATERIAL_INFO, MATERIAL_DEFINITIONS } from '../blacksmith/MaterialSystem';
import { MarketValueDisplay, ValueBreakdown, calculateMarketValue } from '../blacksmith/MarketValuation';
import TradingPanel from '../blacksmith/TradingPanel';

// Upgrade System Tabs
const UPGRADE_SYSTEMS = [
  { id: 'level', name: 'Level Up', icon: TrendingUp, description: 'Increase card level for base stat boosts' },
  { id: 'enhance', name: 'Enhance', icon: Sparkles, description: 'Amplify specific stats with materials' },
  { id: 'combine', name: 'Combine', icon: Merge, description: 'Merge duplicates to increase star rating' },
  { id: 'ascend', name: 'Ascend', icon: Crown, description: 'Break level caps and unlock new potential' },
  { id: 'trade', name: 'Trade', icon: ArrowLeftRight, description: 'List on marketplace or trade with others' },
];

// Mock materials for enhancement - now using genre-based system
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
  return Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => ({
    id: `dup-${i}`,
    ...card,
    level: Math.floor(Math.random() * 10) + 1,
  }));
};

export default function BlacksmithOverlay({ card, onClose }) {
  const [activeSystem, setActiveSystem] = useState('level');
  const [cardLevel, setCardLevel] = useState(card?.level || 1);
  const [cardStars, setCardStars] = useState(card?.stars || 1);
  const [cardAscension, setCardAscension] = useState(card?.ascension || 0);
  const [enhancedStats, setEnhancedStats] = useState({ attack: 0, defense: 0, magic: 0 });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [materials, setMaterials] = useState(MOCK_MATERIALS);
  const [showTradePanel, setShowTradePanel] = useState(false);
  
  const duplicates = useMemo(() => generateDuplicates(card), [card]);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

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

  // Calculate derived stats
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
      setMaterials(prev => prev.map(m => 
        m.id === 'gold' ? { ...m, quantity: m.quantity - levelCost } : m
      ));
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
      setMaterials(prev => prev.map(m => 
        m.id === 'gold' ? { ...m, quantity: m.quantity - cost } : m
      ));
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 600);
  };

  const handleCombine = () => {
    if (selectedDuplicates.length < 2) return;
    setIsUpgrading(true);
    
    setTimeout(() => {
      setCardStars(prev => Math.min(prev + 1, 5));
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
      setMaterials(prev => prev.map(m => 
        m.id === 'gold' ? { ...m, quantity: m.quantity - ascensionCost } : m
      ));
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 1200);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, rgba(10, 15, 20, 0.98) 0%, rgba(20, 25, 35, 0.98) 50%, rgba(10, 15, 20, 0.98) 100%)' }}
      onClick={onClose}
    >
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/8 rounded-full blur-[120px]" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          animate={{
            boxShadow: [
              '0 0 100px rgba(251, 146, 60, 0.05)',
              '0 0 200px rgba(251, 146, 60, 0.1)',
              '0 0 100px rgba(251, 146, 60, 0.05)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Main Container - Centered, 70-80% height, expanding from center */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-7xl mx-8"
        style={{ height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all shadow-2xl"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header - Floating style like main header UI */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute -top-16 left-0 right-0 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30">
              <Hammer className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Blacksmith</h1>
              <p className="text-white/50 text-sm">Forge your card's true potential</p>
            </div>
          </div>
          
          {/* Resources Display */}
          <div className="flex items-center gap-3">
            {materials.slice(0, 2).map(mat => (
              <div key={mat.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xl">{mat.icon}</span>
                <span className="text-white font-bold">{mat.quantity.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="h-full flex gap-8 pt-4">
          
          {/* LEFT SECTION - Card Display */}
          <div className="w-[320px] flex-shrink-0 flex flex-col items-center justify-center">
            {/* Card with Tilt Effect */}
            <div
              className="relative perspective-1000 w-full max-w-[280px] aspect-[2.5/3.5]"
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
                    boxShadow: [
                      '0 0 30px rgba(251, 146, 60, 0.3)',
                      '0 0 60px rgba(251, 146, 60, 0.6)',
                      '0 0 30px rgba(251, 146, 60, 0.3)',
                    ]
                  }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
              )}

              <motion.div
                className="w-full h-full rounded-2xl relative overflow-hidden shadow-2xl border-2 border-white/30 bg-slate-900"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 0 60px ${card?.rarity === 'Legendary' ? 'rgba(249,115,22,0.4)' : card?.rarity === 'Mythic' ? 'rgba(244,63,94,0.4)' : 'rgba(59,130,246,0.4)'}`
                }}
              >
                {/* Card Image */}
                {card?.image ? (
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-white/20 text-6xl">?</div>
                  </div>
                )}
                
                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.35) ${val}%, transparent 100%)`)
                  }}
                />

                {/* Level & Stars Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-white font-bold">
                    Lv. {cardLevel}
                  </Badge>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < cardStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Ascension Badge */}
                {cardAscension > 0 && (
                  <div className="absolute top-12 left-3">
                    <Badge className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md border-purple-400/50 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      A{cardAscension}
                    </Badge>
                  </div>
                )}

                {/* Card Info Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <h3 className="text-white font-bold text-lg truncate">{card?.title || card?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`bg-gradient-to-r ${getRarityColor(card?.rarity)} border-0 text-white text-xs`}>
                      {card?.rarity || "Common"}
                    </Badge>
                    <span className="text-white/50 text-xs">{card?.series}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Power Rating Below Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-center"
            >
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total Power</p>
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-4xl font-black text-white">{baseStats.power.toLocaleString()}</span>
              </div>
            </motion.div>
          </div>

          {/* CENTER SECTION - Upgrade Systems */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* System Tabs */}
            <div className="flex gap-2 mb-6">
              {UPGRADE_SYSTEMS.map(sys => (
                <button
                  key={sys.id}
                  onClick={() => setActiveSystem(sys.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    activeSystem === sys.id
                      ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 border border-orange-500/50 text-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.2)]'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <sys.icon className="w-5 h-5" />
                  <span className="font-semibold">{sys.name}</span>
                </button>
              ))}
            </div>

            {/* Active System Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeSystem === 'level' && (
                  <motion.div
                    key="level"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Level Up</h3>
                      <p className="text-white/50 text-sm mb-6">Increase your card's level to boost all base stats.</p>
                      
                      {/* Level Progress */}
                      <div className="mb-8">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/60">Level {cardLevel}</span>
                          <span className="text-white/60">Max: {maxLevel}</span>
                        </div>
                        <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(cardLevel / maxLevel) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      {/* Stat Preview */}
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        {Object.entries(baseStats).filter(([k]) => k !== 'power').map(([stat, value]) => (
                          <div key={stat} className="p-4 rounded-xl bg-black/30 border border-white/5">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{stat}</p>
                            <p className="text-2xl font-bold text-white">{value}</p>
                            {canLevelUp && (
                              <p className="text-xs text-green-400 mt-1">
                                +{stat === 'attack' ? 15 : stat === 'defense' ? 12 : 10}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Level Up Button */}
                      <Button
                        onClick={handleLevelUp}
                        disabled={!canLevelUp || isUpgrading}
                        className={`w-full py-6 text-lg font-bold transition-all ${
                          canLevelUp
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-[0_0_30px_rgba(251,146,60,0.3)]'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {isUpgrading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-6 h-6" />
                          </motion.div>
                        ) : cardLevel >= maxLevel ? (
                          <>Ascend to Continue</>
                        ) : (
                          <>
                            <ArrowUp className="w-5 h-5 mr-2" />
                            Level Up ({levelCost.toLocaleString()} 🪙)
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {activeSystem === 'enhance' && (
                  <motion.div
                    key="enhance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Enhancement</h3>
                      <p className="text-white/50 text-sm mb-6">Amplify specific stats using materials.</p>
                      
                      {/* Enhancement Options */}
                      <div className="space-y-4">
                        {['attack', 'defense', 'magic'].map(stat => (
                          <div key={stat} className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold capitalize">{stat}</p>
                              <p className="text-white/50 text-sm">+{enhancedStats[stat]} Enhanced</p>
                            </div>
                            <Button
                              onClick={() => handleEnhance(stat)}
                              disabled={isUpgrading}
                              className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              +10 (500 🪙)
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSystem === 'combine' && (
                  <motion.div
                    key="combine"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Combine Duplicates</h3>
                      <p className="text-white/50 text-sm mb-6">Merge duplicate cards to increase star rating.</p>
                      
                      {/* Current Stars */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-8 h-8 transition-all ${
                              i < cardStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Duplicate Cards Grid */}
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        {duplicates.map((dup, i) => (
                          <button
                            key={dup.id}
                            onClick={() => {
                              if (selectedDuplicates.includes(dup.id)) {
                                setSelectedDuplicates(prev => prev.filter(id => id !== dup.id));
                              } else {
                                setSelectedDuplicates(prev => [...prev, dup.id]);
                              }
                            }}
                            className={`aspect-[2.5/3.5] rounded-lg border-2 transition-all overflow-hidden relative ${
                              selectedDuplicates.includes(dup.id)
                                ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <img src={card?.image} alt="" className="w-full h-full object-cover opacity-60" />
                            {selectedDuplicates.includes(dup.id) && (
                              <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                                <Check className="w-8 h-8 text-yellow-400" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-bold">
                              Lv.{dup.level}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Combine Button */}
                      <Button
                        onClick={handleCombine}
                        disabled={selectedDuplicates.length < 2 || cardStars >= 5 || isUpgrading}
                        className={`w-full py-6 text-lg font-bold ${
                          selectedDuplicates.length >= 2 && cardStars < 5
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <Merge className="w-5 h-5 mr-2" />
                        {cardStars >= 5 ? 'Max Stars Reached' : `Combine ${selectedDuplicates.length} Cards`}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {activeSystem === 'ascend' && (
                  <motion.div
                    key="ascend"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Ascension</h3>
                      <p className="text-white/50 text-sm mb-6">Break through level caps and unlock greater potential.</p>
                      
                      {/* Ascension Level */}
                      <div className="flex items-center justify-center gap-4 mb-8">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              i < cardAscension
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                : i === cardAscension && canAscend
                                  ? 'bg-white/20 border-2 border-dashed border-purple-400 animate-pulse'
                                  : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            {i < cardAscension ? (
                              <Crown className="w-6 h-6 text-white" />
                            ) : (
                              <Lock className="w-5 h-5 text-white/30" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Benefits */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-6">
                        <h4 className="text-purple-300 font-semibold mb-3">Next Ascension Benefits:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="w-4 h-4 text-purple-400" />
                            Level cap increased by +10
                          </li>
                          <li className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="w-4 h-4 text-purple-400" />
                            All stats +20% base increase
                          </li>
                          <li className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="w-4 h-4 text-purple-400" />
                            New visual effects unlocked
                          </li>
                        </ul>
                      </div>

                      {/* Ascend Button */}
                      <Button
                        onClick={handleAscend}
                        disabled={!canAscend || isUpgrading}
                        className={`w-full py-6 text-lg font-bold ${
                          canAscend
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {cardAscension >= 5 ? (
                          <>Max Ascension Reached</>
                        ) : !canAscend ? (
                          <>Reach Level {maxLevel} First</>
                        ) : (
                          <>
                            <Crown className="w-5 h-5 mr-2" />
                            Ascend ({ascensionCost.toLocaleString()} 🪙)
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {activeSystem === 'trade' && (
                  <motion.div
                    key="trade"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Trade Card</h3>
                      <p className="text-white/50 text-sm mb-6">List this card on the marketplace or trade for materials.</p>
                      
                      {/* Value Breakdown */}
                      <div className="mb-6">
                        <ValueBreakdown card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats }} />
                      </div>

                      {/* Trade Info */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
                        <h4 className="text-cyan-300 font-semibold mb-3">Trading Benefits:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="w-4 h-4 text-cyan-400" />
                            Card history preserved for buyer
                          </li>
                          <li className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="w-4 h-4 text-cyan-400" />
                            All upgrades transfer with card
                          </li>
                          <li className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="w-4 h-4 text-cyan-400" />
                            Trade for currency or materials
                          </li>
                        </ul>
                      </div>

                      {/* Open Trade Panel Button */}
                      <Button
                        onClick={() => setShowTradePanel(true)}
                        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                      >
                        <ArrowLeftRight className="w-5 h-5 mr-2" />
                        Open Trade Panel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT SECTION - Stats, Materials & Value */}
          <div className="w-[280px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
            {/* Market Value Display */}
            <MarketValueDisplay card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats }} />

            {/* Detailed Stats Panel */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Card Stats
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

            {/* Materials Inventory */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Materials
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {materials.filter(m => m.material_type !== 'gold').map(mat => (
                  <MaterialCard
                    key={mat.id}
                    material={mat.material_type}
                    quantity={mat.quantity}
                    size="small"
                  />
                ))}
              </div>
            </div>

            {/* Upgrade Requirements */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold mb-4">Requirements</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Next Level Cost</span>
                  <span className="text-yellow-400 font-bold">{levelCost.toLocaleString()} 🪙</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Ascension Cost</span>
                  <span className="text-purple-400 font-bold">{ascensionCost.toLocaleString()} 🪙</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Enhancement Cost</span>
                  <span className="text-cyan-400 font-bold">500 🪙</span>
                </div>
              </div>
            </div>

            {/* Next Evolution Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              <h4 className="text-orange-300 font-bold mb-3">Next Milestone</h4>
              <p className="text-white/60 text-sm">
                {cardLevel < maxLevel
                  ? `Reach level ${maxLevel} to unlock Ascension`
                  : cardAscension < 5
                    ? `Ascend to increase max level to ${maxLevel + 10}`
                    : 'Card has reached maximum potential!'}
              </p>
            </div>
          </div>
        </div>

        {/* Trade Panel Overlay */}
        <AnimatePresence>
          {showTradePanel && (
            <TradingPanel
              card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats }}
              onClose={() => setShowTradePanel(false)}
              onListCard={(listing) => {
                console.log('Listing card:', listing);
                setShowTradePanel(false);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}