import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ENHANCEMENT_OPTIONS = [9, 12, 15, 20];

const rarityGlowColors = {
  Common: 'rgba(148, 163, 184, 0.8)',
  Uncommon: 'rgba(34, 197, 94, 0.8)',
  Rare: 'rgba(59, 130, 246, 0.8)',
  Epic: 'rgba(168, 85, 247, 0.8)',
  Legendary: 'rgba(249, 115, 22, 0.8)',
  Mythic: 'rgba(239, 68, 68, 0.8)',
};

export default function EnchantmentPanel({ item, onEnhance, userMaterials = [] }) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [currentEnhancement, setCurrentEnhancement] = useState(item?.enchant_level || 0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [glowHeight, setGlowHeight] = useState((currentEnhancement / 120) * 100);

  const glowColor = rarityGlowColors[item?.rarity] || rarityGlowColors.Common;

  // Filter relevant materials (e.g., matching genre or universal)
  const relevantMaterials = userMaterials.filter(mat => mat.quantity > 0);

  const selectedMaterial = relevantMaterials.find(m => m.id === selectedMaterialId);
  // Example logic: Higher rarity material = better chance/more stats
  const successChance = selectedMaterial ? (selectedMaterial.rarity === 'Legendary' ? 100 : selectedMaterial.rarity === 'Epic' ? 80 : 50) : 0;
  const statGain = selectedMaterial ? (selectedMaterial.rarity === 'Legendary' ? 5 : 2) : 0;

  useEffect(() => {
    setGlowHeight((currentEnhancement / 120) * 100);
  }, [currentEnhancement]);

  const handleEnhance = async () => {
    if (currentEnhancement >= 120 || !selectedMaterial) return;
    
    setIsEnhancing(true);
    
    // Simulate outcome
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const success = Math.random() * 100 < successChance;
    
    if (success) {
       const newLevel = Math.min(currentEnhancement + statGain, 120);
       setCurrentEnhancement(newLevel);
       if (onEnhance) onEnhance(item, newLevel);
    } else {
       // Fail logic could be added here
    }
    
    setIsEnhancing(false);
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a card to enchant</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-16 w-full h-full"
    >
      {/* Card with Protective Encasing */}
      <div className="relative">
        {/* Translucent Protective Layer */}
        <div 
          className="absolute -inset-4 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        />
        
        {/* Card Container */}
        <div className="relative w-[220px] aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 border-white/20">
          {/* Card Image */}
          <img 
            src={item.preview_image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Enhancement Glow Effect - Rises from bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            animate={{ height: `${glowHeight}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              background: `linear-gradient(to top, ${glowColor}, transparent)`,
              filter: 'blur(8px)',
              opacity: 0.7
            }}
          />
          
          {/* Animated Border Glow */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{
              boxShadow: isEnhancing 
                ? [`inset 0 0 30px ${glowColor}`, `inset 0 0 60px ${glowColor}`, `inset 0 0 30px ${glowColor}`]
                : `inset 0 0 ${20 + (currentEnhancement / 120) * 30}px ${glowColor}`
            }}
            transition={{ duration: 0.5, repeat: isEnhancing ? Infinity : 0 }}
          />
          
          {/* Card Stats Overlay */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between">
            {/* Top Row - Enhancement % and Combine Stage */}
            <div className="flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                <span className="text-white/60 text-[10px]">CS</span>
                <span className="text-white font-bold text-sm ml-1">{item.combine_stage || 0}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-amber-500/50">
                <span className="text-amber-400 font-bold text-sm">{currentEnhancement}%</span>
              </div>
            </div>
            
            {/* Center - Level */}
            <div className="flex justify-center">
              <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <span className="text-white/60 text-xs">LVL</span>
                <span className="text-white font-black text-xl ml-2">{item.level || 1}</span>
              </div>
            </div>
            
            {/* Bottom - Name */}
            <div>
              <h3 className="text-white font-bold text-sm leading-tight">{item.name}</h3>
              <p className="text-white/50 text-xs">{item.rarity}</p>
            </div>
          </div>
          
          {/* Sparkle Particles when enhancing */}
          <AnimatePresence>
            {isEnhancing && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ background: glowColor }}
                    initial={{ 
                      x: 110, 
                      y: 280,
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: Math.random() * 200 + 10,
                      y: Math.random() * -200,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{ 
                      duration: 1,
                      delay: i * 0.1,
                      repeat: Infinity
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhancement Controls */}
      <div className="flex flex-col items-center gap-6 w-80 bg-white/5 p-6 rounded-2xl border border-white/10">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-purple-400" /> Enchantment
        </h3>
        
        {/* Material Selection Grid */}
        <div className="w-full">
           <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-bold">Select Material</p>
           {relevantMaterials.length === 0 ? (
              <div className="text-center p-4 border border-dashed border-white/10 rounded-xl text-white/30 text-xs">
                 No materials available
              </div>
           ) : (
              <div className="grid grid-cols-4 gap-2">
                 {relevantMaterials.map(mat => (
                    <button
                       key={mat.id}
                       onClick={() => setSelectedMaterialId(mat.id)}
                       className={`aspect-square rounded-lg border-2 relative overflow-hidden transition-all ${
                          selectedMaterialId === mat.id 
                             ? 'border-purple-500 bg-purple-500/20' 
                             : 'border-white/10 bg-white/5 hover:border-white/30'
                       }`}
                       title={mat.name}
                    >
                       <div className={`w-3 h-3 rounded-full absolute top-1 right-1 ${rarityGlowColors[mat.rarity]?.replace('0.8', '1') || 'bg-slate-500'}`} />
                       <div className="absolute bottom-1 right-1 text-[10px] font-mono text-white/80">{mat.quantity}</div>
                    </button>
                 ))}
              </div>
           )}
        </div>

        {/* Stats Preview */}
        {selectedMaterial && (
           <div className="w-full space-y-2">
              <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                 <span className="text-xs text-white/60">Success Chance</span>
                 <span className={`font-bold text-sm ${successChance >= 80 ? 'text-green-400' : successChance >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {successChance}%
                 </span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                 <span className="text-xs text-white/60">Stat Gain</span>
                 <span className="font-bold text-sm text-purple-400">+{statGain}%</span>
              </div>
           </div>
        )}

        {/* Enhance Button */}
        <Button
          onClick={handleEnhance}
          disabled={isEnhancing || currentEnhancement >= 120 || !selectedMaterial}
          className={`w-full h-14 font-bold text-lg rounded-xl disabled:opacity-50 transition-all ${
             selectedMaterial 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-700 text-slate-400'
          }`}
        >
          {isEnhancing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          ) : currentEnhancement >= 120 ? (
            'MAX TIER REACHED'
          ) : !selectedMaterial ? (
            'SELECT MATERIAL'
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2 fill-current" />
              Confirm Enchant
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}