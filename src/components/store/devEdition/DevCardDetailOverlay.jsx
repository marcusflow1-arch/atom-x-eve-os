import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Shield, Star, Database, Radio, Check, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const rarityColors = {
  Mythic: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300' },
  Legendary: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300' },
  Epic: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-300' },
  Rare: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300' },
  Common: { bg: 'bg-slate-700/50', border: 'border-slate-500', text: 'text-slate-300' },
};

const StatBar = ({ label, value, color }) => (
  <div className="mb-3">
    <div className="flex justify-between text-[10px] mb-1">
      <span className="text-white/50 font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white font-bold">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

export default function DevCardDetailOverlay({ card, game, developer, onClose, onBuy, justAdded }) {
  if (!card) return null;

  const rarity = rarityColors[card.rarity] || rarityColors.Common;
  const priceMap = { Mythic: 95, Legendary: 75, Epic: 45, Rare: 25, Common: 10 };
  const price = priceMap[card.rarity] || 25;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-3xl bg-[#0f1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        {/* Left: Card Visual */}
        <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 relative p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="relative w-48 aspect-[2.5/3.5] group">
            <div
              className={`w-full h-full rounded-xl overflow-hidden border-2 ${rarity.border} shadow-2xl relative`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
              }}
              style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s ease-out' }}
            >
              <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-3 right-3">
                <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] w-full justify-center shadow-lg backdrop-blur-md mb-1`}>
                  {card.rarity}
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-8 flex flex-col relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">{developer}</Badge>
              <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">{card.tag || 'Limited Edition'}</span>
            </div>

            <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{card.name}</h2>
            <p className="text-white/50 text-sm mb-6">{card.type} • {game.title}</p>

            {/* Stats */}
            <div className="space-y-1 mb-6">
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Performance</h4>
              <StatBar label="Power Output" value={card.rarity === 'Mythic' ? 95 : card.rarity === 'Legendary' ? 85 : 65} color="bg-red-500" />
              <StatBar label="Durability" value={card.rarity === 'Mythic' ? 88 : card.rarity === 'Legendary' ? 72 : 55} color="bg-blue-500" />
              <StatBar label="Synergy" value={card.rarity === 'Mythic' ? 92 : card.rarity === 'Legendary' ? 78 : 60} color="bg-purple-500" />
            </div>

            {/* Info Table */}
            <div className="space-y-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden mb-6">
              <div className="flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/80">Type</span>
                </div>
                <span className="text-white font-bold text-sm">{card.type}</span>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/80">Rarity</span>
                </div>
                <span className={`font-bold text-sm ${rarity.text}`}>{card.rarity}</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/80">Price</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-black text-lg">{price}k</span>
                  <span className="text-cyan-400 font-bold text-xs">AGP</span>
                </div>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={() => onBuy(card)}
              disabled={justAdded}
              className={`w-full py-4 font-bold text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${
                justAdded
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/5'
              }`}
            >
              {justAdded ? (
                <><Check className="w-4 h-4" /> Added to Cart</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Purchase - {price}k AGP</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}