import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Sparkles, Zap, Swords, Hammer, ArrowLeftRight, MoreHorizontal, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CardInventoryOverlay({ card, relatedCards, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null);

  const actions = [
    { id: 'combine', label: 'Combine', icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    { id: 'enchant', label: 'Enchant', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { id: 'train', label: 'Train', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    { id: 'craft', label: 'Craft', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
  ];

  // Card Tilt & Shine Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-150, 150], [15, -15]);
  const rotateY = useTransform(mouseX, [-150, 150], [-15, 15]);
  
  // Dynamic gradient position for shine
  const shineX = useTransform(mouseX, [-150, 150], [0, 100]);
  const shineY = useTransform(mouseY, [-150, 150], [0, 100]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl h-[85vh] flex gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Floating outside */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Panel: Selected Card & Actions - Independent Box */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 rounded-3xl overflow-hidden flex flex-col relative p-6"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Interactive Liquid Glass Card Container */}
            <div 
              className="relative group perspective-1000 w-full max-w-[280px] aspect-[2.5/3.5]"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                className="w-full h-full rounded-2xl relative z-10 overflow-hidden shadow-2xl border border-white/20 bg-slate-900"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 0 30px ${card.rarity === 'Legendary' ? 'rgba(249,115,22,0.3)' : card.rarity === 'Mythic' ? 'rgba(244,63,94,0.3)' : 'rgba(59,130,246,0.3)'}`
                }}
              >
                {/* Card Content Layer */}
                <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0)" }}>
                  {card.image ? (
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <div className="text-white/20 text-4xl">?</div>
                    </div>
                  )}
                </div>

                {/* Interactive Shine Layer */}
                <motion.div 
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(
                      shineX, 
                      val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`
                    )
                  }}
                />

                {/* Glossy Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
              </motion.div>
              
              {/* Floor Reflection */}
              <div className="absolute -bottom-10 left-4 right-4 h-4 bg-black/60 blur-xl rounded-full" />
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{card.name || "Unknown Card"}</h2>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{card.series || "Unknown Series"}</Badge>
                <Badge className={`${
                  card.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                  card.rarity === 'Mythic' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                } border`}>
                  {card.rarity || "Common"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group overflow-hidden ${
                  selectedAction === action.id
                    ? `${action.bg} ${action.border} scale-105 shadow-lg`
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-2 rounded-lg bg-black/20 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{action.label}</span>
                
                {/* Hover Glint */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Right Panel: Related Cards / Flow Network - Content Only (No Box) */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col py-6 pr-6"
        >
          <div className="mb-6 flex items-center justify-between pl-2">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Collection Network
              </h3>
              <p className="text-white/40 text-sm">Related cards from {card.series || "this series"}</p>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-white/60">
                {relatedCards.length} Cards Found
              </Badge>
            </div>
          </div>

          {/* Flow Network Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedCards.map((relatedCard) => (
                <motion.div
                  key={relatedCard.id}
                  layoutId={`card-${relatedCard.id}`}
                  className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                    relatedCard.id === card.id 
                      ? 'scale-105 z-10 ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                      : 'hover:scale-105 hover:z-10'
                  }`}
                >
                  {relatedCard.image ? (
                    <img src={relatedCard.image} alt={relatedCard.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-xl">
                      <span className="text-white/10 text-2xl">?</span>
                    </div>
                  )}
                  
                  {/* Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 rounded-xl">
                    <p className="text-xs font-bold text-white truncate">{relatedCard.name}</p>
                    <p className="text-[10px] text-white/60">{relatedCard.rarity}</p>
                  </div>

                  {/* Active Indicator */}
                  {relatedCard.id === card.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
                  )}
                </motion.div>
              ))}
              
              {/* Add Placeholder Slots - Content Only */}
              {[...Array(Math.max(0, 10 - relatedCards.length))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-[2.5/3.5] rounded-xl flex items-center justify-center group opacity-30">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:border-white/30 group-hover:text-white/50 transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Description Area (if an action is selected) */}
          <AnimatePresence>
            {selectedAction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    actions.find(a => a.id === selectedAction)?.bg
                  }`}>
                    {React.createElement(actions.find(a => a.id === selectedAction)?.icon, { className: "w-6 h-6 text-white" })}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg mb-1">
                      {actions.find(a => a.id === selectedAction)?.label} Card
                    </h4>
                    <p className="text-white/60 text-sm">
                      {selectedAction === 'combine' && "Merge duplicate cards to increase mint value and power level."}
                      {selectedAction === 'enchant' && "Imbue this card with magical properties to unlock hidden stats."}
                      {selectedAction === 'train' && "Send this unit to the training grounds to gain XP over time."}
                      {selectedAction === 'craft' && "Use this card as a material to forge a higher rarity item."}
                    </p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Confirm {actions.find(a => a.id === selectedAction)?.label}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}