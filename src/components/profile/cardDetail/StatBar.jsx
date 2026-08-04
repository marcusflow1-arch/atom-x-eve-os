import React from 'react';
import { motion } from 'framer-motion';

export default function StatBar({ label, value, max = 200, color = 'from-cyan-400 to-blue-500', delta }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-white/45 text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-black text-sm tabular-nums">{Number(value).toLocaleString()}</span>
          {delta ? <span className="text-emerald-400 text-[10px] font-bold">+{delta}</span> : null}
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.07] border border-white/[0.06]">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}