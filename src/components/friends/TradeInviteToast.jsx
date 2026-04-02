import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, X } from 'lucide-react';

export default function TradeInviteToast({ friendName, onAccept, onDecline }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-[95] w-80 rounded-2xl border border-white/10 bg-slate-950/90 p-4 backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/20">
          <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Trade request</p>
          <p className="text-xs text-white/60 mt-1">{friendName} wants to trade cards with you.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={onDecline} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
              Decline
            </button>
            <button onClick={onAccept} className="flex-1 rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20">
              Accept
            </button>
          </div>
        </div>
        <button onClick={onDecline} className="text-white/40 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}