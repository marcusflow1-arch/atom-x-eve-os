import React from 'react';
import { motion } from 'framer-motion';
import { Home, Plus, Bell, Globe, Calendar, Mountain, Gamepad2, Trophy, Swords, Sparkles, Radio, Crown } from 'lucide-react';

const FRIENDS = [
  { id: 1, name: 'Shadow', avatar: 'https://i.pravatar.cc/100?u=1', status: 'online' },
  { id: 2, name: 'Vixen', avatar: 'https://i.pravatar.cc/100?u=2', status: 'online' },
  { id: 3, name: 'Ghost', avatar: 'https://i.pravatar.cc/100?u=3', status: 'idle' },
  { id: 4, name: 'Iron', avatar: 'https://i.pravatar.cc/100?u=4', status: 'offline' },
  { id: 5, name: 'Nova', avatar: 'https://i.pravatar.cc/100?u=5', status: 'online' },
];

// 7 decorative glass boxes with different colored outlines (non-functional for now)
const BOXES = [
  { label: 'Quests', icon: Trophy, color: 'rgba(250,204,21,0.5)', glow: 'rgba(250,204,21,0.15)' },
  { label: 'Battle', icon: Swords, color: 'rgba(248,113,113,0.5)', glow: 'rgba(248,113,113,0.15)' },
  { label: 'Story', icon: Sparkles, color: 'rgba(34,211,238,0.5)', glow: 'rgba(34,211,238,0.15)' },
  { label: 'Live', icon: Radio, color: 'rgba(74,222,128,0.5)', glow: 'rgba(74,222,128,0.15)' },
  { label: 'Ranks', icon: Crown, color: 'rgba(168,85,247,0.5)', glow: 'rgba(168,85,247,0.15)' },
  { label: 'Games', icon: Gamepad2, color: 'rgba(96,165,250,0.5)', glow: 'rgba(96,165,250,0.15)' },
  { label: 'World', icon: Globe, color: 'rgba(244,114,182,0.5)', glow: 'rgba(244,114,182,0.15)' },
];

const glassBox = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px) saturate(150%)',
  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
};

export default function AvatarFocusClonePanel() {
  const now = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full flex flex-col gap-4"
    >
      {/* ───── Top row: cloned dashboard header boxes ───── */}
      <div className="flex items-stretch gap-3 flex-wrap">
        {/* Friends — 5 boxes */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10" style={glassBox}>
          {FRIENDS.map((f) => (
            <div key={f.id} className="relative">
              <img src={f.avatar} alt={f.name} className="w-9 h-9 rounded-full object-cover" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0b1018] ${f.status === 'online' ? 'bg-green-500' : f.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
            </div>
          ))}
        </div>

        {/* Home button */}
        <button className="w-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" style={glassBox}>
          <Home className="w-5 h-5 text-white/70" />
        </button>

        {/* Plus button */}
        <button className="w-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" style={glassBox}>
          <Plus className="w-5 h-5 text-white/70" />
        </button>

        {/* Time & Date */}
        <div className="px-4 py-2 rounded-2xl border border-white/10 flex flex-col justify-center" style={glassBox}>
          <span className="text-white font-bold text-lg leading-none font-mono">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-white/50 text-[10px] uppercase tracking-wider mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* System Updates / Notifications */}
        <button className="px-4 rounded-2xl border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors" style={glassBox}>
          <Bell className="w-4 h-4 text-cyan-400" />
          <span className="text-white/70 text-xs font-semibold">System Updates</span>
        </button>

        {/* Environment Hub */}
        <button className="px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors" style={glassBox}>
          <Mountain className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-white/80 text-xs font-bold">Environment Hub</span>
            <span className="text-white/40 text-[9px]">Change your 3D world</span>
          </div>
        </button>
      </div>

      {/* ───── Below: 7 colored glass boxes ───── */}
      <div className="grid grid-cols-4 gap-3">
        {BOXES.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-2"
              style={{ ...glassBox, border: `1px solid ${b.color}`, boxShadow: `inset 0 0 24px ${b.glow}, 0 8px 24px rgba(0,0,0,0.35)` }}
            >
              <Icon className="w-7 h-7 text-white/80" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-wider">{b.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}