import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, X, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  tradeStore, closeTrade, addItemToTrade, removeItemFromTrade,
  setMyTradeConfirmed, setTheirTradeConfirmed,
} from './socialStores';
import { INVENTORY } from '../equipment/inventoryData';

// Flatten the INVENTORY object into a list with category metadata
const flattenInventory = () => {
  const out = [];
  Object.entries(INVENTORY).forEach(([cat, items]) => {
    items.forEach((it) => out.push({ ...it, _category: cat }));
  });
  return out;
};

/**
 * TradePanel — full-screen overlay shown when a trade session is open.
 * Layout: left = your offer + inventory grid, right = partner's offer.
 * Both sides confirm → items transfer (in this single-client demo we just
 * remove the items from your inventory, simulating the swap).
 */
export default function TradePanel() {
  const [trade, setTrade] = useState(tradeStore.get());
  const [inv, setInv] = useState(flattenInventory());
  useEffect(() => tradeStore.subscribe(setTrade), []);

  // Refresh inventory snapshot whenever the panel opens
  useEffect(() => { if (trade.open) setInv(flattenInventory()); }, [trade.open]);

  const bothConfirmed = trade.myConfirmed && trade.theirConfirmed;

  // When both confirmed, finalize the trade: remove offered items from inventory.
  // (Hook must run unconditionally — declared before any early return.)
  useEffect(() => {
    if (!trade.open || !trade.partner || !bothConfirmed) return;
    trade.myOffer.forEach((itemId) => {
      Object.keys(INVENTORY).forEach((cat) => {
        INVENTORY[cat] = INVENTORY[cat].filter((it) => it.id !== itemId);
      });
    });
    toast.success(`Trade complete with ${trade.partner.name}!`);
    setTimeout(() => { closeTrade(); setInv(flattenInventory()); }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothConfirmed, trade.open]);

  if (!trade.open || !trade.partner) return null;

  const offeredItems = trade.myOffer.map((id) => inv.find((it) => it.id === id)).filter(Boolean);
  const availableItems = inv.filter((it) => !trade.myOffer.includes(it.id) && !it.locked);

  const handleConfirm = () => {
    if (trade.myConfirmed) {
      setMyTradeConfirmed(false);
      return;
    }
    setMyTradeConfirmed(true);
    setTimeout(() => setTheirTradeConfirmed(true), 600);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={closeTrade}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl h-[600px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(12, 16, 24, 0.96)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(251, 191, 36, 0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-amber-500/10">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-300" />
              <div className="text-sm font-bold text-white tracking-wider">
                TRADING WITH <span className="text-amber-300">{trade.partner.name.toUpperCase()}</span>
              </div>
            </div>
            <button onClick={closeTrade} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — two offer columns + inventory below */}
          <div className="flex-1 grid grid-cols-2 gap-4 p-5 overflow-hidden">
            {/* My offer */}
            <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
              <div className="px-4 py-2 border-b border-emerald-500/20 flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-300 tracking-wider">YOUR OFFER</div>
                {trade.myConfirmed && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                    <Check className="w-3 h-3" /> READY
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
                {offeredItems.length === 0 ? (
                  <div className="col-span-3 text-center text-white/30 text-xs py-8">
                    Click items below to add
                  </div>
                ) : offeredItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => removeItemFromTrade(it.id)}
                    disabled={trade.myConfirmed}
                    className="aspect-square rounded-lg bg-black/40 border border-emerald-400/30 hover:border-red-400/50 hover:bg-red-500/10 transition-all p-2 flex flex-col items-center justify-center text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-xl mb-1">⚔️</div>
                    <div className="text-[9px] text-white/80 font-medium leading-tight truncate w-full">{it.name}</div>
                    <div className="text-[8px] text-emerald-300/60 group-hover:text-red-300 mt-0.5">remove</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Their offer */}
            <div className="flex flex-col rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
              <div className="px-4 py-2 border-b border-blue-500/20 flex items-center justify-between">
                <div className="text-xs font-bold text-blue-300 tracking-wider">{trade.partner.name.toUpperCase()}'S OFFER</div>
                {trade.theirConfirmed && (
                  <div className="flex items-center gap-1 text-[10px] text-blue-300 font-bold">
                    <Check className="w-3 h-3" /> READY
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex items-center justify-center">
                <div className="text-white/30 text-xs italic">Waiting for offer...</div>
              </div>
            </div>
          </div>

          {/* Inventory picker */}
          <div className="border-t border-white/10 px-5 py-3 bg-black/30">
            <div className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mb-2">Your Inventory</div>
            <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto">
              {availableItems.length === 0 ? (
                <div className="col-span-10 text-center text-white/30 text-xs py-4">No tradeable items</div>
              ) : availableItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => addItemToTrade(it.id)}
                  disabled={trade.myConfirmed}
                  className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-amber-500/10 transition-all p-1.5 flex flex-col items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed"
                  title={it.name}
                >
                  <Plus className="w-3 h-3 text-white/40 group-hover:text-amber-300 mb-0.5" />
                  <div className="text-[8px] text-white/70 leading-tight truncate w-full text-center">{it.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer — confirm + cancel */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/40">
            <button
              onClick={closeTrade}
              className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold tracking-wider uppercase transition-all"
            >
              Cancel
            </button>
            <div className="text-[10px] text-white/40">
              {bothConfirmed ? 'Finalizing trade...' :
                trade.myConfirmed ? `Waiting for ${trade.partner.name}` :
                'Add items, then confirm'}
            </div>
            <button
              onClick={handleConfirm}
              disabled={offeredItems.length === 0}
              className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                trade.myConfirmed
                  ? 'bg-emerald-500/30 border border-emerald-400/60 text-emerald-200'
                  : 'bg-amber-500/30 border border-amber-400/60 text-amber-200 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {trade.myConfirmed ? '✓ Confirmed' : 'Confirm Trade'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}