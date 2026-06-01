import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Trophy } from 'lucide-react';

const RARITY_COLOR = {
  Common: 'text-white/50 bg-white/10',
  Rare: 'text-blue-300 bg-blue-500/15',
  Epic: 'text-purple-300 bg-purple-500/15',
  Legendary: 'text-amber-300 bg-amber-500/15',
};

const RARITY_GLOW = {
  Common: 'rgba(255,255,255,0.15)',
  Rare: 'rgba(59,130,246,0.4)',
  Epic: 'rgba(168,85,247,0.4)',
  Legendary: 'rgba(245,158,11,0.45)',
};

const ACHIEVEMENTS = [
  { name: 'First Blood', icon: '⚔️', desc: 'Win your first match', unlocked: true, rarity: 'Common', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300', points: 10 },
  { name: 'Dragon Slayer', icon: '🐉', desc: 'Defeat the final boss in a single attempt without dying.', unlocked: true, rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300', points: 100 },
  { name: 'Speed Demon', icon: '⚡', desc: 'Complete a full run in under 5 minutes.', unlocked: true, rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300', points: 50 },
  { name: 'Lorekeeper', icon: '📖', desc: 'Read all in-game codex entries.', unlocked: false, rarity: 'Rare', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300', points: 30 },
  { name: 'Untouchable', icon: '🛡️', desc: 'Finish a chapter without taking damage.', unlocked: false, rarity: 'Epic', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300', points: 50 },
  { name: 'World Ender', icon: '💀', desc: 'Reach the true ending of the campaign.', unlocked: false, rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300', points: 100 },
];

export default function GameLandingAchievements({ summary }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="px-5 py-4">
      <p className="text-white/35 text-[10px] mb-3">{summary} unlocked</p>

      <div className="grid grid-cols-3 gap-2.5">
        {ACHIEVEMENTS.map((ach, i) => (
          <button
            key={i}
            onClick={() => setSelected(ach)}
            className="group rounded-xl overflow-hidden text-left transition-all hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: ach.unlocked ? `0 0 0 1px ${RARITY_GLOW[ach.rarity]}` : 'none',
            }}
          >
            <div className="relative w-full aspect-square overflow-hidden">
              <img
                src={ach.image}
                alt={ach.name}
                className={`w-full h-full object-cover transition-all ${ach.unlocked ? 'group-hover:scale-105' : 'grayscale opacity-30'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute top-1 right-1 text-base drop-shadow-lg">{ach.unlocked ? ach.icon : <Lock className="w-3.5 h-3.5 text-white/60" />}</div>
              <span className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[7px] font-bold ${RARITY_COLOR[ach.rarity]}`}>
                {ach.rarity}
              </span>
            </div>
            <div className="p-2">
              <p className="text-white text-[10px] font-semibold leading-tight truncate">{ach.name}</p>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[78%] max-w-[280px] rounded-2xl overflow-hidden"
              style={{ background: 'rgba(16,20,30,0.96)', border: `1px solid ${RARITY_GLOW[selected.rarity]}`, boxShadow: `0 0 30px ${RARITY_GLOW[selected.rarity]}` }}
            >
              <div className="relative h-28">
                <img src={selected.image} alt={selected.name} className={`w-full h-full object-cover ${selected.unlocked ? '' : 'grayscale opacity-40'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10141e] to-transparent" />
                <button onClick={() => setSelected(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center">
                  <X className="w-3 h-3 text-white/70" />
                </button>
                <span className="absolute bottom-2 left-3 text-2xl">{selected.unlocked ? selected.icon : '🔒'}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-bold">{selected.name}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${RARITY_COLOR[selected.rarity]}`}>{selected.rarity}</span>
                </div>
                <p className="text-white/50 text-[11px] leading-relaxed">{selected.desc}</p>
                <div className="flex items-center gap-1.5 mt-3 text-amber-300">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">{selected.points} pts</span>
                  <span className="text-white/30 text-[10px] ml-auto">{selected.unlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}