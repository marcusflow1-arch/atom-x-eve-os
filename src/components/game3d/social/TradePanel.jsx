import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { tradeStore, closeTrade } from './socialStores';
import { base44 } from '@/api/base44Client';
import { INVENTORY } from '../equipment/inventoryData';

// Flatten the INVENTORY object into a list
const flattenInventory = () => {
  const out = [];
  Object.entries(INVENTORY).forEach(([cat, items]) => {
    items.forEach((it) => out.push({ ...it, _category: cat }));
  });
  return out;
};

/**
 * TradePanel — real-time two-player trade window.
 * Uses TradeSession entity to sync both players' offers.
 * Left = your offer (editable). Right = partner's offer (read-only).
 */
export default function TradePanel() {
  const [trade, setTrade] = useState(tradeStore.get());
  const [inv] = useState(flattenInventory);
  const [session, setSession] = useState(null); // TradeSession DB row
  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => tradeStore.subscribe(setTrade), []);

  // Get current user id once
  useEffect(() => {
    base44.auth.me().then((u) => { if (u?.id) setMyUserId(u.id); }).catch(() => {});
  }, []);

  // When trade opens, create or fetch the shared TradeSession
  useEffect(() => {
    if (!trade.open || !trade.partner || !myUserId) return;

    let cancelled = false;

    const initSession = async () => {
      try {
        // Look for an existing active session between us and partner
        const existing = await base44.entities.TradeSession.filter({
          status: 'accepted',
        });
        const mine = (existing || []).find(
          (s) =>
            (s.initiator_id === myUserId && s.recipient_id === trade.partner.id) ||
            (s.initiator_id === trade.partner.id && s.recipient_id === myUserId)
        );

        if (mine) {
          if (!cancelled) setSession(mine);
        } else {
          const created = await base44.entities.TradeSession.create({
            initiator_id: myUserId,
            recipient_id: trade.partner.id,
            initiator_offer_card_ids: [],
            recipient_offer_card_ids: [],
            initiator_confirmed: false,
            recipient_confirmed: false,
            status: 'accepted',
          });
          if (!cancelled) setSession(created);
        }
      } catch (e) {
        console.warn('[Trade] session init failed', e);
      }
    };

    initSession();

    return () => { cancelled = true; };
  }, [trade.open, trade.partner?.id, myUserId]);

  // Subscribe to TradeSession changes so both sides update in real-time
  useEffect(() => {
    if (!session?.id) return;

    const unsub = base44.entities.TradeSession.subscribe((event) => {
      if (event.data?.id === session.id) {
        setSession(event.data);
        // Check if both confirmed → finalize
        if (event.data.initiator_confirmed && event.data.recipient_confirmed) {
          toast.success(`Trade complete!`);
          base44.entities.TradeSession.update(session.id, { status: 'completed' }).catch(() => {});
          setTimeout(() => { setSession(null); closeTrade(); }, 900);
        }
      }
    });

    return () => unsub && unsub();
  }, [session?.id]);

  // Cleanup session on close
  const handleClose = useCallback(async () => {
    if (session?.id) {
      await base44.entities.TradeSession.update(session.id, { status: 'cancelled' }).catch(() => {});
      setSession(null);
    }
    closeTrade();
  }, [session?.id]);

  if (!trade.open || !trade.partner) return null;

  const isInitiator = session?.initiator_id === myUserId;
  const myOffer = isInitiator ? (session?.initiator_offer_card_ids || []) : (session?.recipient_offer_card_ids || []);
  const theirOffer = isInitiator ? (session?.recipient_offer_card_ids || []) : (session?.initiator_offer_card_ids || []);
  const myConfirmed = isInitiator ? !!session?.initiator_confirmed : !!session?.recipient_confirmed;
  const theirConfirmed = isInitiator ? !!session?.recipient_confirmed : !!session?.initiator_confirmed;

  const offeredItems = myOffer.map((id) => inv.find((it) => it.id === id)).filter(Boolean);
  const theirOfferedItems = theirOffer.map((id) => inv.find((it) => it.id === id)).filter(Boolean);
  const availableItems = inv.filter((it) => !myOffer.includes(it.id) && !it.locked);

  const toggleItem = async (itemId) => {
    if (!session?.id || myConfirmed) return;
    const current = isInitiator ? (session.initiator_offer_card_ids || []) : (session.recipient_offer_card_ids || []);
    const newOffer = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    const patch = isInitiator
      ? { initiator_offer_card_ids: newOffer, initiator_confirmed: false, recipient_confirmed: false }
      : { recipient_offer_card_ids: newOffer, initiator_confirmed: false, recipient_confirmed: false };
    try {
      const updated = await base44.entities.TradeSession.update(session.id, patch);
      setSession(updated);
    } catch (e) { console.warn('[Trade] offer update failed', e); }
  };

  const handleConfirm = async () => {
    if (!session?.id) return;
    const newVal = !myConfirmed;
    const patch = isInitiator
      ? { initiator_confirmed: newVal }
      : { recipient_confirmed: newVal };
    try {
      const updated = await base44.entities.TradeSession.update(session.id, patch);
      setSession(updated);
    } catch (e) { console.warn('[Trade] confirm failed', e); }
  };

  const bothConfirmed = myConfirmed && theirConfirmed;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col"
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
            <button onClick={handleClose} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Offer columns */}
          <div className="grid grid-cols-2 gap-4 p-5" style={{ minHeight: 220 }}>
            {/* My offer */}
            <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
              <div className="px-4 py-2 border-b border-emerald-500/20 flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-300 tracking-wider">YOUR OFFER</div>
                {myConfirmed && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                    <Check className="w-3 h-3" /> READY
                  </div>
                )}
              </div>
              <div className="p-3 grid grid-cols-4 gap-2 content-start min-h-[100px]">
                {offeredItems.length === 0 ? (
                  <div className="col-span-4 text-center text-white/30 text-xs py-6">
                    Click items below to add
                  </div>
                ) : offeredItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => toggleItem(it.id)}
                    disabled={myConfirmed}
                    className="aspect-square rounded-lg bg-black/40 border border-emerald-400/30 hover:border-red-400/50 hover:bg-red-500/10 transition-all p-2 flex flex-col items-center justify-center text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`${it.name} — click to remove`}
                  >
                    <div className="text-lg mb-0.5">⚔️</div>
                    <div className="text-[8px] text-white/80 leading-tight truncate w-full">{it.name}</div>
                    <div className="text-[7px] text-red-300/60 group-hover:text-red-300 mt-0.5">remove</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Their offer */}
            <div className="flex flex-col rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
              <div className="px-4 py-2 border-b border-blue-500/20 flex items-center justify-between">
                <div className="text-xs font-bold text-blue-300 tracking-wider">
                  {trade.partner.name.toUpperCase()}'S OFFER
                </div>
                {theirConfirmed && (
                  <div className="flex items-center gap-1 text-[10px] text-blue-300 font-bold">
                    <Check className="w-3 h-3" /> READY
                  </div>
                )}
              </div>
              <div className="p-3 grid grid-cols-4 gap-2 content-start min-h-[100px]">
                {theirOfferedItems.length === 0 ? (
                  <div className="col-span-4 text-center text-white/30 text-xs py-6 italic">
                    Waiting for their offer...
                  </div>
                ) : theirOfferedItems.map((it) => (
                  <div
                    key={it.id}
                    className="aspect-square rounded-lg bg-black/40 border border-blue-400/30 p-2 flex flex-col items-center justify-center text-center"
                    title={it.name}
                  >
                    <div className="text-lg mb-0.5">⚔️</div>
                    <div className="text-[8px] text-white/80 leading-tight truncate w-full">{it.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory picker */}
          <div className="border-t border-white/10 px-5 py-3 bg-black/30">
            <div className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mb-2">
              Your Inventory — click to add/remove from offer
            </div>
            <div className="grid grid-cols-10 gap-1.5 max-h-28 overflow-y-auto">
              {availableItems.length === 0 ? (
                <div className="col-span-10 text-center text-white/30 text-xs py-3">No tradeable items</div>
              ) : availableItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => toggleItem(it.id)}
                  disabled={myConfirmed}
                  className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-amber-500/10 transition-all p-1.5 flex flex-col items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed"
                  title={it.name}
                >
                  <div className="text-sm">⚔️</div>
                  <div className="text-[7px] text-white/70 leading-tight truncate w-full text-center">{it.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/40">
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold tracking-wider uppercase transition-all"
            >
              Cancel
            </button>
            <div className="text-[10px] text-white/40">
              {bothConfirmed ? '🎉 Finalizing trade...' :
                myConfirmed ? `Waiting for ${trade.partner.name} to confirm...` :
                'Add items then confirm when ready'}
            </div>
            <button
              onClick={handleConfirm}
              disabled={offeredItems.length === 0 && !myConfirmed}
              className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                myConfirmed
                  ? 'bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/20'
                  : 'bg-amber-500/30 border border-amber-400/60 text-amber-200 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {myConfirmed ? '✓ Confirmed — undo?' : 'Confirm Trade'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}