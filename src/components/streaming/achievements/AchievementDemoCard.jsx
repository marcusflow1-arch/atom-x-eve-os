import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const rarity = {
  Common: ['rgba(226,232,240,.55)', 'rgba(226,232,240,.16)'],
  Rare: ['rgba(96,165,250,.85)', 'rgba(59,130,246,.3)'],
  Epic: ['rgba(216,180,254,.85)', 'rgba(168,85,247,.32)'],
  Legendary: ['rgba(253,186,116,.9)', 'rgba(245,158,11,.35)'],
};

export default function AchievementDemoCard({ achievement, selected, onSelect }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, shine: 50 });
  const colors = rarity[achievement.rarity] || rarity.Common;
  const move = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - y) * 12, y: (x - 0.5) * 14, shine: x * 100 });
  };
  return <button type="button" onClick={() => onSelect(achievement)} onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0, shine: 50 })} className="relative h-44 w-32 shrink-0 text-left transition-transform duration-150" style={{ transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${selected ? '-5px' : '0'})`, border: `1px solid ${colors[0]}`, boxShadow: `0 0 ${selected ? 28 : 16}px ${colors[1]}` }}>
    <img src={achievement.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950" />
    <div className="absolute inset-y-0 w-7 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-75 blur-[1px] pointer-events-none" style={{ left: `calc(${tilt.shine}% - 14px)` }} />
    <Sparkles className="absolute right-2 top-2 h-3.5 w-3.5" style={{ color: colors[0] }} />
    <div className="absolute inset-x-2 bottom-2"><span className="text-[8px] uppercase tracking-widest" style={{ color: colors[0] }}>{achievement.rarity}</span><div className="mt-1 text-xs font-bold leading-tight text-white">{achievement.name}</div></div>
  </button>;
}