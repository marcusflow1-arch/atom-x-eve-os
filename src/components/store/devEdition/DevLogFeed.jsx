import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Paintbrush, Zap, ChevronRight } from 'lucide-react';

const typeConfig = {
  update: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'Update' },
  stream: { icon: Radio, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Stream Recap' },
  design: { icon: Paintbrush, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Design Notes' },
};

export default function DevLogFeed({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dev Log</h3>
        <p className="text-xs text-white/30 mt-0.5">Latest updates from the studio</p>
      </div>

      <div className="divide-y divide-white/5">
        {logs.map((entry, idx) => {
          const cfg = typeConfig[entry.type] || typeConfig.update;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer group"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center mt-0.5 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-white/20 text-[10px]">•</span>
                  <span className="text-white/30 text-[10px]">{entry.date}</span>
                </div>
                <p className="text-white font-semibold text-sm mb-1 leading-snug">{entry.title}</p>
                <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{entry.preview}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-3" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}