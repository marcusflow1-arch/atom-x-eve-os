import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Swords, Hammer, ArrowLeftRight, MoreHorizontal } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        style={{
          background: 'rgba(20, 20, 30, 0.6)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Panel: Selected Card & Actions */}
        <div className="w-full md:w-1/3 lg:w-1/4 p-6 border-r border-white/10 flex flex-col relative bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Liquid Glass Card Container */}
            <div className="relative group perspective-1000 w-full max-w-[280px] aspect-[2.5/3.5]">
              <motion.div
                className="w-full h-full rounded-2xl relative z-10 overflow-hidden shadow-2xl border border-white/20"
                style={{
                  boxShadow: `0 0 30px ${card.rarity === 'Legendary' ? 'rgba(249,115,22,0.3)' : card.rarity === 'Mythic' ? 'rgba(244,63,94,0.3)' : 'rgba(59,130,246,0.3)'}`
                }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {card.image ? (
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <div className="text-white/20 text-4xl">?</div>
                  </div>
                )}
                
                {/* Shiny Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50 pointer-events-none" />
              </motion.div>
              
              {/* Floor Reflection */}
              <div className="absolute -bottom-8 left-4 right-4 h-4 bg-black/50 blur-xl rounded-full" />
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
        </div>

        {/* Right Panel: Related Cards / Flow Network */}
        <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col bg-black/20">
          <div className="mb-6 flex items-center justify-between">
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
                  className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer group border transition-all duration-300 ${
                    relatedCard.id === card.id 
                      ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-lg scale-105 z-10' 
                      : 'border-white/10 hover:border-white/30 hover:scale-105 hover:z-10 bg-white/5'
                  }`}
                  // onClick={() => handleCardSelect(relatedCard)} // In a real app, this would switch the selected card
                >
                  {relatedCard.image ? (
                    <img src={relatedCard.image} alt={relatedCard.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <span className="text-white/10 text-2xl">?</span>
                    </div>
                  )}
                  
                  {/* Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-xs font-bold text-white truncate">{relatedCard.name}</p>
                    <p className="text-[10px] text-white/60">{relatedCard.rarity}</p>
                  </div>

                  {/* Active Indicator */}
                  {relatedCard.id === card.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
                  )}
                </motion.div>
              ))}
              
              {/* Add Placeholder Slots */}
              {[...Array(Math.max(0, 10 - relatedCards.length))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-[2.5/3.5] rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center group">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/10 group-hover:border-white/20 group-hover:text-white/30 transition-all">
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
        </div>
      </motion.div>
    </motion.div>
  );
}