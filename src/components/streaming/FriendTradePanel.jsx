import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, DollarSign, Package, CheckCircle2, Clock, AlertTriangle, GripVertical, Plus, Minus } from 'lucide-react';

const RARITY_STYLE = {
  Legendary: 'border-yellow-400/60 bg-yellow-500/10 text-yellow-400',
  Epic: 'border-purple-400/50 bg-purple-500/10 text-purple-400',
  Rare: 'border-blue-400/50 bg-blue-500/10 text-blue-400',
  Uncommon: 'border-green-400/40 bg-green-500/10 text-green-400',
  Common: 'border-white/15 bg-white/5 text-white/50',
};

const MOCK_MY_CARDS = [
  { id: 'c1', name: 'Neural Shock', rarity: 'Legendary', game: 'Cyberpunk 2088', category: 'Ability' },
  { id: 'c2', name: 'Void Walker Set', rarity: 'Epic', game: 'Elden Ring', category: 'Equipment' },
  { id: 'c3', name: 'Shadow Blade', rarity: 'Legendary', game: 'Elden Ring', category: 'Equipment' },
  { id: 'c4', name: 'Phoenix Companion', rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Companion' },
  { id: 'c5', name: 'First Blood', rarity: 'Rare', game: 'Valorant', category: 'Achievement' },
  { id: 'c6', name: 'Arcane Tome', rarity: 'Rare', game: 'Elden Ring', category: 'Ability' },
  { id: 'c7', name: 'Iron Shield', rarity: 'Uncommon', game: 'Dark Souls', category: 'Equipment' },
  { id: 'c8', name: 'Basic Sword', rarity: 'Common', game: 'Dark Souls', category: 'Equipment' },
];

export default function FriendTradePanel({ friend, onClose }) {
  const [mySlots, setMySlots] = useState([null, null, null, null]);
  const [myCash, setMyCash] = useState('');
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [tradeStatus, setTradeStatus] = useState('idle');
  const [searchFilter, setSearchFilter] = useState('');
  const dragCard = useRef(null);

  const filteredCards = MOCK_MY_CARDS.filter(c =>
    !mySlots.some(s => s?.id === c.id) &&
    (c.name.toLowerCase().includes(searchFilter.toLowerCase()) || c.game.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleDragStart = (card) => { dragCard.current = card; };

  const handleDropOnSlot = (slotIdx) => {
    if (!dragCard.current) return;
    const updated = [...mySlots];
    updated[slotIdx] = dragCard.current;
    setMySlots(updated);
    dragCard.current = null;
    setDragOverSlot(null);
  };

  const removeFromSlot = (idx) => {
    const updated = [...mySlots];
    updated[idx] = null;
    setMySlots(updated);
  };

  const hasOffer = mySlots.some(s => s !== null) || (myCash && parseFloat(myCash) > 0);

  const handleConfirmTrade = () => {
    if (tradeStatus === 'idle') setTradeStatus('my_confirmed');
    else if (tradeStatus === 'my_confirmed') {
      setTradeStatus('waiting_other');
      setTimeout(() => setTradeStatus('completed'), 2500);
    }
  };

  const handleReset = () => {
    setMySlots([null, null, null, null]);
    setMyCash('');
    setTradeStatus('idle');
  };

  return (
    <>
    {/* Backdrop — click outside to close */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/40"
    />
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed z-[71] flex flex-col overflow-hidden"
      style={{
        left: '320px',
        top: '64px',
        bottom: '52px',
        right: 0,
        background: 'rgba(8, 10, 18, 0.93)',
        backdropFilter: 'blur(50px) saturate(180%)',
        WebkitBackdropFilter: 'blur(50px) saturate(180%)',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 border-b border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.025)' }}>
        <div className="flex items-center gap-2.5">
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Trade with</span>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            <img src={friend.avatar} alt={friend.name} className="w-4 h-4 rounded-full object-cover" />
            <span className="text-xs font-bold text-white">{friend.name}</span>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Completed State */}
      <AnimatePresence>
        {tradeStatus === 'completed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-md">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Trade Complete!</h2>
            <p className="text-white/50 text-sm">Both parties confirmed the trade successfully.</p>
            <button onClick={handleReset} className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-sm hover:bg-emerald-500/30 transition-colors">
              New Trade
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trade Area */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT: My Card Inventory */}
        <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2">Your Cards</p>
            <input
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search cards..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-white/20"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5" style={{ scrollbarWidth: 'none' }}>
            {filteredCards.map(card => (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(card)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] ${RARITY_STYLE[card.rarity]}`}
              >
                <GripVertical className="w-3 h-3 text-white/20 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{card.name}</p>
                  <p className="text-white/40 text-[9px] truncate">{card.rarity} · {card.category}</p>
                </div>
                <span className="text-[8px] font-bold text-white/30 flex-shrink-0">{card.game.split(' ')[0]}</span>
              </div>
            ))}
            {filteredCards.length === 0 && (
              <p className="text-center text-white/20 text-xs pt-6">All cards in offer or none match</p>
            )}
          </div>
        </div>

        {/* RIGHT: Trade Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* YOUR OFFER */}
            <div className="flex-1 flex flex-col p-4 border-r border-white/[0.06]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/70 mb-3">Your Offer</p>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {mySlots.map((slot, idx) => (
                  <div
                    key={idx}
                    onDragOver={e => { e.preventDefault(); setDragOverSlot(idx); }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={() => handleDropOnSlot(idx)}
                    className={`relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                      dragOverSlot === idx ? 'border-emerald-400/60 bg-emerald-500/10 scale-105' :
                      slot ? `border-solid ${RARITY_STYLE[slot.rarity]} border` : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    {slot ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center relative">
                        <Package className="w-6 h-6 opacity-60" />
                        <span className="text-[9px] font-bold leading-tight">{slot.name}</span>
                        <span className="text-[7px] opacity-50">{slot.rarity}</span>
                        <button onClick={() => removeFromSlot(idx)}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Plus className="w-5 h-5 text-white/15 mx-auto" />
                        <span className="text-[8px] text-white/15 mt-1 block">Drop card</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Add Currency (AGP)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMyCash(v => String(Math.max(0, (parseFloat(v)||0) - 1000)))}
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <input type="number" value={myCash} onChange={e => setMyCash(e.target.value)} placeholder="0"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white text-center placeholder-white/20 outline-none focus:border-emerald-400/40" />
                  <button onClick={() => setMyCash(v => String((parseFloat(v)||0) + 1000))}
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* THEIR OFFER (read-only) */}
            <div className="flex-1 flex flex-col p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400/70 mb-3">{friend.name}'s Offer</p>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {[null, null, null, null].map((_, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                    <span className="text-[8px] text-white/10">Waiting...</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Their Currency</p>
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-center text-xs text-white/30">— AGP</div>
              </div>
            </div>
          </div>

          {/* Footer: Status + Confirm */}
          <div className="flex-shrink-0 border-t border-white/[0.06] p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {tradeStatus !== 'idle' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-lg border ${
                  tradeStatus === 'my_confirmed' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                  'bg-blue-500/10 border-blue-500/20 text-blue-300'
                }`}>
                {tradeStatus === 'my_confirmed' && <><AlertTriangle className="w-3.5 h-3.5" /> You confirmed. Click <strong>Confirm Trade</strong> again to send to {friend.name}.</>}
                {tradeStatus === 'waiting_other' && <><Clock className="w-3.5 h-3.5" /> Waiting for {friend.name} to confirm...</>}
              </motion.div>
            )}
            <div className="flex items-center gap-3">
              <button onClick={handleReset}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmTrade}
                disabled={!hasOffer || tradeStatus === 'waiting_other'}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tradeStatus === 'waiting_other' ? 'bg-blue-500/10 border border-blue-400/20 text-blue-400/50 cursor-not-allowed' :
                  tradeStatus === 'my_confirmed' ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30' :
                  hasOffer ? 'bg-white/10 border border-white/20 text-white hover:bg-white/15' :
                  'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                }`}>
                {tradeStatus === 'idle' && '→ Trade'}
                {tradeStatus === 'my_confirmed' && '✓ Confirm Trade'}
                {tradeStatus === 'waiting_other' && `Waiting for ${friend.name}...`}
              </button>
            </div>
            <p className="text-center text-[9px] text-white/20 mt-2">Both players must confirm twice to prevent scams</p>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}