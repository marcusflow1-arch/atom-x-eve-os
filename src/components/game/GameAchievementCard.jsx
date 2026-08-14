import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';

const rarityGlow = {
  Common: 'rgba(148,163,184,0.30)',
  Uncommon: 'rgba(34,211,238,0.34)',
  Rare: 'rgba(96,165,250,0.38)',
  Epic: 'rgba(167,139,250,0.42)',
  Legendary: 'rgba(251,191,36,0.46)',
  Mythic: 'rgba(244,114,182,0.50)',
};

export default function GameAchievementCard({ achievement, index = 0, compact = true }) {
  const ref = useRef(null);
  const rarity = achievement?.rarity || 'Common';
  const glow = rarityGlow[rarity] || rarityGlow.Common;
  const title = achievement?.title || achievement?.name || 'Achievement';
  const icon = achievement?.icon || '✦';
  const locked = achievement?.locked ?? false;

  const handleMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateY = ((x - 50) / 50) * 7;
    const rotateX = -((y - 50) / 50) * 7;
    node.style.setProperty('--mx', `${x}%`);
    node.style.setProperty('--my', `${y}%`);
    node.style.setProperty('--rx', `${rotateX}deg`);
    node.style.setProperty('--ry', `${rotateY}deg`);
  };

  const reset = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--mx', '50%');
    node.style.setProperty('--my', '50%');
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.22 }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="group relative cursor-pointer select-none"
      style={{ perspective: 900 }}
    >
      <div
        className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-xl transition-transform duration-150 ease-out ${compact ? 'w-[150px] h-[190px]' : 'w-[180px] h-[225px]'}`}
        style={{
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
          boxShadow: `0 12px 30px rgba(0,0,0,0.30), 0 0 24px ${glow}`,
          '--mx': '50%',
          '--my': '50%',
          '--rx': '0deg',
          '--ry': '0deg',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.22), transparent 28%)` }} />
        <div className="absolute inset-x-2 top-2 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-40" />
        <div className="absolute top-0 left-[-45%] w-[35%] h-full rotate-[18deg] bg-white/20 blur-md opacity-0 group-hover:opacity-70 group-hover:translate-x-[340%] transition-all duration-700 pointer-events-none" />

        <div className="relative h-full flex flex-col p-3">
          <div className="flex items-center justify-between gap-2 text-[8px] uppercase tracking-[0.18em] text-white/35 font-black">
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {achievement?.level ? `Lv ${achievement.level}` : 'Achievement'}</span>
            <span>{rarity}</span>
          </div>

          <div className="flex-1 flex items-center justify-center py-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border" style={{ borderColor: `${glow}`, background: `radial-gradient(circle, ${glow}, rgba(255,255,255,0.02))`, boxShadow: `0 0 24px ${glow}` }}>
              {locked ? <Lock className="w-6 h-6 text-white/35" /> : <span>{icon}</span>}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black text-xs leading-tight line-clamp-2">{title}</h4>
            <p className="text-white/35 text-[9px] mt-1 line-clamp-2">{achievement?.description || 'Unlock this achievement through play.'}</p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-[8px] font-bold uppercase tracking-wider">
              <span className="text-cyan-300/80">{achievement?.category || 'Standard'}</span>
              <span className="text-white/35">{locked ? 'Locked' : 'Earnable'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
