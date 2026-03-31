import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeftRight, DollarSign, Package, CheckCircle2, Clock,
  AlertTriangle, Plus, Minus, ChevronRight, Gamepad2, Swords,
  Shield, Zap, Star, Crown, Flame, Users
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const GAMES_WITH_CARDS = [
  {
    id: 'cp2088', name: 'Cyberpunk 2088',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&q=80',
    cards: [
      { id: 'c1', name: 'Neural Shock',     rarity: 'Legendary', category: 'Ability',    icon: Zap },
      { id: 'c2', name: 'Phoenix Partner',  rarity: 'Epic',      category: 'Companion',  icon: Flame },
      { id: 'c3', name: 'Cyber Blade',      rarity: 'Rare',      category: 'Equipment',  icon: Swords },
      { id: 'c4', name: 'Holo-Shield',      rarity: 'Uncommon',  category: 'Equipment',  icon: Shield },
      { id: 'c5', name: 'Night Vision',     rarity: 'Common',    category: 'Ability',    icon: Star },
    ]
  },
  {
    id: 'elden', name: 'Elden Ring',
    cover: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=80&q=80',
    cards: [
      { id: 'e1', name: 'Shadow Blade',     rarity: 'Legendary', category: 'Equipment',  icon: Swords },
      { id: 'e2', name: 'Void Walker Set',  rarity: 'Epic',      category: 'Equipment',  icon: Shield },
      { id: 'e3', name: 'Arcane Tome',      rarity: 'Rare',      category: 'Ability',    icon: Zap },
      { id: 'e4', name: 'Iron Gauntlet',    rarity: 'Uncommon',  category: 'Equipment',  icon: Shield },
    ]
  },
  {
    id: 'valorant', name: 'Valorant',
    cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=80&q=80',
    cards: [
      { id: 'v1', name: 'First Blood',      rarity: 'Rare',      category: 'Achievement', icon: Crown },
      { id: 'v2', name: 'Radiant Crown',    rarity: 'Legendary', category: 'Achievement', icon: Crown },
      { id: 'v3', name: 'Ace Protocol',     rarity: 'Epic',      category: 'Ability',     icon: Zap },
    ]
  },
  {
    id: 'darksouls', name: 'Dark Souls',
    cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=80&q=80',
    cards: [
      { id: 'd1', name: 'Iron Shield',      rarity: 'Uncommon',  category: 'Equipment',  icon: Shield },
      { id: 'd2', name: 'Basic Sword',      rarity: 'Common',    category: 'Equipment',  icon: Swords },
      { id: 'd3', name: 'Soul Vessel',      rarity: 'Epic',      category: 'Ability',    icon: Star },
    ]
  },
];

// Friend's mock offer
const FRIEND_OFFER_CARDS = [
  { id: 'f1', name: 'Radiant Crown',   rarity: 'Legendary', category: 'Achievement', game: 'Valorant', icon: Crown },
  { id: 'f2', name: 'Soul Vessel',     rarity: 'Epic',      category: 'Ability',     game: 'Dark Souls', icon: Star },
  { id: 'f3', name: 'Arcane Tome',     rarity: 'Rare',      category: 'Ability',     game: 'Elden Ring', icon: Zap },
];
const FRIEND_CURRENCY = 2500;

// ─── Rarity styles ────────────────────────────────────────────────────────────
const RARITY = {
  Legendary: { border: 'rgba(250,180,40,0.55)', bg: 'rgba(250,180,40,0.08)', text: '#ffb828', glow: '0 0 14px rgba(250,180,40,0.35)' },
  Epic:      { border: 'rgba(160,80,255,0.5)',  bg: 'rgba(160,80,255,0.08)', text: '#c060ff', glow: '0 0 14px rgba(160,80,255,0.3)' },
  Rare:      { border: 'rgba(80,140,255,0.5)',  bg: 'rgba(80,140,255,0.08)', text: '#6090ff', glow: '0 0 14px rgba(80,140,255,0.25)' },
  Uncommon:  { border: 'rgba(80,200,120,0.45)', bg: 'rgba(80,200,120,0.07)', text: '#50c878', glow: 'none' },
  Common:    { border: 'rgba(255,255,255,0.12)',bg: 'rgba(255,255,255,0.04)', text: 'rgba(255,255,255,0.5)', glow: 'none' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function CardChip({ card, onDoubleClick, dimmed }) {
  const r = RARITY[card.rarity] || RARITY.Common;
  const Icon = card.icon || Package;
  return (
    <div
      onDoubleClick={onDoubleClick}
      title={`Double-click to ${dimmed ? 'add' : 'remove'}`}
      className="relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl cursor-pointer select-none transition-all duration-200 hover:scale-[1.04]"
      style={{
        background: dimmed ? 'rgba(255,255,255,0.03)' : r.bg,
        border: `1px solid ${dimmed ? 'rgba(255,255,255,0.08)' : r.border}`,
        boxShadow: dimmed ? 'none' : r.glow,
        opacity: dimmed ? 0.45 : 1,
        backdropFilter: 'blur(12px)',
        minHeight: '64px',
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: dimmed ? 'rgba(255,255,255,0.2)' : r.text }} />
      <p className="text-[9px] font-bold text-center leading-tight line-clamp-2 px-0.5" style={{ color: dimmed ? 'rgba(255,255,255,0.25)' : r.text }}>{card.name}</p>
      <span className="text-[7px] uppercase tracking-widest" style={{ color: dimmed ? 'rgba(255,255,255,0.15)' : `${r.text}99` }}>{card.rarity}</span>
    </div>
  );
}

function TradeSlot({ card, onDrop, onDragOver, onDragLeave, isOver, onDoubleClick }) {
  const r = card ? (RARITY[card.rarity] || RARITY.Common) : null;
  const Icon = card?.icon || Package;
  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDoubleClick={card ? onDoubleClick : undefined}
      title={card ? 'Double-click to remove' : 'Drag or double-click a card'}
      className="relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200"
      style={{
        minHeight: '68px',
        border: isOver
          ? '2px solid rgba(34,211,238,0.7)'
          : card
            ? `1px solid ${r.border}`
            : '1.5px dashed rgba(255,255,255,0.10)',
        background: isOver
          ? 'rgba(34,211,238,0.07)'
          : card ? r.bg : 'rgba(255,255,255,0.025)',
        boxShadow: card ? r.glow : 'none',
        backdropFilter: 'blur(12px)',
        cursor: card ? 'pointer' : 'default',
        transform: isOver ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      {card ? (
        <>
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: r.text }} />
          <p className="text-[9px] font-bold text-center leading-tight line-clamp-2 px-0.5" style={{ color: r.text }}>{card.name}</p>
          <span className="text-[7px] uppercase tracking-widest" style={{ color: `${r.text}99` }}>{card.rarity}</span>
          <button
            onClick={e => { e.stopPropagation(); onDoubleClick(); }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </>
      ) : (
        <Plus className="w-4 h-4 text-white/15" />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FriendTradePanel({ friend, onClose }) {
  const SLOT_COUNT = 8;
  const [mySlots, setMySlots] = useState(Array(SLOT_COUNT).fill(null));
  const [myCash, setMyCash] = useState('');
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [tradeStatus, setTradeStatus] = useState('idle');
  const [selectedGame, setSelectedGame] = useState(null);
  const dragCard = useRef(null);

  // All cards currently in slots
  const slottedIds = new Set(mySlots.filter(Boolean).map(c => c.id));

  const inventoryCards = selectedGame
    ? (GAMES_WITH_CARDS.find(g => g.id === selectedGame)?.cards || [])
    : [];

  // Add card to first empty slot
  const addToSlot = (card) => {
    if (slottedIds.has(card.id)) return;
    const idx = mySlots.findIndex(s => s === null);
    if (idx === -1) return;
    const updated = [...mySlots];
    updated[idx] = card;
    setMySlots(updated);
  };

  const removeFromSlot = (idx) => {
    const updated = [...mySlots];
    updated[idx] = null;
    setMySlots(updated);
  };

  const handleDragStart = (card) => { dragCard.current = card; };

  const handleDropOnSlot = (slotIdx) => {
    if (!dragCard.current) return;
    if (slottedIds.has(dragCard.current.id) && mySlots[slotIdx]?.id !== dragCard.current.id) {
      dragCard.current = null; setDragOverSlot(null); return;
    }
    const updated = [...mySlots];
    updated[slotIdx] = dragCard.current;
    setMySlots(updated);
    dragCard.current = null;
    setDragOverSlot(null);
  };

  const hasOffer = mySlots.some(Boolean) || (myCash && parseFloat(myCash) > 0);

  const handleConfirmTrade = () => {
    if (tradeStatus === 'idle') setTradeStatus('my_confirmed');
    else if (tradeStatus === 'my_confirmed') {
      setTradeStatus('waiting_other');
      setTimeout(() => setTradeStatus('completed'), 2500);
    }
  };

  const handleReset = () => {
    setMySlots(Array(SLOT_COUNT).fill(null));
    setMyCash('');
    setTradeStatus('idle');
  };

  // Glass panel styles
  const glassPanel = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(30px) saturate(160%)',
    WebkitBackdropFilter: 'blur(30px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/50"
        style={{ backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed z-[71] flex flex-col overflow-hidden"
        style={{
          left: '320px', top: '64px', bottom: '52px', right: 0,
          background: 'rgba(6, 8, 16, 0.91)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Trade Complete Overlay */}
        <AnimatePresence>
          {tradeStatus === 'completed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <CheckCircle2 className="w-20 h-20 text-emerald-400" />
              </motion.div>
              <h2 className="text-3xl font-black text-white tracking-wide">Trade Complete!</h2>
              <p className="text-white/50 text-sm">Both parties confirmed successfully.</p>
              <button onClick={handleReset}
                className="mt-2 px-8 py-3 rounded-2xl font-bold text-sm text-emerald-300 transition-colors"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
                New Trade
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Secure Trade</span>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={friend.avatar} alt={friend.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" />
              <span className="text-xs font-bold text-white">{friend.name}</span>
              <span className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT: Game + Inventory Browser ─────────────────────────── */}
          <div className="w-[230px] flex-shrink-0 flex flex-col overflow-hidden"
            style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Game List */}
            <div className="flex-shrink-0 px-3 pt-3 pb-2">
              <p className="text-[8px] font-black uppercase tracking-widest mb-2 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Your Games</p>
              <div className="space-y-1">
                {GAMES_WITH_CARDS.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left"
                    style={{
                      background: selectedGame === game.id ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                      border: selectedGame === game.id ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={game.cover} alt={game.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold truncate flex-1" style={{ color: selectedGame === game.id ? 'rgba(34,211,238,0.9)' : 'rgba(255,255,255,0.6)' }}>{game.name}</span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0 transition-transform" style={{
                      color: 'rgba(255,255,255,0.2)',
                      transform: selectedGame === game.id ? 'rotate(90deg)' : 'rotate(0deg)'
                    }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Card List for selected game */}
            <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                {selectedGame && (
                  <motion.div key={selectedGame}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest mb-2 mt-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Cards — double-click or drag
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {inventoryCards.map(card => (
                        <div
                          key={card.id}
                          draggable={!slottedIds.has(card.id)}
                          onDragStart={() => !slottedIds.has(card.id) && handleDragStart(card)}
                        >
                          <CardChip
                            card={card}
                            dimmed={slottedIds.has(card.id)}
                            onDoubleClick={() => {
                              if (slottedIds.has(card.id)) {
                                const idx = mySlots.findIndex(s => s?.id === card.id);
                                if (idx !== -1) removeFromSlot(idx);
                              } else {
                                addToSlot(card);
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {!selectedGame && (
                  <motion.div key="no-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <Gamepad2 className="w-8 h-8 text-white/10" />
                    <p className="text-xs text-white/20 leading-relaxed">Select a game above<br/>to browse your cards</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT: Trade Workspace ──────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">

            {/* THEIR OFFER — 30% */}
            <div className="flex flex-col overflow-hidden" style={{ flex: '0 0 30%', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-2">
                <img src={friend.avatar} alt={friend.name} className="w-4 h-4 rounded-full object-cover" />
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(100,160,255,0.7)' }}>{friend.name}'s Offer</p>
                <span className="ml-auto text-[8px] font-bold text-white/30 flex items-center gap-1">
                  <DollarSign className="w-2.5 h-2.5" />{FRIEND_CURRENCY.toLocaleString()} AGP
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-8 gap-1.5">
                  {Array(SLOT_COUNT).fill(null).map((_, idx) => {
                    const card = FRIEND_OFFER_CARDS[idx] || null;
                    const r = card ? (RARITY[card.rarity] || RARITY.Common) : null;
                    const Icon = card?.icon || Package;
                    return (
                      <div key={idx}
                        className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl"
                        style={{
                          minHeight: '64px',
                          background: card ? r.bg : 'rgba(255,255,255,0.02)',
                          border: card ? `1px solid ${r.border}` : '1.5px dashed rgba(255,255,255,0.06)',
                          boxShadow: card ? r.glow : 'none',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        {card ? (
                          <>
                            <Icon className="w-3.5 h-3.5" style={{ color: r.text }} />
                            <p className="text-[8px] font-bold text-center leading-tight" style={{ color: r.text }}>{card.name}</p>
                            <span className="text-[6px] uppercase tracking-widest" style={{ color: `${r.text}88` }}>{card.rarity}</span>
                          </>
                        ) : (
                          <span className="text-[7px] text-white/10">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MY OFFER — 70% */}
            <div className="flex flex-col overflow-hidden" style={{ flex: '0 0 70%' }}>
              <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(52,211,153,0.75)' }}>Your Offer</p>
                <span className="text-[8px] text-white/20 ml-1">({mySlots.filter(Boolean).length}/{SLOT_COUNT} cards)</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-8 gap-1.5">
                  {mySlots.map((card, idx) => (
                    <TradeSlot
                      key={idx}
                      card={card}
                      isOver={dragOverSlot === idx}
                      onDrop={() => handleDropOnSlot(idx)}
                      onDragOver={() => setDragOverSlot(idx)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDoubleClick={() => removeFromSlot(idx)}
                    />
                  ))}
                </div>
              </div>

              {/* Currency row */}
              <div className="flex-shrink-0 px-4 pb-3">
                <p className="text-[8px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <DollarSign className="w-3 h-3" /> Add Currency (AGP)
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMyCash(v => String(Math.max(0, (parseFloat(v)||0) - 500)))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Minus className="w-3 h-3" />
                  </button>
                  <input type="number" value={myCash} onChange={e => setMyCash(e.target.value)} placeholder="0 AGP"
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white text-center placeholder-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button onClick={() => setMyCash(v => String((parseFloat(v)||0) + 500))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 pb-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', background: 'rgba(0,0,0,0.15)' }}>
                <AnimatePresence>
                  {tradeStatus !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-xl"
                      style={tradeStatus === 'my_confirmed'
                        ? { background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#fcd34d' }
                        : { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {tradeStatus === 'my_confirmed' && <><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> You confirmed. Click <strong>Confirm Trade</strong> again to lock in.</>}
                      {tradeStatus === 'waiting_other' && <><Clock className="w-3.5 h-3.5 flex-shrink-0" /> Waiting for {friend.name} to confirm...</>}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-3">
                  <button onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmTrade}
                    disabled={!hasOffer || tradeStatus === 'waiting_other'}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={
                      tradeStatus === 'waiting_other'
                        ? { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.4)', cursor: 'not-allowed' }
                        : tradeStatus === 'my_confirmed'
                          ? { background: 'rgba(52,211,153,0.85)', color: '#000', boxShadow: '0 0 20px rgba(52,211,153,0.35)' }
                          : hasOffer
                            ? { background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', color: '#67e8f9' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                    }>
                    {tradeStatus === 'idle' && '→ Propose Trade'}
                    {tradeStatus === 'my_confirmed' && '✓ Confirm Trade'}
                    {tradeStatus === 'waiting_other' && `Waiting for ${friend.name}...`}
                  </button>
                </div>
                <p className="text-center text-[8px] mt-2" style={{ color: 'rgba(255,255,255,0.15)' }}>Both players must confirm twice to prevent scams</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}