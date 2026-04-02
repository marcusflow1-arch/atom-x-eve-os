import React from 'react';
import { motion } from 'framer-motion';
import { Users, X } from 'lucide-react';

export default function LunarRequestModal({ request, onAccept, onDecline }) {
  const isInvite = request?.request_type === 'invite';
  const title = isInvite ? 'Dashboard Invite' : 'Join Request';
  const body = isInvite
    ? `${request.requester_name} has invited you to join their dashboard page.`
    : `${request.requester_name} is requesting to join your Lunar dashboard page.`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
              <Users className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/45">Approval needed</p>
            </div>
          </div>
          <button onClick={onDecline} className="text-white/35 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-white/70">{body} Would you like to accept?</p>

        <div className="mt-6 flex gap-3">
          <button onClick={onDecline} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10">
            No
          </button>
          <button onClick={onAccept} className="flex-1 rounded-2xl border border-cyan-400/20 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20">
            Yes
          </button>
        </div>
      </div>
    </motion.div>
  );
}