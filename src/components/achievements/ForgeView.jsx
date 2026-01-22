import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Merge, Crown, ArrowLeftRight, Hammer, Check, ArrowUp, Flame, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaterialCard } from '@/components/blacksmith/MaterialSystem';

// Mock materials and data (reused from BlacksmithOverlay logic for consistency)
const MOCK_MATERIALS = [
  { id: 'gold', material_type: 'gold', name: 'Gold', icon: '🪙', quantity: 25000, rarity: 'Currency' },
  { id: 'precision_shard', material_type: 'precision_shard', quantity: 45, rarity: 'Rare' },
  { id: 'combat_core', material_type: 'combat_core', quantity: 28, rarity: 'Epic' },
  { id: 'ascension_core', material_type: 'ascension_core', quantity: 8, rarity: 'Epic' },
  { id: 'skill_catalyst', material_type: 'skill_catalyst', quantity: 35, rarity: 'Rare' },
  { id: 'fusion_currency', material_type: 'fusion_currency', quantity: 120, rarity: 'Uncommon' },
  { id: 'wildcard', material_type: 'wildcard', quantity: 5, rarity: 'Legendary' },
];

const UPGRADE_SYSTEMS = [
  { id: 'level', name: 'Level Up', icon: TrendingUp },
  { id: 'enhance', name: 'Enhance', icon: Sparkles },
  { id: 'combine', name: 'Combine', icon: Merge },
  { id: 'ascend', name: 'Ascend', icon: Crown },
];

export default function ForgeView({ card, onStatsUpdate }) {
  const [activeSystem, setActiveSystem] = useState('level');
  
  // Local state for the forge session
  const [stats, setStats] = useState({
    level: card?.level || 1,
    stars: card?.stars || 1,
    ascension: card?.ascension || 0,
    enhanced_stats: { attack: 0, defense: 0, magic: 0 }
  });

  const [materials, setMaterials] = useState(MOCK_MATERIALS);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Propagate stats changes up to the parent display
  useEffect(() => {
    if (onStatsUpdate) onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  // Derived calculations
  const maxLevel = 10 + (stats.ascension * 10);
  const levelCost = stats.level * 100;
  const canLevelUp = stats.level < maxLevel && materials.find(m => m.id === 'gold')?.quantity >= levelCost;
  
  const handleLevelUp = () => {
    if (!canLevelUp) return;
    performUpgrade(() => {
      setStats(prev => ({ ...prev, level: prev.level + 1 }));
      consumeMaterial('gold', levelCost);
    });
  };

  const handleEnhance = (stat) => {
    const cost = 500;
    if (materials.find(m => m.id === 'gold')?.quantity < cost) return;
    performUpgrade(() => {
      setStats(prev => ({ 
        ...prev, 
        enhanced_stats: { ...prev.enhanced_stats, [stat]: prev.enhanced_stats[stat] + 10 } 
      }));
      consumeMaterial('gold', cost);
    });
  };

  const handleCombine = (count) => {
    if (stats.stars >= 5) return;
    performUpgrade(() => {
      setStats(prev => ({ ...prev, stars: Math.min(prev.stars + count, 5) }));
    });
  };

  const canAscend = stats.level >= maxLevel && stats.ascension < 5;
  const ascensionCost = (stats.ascension + 1) * 5000;
  
  const handleAscend = () => {
    if (!canAscend || materials.find(m => m.id === 'gold')?.quantity < ascensionCost) return;
    performUpgrade(() => {
      setStats(prev => ({ ...prev, ascension: prev.ascension + 1 }));
      consumeMaterial('gold', ascensionCost);
    });
  };

  const performUpgrade = (action) => {
    setIsUpgrading(true);
    setTimeout(() => {
      action();
      setIsUpgrading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 800);
  };

  const consumeMaterial = (id, amount) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, quantity: m.quantity - amount } : m));
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-l-3xl border-l border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Hammer className="w-6 h-6 text-orange-400" />
            Forge
          </h2>
          <p className="text-white/40 text-sm">Upgrade and evolve your collection</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
            <span className="text-lg">🪙</span>
            <span className="text-white font-bold">{materials.find(m => m.id === 'gold').quantity.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-4 gap-2 border-b border-white/5">
        {UPGRADE_SYSTEMS.map(sys => (
          <button
            key={sys.id}
            onClick={() => setActiveSystem(sys.id)}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
              activeSystem === sys.id
                ? 'bg-gradient-to-b from-orange-500/20 to-orange-600/5 border-orange-500/40 text-orange-200'
                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <sys.icon className={`w-5 h-5 mb-1 ${activeSystem === sys.id ? 'text-orange-400' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wider">{sys.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          {activeSystem === 'level' && (
            <motion.div 
              key="level"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-end mb-4">
                   <div>
                     <span className="text-white/40 text-xs uppercase tracking-wider block mb-1">Current Level</span>
                     <div className="text-4xl font-black text-white">{stats.level} <span className="text-white/30 text-xl">/ {maxLevel}</span></div>
                   </div>
                   {canLevelUp && (
                     <div className="text-green-400 text-sm font-bold flex items-center gap-1">
                       <ArrowUp className="w-4 h-4" /> Next: Lv.{stats.level + 1}
                     </div>
                   )}
                </div>
                
                {/* Progress Bar */}
                <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-2 relative">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.level / maxLevel) * 100}%` }}
                  />
                  {/* Stripes animation */}
                  <div className="absolute inset-0 bg-[url('/stripes.png')] opacity-10" />
                </div>
                <div className="text-right text-xs text-white/30">EXP Progress</div>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white/40 text-xs uppercase mb-1">Power Rating</div>
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                       <Flame className="w-5 h-5 text-orange-500" />
                       {(1000 + stats.level * 50).toLocaleString()}
                       {canLevelUp && <span className="text-green-400 text-sm ml-2">+50</span>}
                    </div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white/40 text-xs uppercase mb-1">Stat Multiplier</div>
                    <div className="text-2xl font-bold text-white">
                       x{(1 + stats.level * 0.1).toFixed(1)}
                       {canLevelUp && <span className="text-green-400 text-sm ml-2">+0.1</span>}
                    </div>
                 </div>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                 <Button 
                   onClick={handleLevelUp}
                   disabled={!canLevelUp || isUpgrading}
                   className={`w-full py-8 text-lg font-bold rounded-xl transition-all ${
                     canLevelUp 
                       ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:scale-[1.02] shadow-lg shadow-orange-500/20' 
                       : 'bg-white/5 text-white/20'
                   }`}
                 >
                   {isUpgrading ? (
                     <Sparkles className="w-6 h-6 animate-spin" />
                   ) : canLevelUp ? (
                     <span className="flex items-center gap-2">
                       Level Up <span className="w-1 h-1 bg-white/50 rounded-full mx-1" /> {levelCost} 🪙
                     </span>
                   ) : (
                     stats.level >= maxLevel ? "Max Level Reached (Ascend Required)" : "Insufficient Gold"
                   )}
                 </Button>
              </div>
            </motion.div>
          )}

          {activeSystem === 'enhance' && (
             <motion.div key="enhance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {['Attack', 'Defense', 'Magic', 'Speed'].map(stat => (
                 <div key={stat} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300">
                         <Sparkles className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="text-white font-bold">{stat}</div>
                         <div className="text-white/40 text-xs">Current Bonus: +{stats.enhanced_stats[stat.toLowerCase()] || 0}</div>
                       </div>
                    </div>
                    <Button 
                      onClick={() => handleEnhance(stat.toLowerCase())}
                      disabled={isUpgrading}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    >
                      Enhance (500 🪙)
                    </Button>
                 </div>
               ))}
             </motion.div>
          )}

          {activeSystem === 'combine' && (
            <motion.div key="combine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center">
               <div className="flex justify-center gap-2 mb-8">
                 {Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className={`w-8 h-8 ${i < stats.stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/10'}`} />
                 ))}
               </div>
               
               <p className="text-white/60">Combine duplicate cards to increase Star Rating. Higher stars unlock latent abilities.</p>
               
               <div className="grid grid-cols-4 gap-4 my-8">
                  {[1,2,3].map(i => (
                    <div key={i} className="aspect-[2.5/3.5] bg-white/5 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
                       <span className="text-white/20">Duplicate</span>
                    </div>
                  ))}
               </div>

               <Button 
                 onClick={() => handleCombine(1)}
                 disabled={stats.stars >= 5 || isUpgrading}
                 className="w-full py-6 bg-yellow-500/80 hover:bg-yellow-500 text-black font-bold"
               >
                 Combine (Mock Action)
               </Button>
            </motion.div>
          )}

          {activeSystem === 'ascend' && (
             <motion.div key="ascend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
                <div className="w-32 h-32 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-pulse" />
                   <Crown className="w-16 h-16 text-purple-400" />
                </div>
                
                <h3 className="text-3xl font-black text-white mb-2">Ascension {stats.ascension + 1}</h3>
                <p className="text-white/50 text-center max-w-xs mb-8">Break the limits. Raise max level by 10 and unlock visual effects.</p>

                <div className="w-full space-y-2 mb-8">
                   <div className="flex justify-between text-sm p-3 bg-white/5 rounded-lg">
                      <span className="text-white/60">Current Max Level</span>
                      <span className="text-white font-mono">{maxLevel} → {maxLevel + 10}</span>
                   </div>
                   <div className="flex justify-between text-sm p-3 bg-white/5 rounded-lg">
                      <span className="text-white/60">Cost</span>
                      <span className="text-purple-300 font-bold">{ascensionCost.toLocaleString()} 🪙</span>
                   </div>
                </div>

                <Button 
                  onClick={handleAscend}
                  disabled={!canAscend || isUpgrading}
                  className={`w-full py-8 text-lg font-bold ${canAscend ? 'bg-purple-600 hover:bg-purple-500' : 'bg-white/10 opacity-50'}`}
                >
                  {stats.ascension >= 5 ? "Max Ascension" : canAscend ? "Ascend Now" : "Level Max Required"}
                </Button>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}