import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Trophy, Award, Check } from 'lucide-react';

const RARITY = {
  Common:    { text: 'text-white/60',   chip: 'text-white/60 bg-white/10 border-white/15',     glow: 'rgba(255,255,255,0.18)', grad: 'from-white/15 to-white/5' },
  Rare:      { text: 'text-blue-300',   chip: 'text-blue-300 bg-blue-500/15 border-blue-400/25', glow: 'rgba(59,130,246,0.45)',  grad: 'from-blue-500/25 to-blue-500/5' },
  Epic:      { text: 'text-purple-300', chip: 'text-purple-300 bg-purple-500/15 border-purple-400/25', glow: 'rgba(168,85,247,0.45)', grad: 'from-purple-500/25 to-purple-500/5' },
  Legendary: { text: 'text-amber-300',  chip: 'text-amber-300 bg-amber-500/15 border-amber-400/25', glow: 'rgba(245,158,11,0.5)', grad: 'from-amber-500/30 to-amber-500/5' },
};

const ACHIEVEMENTS = [
  { name: 'First Blood', icon: '⚔️', desc: 'Win your first match.', unlocked: true, rarity: 'Common', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', points: 10, percent: 78 },
  { name: 'Dragon Slayer', icon: '🐉', desc: 'Defeat the final boss in a single attempt without dying.', unlocked: true, rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', points: 100, percent: 3 },
  { name: 'Speed Demon', icon: '⚡', desc: 'Complete a full run in under 5 minutes.', unlocked: true, rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', points: 50, percent: 12 },
  { name: 'Lorekeeper', icon: '📖', desc: 'Read all in-game codex entries.', unlocked: false, rarity: 'Rare', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400', points: 30, percent: 24 },
  { name: 'Untouchable', icon: '🛡️', desc: 'Finish a chapter without taking damage.', unlocked: false, rarity: 'Epic', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', points: 50, percent: 8 },
  { name: 'World Ender', icon: '💀', desc: 'Reach the true ending of the campaign.', unlocked: false, rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', points: 100, percent: 2 },
];

const FILTERS = ['All', 'Unlocked', 'Locked', 'Common', 'Rare', 'Epic', 'Legendary'];

export default function GameLandingAchievements() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalPoints = ACHIEVEMENTS.filter(a => a.unlocked).reduce((s, a) => s + a.points, 0);
  const maxPoints = ACHIEVEMENTS.reduce((s, a) => s + a.points, 0);
  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  const list = useMemo(() => {
    if (filter === 'All') return ACHIEVEMENTS;
    if (filter === 'Unlocked') return ACHIEVEMENTS.filter(a => a.unlocked);
    if (filter === 'Locked') return ACHIEVEMENTS.filter(a => !a.unlocked);
    return ACHIEVEMENTS.filter(a => a.rarity === filter);
  }, [filter]);

  return (
    <div className="px-5 py-4">
      {/* ── HEADER: progress summary ── */}
      <div className="rounded-2xl p-4 mb-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(168,85,247,0.06))', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-black leading-tight">Achievements</p>
            <p className="text-white/40 text-[10px]">{unlockedCount} of {ACHIEVEMENTS.length} unlocked · {pct}% complete</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-amber-300 text-lg font-black leading-none">{totalPoints}</p>
            <p className="text-white/30 text-[9px]">/ {maxPoints} pts</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #a855f7)' }}
          />
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all flex-shrink-0 ${
              filter === f ? 'bg-white/15 border-white/30 text-white' : 'bg-white/[0.04] border-white/10 text-white/45 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── GRID ── */}
      <div className="grid grid-cols-2 gap-3">
        {list.map((ach, i) => {
          const r = RARITY[ach.rarity];
          return (
            <motion.button
              key={ach.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(ach)}
              className="group rounded-2xl overflow-hidden text-left transition-all hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${ach.unlocked ? r.glow : 'rgba(255,255,255,0.07)'}`,
                boxShadow: ach.unlocked ? `0 4px 20px -8px ${r.glow}` : 'none',
              }}
            >
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <img
                  src={ach.image}
                  alt={ach.name}
                  className={`w-full h-full object-cover transition-all duration-500 ${ach.unlocked ? 'group-hover:scale-110' : 'grayscale opacity-25'}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${r.grad}`} style={{ mixBlendMode: 'overlay' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Rarity chip */}
                <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border ${r.chip}`}>
                  {ach.rarity}
                </span>

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  {ach.unlocked ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center border border-green-300/40">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center border border-white/15">
                      <Lock className="w-2.5 h-2.5 text-white/60" />
                    </div>
                  )}
                </div>

                {/* Icon + name */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end gap-2">
                  <span className="text-xl drop-shadow-lg leading-none">{ach.unlocked ? ach.icon : '🔒'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-[11px] font-bold leading-tight truncate">{ach.name}</p>
                    <p className="text-amber-300/90 text-[8px] font-bold flex items-center gap-1">
                      <Trophy className="w-2 h-2" /> {ach.points} pts
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm z-20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[82%] max-w-[300px] rounded-2xl overflow-hidden"
              style={{ background: 'rgba(14,18,28,0.98)', border: `1px solid ${RARITY[selected.rarity].glow}`, boxShadow: `0 0 40px ${RARITY[selected.rarity].glow}` }}
            >
              <div className="relative h-32">
                <img src={selected.image} alt={selected.name} className={`w-full h-full object-cover ${selected.unlocked ? '' : 'grayscale opacity-40'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e121c] via-[#0e121c]/40 to-transparent" />
                <button onClick={() => setSelected(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 flex items-center justify-center border border-white/10">
                  <X className="w-3.5 h-3.5 text-white/70" />
                </button>
                <span className="absolute bottom-2.5 left-3.5 text-3xl drop-shadow-xl">{selected.unlocked ? selected.icon : '🔒'}</span>
                <span className={`absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${RARITY[selected.rarity].chip}`}>
                  {selected.rarity}
                </span>
              </div>
              <div className="p-4">
                <p className="text-white text-base font-black mb-1">{selected.name}</p>
                <p className="text-white/50 text-xs leading-relaxed mb-3">{selected.desc}</p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-amber-300 text-sm font-black flex items-center justify-center gap-1"><Trophy className="w-3 h-3" />{selected.points}</p>
                    <p className="text-white/30 text-[8px] uppercase tracking-wider mt-0.5">Points</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-cyan-300 text-sm font-black flex items-center justify-center gap-1"><Award className="w-3 h-3" />{selected.percent}%</p>
                    <p className="text-white/30 text-[8px] uppercase tracking-wider mt-0.5">Of players</p>
                  </div>
                </div>

                <div className={`w-full py-2 rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1.5 ${
                  selected.unlocked ? 'text-green-300 bg-green-500/10 border border-green-500/20' : 'text-white/40 bg-white/[0.04] border border-white/10'
                }`}>
                  {selected.unlocked ? <><Check className="w-3 h-3" /> Unlocked</> : <><Lock className="w-3 h-3" /> Locked</>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}