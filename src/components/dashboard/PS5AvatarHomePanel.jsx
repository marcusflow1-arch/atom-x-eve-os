import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Package, Users, Zap, Star, ChevronRight, Shield, Sword, Crown, Heart, TrendingUp, Target, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { id: 'avatar',       label: 'Avatar',      icon: User },
  { id: 'trophies',     label: 'Trophies',    icon: Trophy },
  { id: 'inventory',    label: 'Inventory',   icon: Package },
  { id: 'friends',      label: 'Friends',     icon: Users },
];

const MOCK_TROPHIES = [
  { id: 1, name: 'Dragon Slayer',    icon: '🐉', rarity: 'Legendary', earned: true,  points: 80 },
  { id: 2, name: 'Void Walker',      icon: '🌀', rarity: 'Epic',      earned: true,  points: 50 },
  { id: 3, name: 'Arena Champion',   icon: '⚔️', rarity: 'Epic',      earned: true,  points: 50 },
  { id: 4, name: 'Shadow Phantom',   icon: '👤', rarity: 'Rare',      earned: false, points: 30 },
  { id: 5, name: 'First Blood',      icon: '🔴', rarity: 'Common',    earned: true,  points: 15 },
  { id: 6, name: 'Arcane Prodigy',   icon: '✨', rarity: 'Legendary', earned: false, points: 80 },
];

const MOCK_INVENTORY = [
  { id: 1, name: 'Emerald Blade',    icon: '🗡️',  type: 'Weapon',    rarity: 'Legendary' },
  { id: 2, name: 'Quantum Shield',   icon: '🛡️',  type: 'Armor',     rarity: 'Epic' },
  { id: 3, name: 'Arcane Surge',     icon: '✨',  type: 'Ability',   rarity: 'Rare' },
  { id: 4, name: 'Shadow Cloak',     icon: '🌑',  type: 'Armor',     rarity: 'Epic' },
  { id: 5, name: 'Thunder Ring',     icon: '⚡',  type: 'Accessory', rarity: 'Rare' },
  { id: 6, name: 'Phoenix Feather',  icon: '🔥',  type: 'Consumable',rarity: 'Common' },
  { id: 7, name: 'Moon Charm',       icon: '🌙',  type: 'Accessory', rarity: 'Legendary' },
  { id: 8, name: 'Void Core',        icon: '💜',  type: 'Material',  rarity: 'Epic' },
];

const RARITY_COLORS = {
  Legendary: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  Epic:      { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', text: '#a855f7', glow: 'rgba(168,85,247,0.25)' },
  Rare:      { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
  Common:    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.5)', glow: 'transparent' },
};

function AvatarTab({ user, progression }) {
  const level = progression?.global_level || 1;
  const xp = progression?.global_xp || 0;
  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, (xp / xpNeeded) * 100);
  const stats = progression?.stats || {};

  const statItems = [
    { label: 'HP',       value: stats.hp || 100,   icon: Heart,      color: '#f87171' },
    { label: 'Attack',   value: stats.strength || 10, icon: Sword,   color: '#fb923c' },
    { label: 'Defense',  value: stats.defense || 5, icon: Shield,    color: '#60a5fa' },
    { label: 'Speed',    value: stats.speed || 1.0, icon: Zap,       color: '#34d399' },
    { label: 'Score',    value: progression?.gamer_score || 0, icon: Crown, color: '#fbbf24' },
    { label: 'Games',    value: progression?.games_played || 0, icon: Target, color: '#a78bfa' },
  ];

  return (
    <div className="flex gap-5 h-full">
      {/* Character portrait */}
      <div className="flex-shrink-0 w-44 flex flex-col gap-3">
        <div
          className="relative rounded-2xl overflow-hidden flex-1 min-h-0"
          style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.15) 0%, rgba(14,22,38,0.95) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Avatar image / placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover opacity-90" />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-40">
                <User className="w-16 h-16 text-white" />
                <span className="text-[10px] text-white uppercase tracking-widest">No Avatar</span>
              </div>
            )}
          </div>
          {/* Level badge */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black tracking-wider"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff' }}
          >
            LVL {level}
          </div>
          {/* Name */}
          <div className="absolute top-3 left-0 right-0 text-center">
            <span className="text-white text-xs font-bold drop-shadow-lg truncate px-2">
              {user?.full_name || user?.username || 'Warrior'}
            </span>
          </div>
        </div>
        {/* XP bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-white/40 uppercase tracking-widest">XP</span>
            <span className="text-[9px] text-white/50">{xp} / {xpNeeded}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 content-start">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}</p>
              <p className="text-white/35 text-[9px] uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrophiesTab() {
  const earned = MOCK_TROPHIES.filter(t => t.earned);
  const total = MOCK_TROPHIES.length;
  const percent = Math.round((earned.length / total) * 100);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Progress header */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-white font-bold text-sm">{earned.length} / {total} Trophies</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
          />
        </div>
        <span className="text-amber-400/70 text-xs font-bold">{percent}%</span>
      </div>

      {/* Trophy grid */}
      <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
        {MOCK_TROPHIES.map(trophy => {
          const r = RARITY_COLORS[trophy.rarity];
          return (
            <motion.div
              key={trophy.id}
              whileHover={{ scale: 1.04 }}
              className="flex flex-col items-center gap-2 rounded-xl p-3 cursor-pointer transition-all"
              style={{
                background: trophy.earned ? r.bg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${trophy.earned ? r.border : 'rgba(255,255,255,0.06)'}`,
                opacity: trophy.earned ? 1 : 0.4,
                boxShadow: trophy.earned ? `0 0 16px ${r.glow}` : 'none',
              }}
            >
              <span className="text-3xl" style={{ filter: trophy.earned ? 'none' : 'grayscale(1)' }}>{trophy.icon}</span>
              <span className="text-white text-[10px] font-bold text-center leading-tight">{trophy.name}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: r.text }}>{trophy.rarity}</span>
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5" style={{ color: r.text }} />
                <span className="text-[8px] text-white/40">{trophy.points} pts</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryTab() {
  return (
    <div className="grid grid-cols-4 gap-2 overflow-y-auto h-full" style={{ scrollbarWidth: 'none' }}>
      {MOCK_INVENTORY.map(item => {
        const r = RARITY_COLORS[item.rarity];
        return (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.06 }}
            className="flex flex-col items-center gap-2 rounded-xl p-3 cursor-pointer"
            style={{
              background: r.bg,
              border: `1px solid ${r.border}`,
              boxShadow: `0 0 12px ${r.glow}`,
            }}
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-white text-[9px] font-bold text-center leading-tight">{item.name}</span>
            <span className="text-[8px] uppercase tracking-widest" style={{ color: r.text }}>{item.type}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function FriendsTab({ onSelectEnv }) {
  const { user } = useAuth();
  const [joiningId, setJoiningId] = useState(null);

  const { data: dbUsers } = useQuery({
    queryKey: ['ps5_friends_panel'],
    queryFn: () => base44.entities.PlayerState.list(),
    refetchInterval: 10000,
  });

  const friends = React.useMemo(() => {
    if (!dbUsers) return [];
    const now = Date.now();
    const seen = new Set();
    return (Array.isArray(dbUsers) ? dbUsers : [])
      .filter(p => p && p.player_id && p.player_id !== user?.id && (now - (p.last_update || 0)) < 120000)
      .filter(p => { if (seen.has(p.player_id)) return false; seen.add(p.player_id); return true; })
      .slice(0, 8)
      .map(p => ({
        id: p.player_id,
        name: p.display_name || 'Unknown',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.player_id}`,
        game: p.current_game || 'Luna Dashboard',
        envUrl: p.env_url,
      }));
  }, [dbUsers, user]);

  const handleJoin = (f) => {
    setJoiningId(f.id);
    setTimeout(() => {
      setJoiningId(null);
      if (onSelectEnv) onSelectEnv({ id: `joined_${f.id}`, modelUrl: f.envUrl });
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${f.id}`, hostId: f.id, hostName: f.name } }));
    }, 1200);
  };

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
        <Users className="w-12 h-12 text-white/30" />
        <p className="text-white/40 text-sm">No friends online right now</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full" style={{ scrollbarWidth: 'none' }}>
      {friends.map(f => (
        <div
          key={f.id}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0f1a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{f.name}</p>
            <p className="text-white/35 text-[9px] truncate">{f.game}</p>
          </div>
          <button
            onClick={() => handleJoin(f)}
            disabled={joiningId === f.id}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: joiningId === f.id ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
            }}
          >
            {joiningId === f.id ? '...' : 'Join'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function PS5AvatarHomePanel({ onSelectEnv }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('avatar');

  const { data: progressionData } = useQuery({
    queryKey: ['avatar_progression_ps5', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const rows = await base44.entities.AvatarProgression.filter({ user_id: user.id });
      return rows[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background: 'linear-gradient(160deg, rgba(8,14,26,0.97) 0%, rgba(12,18,32,0.97) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* PS5-style top bar */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Section label */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #6366f1, #a855f7)' }} />
          <span className="text-white/70 text-xs font-bold uppercase tracking-[0.18em]">AI Avatar Home</span>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.45)' : '1px solid transparent',
                  color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                  boxShadow: isActive ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* View Full Profile */}
        <button
          onClick={() => navigate(createPageUrl('AvatarHome'))}
          className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/70 transition-colors"
        >
          <span className="uppercase tracking-widest">Full Profile</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {activeTab === 'avatar'    && <AvatarTab user={user} progression={progressionData} />}
            {activeTab === 'trophies'  && <TrophiesTab />}
            {activeTab === 'inventory' && <InventoryTab />}
            {activeTab === 'friends'   && <FriendsTab onSelectEnv={onSelectEnv} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}