import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, ShoppingCart, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/CartContext';

const rarityColors = {
  Mythic: { border: 'border-red-500/60', text: 'text-red-300', glow: 'shadow-[0_0_16px_rgba(239,68,68,0.3)]', bg: 'from-red-900/60 to-red-800/20' },
  Legendary: { border: 'border-yellow-500/60', text: 'text-yellow-300', glow: 'shadow-[0_0_16px_rgba(234,179,8,0.3)]', bg: 'from-yellow-900/60 to-amber-800/20' },
  Epic: { border: 'border-purple-500/60', text: 'text-purple-300', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.3)]', bg: 'from-purple-900/60 to-purple-800/20' },
  Rare: { border: 'border-blue-500/60', text: 'text-blue-300', glow: '', bg: 'from-blue-900/60 to-blue-800/20' },
  Common: { border: 'border-white/10', text: 'text-white/60', glow: '', bg: 'from-slate-800/60 to-slate-700/20' },
};

const priceMap = { Mythic: 95, Legendary: 75, Epic: 45, Rare: 25, Common: 10 };

function CardItem({ card, onBuy }) {
  const [justAdded, setJustAdded] = useState(false);
  const rarity = rarityColors[card.rarity] || rarityColors.Common;

  const handleBuy = (e) => {
    e.stopPropagation();
    onBuy(card);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <motion.div whileHover={{ y: -6, scale: 1.04 }} className="flex-shrink-0 w-[140px]">
      <div className="text-center mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${rarity.text}`}>{card.rarity}</span>
        <p className="text-xs font-semibold text-white truncate">{card.name}</p>
      </div>
      <div className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 ${rarity.border} ${rarity.glow} transition-all`}>
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <Badge className={`bg-gradient-to-r ${rarity.bg} ${rarity.text} border-none text-[9px] w-full justify-center`}>
            {card.tag || 'Limited Edition'}
          </Badge>
        </div>
      </div>
      <button
        onClick={handleBuy}
        className={`w-full mt-2 h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
          justAdded
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-white/5 hover:bg-cyan-500 hover:text-black text-white/70 border-white/10 hover:border-cyan-400'
        }`}
      >
        {justAdded ? <><Check className="w-3 h-3" /> Added</> : <><ShoppingCart className="w-3 h-3" /> {priceMap[card.rarity]}k AGP</>}
      </button>
    </motion.div>
  );
}

export default function DevGamesAndCards({ games, developerName }) {
  const [selectedGame, setSelectedGame] = useState(games?.[0]);
  const scrollRef = React.useRef(null);
  const { addItem } = useCart();

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const handleBuy = (card) => {
    addItem?.({
      id: card.id,
      title: card.name,
      price: priceMap[card.rarity] || 25,
      image: card.image,
      type: 'Trading Card',
      developer: developerName
    });
  };

  if (!games || games.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* Games Grid Header */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Games by {developerName}</h3>
          <p className="text-xs text-white/30 mt-0.5">Select a game to see its exclusive developer cards</p>
        </div>
        <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => setSelectedGame(game)}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                selectedGame?.id === game.id
                  ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20'
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              <img src={game.cover} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <p className="text-white font-bold text-[10px] leading-tight truncate">{game.title}</p>
                <p className="text-white/40 text-[9px]">{game.cards.length} cards</p>
              </div>
              {selectedGame?.id === game.id && (
                <motion.div layoutId="devGameSelect" className="absolute inset-0 border-2 border-cyan-400 rounded-xl pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected Game Cards */}
      <AnimatePresence mode="wait">
        {selectedGame && selectedGame.cards.length > 0 && (
          <motion.div
            key={selectedGame.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedGame.title} — Dev Cards</h3>
                <p className="text-xs text-white/30 mt-0.5">{selectedGame.genre} • {selectedGame.year} • {selectedGame.cards.length} cards available</p>
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
            <div className="p-5">
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {selectedGame.cards.map(card => (
                  <CardItem key={card.id} card={card} onBuy={handleBuy} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}