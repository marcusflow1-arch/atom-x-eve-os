import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Sparkles, Zap, Swords, Hammer, ArrowLeftRight, Layers, Plus, Hexagon, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ItemWorkstation({ item, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null); // null = Overview
  const [stats, setStats] = useState({ level: item?.level_requirement || 1, power: 150, xp: 0, xpToNext: 1000 });
  const [fusionMaterial, setFusionMaterial] = useState(null);

  // Mock "Extra Items" for combination
  const extraItems = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: `extra-${i}`,
      name: `${item?.name || 'Item'} Duplicate`,
      rarity: 'Common',
      image: i % 2 === 0 ? item?.preview_image_url : null
    }));
  }, [item]);

  const actions = [
    { id: 'enchant', label: 'Enchant', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { id: 'combine', label: 'Combine', icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    { id: 'train', label: 'Train', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
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
    setStats(prev => {
      const newXp = prev.xp + 250;
      if (newXp >= prev.xpToNext) {
        return { ...prev, level: prev.level + 1, power: prev.power + 10, xp: newXp - prev.xpToNext, xpToNext: Math.floor(prev.xpToNext * 1.5) };
      }
      return { ...prev, xp: newXp };
    });
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
                <div className="absolute inset-0 z-0">
                  {item?.preview_image_url ? (
                    <img src={item.preview_image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Shield className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                </div>
                <motion.div 
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`)
                  }}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
              </motion.div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{item?.name || "Unknown Item"}</h2>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{item?.type || "Item"}</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item?.rarity || "Common"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 grid grid-cols-3 gap-2 border-t border-white/5">
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
                   <p className="text-white/50">Gain experience to level up item stats.</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center">
                   <div className="w-full max-w-md space-y-8">
                      <div className="text-center">
                        <div className="text-6xl font-black text-white mb-2">{stats.level}</div>
                        <div className="text-white/40 uppercase tracking-widest text-sm">Item Level</div>
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
                      <Button onClick={handleTrain} className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-700">
                         <Swords className="w-5 h-5 mr-2" /> Train (+250 XP)
                      </Button>
                   </div>
                </div>
              </motion.div>
            ) : selectedAction === 'combine' ? (
              <motion.div key="combine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                 <div className="mb-8">
                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><ArrowLeftRight className="w-8 h-8 text-blue-400"/> Fusion Core</h2>
                    <p className="text-white/50">Combine duplicates to increase rarity.</p>
                 </div>
                 <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center p-8 gap-8">
                    <div className="flex items-center gap-4 md:gap-8 w-full justify-center">
                       <div className="w-32 md:w-40 aspect-[3/4] bg-white/10 rounded-xl border border-white/20 flex flex-col items-center justify-center p-2 text-center">
                           <img src={item?.preview_image_url} className="w-16 h-16 rounded-full mb-2 object-cover opacity-50" />
                           <span className="font-bold text-white text-xs md:text-sm">{item?.name}</span>
                           <span className="text-[10px] text-white/50">Base Item</span>
                       </div>
                       <Plus className="w-8 h-8 text-white/40" />
                       <button onClick={() => setFusionMaterial(fusionMaterial ? null : {})} className={`w-32 md:w-40 aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all p-2 text-center ${fusionMaterial ? 'bg-blue-500/20 border-blue-500' : 'border-white/20 hover:border-white/40'}`}>
                          {fusionMaterial ? (
                              <>
                                <Layers className="w-8 h-8 text-blue-300 mb-2" />
                                <span className="font-bold text-blue-300 text-xs md:text-sm">Material Set</span>
                              </>
                          ) : (
                              <>
                                <div className="text-white/40 text-xs mb-2">Select Duplicates</div>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">{extraItems.length} Available</span>
                              </>
                          )}
                       </button>
                       <ArrowRight className="w-8 h-8 text-white/40" />
                       <div className="w-32 md:w-40 aspect-[3/4] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/50 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                          <Hexagon className="w-12 h-12 text-blue-300 mb-2" />
                          <span className="font-bold text-white text-xs md:text-sm">Upgraded</span>
                       </div>
                    </div>
                    
                    {!fusionMaterial && (
                        <div className="w-full mt-4">
                            <h4 className="text-white/40 text-xs font-bold uppercase mb-3">Available Materials</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {extraItems.map((extra) => (
                                    <button 
                                        key={extra.id} 
                                        onClick={() => setFusionMaterial(extra)}
                                        className="flex-shrink-0 w-20 aspect-square bg-white/5 rounded-lg border border-white/10 hover:border-white/30 flex items-center justify-center overflow-hidden relative group"
                                    >
                                        <img src={extra.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40">
                                            <Plus className="w-6 h-6 text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                 </div>
                 <div className="mt-6 flex justify-center">
                    <Button disabled={!fusionMaterial} className="bg-blue-600 hover:bg-blue-700 w-full max-w-sm h-12 text-lg">Initiate Fusion</Button>
                 </div>
              </motion.div>
            ) : selectedAction === 'enchant' ? (
              <motion.div key="enchant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                 <div className="mb-8">
                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><Zap className="w-8 h-8 text-purple-400"/> Enchantment Table</h2>
                    <p className="text-white/50">Imbue items with magical properties.</p>
                 </div>
                 <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                        <div className="space-y-4">
                            <h3 className="text-white/60 text-sm font-bold uppercase">Enchantment Slots</h3>
                            {Array.from({ length: item?.enchantment_slots || 2 }).map((_, i) => (
                                <div key={i} className="h-20 bg-black/20 rounded-xl border-2 border-dashed border-white/10 flex items-center gap-4 p-4 hover:border-white/20 transition-colors cursor-pointer group">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white/40 group-hover:text-white/60 font-medium">Empty Slot {i+1}</div>
                                        <div className="text-xs text-white/20">Select an enchantment scroll</div>
                                    </div>
                                    <Plus className="w-5 h-5 text-white/20 group-hover:text-white/50" />
                                </div>
                            ))}
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                            <h3 className="text-white/60 text-sm font-bold uppercase mb-4">Available Scrolls</h3>
                            <div className="space-y-2">
                                {['Fire Aspect I', 'Sharpness II', 'Unbreaking III', 'Mending'].map((scroll, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-purple-500/30">
                                        <div className="w-8 h-8 rounded bg-purple-900/30 flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <span className="text-sm text-purple-100 font-medium">{scroll}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                 </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}