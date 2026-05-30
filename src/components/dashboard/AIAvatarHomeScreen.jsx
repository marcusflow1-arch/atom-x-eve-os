import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Zap, Shield, Sword, Target, Star, Users, BookOpen,
  Heart, Cpu, Package, Bell, Activity, ChevronRight, Bot, Flame,
  Layers, Crown, Radio, Globe, TrendingUp, Clock
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Static mock data for the home screen panels
const ACTIVE_QUESTS = [
  { id: 1, name: 'Defeat the Void Titan', progress: 68, type: 'Combat', color: 'text-red-400' },
  { id: 2, name: 'Craft the Lunar Blade', progress: 45, type: 'Crafting', color: 'text-amber-400' },
  { id: 3, name: 'Explore the Starfell Ruins', progress: 90, type: 'Exploration', color: 'text-cyan-400' },
];

const TROPHIES = [
  { icon: '🏆', name: 'Apex Predator', rarity: 'Legendary', glow: 'rgba(251,191,36,0.5)' },
  { icon: '⚔️', name: 'Blade Master', rarity: 'Epic', glow: 'rgba(168,85,247,0.5)' },
  { icon: '🌌', name: 'Star Voyager', rarity: 'Rare', glow: 'rgba(59,130,246,0.5)' },
  { icon: '🔥', name: 'Inferno Lord', rarity: 'Epic', glow: 'rgba(239,68,68,0.5)' },
  { icon: '🛡️', name: 'Fortress', rarity: 'Rare', glow: 'rgba(34,211,238,0.4)' },
];

const COMPANIONS = [
  { id: 1, name: 'Nexus', type: 'AI Guardian', color: 'from-cyan-500 to-blue-600', icon: '🤖', active: true },
  { id: 2, name: 'Ember', type: 'Fire Drake', color: 'from-orange-500 to-red-600', icon: '🐉', active: false },
  { id: 3, name: 'Luna', type: 'Specter', color: 'from-purple-500 to-violet-600', icon: '👻', active: false },
];

const RECENT_ACTIVITY = [
  { action: 'Unlocked Trophy', detail: 'Apex Predator', time: '2m ago', icon: Trophy, color: 'text-amber-400' },
  { action: 'Level Up!', detail: 'Reached Level 42', time: '15m ago', icon: TrendingUp, color: 'text-green-400' },
  { action: 'Quest Complete', detail: 'Into the Void', time: '1h ago', icon: Target, color: 'text-cyan-400' },
  { action: 'New Card', detail: 'Quantum Shield (Epic)', time: '2h ago', icon: Layers, color: 'text-purple-400' },
];

// Floating holographic data chip
function HoloChip({ label, value, icon: Icon, color = 'cyan', pulse = false }) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', border: 'border-cyan-400/30', bg: 'rgba(34,211,238,0.08)', glow: 'rgba(34,211,238,0.15)' },
    purple: { text: 'text-purple-400', border: 'border-purple-400/30', bg: 'rgba(168,85,247,0.08)', glow: 'rgba(168,85,247,0.15)' },
    amber: { text: 'text-amber-400', border: 'border-amber-400/30', bg: 'rgba(251,191,36,0.08)', glow: 'rgba(251,191,36,0.15)' },
    green: { text: 'text-green-400', border: 'border-green-400/30', bg: 'rgba(34,197,94,0.08)', glow: 'rgba(34,197,94,0.15)' },
    red: { text: 'text-red-400', border: 'border-red-400/30', bg: 'rgba(239,68,68,0.08)', glow: 'rgba(239,68,68,0.15)' },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${c.border} backdrop-blur-md`}
      style={{ background: c.bg, boxShadow: `0 0 12px ${c.glow}` }}
    >
      {Icon && <Icon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`} />}
      <div className="min-w-0">
        <p className="text-white/40 text-[9px] uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={`${c.text} text-xs font-bold leading-none`}>{value}</p>
      </div>
    </div>
  );
}

// Trophy showcase item
function TrophyItem({ trophy, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-1.5 group cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.15, y: -4 }}
        className="relative w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.12), rgba(0,0,0,0.4))`,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: `0 0 16px ${trophy.glow}`,
        }}
      >
        <span className="text-2xl">{trophy.icon}</span>
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `radial-gradient(circle, ${trophy.glow} 0%, transparent 70%)` }}
        />
      </motion.div>
      <p className="text-white/50 text-[8px] text-center truncate w-12 group-hover:text-white/80 transition-colors">{trophy.name}</p>
    </motion.div>
  );
}

// Glass panel wrapper
function GlassPanel({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-md ${className}`}
      style={{
        background: 'rgba(10, 15, 28, 0.75)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style
      }}
    >
      {children}
    </div>
  );
}

// Section label
function SectionLabel({ children, icon: Icon, color = 'text-white/40' }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon className={`w-3 h-3 ${color}`} />}
      <p className={`text-[9px] font-bold uppercase tracking-widest ${color}`}>{children}</p>
    </div>
  );
}

export default function AIAvatarHomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCompanion, setActiveCompanion] = useState(0);
  const [statsPulse, setStatsPulse] = useState(false);

  // Fetch real avatar progression
  const { data: progression } = useQuery({
    queryKey: ['avatar_progression_home', user?.id],
    queryFn: () => user?.id ? base44.entities.AvatarProgression.filter({ user_id: user.id }) : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const prog = progression?.[0];
  const level = prog?.global_level || 42;
  const xp = prog?.global_xp || 8450;
  const xpNeeded = level * 100;
  const xpPct = Math.min(100, Math.round((xp % xpNeeded) / xpNeeded * 100));
  const displayName = user?.full_name || user?.username || 'Commander';

  // Pulse stats on mount
  useEffect(() => {
    const t = setTimeout(() => setStatsPulse(true), 800);
    const t2 = setTimeout(() => setStatsPulse(false), 2000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  // Rotate companions
  useEffect(() => {
    const t = setInterval(() => setActiveCompanion(p => (p + 1) % COMPANIONS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        height: '512px',
        background: 'linear-gradient(135deg, #050912 0%, #0a0f1e 30%, #060d1a 60%, #080c18 100%)',
      }}
    >
      {/* ── Ambient Background Layers ── */}
      {/* Deep nebula glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full opacity-20 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full opacity-15 blur-[90px]"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 opacity-10 blur-[60px]"
          style={{ background: 'radial-gradient(ellipse, #06b6d4 0%, transparent 70%)' }} />
      </div>

      {/* Subtle scanline grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)',
        }}
      />

      {/* ── Main Layout: 3 columns ── */}
      <div className="relative h-full flex gap-3 p-4 z-10">

        {/* ── LEFT COLUMN: Avatar + Stats ── */}
        <div className="flex flex-col gap-3 w-[220px] flex-shrink-0">

          {/* Avatar Display */}
          <GlassPanel className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-32 opacity-30 blur-[40px]"
              style={{ background: 'radial-gradient(ellipse, #22d3ee 0%, transparent 70%)' }} />

            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-widest">AI Avatar</p>
                <p className="text-white font-bold text-sm truncate">{displayName}</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)' }}
              >
                <Bot className="w-4 h-4 text-cyan-400" />
              </motion.div>
            </div>

            {/* Avatar Silhouette — placeholder glow figure */}
            <div className="relative flex items-center justify-center flex-1 w-full my-2">
              {/* Holographic ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute w-28 h-28 rounded-full"
                style={{
                  border: '1px solid rgba(34,211,238,0.3)',
                  borderTopColor: 'rgba(34,211,238,0.8)',
                  borderRightColor: 'rgba(34,211,238,0.5)',
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute w-20 h-20 rounded-full"
                style={{
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderBottomColor: 'rgba(168,85,247,0.7)',
                }}
              />
              {/* Avatar figure placeholder */}
              <div
                className="relative w-16 h-24 rounded-2xl flex flex-col items-center justify-end pb-2"
                style={{
                  background: 'linear-gradient(180deg, rgba(34,211,238,0.25) 0%, rgba(59,130,246,0.15) 100%)',
                  border: '1px solid rgba(34,211,238,0.2)',
                  boxShadow: '0 0 30px rgba(34,211,238,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Head */}
                <div
                  className="absolute top-2 w-8 h-8 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 40% 35%, rgba(34,211,238,0.6), rgba(59,130,246,0.3))',
                    boxShadow: '0 0 12px rgba(34,211,238,0.5)',
                  }}
                />
                {/* Body glow */}
                <div className="w-full h-10 rounded-xl opacity-40"
                  style={{ background: 'linear-gradient(180deg, rgba(34,211,238,0.3), transparent)' }} />
                <Crown className="w-3 h-3 text-amber-400 absolute top-0 -translate-y-1" />
              </div>
            </div>

            {/* Level + XP */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-cyan-400 text-[10px] font-bold">LVL {level}</span>
                <span className="text-white/30 text-[9px]">{xp.toLocaleString()} XP</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}
                />
              </div>
              <p className="text-white/25 text-[8px] text-right mt-0.5">{xpPct}% to next level</p>
            </div>
          </GlassPanel>

          {/* Stats Chips */}
          <GlassPanel className="p-3">
            <SectionLabel icon={Activity} color="text-cyan-400/60">Combat Stats</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5">
              <HoloChip label="Attack" value="2,450" icon={Sword} color="red" pulse={statsPulse} />
              <HoloChip label="Defense" value="1,830" icon={Shield} color="cyan" />
              <HoloChip label="Speed" value="94" icon={Zap} color="amber" />
              <HoloChip label="HP" value="4,200" icon={Heart} color="green" />
            </div>
          </GlassPanel>
        </div>

        {/* ── CENTER COLUMN: Command Console ── */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">

          {/* Top: Trophy Wall + Class Badge */}
          <div className="flex gap-3">
            {/* Trophy Showcase */}
            <GlassPanel className="flex-1 p-3">
              <SectionLabel icon={Trophy} color="text-amber-400/70">Trophy Showcase</SectionLabel>
              <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {TROPHIES.map((t, i) => (
                  <TrophyItem key={t.name} trophy={t} delay={i * 0.08} />
                ))}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  onClick={() => navigate(createPageUrl('Achievements'))}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-dashed border-white/20 group-hover:border-amber-400/40 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400/60 transition-colors" />
                  </div>
                  <p className="text-white/20 text-[8px] group-hover:text-white/50 transition-colors">View All</p>
                </motion.div>
              </div>
            </GlassPanel>

            {/* Class Badge */}
            <GlassPanel className="w-32 flex-shrink-0 p-3 flex flex-col items-center justify-center gap-2">
              <motion.div
                animate={{ boxShadow: ['0 0 12px rgba(168,85,247,0.4)', '0 0 24px rgba(168,85,247,0.7)', '0 0 12px rgba(168,85,247,0.4)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(99,102,241,0.2))', border: '1px solid rgba(168,85,247,0.4)' }}
              >
                <span className="text-3xl">⚡</span>
              </motion.div>
              <div className="text-center">
                <p className="text-purple-300 font-bold text-xs">Void Mage</p>
                <p className="text-white/30 text-[8px]">Elite Class</p>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-2.5 h-2.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Active Quests */}
          <GlassPanel className="p-3">
            <SectionLabel icon={Target} color="text-cyan-400/60">Active Quests</SectionLabel>
            <div className="space-y-2">
              {ACTIVE_QUESTS.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white/80 text-[10px] font-medium truncate">{q.name}</span>
                      <span className={`text-[9px] font-bold ${q.color} flex-shrink-0 ml-2`}>{q.progress}%</span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${q.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        className={`h-full rounded-full ${q.progress > 80 ? 'bg-cyan-400' : q.progress > 50 ? 'bg-purple-400' : 'bg-amber-400'}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          {/* Recent Activity */}
          <GlassPanel className="flex-1 p-3 overflow-hidden">
            <SectionLabel icon={Bell} color="text-white/30">Recent Activity</SectionLabel>
            <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: '90px', scrollbarWidth: 'none' }}>
              {RECENT_ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-2 py-1 border-b border-white/[0.04] last:border-0"
                  >
                    <Icon className={`w-3 h-3 ${a.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                      <span className="text-white/70 text-[10px] font-medium flex-shrink-0">{a.action}</span>
                      <span className="text-white/30 text-[9px] truncate">{a.detail}</span>
                    </div>
                    <span className="text-white/20 text-[8px] flex-shrink-0">{a.time}</span>
                  </motion.div>
                );
              })}
            </div>
          </GlassPanel>
        </div>

        {/* ── RIGHT COLUMN: Companions + Inventory + Friends ── */}
        <div className="flex flex-col gap-3 w-[200px] flex-shrink-0">

          {/* Active Companion */}
          <GlassPanel className="p-3">
            <SectionLabel icon={Cpu} color="text-purple-400/60">Active Companion</SectionLabel>
            <AnimatePresence mode="wait">
              {COMPANIONS.map((c, i) =>
                i === activeCompanion ? (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2.5"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl flex-shrink-0`}
                      style={{ boxShadow: '0 0 16px rgba(168,85,247,0.4)' }}
                    >
                      {c.icon}
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs">{c.name}</p>
                      <p className="text-white/40 text-[9px]">{c.type}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-[8px]">Active</span>
                      </div>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
            {/* Companion dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              {COMPANIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCompanion(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeCompanion ? 'bg-purple-400 w-3' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </GlassPanel>

          {/* Inventory Summary */}
          <GlassPanel className="p-3">
            <SectionLabel icon={Package} color="text-amber-400/60">Inventory</SectionLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { icon: '⚔️', count: 12, rarity: 'border-amber-400/30' },
                { icon: '🛡️', count: 8, rarity: 'border-purple-400/30' },
                { icon: '💎', count: 34, rarity: 'border-cyan-400/30' },
                { icon: '🧪', count: 56, rarity: 'border-green-400/30' },
                { icon: '📜', count: 7, rarity: 'border-blue-400/30' },
                { icon: '🔮', count: 3, rarity: 'border-violet-400/30' },
                { icon: '🗡️', count: 5, rarity: 'border-red-400/30' },
                { icon: '✨', count: 99, rarity: 'border-white/20' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border ${item.rarity} cursor-pointer`}
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <span className="text-sm leading-none">{item.icon}</span>
                  <span className="text-white/40 text-[7px] mt-0.5">{item.count}</span>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          {/* Friends Online */}
          <GlassPanel className="flex-1 p-3 overflow-hidden">
            <SectionLabel icon={Users} color="text-green-400/60">Friends Online</SectionLabel>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '100px', scrollbarWidth: 'none' }}>
              {[
                { name: 'Shadow_Striker', game: 'Cyberpunk 2088', color: 'bg-green-500' },
                { name: 'CyberVixen', game: 'Final Fantasy', color: 'bg-green-500' },
                { name: 'NovaStar', game: 'Elden Ring', color: 'bg-yellow-500' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{f.name[0]}</span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0f1e] ${f.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/80 text-[9px] font-medium truncate">{f.name}</p>
                    <p className="text-white/25 text-[8px] truncate">{f.game}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Navigate */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(createPageUrl('Friends'))}
              className="w-full mt-2 py-1.5 rounded-lg text-[9px] font-bold text-white/40 hover:text-white/80 border border-white/8 hover:border-white/20 transition-all flex items-center justify-center gap-1"
            >
              <Globe className="w-3 h-3" />
              View All Friends
            </motion.button>
          </GlassPanel>
        </div>
      </div>

      {/* ── Bottom Label ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}
        >
          <Radio className="w-2.5 h-2.5 text-cyan-400" />
          <span className="text-cyan-400/70 text-[8px] font-bold uppercase tracking-widest">Atom X Eve — AI Command Center</span>
          <Radio className="w-2.5 h-2.5 text-cyan-400" />
        </motion.div>
      </div>
    </div>
  );
}