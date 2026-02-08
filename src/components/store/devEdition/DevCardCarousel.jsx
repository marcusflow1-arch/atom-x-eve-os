import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const rarityColors = {
  Mythic: { bg: 'from-red-900/60 to-red-800/30', border: 'border-red-500/50', text: 'text-red-300', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
  Legendary: { bg: 'from-yellow-900/60 to-amber-800/30', border: 'border-yellow-500/50', text: 'text-yellow-300', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]' },
  Epic: { bg: 'from-purple-900/60 to-purple-800/30', border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
  Rare: { bg: 'from-blue-900/60 to-blue-800/30', border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  Common: { bg: 'from-slate-800/60 to-slate-700/30', border: 'border-slate-500/50', text: 'text-slate-300', glow: '' },
};

export default function DevCardCarousel({ cards, game, selectedCard, onSelectCard, onBuy, justAdded }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  if (!cards || cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-6 space-y-4"
    >
      {/* Game Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{game.title}</h3>
          <p className="text-xs text-white/40">{game.genre} • {cards.length} Limited Edition Cards</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll('left')} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={() => scroll('right')} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Cards Horizontal Scroll */}
      <div className="relative group/strip">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card) => {
            const rarity = rarityColors[card.rarity] || rarityColors.Common;
            const isActive = selectedCard?.id === card.id;

            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -6, scale: 1.04 }}
                onClick={() => onSelectCard(card)}
                className={`flex-shrink-0 w-[160px] cursor-pointer`}
              >
                {/* Card Name Above */}
                <div className="text-center mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${rarity.text}`}>
                    {card.rarity}
                  </span>
                  <p className="text-xs font-semibold text-white truncate">{card.name}</p>
                </div>

                {/* Card Visual */}
                <div className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all ${
                  isActive ? `${rarity.border} ${rarity.glow}` : 'border-white/10 hover:border-white/20'
                }`}>
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  {/* Tag */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge className={`bg-gradient-to-r ${rarity.bg} ${rarity.text} border-none text-[9px] w-full justify-center backdrop-blur-md`}>
                      {card.tag || 'Limited Edition'}
                    </Badge>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCardIndicator"
                      className="absolute inset-0 rounded-xl ring-2 ring-cyan-400/60 pointer-events-none"
                    />
                  )}
                </div>

                {/* Buy Button Below Card */}
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectCard(card); onBuy(card); }}
                  disabled={justAdded}
                  className={`w-full mt-2 h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    justAdded && selectedCard?.id === card.id
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 hover:bg-cyan-500 hover:text-black text-white/70 border border-white/10 hover:border-cyan-400'
                  }`}
                >
                  {justAdded && selectedCard?.id === card.id ? (
                    <><Check className="w-3 h-3" /> Added</>
                  ) : (
                    <><ShoppingCart className="w-3 h-3" /> Buy</>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}