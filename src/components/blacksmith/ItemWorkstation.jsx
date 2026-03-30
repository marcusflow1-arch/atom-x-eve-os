import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Sparkles, Zap, Swords, Hammer, ArrowLeftRight, Layers, Plus, Hexagon, ArrowRight, Shield, Crown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ItemWorkstation({ item, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [stats, setStats] = useState({ 
    level: item?.level_requirement || 1, 
    power: 150, 
    xp: 0, 
    xpToNext: 1000 
  });
  const [fusionMaterial, setFusionMaterial] = useState(null);
  const [combineStage, setCombineStage] = useState(1); // CS 1-12
  const [enchantmentPercent, setEnchantmentPercent] = useState(0); // 0-120%
  const [equippedPerks, setEquippedPerks] = useState([]);
  const [selectedPerk, setSelectedPerk] = useState(null); // Single perk waiting to be applied
  const [enchantMode, setEnchantMode] = useState('perks'); // 'perks' or 'percentage'
  const [playerXP, setPlayerXP] = useState(5000); // Mock player XP
  const [isAscended, setIsAscended] = useState(false);
  
  const getMaxLevel = (rarity) => {
    if (['Common', 'Uncommon', 'Rare', 'Epic'].includes(rarity)) return 20;
    if (['Legendary', 'Demigod'].includes(rarity)) return 30;
    if (rarity === 'Mythical') return 35;
    if (rarity === 'Chosen') return 40;
    return 20;
  };
  
  const maxLevel = getMaxLevel(item?.rarity);

  if (!item) return null;

  // Combine state (two slots for same-game cards)
  const [combineSlot, setCombineSlot] = useState(null);
  const [combineQuantity, setCombineQuantity] = useState(1);
  const [inventoryCards, setInventoryCards] = useState(() => 
    Array.from({ length: 18 }, (_, i) => ({
      id: `duplicate-${i}`,
      name: item?.name,
      rarity: item?.rarity,
      type: item?.type,
      image: item?.preview_image_url,
      level: item?.level_requirement,
      combineStage: 1
    }))
  );

  // Mock "Inventory Items" for the game
  const inventoryItems = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: `card-${i}`,
      name: i % 3 === 0 ? item?.name : `${item?.name || 'Item'} ${i + 1}`,
      rarity: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][i % 5],
      type: i % 2 === 0 ? 'Weapon' : 'Armor',
      image: item?.preview_image_url,
      level: Math.floor(Math.random() * 20) + 1,
      combineStage: Math.floor(Math.random() * 5) + 1
    }));
  }, [item]);

  const rarityColors = {
    Common: { base: '#64748b', glow: '#94a3b8', dark: '#475569' },
    Uncommon: { base: '#10b981', glow: '#34d399', dark: '#059669' },
    Rare: { base: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' },
    Epic: { base: '#a855f7', glow: '#c084fc', dark: '#9333ea' },
    Legendary: { base: '#f97316', glow: '#fb923c', dark: '#ea580c' },
    Mythical: { base: '#ec4899', glow: '#f472b6', dark: '#db2777' },
    Chosen: { base: '#eab308', glow: '#facc15', dark: '#ca8a04' },
  };

  const actions = [
    { id: 'enchant', label: 'Enchant', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { id: 'combine', label: 'Combine', icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    { id: 'train', label: 'Train', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    { id: 'ascend', label: 'Ascend', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' },
  ];

  const availablePerks = [
    { id: 'fire', name: 'Fire Damage', icon: '🔥', effect: '+15% Fire DMG' },
    { id: 'ice', name: 'Frost Strike', icon: '❄️', effect: 'Freeze enemies' },
    { id: 'lightning', name: 'Chain Lightning', icon: '⚡', effect: 'AoE Shock' },
    { id: 'poison', name: 'Toxic Curse', icon: '☠️', effect: 'DoT Poison' },
    { id: 'crit', name: 'Critical Edge', icon: '💥', effect: '+25% Crit Rate' },
    { id: 'lifesteal', name: 'Vampiric', icon: '🩸', effect: '10% Lifesteal' },
  ];

  // Tilt Logic
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

  const handleTrain = () => {
    const cost = 500;
    if (playerXP < cost) {
      alert('Not enough XP!');
      return;
    }
    setPlayerXP(prev => prev - cost);
    setStats(prev => {
      const newXp = prev.xp + 250;
      if (newXp >= prev.xpToNext) {
        return { ...prev, level: prev.level + 1, power: prev.power + 10, xp: newXp - prev.xpToNext, xpToNext: Math.floor(prev.xpToNext * 1.5) };
      }
      return { ...prev, xp: newXp };
    });
  };

  const handleCombine = () => {
    if (combineStage >= 12) {
      alert('Max combine stage reached!');
      return;
    }
    if (!combineSlot) {
      alert('Drag a card to the combine area!');
      return;
    }
    // Simulate consuming cards from inventory
    setCombineStage(prev => Math.min(prev + combineQuantity, 12));
    setCombineSlot(null);
    setCombineQuantity(2);
    alert(`Successfully combined ${combineQuantity} cards! They have been removed from your inventory.`);
  };

  const handleTogglePerk = (perk) => {
    if (selectedPerk?.id === perk.id) {
      setSelectedPerk(null);
    } else {
      setSelectedPerk(perk);
    }
  };

  const handleApplyPerk = () => {
    if (!selectedPerk) return;
    
    const cost = 300;
    if (playerXP < cost) {
      alert('Not enough XP!');
      return;
    }
    setPlayerXP(prev => prev - cost);
    
    // Replace existing perk or add new one (only one perk allowed)
    setEquippedPerks([selectedPerk]);
    setSelectedPerk(null);
  };

  const handleRemovePerk = () => {
    setEquippedPerks([]);
  };

  const handleEnchantPercent = () => {
    const cost = 200;
    if (playerXP < cost) {
      alert('Not enough XP!');
      return;
    }
    if (enchantmentPercent >= 120) {
      alert('Max enchantment reached!');
      return;
    }
    setPlayerXP(prev => prev - cost);
    setEnchantmentPercent(prev => Math.min(prev + 10, 120));
  };

  const handleAscend = () => {
    const cost = 5000;
    if (playerXP < cost) {
      alert('Not enough XP!');
      return;
    }
    if (isAscended) {
      alert('Card already ascended!');
      return;
    }
    setPlayerXP(prev => prev - cost);
    setIsAscended(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl h-[85vh] flex gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Panel: Item Visual & Actions */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 rounded-3xl overflow-hidden flex flex-col relative p-6 bg-slate-900/80 border border-white/10 shadow-2xl"
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* 3D Card Effect */}
            <div 
              className="relative group perspective-1000 w-full max-w-[240px] aspect-[3/4]"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                className="w-full h-full rounded-2xl relative z-10 overflow-hidden shadow-2xl border border-white/20 bg-slate-800"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 0 30px ${item?.rarity === 'Legendary' ? 'rgba(249,115,22,0.3)' : 'rgba(59,130,246,0.3)'}`
                }}
              >
                {/* Card Image Base */}
                <div className="absolute inset-0 z-0">
                  {item?.preview_image_url ? (
                    <img src={item.preview_image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Shield className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Enchantment Sleeve Overlay - Behind Card Image */}
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none rounded-2xl overflow-hidden"
                  style={{
                    height: `${(enchantmentPercent / 120) * 85}%`,
                    bottom: 0,
                    top: 'auto',
                    transform: 'translateZ(-10px)',
                  }}
                  animate={{ 
                    opacity: enchantmentPercent > 0 ? 0.7 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Liquid Glass Background */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, 
                        rgba(168, 85, 247, ${enchantmentPercent / 120 * 0.6}) 0%, 
                        rgba(147, 51, 234, ${enchantmentPercent / 120 * 0.5}) 50%, 
                        rgba(126, 34, 206, ${enchantmentPercent / 120 * 0.7}) 100%)`,
                      backdropFilter: 'blur(12px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                    }}
                  />
                  
                  {/* Animated Liquid Waves */}
                  <motion.div
                    className="absolute inset-0 opacity-40"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{
                      background: 'radial-gradient(circle at 20% 50%, rgba(192, 132, 252, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.3) 0%, transparent 50%)',
                      backgroundSize: '200% 200%',
                    }}
                  />

                  {/* Glass Highlight */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
                    }}
                  />
                </motion.div>

                {/* Purple Aura Around Card */}
                {enchantmentPercent > 0 && (
                  <motion.div
                    className="absolute -inset-2 z-0 rounded-3xl pointer-events-none"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.03, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.6) 0%, rgba(126, 34, 206, 0.3) 50%, transparent 70%)',
                      filter: 'blur(15px)',
                    }}
                  />
                )}

                {/* God-like Aura for Ascended Cards */}
                {isAscended && (
                  <>
                    <motion.div
                      className="absolute -inset-4 z-0 rounded-3xl pointer-events-none"
                      animate={{
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.5) 40%, rgba(234, 88, 12, 0.3) 70%, transparent 90%)',
                        filter: 'blur(20px)',
                      }}
                    />
                    <motion.div
                      className="absolute -inset-1 z-1 rounded-2xl pointer-events-none"
                      animate={{
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        boxShadow: '0 0 40px rgba(251, 191, 36, 0.8), inset 0 0 20px rgba(251, 191, 36, 0.3)',
                      }}
                    />
                  </>
                )}

                {/* Shine Effect */}
                <motion.div 
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`)
                  }}
                />

                {/* Card Info Overlays */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {/* Top: Level */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                    <span className="text-white font-bold text-xs">Lv.{stats.level}</span>
                  </div>

                  {/* Bottom Middle: Perks */}
                  {equippedPerks.length > 0 && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
                      {equippedPerks.slice(0, 3).map(perk => (
                        <div key={perk.id} className="w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xs">
                          {perk.icon}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bottom: CS & Enchant % */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] font-bold">
                    <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20 text-blue-300">
                      CS {combineStage}
                    </span>
                    <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20 text-purple-300">
                      {enchantmentPercent}%
                    </span>
                  </div>
                </div>

                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
              </motion.div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{item?.name || "Unknown Item"}</h2>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{item?.type || "Item"}</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item?.rarity || "Common"}
                </Badge>
              </div>
              
              {/* Player XP Display */}
              <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="font-bold text-yellow-400">{playerXP.toLocaleString()}</span>
                <span>Player XP</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 grid grid-cols-4 gap-2 border-t border-white/5">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedAction(selectedAction === action.id ? null : action.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                  selectedAction === action.id
                    ? `${action.bg} ${action.border} shadow-lg`
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-2 rounded-full bg-black/20 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Right Panel: Content */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col py-6 pr-6"
        >
          <AnimatePresence mode="wait">
            {!selectedAction ? (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                 <div className="mb-6">
                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                        <Layers className="w-8 h-8 text-blue-400"/> Workstation Overview
                    </h2>
                    <p className="text-white/50">Item statistics and status.</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {item?.base_stats && Object.entries(item.base_stats).map(([key, value]) => (
                        <div key={key} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-xs uppercase text-white/40 font-bold mb-1">{key.replace('_', ' ')}</div>
                            <div className="text-2xl font-mono text-white">{value}</div>
                        </div>
                    ))}
                 </div>
                 
                 <div className="mt-6 bg-white/5 p-6 rounded-2xl border border-white/10 flex-1">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400"/> Active Effects
                    </h3>
                    <div className="space-y-3">
                        {item?.modifiers?.map((mod, i) => (
                            <div key={i} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <div>
                                    <div className="text-white font-medium text-sm">{mod.name}</div>
                                    <div className="text-white/40 text-xs">{mod.effect}</div>
                                </div>
                            </div>
                        ))}
                        {(!item?.modifiers || item.modifiers.length === 0) && (
                            <div className="text-white/30 italic text-sm">No active effects. Enchant this item to add powers.</div>
                        )}
                    </div>
                 </div>
              </motion.div>
            ) : selectedAction === 'train' ? (
              <motion.div key="train" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                <div className="mb-8">
                   <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><Swords className="w-8 h-8 text-red-400"/> Training Grounds</h2>
                   <p className="text-white/50">Gain experience to level up (Max: Lv.{maxLevel})</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center">
                   <div className="w-full max-w-md space-y-8">
                      <div className="text-center">
                        <div className="text-6xl font-black text-white mb-2">{stats.level}</div>
                        <div className="text-white/40 uppercase tracking-widest text-sm">Level {stats.level} / {maxLevel}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-white/60">XP Progress</span>
                           <span className="text-white">{stats.xp} / {stats.xpToNext}</span>
                        </div>
                        <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                           <motion.div className="h-full bg-red-500" initial={{ width: 0 }} animate={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
                        </div>
                      </div>
                      <Button onClick={handleTrain} disabled={stats.level >= maxLevel} className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-700">
                         <Swords className="w-5 h-5 mr-2" /> Train (+250 XP) - Cost: 500 XP
                      </Button>
                      {stats.level >= maxLevel && (
                        <div className="text-center text-green-400 font-bold">⚡ MAX LEVEL REACHED ⚡</div>
                      )}
                   </div>
                </div>
              </motion.div>
            ) : selectedAction === 'ascend' ? (
              <motion.div key="ascend" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                <div className="mb-8">
                   <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><Crown className="w-8 h-8 text-yellow-400"/> Ascension Altar</h2>
                   <p className="text-white/50">Unlock divine power and gain +20% to all stats</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center">
                   <div className="w-full max-w-md space-y-8 text-center">
                      {!isAscended ? (
                        <>
                          <div className="text-6xl mb-4">⚜️</div>
                          <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white">Ascend to Godhood</h3>
                            <p className="text-white/60">Unlock divine aura and increase all base stats by 20%</p>
                            <div className="bg-black/20 rounded-xl p-4 border border-yellow-500/20">
                              <h4 className="text-xs text-yellow-400 font-bold uppercase mb-2">Benefits</h4>
                              <div className="space-y-1 text-sm text-white/70">
                                <div>✓ +20% All Stats</div>
                                <div>✓ Divine Aura Effect</div>
                                <div>✓ Golden Glow</div>
                              </div>
                            </div>
                          </div>
                          <Button onClick={handleAscend} className="w-full h-16 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                            <Crown className="w-6 h-6 mr-2" /> Ascend (5000 XP)
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-6xl mb-4 animate-pulse">👑</div>
                          <div className="space-y-3">
                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                              ASCENDED
                            </h3>
                            <p className="text-white/80 font-bold">This card has achieved divine status!</p>
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                              <div className="text-white text-sm">All stats increased by 20%</div>
                            </div>
                          </div>
                        </>
                      )}
                   </div>
                </div>
              </motion.div>
            ) : selectedAction === 'combine' ? (
             <motion.div key="combine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
               <div className="mb-6">
                  <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><ArrowLeftRight className="w-8 h-8 text-blue-400"/> Combine Station</h2>
                  <p className="text-white/50">Select cards to combine. Each card increases CS by the selected quantity (Max: CS 12)</p>
               </div>

               {/* Two-Box Layout */}
               <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* Left: Inventory Grid */}
                  <div className="flex-1 flex flex-col bg-white/5 rounded-2xl border border-white/10 p-4">
                     <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">Your Cards</div>
                        <div className="flex items-center gap-2">
                           <button
                              onClick={() => setCombineQuantity(prev => Math.max(1, prev - 1))}
                              className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold transition-all"
                           >
                              −
                           </button>
                           <div className="text-lg font-black text-white w-8 text-center">{combineQuantity}</div>
                           <button
                              onClick={() => setCombineQuantity(prev => Math.min(12, prev + 1))}
                              className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold transition-all"
                           >
                              +
                           </button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-3">
                           {inventoryCards.map((card, idx) => (
                              <motion.div
                                 key={card.id}
                                 draggable
                                 onDragStart={(e) => e.dataTransfer.setData('card', JSON.stringify(card))}
                                 onClick={() => setCombineSlot(card)}
                                 whileHover={{ scale: 1.05 }}
                                 className="aspect-[3/4] rounded-lg border border-white/20 bg-slate-800 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all relative group"
                              >
                                 <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                 <div className="absolute bottom-1 left-1 right-1">
                                    <div className="text-white text-[9px] font-bold truncate">{card.name}</div>
                                    <div className="text-blue-300 text-[8px]">Duplicate</div>
                                 </div>
                              </motion.div>
                           ))}
                        </div>
                     </div>

                     <div className="text-[10px] text-white/40 text-center mt-2">
                        {inventoryCards.length} cards available • Qty: {combineQuantity}
                     </div>
                  </div>

                  {/* Right: Single Combine Slot */}
                  <div className="w-64 flex flex-col bg-white/5 rounded-2xl border border-white/10 p-4">
                     <div className="text-xs font-bold text-blue-300 text-center mb-3 uppercase tracking-wider">Combine Slot</div>

                     <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                           e.preventDefault();
                           const card = JSON.parse(e.dataTransfer.getData('card'));
                           setCombineSlot(card);
                        }}
                        className={`flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                           combineSlot ? 'bg-blue-500/20 border-blue-500/70' : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                     >
                        {combineSlot ? (
                           <>
                              <img src={combineSlot.image} alt={combineSlot.name} className="w-28 h-36 object-cover rounded-lg mb-3 shadow-lg" />
                              <span className="font-bold text-white text-sm text-center px-2">{combineSlot.name}</span>
                              <span className="text-[10px] text-blue-300 mt-1">Selected</span>
                              <button onClick={() => setCombineSlot(null)} className="mt-2 text-[10px] text-red-400 hover:text-red-300 underline">
                                 Remove
                              </button>
                           </>
                        ) : (
                           <>
                              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                 <Layers className="w-10 h-10 text-white/40" />
                              </div>
                              <span className="text-white/40 text-sm">Click or Drag Card</span>
                           </>
                        )}
                     </div>

                     {/* Result Preview */}
                     <div className="text-center mt-4 pt-4 border-t border-white/10">
                        <div className="text-[10px] text-white/40 mb-2">Result After Combine</div>
                        <div className="flex items-center justify-center gap-2">
                           <div className="text-xl font-black text-white">CS {combineStage}</div>
                           <ArrowRight className="w-4 h-4 text-white/40" />
                           <div className="text-xl font-black text-blue-400">CS {Math.min(combineStage + combineQuantity, 12)}</div>
                        </div>
                        <div className="text-[9px] text-white/30 mt-1">
                           +{combineQuantity} stage{combineQuantity > 1 ? 's' : ''}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Combine Button */}
               <div className="mt-6">
                  <Button 
                     onClick={() => {
                       if (!combineSlot) {
                         alert('Select a card to combine!');
                         return;
                       }
                       if (inventoryCards.length < combineQuantity) {
                         alert(`Not enough cards! You need ${combineQuantity} but only have ${inventoryCards.length}`);
                         return;
                       }
                       if (combineStage + combineQuantity > 12) {
                         alert('This would exceed max CS 12!');
                         return;
                       }

                       // Remove cards from inventory
                       setInventoryCards(prev => prev.slice(combineQuantity));

                       // Increase CS
                       setCombineStage(prev => Math.min(prev + combineQuantity, 12));
                       setCombineSlot(null);
                       alert(`Successfully combined ${combineQuantity} card${combineQuantity > 1 ? 's' : ''}! +${combineQuantity} CS`);
                     }} 
                     disabled={!combineSlot || inventoryCards.length < combineQuantity || combineStage >= 12} 
                     className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold"
                  >
                     <ArrowLeftRight className="w-5 h-5 mr-2" />
                     Combine {combineQuantity}x Card{combineQuantity > 1 ? 's' : ''}
                  </Button>
                  {combineStage >= 12 && (
                     <div className="text-center text-yellow-400 text-xs font-bold mt-3">⚡ MAX CS REACHED ⚡</div>
                  )}
               </div>
            </motion.div>
            ) : selectedAction === 'enchant' ? (
             <motion.div key="enchant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                <div className="mb-6">
                   <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><Zap className="w-8 h-8 text-purple-400"/> Enchantment Table</h2>
                   <p className="text-white/50">Add perks or increase enchantment power</p>

                   {/* Mode Toggle */}
                   <div className="flex gap-3 mt-4">
                     <button
                       onClick={() => setEnchantMode('perks')}
                       className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                         enchantMode === 'perks' ? 'bg-purple-500/30 text-white border border-purple-500/50' : 'bg-white/5 text-white/40 border border-white/10'
                       }`}
                     >
                       Add Perks
                     </button>
                     <button
                       onClick={() => setEnchantMode('percentage')}
                       className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                         enchantMode === 'percentage' ? 'bg-purple-500/30 text-white border border-purple-500/50' : 'bg-white/5 text-white/40 border border-white/10'
                       }`}
                     >
                       Enchant Power (0-120%)
                     </button>
                   </div>
                </div>

                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 overflow-y-auto">
                    {enchantMode === 'perks' ? (
                      <div className="space-y-4">
                        <h3 className="text-white/60 text-sm font-bold uppercase mb-4">Available Perks (Select One)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {availablePerks.map(perk => {
                            const equipped = equippedPerks.find(p => p.id === perk.id);
                            const selected = selectedPerk?.id === perk.id;
                            return (
                              <button
                                key={perk.id}
                                onClick={() => handleTogglePerk(perk)}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  equipped 
                                    ? 'bg-green-500/20 border-green-500/50' 
                                    : selected
                                    ? 'bg-purple-500/30 border-purple-500/70 shadow-lg shadow-purple-500/20'
                                    : 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10'
                                }`}
                              >
                                <div className="text-3xl mb-2">{perk.icon}</div>
                                <div className="text-white font-bold text-sm">{perk.name}</div>
                                <div className="text-white/40 text-xs">{perk.effect}</div>
                                {!equipped && !selected && (
                                  <div className="mt-2 text-[10px] text-yellow-400 flex items-center justify-center gap-1">
                                    <Sparkles className="w-3 h-3" /> 300 XP
                                  </div>
                                )}
                                {selected && <div className="mt-2 text-[10px] text-purple-300">⬤ Selected</div>}
                                {equipped && <div className="mt-2 text-[10px] text-green-400">✓ Equipped</div>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Perk to Apply */}
                        {selectedPerk && (
                          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white/80 text-sm font-bold">Selected Perk</h4>
                              <div className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> 300 XP
                              </div>
                            </div>
                            <div className="flex items-center gap-3 bg-purple-500/30 border border-purple-500/40 rounded-lg px-4 py-3 mb-3">
                              <span className="text-2xl">{selectedPerk.icon}</span>
                              <div>
                                <div className="text-white text-sm font-bold">{selectedPerk.name}</div>
                                <div className="text-white/60 text-xs">{selectedPerk.effect}</div>
                              </div>
                            </div>
                            <Button onClick={handleApplyPerk} className="w-full bg-purple-600 hover:bg-purple-700">
                              {equippedPerks.length > 0 ? 'Replace Perk (300 XP)' : 'Apply Perk (300 XP)'}
                            </Button>
                          </div>
                        )}

                        {/* Equipped Perk */}
                        {equippedPerks.length > 0 && (
                          <div className="mt-6 p-4 bg-black/20 rounded-xl border border-green-500/20">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white/60 text-xs font-bold uppercase">Current Perk</h4>
                              <button onClick={handleRemovePerk} className="text-xs text-red-400 hover:text-red-300 underline">
                                Remove
                              </button>
                            </div>
                            <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-3">
                              <span className="text-2xl">{equippedPerks[0].icon}</span>
                              <div>
                                <div className="text-white text-sm font-bold">{equippedPerks[0].name}</div>
                                <div className="text-white/60 text-xs">{equippedPerks[0].effect}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-7xl font-black text-purple-400 mb-2">{enchantmentPercent}%</div>
                          <div className="text-white/40 text-sm">Enchantment Power (Max: 120%)</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="h-6 bg-black/40 rounded-full overflow-hidden border border-white/10 relative">
                            <motion.div 
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(to right, ${rarityColors[item?.rarity]?.base || '#a855f7'}, ${rarityColors[item?.rarity]?.glow || '#c084fc'})`,
                                boxShadow: enchantmentPercent === 120 ? `0 0 20px ${rarityColors[item?.rarity]?.glow}` : 'none'
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(enchantmentPercent / 120) * 100}%` }}
                              transition={{ duration: 0.5 }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                              {enchantmentPercent}% / 120%
                            </div>
                          </div>
                        </div>

                        {/* Enchant Button */}
                        <div className="flex flex-col gap-4 items-center">
                          <Button 
                            onClick={handleEnchantPercent} 
                            disabled={enchantmentPercent >= 120}
                            className="bg-purple-600 hover:bg-purple-700 w-full max-w-md h-14 text-lg"
                          >
                            <Zap className="w-5 h-5 mr-2" /> Enchant +10% (200 XP)
                          </Button>

                          {enchantmentPercent === 120 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-400 mb-1">⚡ MAX POWER ⚡</div>
                              <div className="text-white/40 text-sm">This card has reached maximum enchantment!</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
             </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}