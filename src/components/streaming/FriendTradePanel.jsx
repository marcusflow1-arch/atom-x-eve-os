import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { finalizeTradeSession } from '@/functions/finalizeTradeSession';
import {
  X, ArrowLeftRight, DollarSign, Package, CheckCircle2, Clock,
  AlertTriangle, Plus, Minus, ChevronRight, Gamepad2, Swords,
  Shield, Zap, Star, Crown, Flame, Users, Search
} from 'lucide-react';

const ICON_BY_TYPE = {
  Equipment: Swords,
  Ability: Zap,
  Companion: Users,
  Achievement: Crown,
};

const getCardIcon = (card) => ICON_BY_TYPE[card.card_type] || ICON_BY_TYPE[card.category] || Package;

// ─── Rarity styles with gradient borders ──────────────────────────────────────
const RARITY = {
  Legendary: { 
    border: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
    borderColors: ['#fbbf24', '#f59e0b', '#d97706'],
    bg: 'rgba(251,191,36,0.08)', 
    text: '#fbbf24', 
    glow: '0 0 16px rgba(251,191,36,0.4)' 
  },
  Epic: { 
    border: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)',
    borderColors: ['#a855f7', '#7c3aed', '#6d28d9'],
    bg: 'rgba(168,85,247,0.08)', 
    text: '#c084fc', 
    glow: '0 0 16px rgba(168,85,247,0.35)' 
  },
  Rare: { 
    border: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    borderColors: ['#3b82f6', '#2563eb', '#1d4ed8'],
    bg: 'rgba(59,130,246,0.08)', 
    text: '#60a5fa', 
    glow: '0 0 16px rgba(59,130,246,0.3)' 
  },
  Uncommon: { 
    border: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    borderColors: ['#10b981', '#059669', '#047857'],
    bg: 'rgba(16,185,129,0.07)', 
    text: '#34d399', 
    glow: '0 0 12px rgba(16,185,129,0.25)' 
  },
  Common: { 
    border: 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)',
    borderColors: ['#6b7280', '#4b5563', '#374151'],
    bg: 'rgba(107,114,128,0.04)', 
    text: '#9ca3af', 
    glow: 'none' 
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Rarity background gradients for Store-style cards
const RARITY_BG = {
  Legendary: 'linear-gradient(135deg, #3a2200 0%, #6b3a00 40%, #d97706 100%)',
  Epic:      'linear-gradient(135deg, #1e0533 0%, #4c1d95 40%, #7c3aed 100%)',
  Rare:      'linear-gradient(135deg, #0a0f3d 0%, #1e3a8a 40%, #2563eb 100%)',
  Uncommon:  'linear-gradient(135deg, #051a0f 0%, #064e3b 40%, #059669 100%)',
  Common:    'linear-gradient(135deg, #0f0f0f 0%, #1f2937 40%, #374151 100%)',
};

function CardChip({ card, onDoubleClick, dimmed }) {
  const r = RARITY[card.rarity] || RARITY.Common;
  const Icon = card.icon || Package;

  return (
    <motion.div
      onDoubleClick={onDoubleClick}
      title={`Double-click to ${dimmed ? 'add' : 'remove'}`}
      whileHover={!dimmed ? { y: -6, scale: 1.03 } : {}}
      whileTap={!dimmed ? { scale: 0.97 } : {}}
      className="group relative cursor-pointer select-none rounded-xl overflow-hidden shadow-lg"
      style={{
        aspectRatio: '3/4',
        opacity: dimmed ? 0.4 : 1,
        background: RARITY_BG[card.rarity] || RARITY_BG.Common,
        border: dimmed ? '1px solid rgba(255,255,255,0.06)' : `1px solid rgba(255,255,255,0.08)`,
        boxShadow: dimmed ? 'none' : r.glow,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Card shimmer overlay */}
      {!dimmed && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)' }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

      {/* Rarity badge top-right */}
      <div
        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest z-10"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: r.text, border: `1px solid ${r.text}44` }}
      >
        {card.rarity}
      </div>

      {/* Icon centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="w-7 h-7 opacity-60 group-hover:opacity-90 transition-opacity" style={{ color: r.text }} />
      </div>

      {/* Bottom info — slides up on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 group-hover:translate-y-0 transition-transform duration-300 z-10">
        <p className="text-white font-bold text-[9px] leading-tight truncate">{card.name}</p>
        <p className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: r.text }}>{card.category}</p>
      </div>
    </motion.div>
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
export default function FriendTradePanel({ friend, onClose, currentUser }) {
  const SLOT_COUNT = 8;
  const [mySlots, setMySlots] = useState(Array(SLOT_COUNT).fill(null));
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [tradeSession, setTradeSession] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryCards, setInventoryCards] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dragCard = useRef(null);

  // Add gleam animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gleam {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      try { document.head.removeChild(style); } catch(e) {}
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id || !friend?.friend_id) return;

    const loadTradeState = async () => {
      const sessions = await base44.entities.TradeSession.list();
      const activeSession = sessions.find((session) => {
        const pairMatch =
          (session.initiator_id === currentUser.id && session.recipient_id === friend.friend_id) ||
          (session.initiator_id === friend.friend_id && session.recipient_id === currentUser.id);
        return pairMatch && ['pending', 'accepted'].includes(session.status);
      });
      setTradeSession(activeSession || null);

      const cards = await base44.entities.UserCard.filter({ user_id: currentUser.id });
      setInventoryCards(cards.filter((card) => card.trade_status !== 'locked_in_trade'));
    };

    loadTradeState();
    const unsubscribe = base44.entities.TradeSession.subscribe((event) => {
      const data = event.data;
      const pairMatch = data && (
        (data.initiator_id === currentUser.id && data.recipient_id === friend.friend_id) ||
        (data.initiator_id === friend.friend_id && data.recipient_id === currentUser.id)
      );
      if (pairMatch) {
        loadTradeState();
      }
    });

    return unsubscribe;
  }, [currentUser?.id, friend?.friend_id]);

  useEffect(() => {
    if (!tradeSession) {
      setMySlots(Array(SLOT_COUNT).fill(null));
      return;
    }

    const mine = tradeSession.initiator_id === currentUser?.id
      ? tradeSession.initiator_offer_snapshot || []
      : tradeSession.recipient_offer_snapshot || [];

    const padded = [...mine];
    while (padded.length < SLOT_COUNT) padded.push(null);
    setMySlots(padded.slice(0, SLOT_COUNT));
  }, [tradeSession, currentUser?.id]);

  const slottedIds = new Set(mySlots.filter(Boolean).map(c => c.id));

  const gameOptions = useMemo(() => Array.from(new Set(inventoryCards.map(card => card.game_name).filter(Boolean))), [inventoryCards]);

  const filteredCards = inventoryCards.filter(card => {
    if (selectedGame && card.game_name !== selectedGame) return false;
    if (selectedCategory && selectedCategory !== 'All' && card.card_type !== selectedCategory) return false;
    if (searchQuery && !card.card_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).map(card => ({
    ...card,
    name: card.card_name,
    rarity: card.card_rarity,
    category: card.card_type,
    icon: getCardIcon(card),
  }));

  const addToSlot = async (card) => {
    if (slottedIds.has(card.id) || !tradeSession || tradeSession.status !== 'accepted') return;
    const idx = mySlots.findIndex(s => s === null);
    if (idx === -1) return;
    const updated = [...mySlots];
    updated[idx] = card;
    setMySlots(updated);
    await syncOffer(updated);
  };

  const removeFromSlot = async (idx) => {
    const card = mySlots[idx];
    const updated = [...mySlots];
    updated[idx] = null;
    setMySlots(updated);
    if (card?.id) {
      await base44.entities.UserCard.update(card.id, { trade_status: 'available' });
    }
    await syncOffer(updated);
  };

  const handleDragStart = (card) => { dragCard.current = card; };

  const handleDropOnSlot = async (slotIdx) => {
    if (!dragCard.current || !tradeSession || tradeSession.status !== 'accepted') return;
    if (slottedIds.has(dragCard.current.id) && mySlots[slotIdx]?.id !== dragCard.current.id) {
      dragCard.current = null; setDragOverSlot(null); return;
    }
    const updated = [...mySlots];
    updated[slotIdx] = dragCard.current;
    setMySlots(updated);
    await syncOffer(updated);
    dragCard.current = null;
    setDragOverSlot(null);
  };

  const hasOffer = mySlots.some(Boolean);
  const isInitiator = tradeSession?.initiator_id === currentUser?.id;
  const friendOfferCards = (tradeSession
    ? (isInitiator ? tradeSession.recipient_offer_snapshot : tradeSession.initiator_offer_snapshot)
    : []) || [];
  const myConfirmed = tradeSession ? (isInitiator ? tradeSession.initiator_confirmed : tradeSession.recipient_confirmed) : false;
  const friendConfirmed = tradeSession ? (isInitiator ? tradeSession.recipient_confirmed : tradeSession.initiator_confirmed) : false;
  const tradeStatus = !tradeSession ? 'idle' : tradeSession.status === 'completed' ? 'completed' : myConfirmed ? (friendConfirmed ? 'ready' : 'waiting_other') : 'idle';

  const syncOffer = async (nextSlots) => {
    if (!tradeSession) return;
    const offerCards = nextSlots.filter(Boolean);
    const payload = isInitiator
      ? {
          initiator_offer_card_ids: offerCards.map(card => card.id),
          initiator_offer_snapshot: offerCards,
          initiator_confirmed: false,
          recipient_confirmed: false,
          status: 'accepted',
        }
      : {
          recipient_offer_card_ids: offerCards.map(card => card.id),
          recipient_offer_snapshot: offerCards,
          initiator_confirmed: false,
          recipient_confirmed: false,
          status: 'accepted',
        };

    await Promise.all(offerCards.map((card) => base44.entities.UserCard.update(card.id, {
      trade_status: 'locked_in_trade',
      last_trade_id: tradeSession.id,
    })));
    await base44.entities.TradeSession.update(tradeSession.id, payload);
  };

  const handleStartTrade = async () => {
    setIsSubmitting(true);
    const session = await base44.entities.TradeSession.create({
      initiator_id: currentUser.id,
      recipient_id: friend.friend_id,
      status: 'pending',
    });
    setTradeSession(session);
    setIsSubmitting(false);
  };

  const handleConfirmTrade = async () => {
    if (!tradeSession) return;
    setIsSubmitting(true);
    const payload = isInitiator ? { initiator_confirmed: true } : { recipient_confirmed: true };
    const updated = await base44.entities.TradeSession.update(tradeSession.id, payload);
    setTradeSession(updated);

    const initiatorDone = (isInitiator ? true : updated.initiator_confirmed);
    const recipientDone = (isInitiator ? updated.recipient_confirmed : true);
    if (initiatorDone && recipientDone) {
      await finalizeTradeSession({ tradeSessionId: tradeSession.id });
    }
    setIsSubmitting(false);
  };

  const handleReset = async () => {
    if (tradeSession?.status === 'completed') {
      setMySlots(Array(SLOT_COUNT).fill(null));
      setTradeSession(null);
      return;
    }

    const reservedCards = mySlots.filter(Boolean);
    await Promise.all(reservedCards.map((card) => base44.entities.UserCard.update(card.id, {
      trade_status: 'available',
    })));

    if (tradeSession) {
      await base44.entities.TradeSession.update(tradeSession.id, { status: 'cancelled' });
    }

    setMySlots(Array(SLOT_COUNT).fill(null));
    setTradeSession(null);
  };

  return (
    <>
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed z-[71] flex flex-col overflow-hidden pointer-events-auto"
        style={{
          left: '320px', top: '64px', bottom: '52px', right: 0,
          background: 'rgba(100, 120, 140, 0.08)',
          backdropFilter: 'blur(30px) saturate(160%)',
          WebkitBackdropFilter: 'blur(30px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
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
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(100,120,140,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Secure Trade</span>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(100,120,140,0.12)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
              <img src={friend.avatar} alt={friend.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" />
              <span className="text-xs font-bold text-white">{friend.name}</span>
              <span className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
            style={{ background: 'rgba(100,120,140,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body - Restructured Layout */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT: Vertical Game List (18%) ───────────────────────────────── */}
          <div style={{ flex: '0 0 18%' }} className="flex flex-col overflow-hidden min-h-0 relative">
            {/* Partial Divider Line */}
            <div className="absolute right-0 top-[20px] bottom-[20px] w-px"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 10%, rgba(255,255,255,0.15) 90%, transparent 100%)',
              }}
            />

            {/* Game List Header */}
            <div className="flex-shrink-0 px-3 pt-3 pb-2">
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Games ({gameOptions.length})
              </p>
            </div>

            {/* Vertical Game List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5" style={{ scrollbarWidth: 'none' }}>
              {gameOptions.map(gameName => (
                <button
                  key={gameName}
                  onClick={() => {
                    setSelectedGame(selectedGame === gameName ? null : gameName);
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="w-full flex items-center gap-2 py-1.5 px-1 transition-all hover:bg-white/5 rounded-lg"
                >
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-[9px] font-bold text-white/80 hover:text-white transition-colors line-clamp-2 leading-tight text-left flex-1">
                    {gameName}
                  </span>
                  {selectedGame === gameName && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.6)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── MIDDLE: Achievement Cards Display (52%) ──────────────────────── */}
          <div style={{ flex: '0 0 52%' }} className="flex flex-col overflow-hidden min-h-0 px-4">
            
            {/* Category Filter + Search */}
            <AnimatePresence mode="wait">
              {selectedGame && (
                <motion.div key="filters"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 py-3"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {selectedGame}
                    </p>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  
                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {['All', 'Equipment', 'Ability', 'Companion', 'Achievement'].map(cat => (
                      <button key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className="px-3 py-1.5 rounded-full text-[7px] font-bold whitespace-nowrap flex-shrink-0 transition-all uppercase tracking-widest hover:scale-105"
                        style={{
                          background: selectedCategory === cat ? 'rgba(34,211,238,0.15)' : 'rgba(100,120,140,0.1)',
                          border: selectedCategory === cat ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(255,255,255,0.12)',
                          color: selectedCategory === cat ? '#67e8f9' : 'rgba(255,255,255,0.65)',
                          backdropFilter: 'blur(20px)',
                          boxShadow: selectedCategory === cat ? '0 0 12px rgba(34,211,238,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative mt-3">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input type="text" placeholder="Search items..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-white/30 outline-none transition-all focus:scale-105"
                      style={{ background: 'rgba(100,120,140,0.12)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Achievement Cards Grid - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                {selectedGame ? (
                  <motion.div key={selectedGame}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {filteredCards.length} Card{filteredCards.length !== 1 ? 's' : ''} Available
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {filteredCards.map(card => (
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
                ) : (
                  <motion.div key="no-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-3 h-full text-center">
                    <Gamepad2 className="w-16 h-16 text-white/10" />
                    <p className="text-sm text-white/20 leading-relaxed">Select a game from the<br/>left to view achievements</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT: Trade Workspace (30%) ──────────────────────────────────── */}
          <div style={{ flex: '0 0 30%' }} className="flex flex-col overflow-hidden min-h-0">

            {/* THEIR OFFER — 50% */}
            <div className="flex flex-col overflow-hidden" style={{ flex: '0 0 50%', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-2">
                <img src={friend.avatar} alt={friend.name} className="w-4 h-4 rounded-full object-cover" />
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(100,160,255,0.7)' }}>{friend.name}'s Offer</p>
                <span className="ml-auto text-[8px] font-bold text-white/30 flex items-center gap-1">
                  {friendConfirmed ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <Clock className="w-2.5 h-2.5" />} {friendConfirmed ? 'Confirmed' : 'Waiting'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-4 gap-1">
                  {Array(4).fill(null).map((_, idx) => {
                    const card = friendOfferCards[idx] || null;
                    const r = card ? (RARITY[card.rarity] || RARITY.Common) : null;
                    const Icon = card?.icon || Package;
                    return (
                      <div key={idx}
                        className="flex flex-col items-center justify-center gap-1 p-1 rounded-lg"
                        style={{
                          minHeight: '60px',
                          background: card ? r.bg : 'rgba(255,255,255,0.02)',
                          border: card ? `1px solid ${r.border}` : '1px dashed rgba(255,255,255,0.06)',
                          boxShadow: card ? r.glow : 'none',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        {card ? (
                          <>
                            <Icon className="w-3 h-3" style={{ color: r.text }} />
                            <p className="text-[7px] font-bold text-center leading-tight" style={{ color: r.text }}>{card.name}</p>
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

            {/* MY OFFER — 50% */}
            <div className="flex flex-col overflow-hidden" style={{ flex: '0 0 50%' }}>
              <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(52,211,153,0.75)' }}>Your Offer</p>
                <span className="text-[8px] text-white/20 ml-1">({mySlots.filter(Boolean).length}/{SLOT_COUNT})</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-4 gap-1">
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
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/55">
                  Cards keep their original game mapping after the trade, so they appear in the correct game library.
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 pb-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', background: 'rgba(100,120,140,0.08)' }}>
                <AnimatePresence>
                  {tradeStatus !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-[7px] mb-3 px-2 py-1.5 rounded-lg"
                      style={tradeStatus === 'my_confirmed'
                        ? { background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#fcd34d' }
                        : { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {tradeStatus === 'ready' && <><AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" /> Ready to finish</>}
                      {tradeStatus === 'waiting_other' && <><Clock className="w-2.5 h-2.5 flex-shrink-0" /> Waiting...</>}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset}
                    className="px-2 py-1.5 rounded-lg text-[7px] font-bold text-white/40 hover:text-white transition-colors flex-1"
                    style={{ background: 'rgba(100,120,140,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Cancel
                  </button>
                  <button onClick={tradeSession ? handleConfirmTrade : handleStartTrade}
                    disabled={isSubmitting || (!tradeSession && !friend?.status) || (tradeSession && (!hasOffer || tradeStatus === 'waiting_other' || myConfirmed))}
                    className="flex-1 py-1.5 rounded-lg text-[7px] font-bold transition-all"
                    style={
                      tradeStatus === 'waiting_other'
                        ? { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.4)', cursor: 'not-allowed' }
                        : myConfirmed
                          ? { background: 'rgba(52,211,153,0.85)', color: '#000', boxShadow: '0 0 20px rgba(52,211,153,0.35)' }
                          : tradeSession
                            ? { background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', color: '#67e8f9' }
                            : { background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', color: '#67e8f9' }
                    }>
                    {!tradeSession && 'Send Trade Request'}
                    {tradeSession && !myConfirmed && 'Confirm Trade'}
                    {tradeSession && myConfirmed && tradeStatus !== 'completed' && 'Confirmed'}
                    {tradeStatus === 'waiting_other' && 'Waiting'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}