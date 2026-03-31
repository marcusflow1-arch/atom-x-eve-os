import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ArrowLeftRight, CheckCircle2, Clock, Zap, Shield, Trophy, User, Trees, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import InventoryPickerModal from './InventoryPickerModal';

const MAX_SLOTS = 6;

const FRIENDS = [
  { id: 'f1', name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'SS', rating: 4.8 },
  { id: 'f2', name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'CV', rating: 4.5 },
  { id: 'f3', name: 'GhostReaper', status: 'idle', avatar: 'GR', rating: 4.9 },
  { id: 'f4', name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'NS', rating: 4.7 },
  { id: 'f5', name: 'VoidKnight', status: 'online', game: 'Elden Ring', avatar: 'VK', rating: 4.2 },
  { id: 'f6', name: 'NeonPulse', status: 'idle', game: 'Valorant', avatar: 'NP', rating: 4.6 },
];

function ItemSlot({ item, onAdd, onRemove, slotIndex }) {
  if (item) {
    const Icon = item.icon || Trophy;
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative aspect-square rounded-xl border-2 ${item.border || 'border-white/20'} ${item.bg || 'bg-white/5'} flex flex-col items-center justify-center gap-1 p-2 group`}
      >
        <Icon className={`w-6 h-6 ${item.color || 'text-white'}`} />
        <p className="text-white text-[8px] font-bold text-center leading-tight line-clamp-2">{item.name}</p>
        <Badge className={`text-[7px] px-1 py-0 border ${item.border || 'border-white/20'} ${item.bg || 'bg-white/5'} ${item.color || 'text-white'}`}>{item.rarity}</Badge>
        <button
          onClick={() => onRemove(slotIndex)}
          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      </motion.div>
    );
  }

  return (
    <button
      onClick={() => onAdd(slotIndex)}
      className="aspect-square rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05] flex flex-col items-center justify-center gap-1 transition-all group"
    >
      <Plus className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" />
      <span className="text-[8px] text-white/20 group-hover:text-white/40 transition-colors">Add Card</span>
    </button>
  );
}

export default function TradeNegotiationPanel({ initialItem, onClose }) {
  const [step, setStep] = useState('select_friend'); // 'select_friend' | 'negotiate' | 'pending'
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [mySlots, setMySlots] = useState(Array(MAX_SLOTS).fill(null).map((_, i) => i === 0 && initialItem ? initialItem : null));
  const [theirSlots] = useState(Array(MAX_SLOTS).fill(null)); // read-only (other party's offer)
  const [pickerOpenForSlot, setPickerOpenForSlot] = useState(null);
  const [myConfirmed, setMyConfirmed] = useState(false);
  const [myCurrency, setMyCurrency] = useState('');

  const usedIds = mySlots.filter(Boolean).map(i => i.id);

  const handleAddToSlot = (slotIndex) => {
    setPickerOpenForSlot(slotIndex);
  };

  const handlePickItem = (item) => {
    const newSlots = [...mySlots];
    newSlots[pickerOpenForSlot] = item;
    setMySlots(newSlots);
    setPickerOpenForSlot(null);
    setMyConfirmed(false);
  };

  const handleRemoveFromSlot = (slotIndex) => {
    const newSlots = [...mySlots];
    newSlots[slotIndex] = null;
    setMySlots(newSlots);
    setMyConfirmed(false);
  };

  const myItemCount = mySlots.filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-x-0 z-[150] flex flex-col"
      style={{
        top: '64px',
        bottom: '52px',
        background: 'rgba(8, 10, 18, 0.97)',
        backdropFilter: 'blur(50px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-blue-400" />
          <span className="text-base font-bold text-white">
            {step === 'select_friend' ? 'Choose Trade Partner' : step === 'negotiate' ? `Trading with ${selectedFriend?.name}` : 'Awaiting Confirmation'}
          </span>
          {step === 'negotiate' && (
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <div className={`w-2 h-2 rounded-full ${selectedFriend?.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              {selectedFriend?.status}
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step: Select Friend */}
      {step === 'select_friend' && (
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
          <p className="text-white/40 text-xs mb-4">Select a friend to send a trade request to:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {FRIENDS.map(friend => (
              <button
                key={friend.id}
                onClick={() => { setSelectedFriend(friend); setStep('negotiate'); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-blue-400/40 hover:bg-blue-500/5 transition-all group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                    {friend.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#080a12] ${friend.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">{friend.name}</p>
                  <div className="flex items-center justify-center gap-0.5 text-yellow-400 text-[9px] mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" /> {friend.rating}
                  </div>
                  {friend.game && <p className="text-white/30 text-[9px] mt-0.5 truncate max-w-[100px]">{friend.game}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Negotiate */}
      {step === 'negotiate' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* My Side */}
            <div className="flex-1 flex flex-col p-5 border-r border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">ME</div>
                <span className="text-sm font-bold text-white">Your Offer</span>
                <span className="text-xs text-white/30 ml-auto">{myItemCount} / {MAX_SLOTS} items</span>
              </div>

              {/* Item Slots */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {mySlots.map((item, i) => (
                  <ItemSlot key={i} item={item} onAdd={handleAddToSlot} onRemove={handleRemoveFromSlot} slotIndex={i} />
                ))}
              </div>

              {/* Add Currency */}
              <div className="mt-auto">
                <label className="text-[9px] text-white/30 uppercase tracking-wider block mb-1">Add AGP Currency (optional)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={myCurrency}
                    onChange={e => { setMyCurrency(e.target.value); setMyConfirmed(false); }}
                    placeholder="0"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-500/40 pr-12 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/50 text-[10px] font-bold">AGP</span>
                </div>
              </div>
            </div>

            {/* Center Arrow */}
            <div className="flex-shrink-0 flex items-center justify-center px-4">
              <div className="flex flex-col items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-white/20" />
                <span className="text-[9px] text-white/20 uppercase tracking-wider">Trade</span>
              </div>
            </div>

            {/* Their Side */}
            <div className="flex-1 flex flex-col p-5 border-l border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                  {selectedFriend?.avatar}
                </div>
                <span className="text-sm font-bold text-white">{selectedFriend?.name}'s Offer</span>
              </div>

              {/* Their Slots (read-only empty — waiting for them) */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {theirSlots.map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-1"
                  >
                    <Clock className="w-4 h-4 text-white/10" />
                    <span className="text-[8px] text-white/15">Waiting...</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-center">
                  <p className="text-blue-400/60 text-[10px]">Waiting for {selectedFriend?.name} to add their items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Footer */}
          <div className="flex-shrink-0 border-t border-white/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* My confirm status */}
              <div className={`flex items-center gap-1.5 text-xs font-medium ${myConfirmed ? 'text-emerald-400' : 'text-white/30'}`}>
                <CheckCircle2 className={`w-4 h-4 ${myConfirmed ? 'text-emerald-400' : 'text-white/20'}`} />
                You {myConfirmed ? 'confirmed' : 'not confirmed'}
              </div>
              <div className="h-4 w-px bg-white/10" />
              {/* Their confirm status */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/20">
                <Clock className="w-4 h-4 text-white/15" />
                {selectedFriend?.name} awaiting...
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('select_friend')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors"
              >
                Change Partner
              </button>
              <button
                disabled={myItemCount === 0}
                onClick={() => { setMyConfirmed(true); setStep('pending'); }}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  myItemCount > 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Pending */}
      {step === 'pending' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center"
          >
            <ArrowLeftRight className="w-8 h-8 text-blue-400/60" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Trade Request Sent!</h3>
            <p className="text-white/40 text-sm">Waiting for <span className="text-blue-400">{selectedFriend?.name}</span> to confirm the trade.</p>
            <p className="text-white/20 text-xs mt-2">Both parties must confirm before items are exchanged.</p>
          </div>

          {/* Summary */}
          <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Your Offer Summary</p>
            <div className="flex flex-wrap gap-2">
              {mySlots.filter(Boolean).map((item, i) => {
                const Icon = item.icon || Trophy;
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${item.border || 'border-white/10'} ${item.bg || 'bg-white/5'}`}>
                    <Icon className={`w-4 h-4 ${item.color || 'text-white'}`} />
                    <span className="text-white text-xs font-medium">{item.name}</span>
                  </div>
                );
              })}
              {myCurrency && parseInt(myCurrency) > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                  <span className="text-cyan-400 text-xs font-bold">+{parseInt(myCurrency).toLocaleString()} AGP</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setMyConfirmed(false); setStep('negotiate'); }}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-sm transition-colors"
            >
              Edit Trade
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm transition-colors"
            >
              Cancel Trade
            </button>
          </div>
        </div>
      )}

      {/* Inventory Picker Modal */}
      <AnimatePresence>
        {pickerOpenForSlot !== null && (
          <InventoryPickerModal
            onSelect={handlePickItem}
            onClose={() => setPickerOpenForSlot(null)}
            excludeIds={usedIds}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}