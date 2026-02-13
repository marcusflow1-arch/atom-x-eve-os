import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Star, Zap, Gamepad2, BookOpen, ShoppingCart, Check, Users, Trophy, Sparkles } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';

const rarityStyles = {
  Common: { border: 'border-slate-400/40', glow: '', text: 'text-slate-300', bg: 'bg-slate-500/20' },
  Rare: { border: 'border-blue-400/40', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', text: 'text-blue-300', bg: 'bg-blue-500/20' },
  Epic: { border: 'border-purple-400/40', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', text: 'text-purple-300', bg: 'bg-purple-500/20' },
  Legendary: { border: 'border-amber-400/40', glow: 'shadow-[0_0_25px_rgba(251,191,36,0.3)]', text: 'text-amber-300', bg: 'bg-amber-500/20' },
};

function DevGameTile({ game, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(game)}
      className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${
        isSelected ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/5 hover:border-white/20'
      }`}
    >
      <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[8px] text-white/60 border border-white/10">
        {game.cards.length} Cards
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white font-bold text-[11px] leading-tight truncate">{game.title}</p>
        <p className="text-white/40 text-[9px]">{game.genre}</p>
      </div>
    </motion.div>
  );
}

function SpotlightCard({ card, isSelected, onClick }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const style = rarityStyles[card.rarity] || rarityStyles.Common;

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - rect.top) / rect.height - 0.5) * 15,
      y: ((e.clientX - rect.left) / rect.width - 0.5) * -15
    });
  };

  return (
    <motion.div
      ref={ref}
      onClick={() => onClick(card)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: isSelected ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-32 h-44 relative cursor-pointer flex-shrink-0"
      style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
    >
      <div
        className={`absolute inset-0 rounded-xl border-2 ${style.border} ${isSelected || hovered ? style.glow : ''} overflow-hidden transition-shadow duration-300`}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 55, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(${105 + tilt.y * 2}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)` }}
        />
        <div className="relative h-full flex flex-col p-2.5">
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${style.text}`}>{card.rarity}</span>
            <span className="text-[7px] text-white/30">{card.type}</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-4xl drop-shadow-lg">{card.icon}</span>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-[10px] truncate">{card.name}</p>
            <p className="text-white/40 text-[8px]">{card.tag}</p>
          </div>
        </div>
        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${style.border} rounded-tl-lg`} />
        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${style.border} rounded-tr-lg`} />
        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${style.border} rounded-bl-lg`} />
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${style.border} rounded-br-lg`} />
      </div>
    </motion.div>
  );
}

function CardDetailPanel({ card, onClose }) {
  if (!card) return null;
  const style = rarityStyles[card.rarity] || rarityStyles.Common;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-[380px] z-[60] flex flex-col border-l border-white/10"
      style={{
        background: 'rgba(10, 15, 25, 0.92)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
      }}
    >
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <h3 className="text-white font-bold text-lg">Card Details</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><X className="w-4 h-4 text-white/60" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'none' }}>
        <div className="flex justify-center"><SpotlightCard card={card} isSelected={true} onClick={() => {}} /></div>

        <div className="text-center">
          <h2 className={`text-2xl font-black ${style.text}`}>{card.name}</h2>
          <div className="flex justify-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>{card.rarity}</span>
            <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/10 text-white/80">{card.type}</span>
          </div>
        </div>

        <p className="text-white/70 text-sm leading-relaxed">{card.description}</p>

        {card.stats && (
          <div>
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Stats</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(card.stats).map(([k, v]) => (
                <div key={k} className="p-2 rounded-lg text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className={`font-bold text-sm ${style.text}`}>{v}</p>
                  <p className="text-white/30 text-[9px] uppercase">{k}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4" />
            {card.price || 'Purchase'}
          </button>
          <button className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl border border-white/10 transition-colors">
            <Star className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DevSpotlightOverlay({ onClose }) {
  const [selectedDev, setSelectedDev] = useState(DEV_SPOTLIGHT_DATA[0]);
  const [selectedGame, setSelectedGame] = useState(DEV_SPOTLIGHT_DATA[0]?.games[0]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (selectedCard) setSelectedCard(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCard, onClose]);

  const handleDevSelect = (dev) => {
    setSelectedDev(dev);
    setSelectedGame(dev.games[0]);
    setSelectedCard(null);
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setSelectedCard(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex flex-col"
      style={{
        background: 'rgba(8, 12, 20, 0.88)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.5))' }} />
          <h1 className="text-white text-2xl font-black tracking-wide">Developer Spotlight</h1>
          <span className="text-white/20 text-xs font-mono ml-2">Press P or ESC to close</span>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Developer Tabs */}
      <div className="px-8 flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        {DEV_SPOTLIGHT_DATA.map(dev => (
          <button
            key={dev.id}
            onClick={() => handleDevSelect(dev)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all border ${
              selectedDev?.id === dev.id
                ? 'bg-white/10 border-cyan-400/40 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-white/[0.03] border-white/5 text-white/50 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <img src={dev.logo} alt={dev.name} className="w-7 h-7 rounded-full border border-white/20" />
            <span className="text-sm font-semibold">{dev.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex px-8 pb-8 gap-6 min-h-0">
        {/* Left Panel - Games */}
        <div className="w-[180px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Games</h3>
          {selectedDev?.games.map(game => (
            <DevGameTile
              key={game.id}
              game={game}
              isSelected={selectedGame?.id === game.id}
              onClick={handleGameSelect}
            />
          ))}
        </div>

        {/* Center Panel - Cards Grid */}
        <div className="flex-1 flex flex-col min-w-0 rounded-2xl p-6 border border-white/8"
             style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          {selectedGame && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-bold text-xl">{selectedGame.title}</h2>
                  <p className="text-white/40 text-xs">{selectedGame.genre} • {selectedGame.cards.length} Cards Released</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Users className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/50 text-[10px]">{selectedDev?.name}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex flex-wrap gap-5">
                  {selectedGame.cards.map(card => (
                    <SpotlightCard
                      key={card.id}
                      card={card}
                      isSelected={selectedCard?.id === card.id}
                      onClick={setSelectedCard}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Detail Panel */}
      <AnimatePresence>
        {selectedCard && <CardDetailPanel card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}