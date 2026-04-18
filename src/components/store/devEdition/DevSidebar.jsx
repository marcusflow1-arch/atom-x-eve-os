import React from 'react';
import { motion } from 'framer-motion';
import { Radio, CheckCircle } from 'lucide-react';

export default function DevSidebar({ developers, selectedId, onSelect }) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Developers</h3>
      </div>
      <div className="divide-y divide-white/5">
        {developers.map((dev, idx) => (
          <motion.button
            key={dev.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onSelect(dev)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${
              selectedId === dev.id ? 'bg-white/[0.07]' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <img src={dev.avatar_url} alt={dev.studio_name} className="w-10 h-10 rounded-xl object-cover" />
              {dev.is_live && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-[#080c12] animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-white truncate">{dev.studio_name}</p>
                {dev.verified && <CheckCircle className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-white/40 truncate">{dev.total_games} games • {dev.total_cards} cards</p>
              {dev.is_live && (
                <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold mt-0.5">
                  <Radio className="w-2.5 h-2.5" /> Live
                </span>
              )}
            </div>
            {selectedId === dev.id && (
              <div className="w-1 h-8 bg-cyan-400 rounded-full flex-shrink-0" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}