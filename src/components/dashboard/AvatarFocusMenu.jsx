import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Swords, Crown, Layers, Radio } from 'lucide-react';

const ITEMS = [
  { id: 'AI Story', label: 'AI Story', icon: Sparkles, color: 'text-cyan-400' },
  { id: 'AI Battle', label: 'AI Battle', icon: Swords, color: 'text-red-400' },
  { id: 'Leaderboard', label: 'Leaderboard', icon: Crown, color: 'text-yellow-400' },
  { id: 'Stats', label: 'Stats', icon: Layers, color: 'text-purple-400' },
  { id: 'Live', label: 'Live', icon: Radio, color: 'text-green-400' },
];

export default function AvatarFocusMenu({ activeView, onSelect }) {
  return (
    <div className="flex flex-col gap-2 w-full px-3">
      {ITEMS.map((item, i) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all uppercase tracking-widest text-[11px] font-bold ${
              isActive
                ? 'bg-white/15 border-white/30 text-white shadow-[0_0_18px_rgba(255,255,255,0.12)]'
                : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
            {item.label}
          </motion.button>
        );
      })}
    </div>
  );
}