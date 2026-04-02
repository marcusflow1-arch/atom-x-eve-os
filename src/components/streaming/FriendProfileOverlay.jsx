import { useState } from 'react';
import MiniAvatarViewer from '@/components/dashboard/MiniAvatarViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Swords, Users, Trophy, TrendingUp, Gamepad2, Star } from 'lucide-react';
import FriendMessenger from '../friends/FriendMessenger';

const recentGamesData = [
  { name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=200&q=80' },
  { name: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80' },
  { name: 'Shadow Tome', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&q=80' },
  { name: 'Hollow Odyssey', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&q=80' },
  { name: 'Norse Legends', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&q=80' },
  { name: 'Dungeon Age', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=200&q=80' },
  { name: 'Apex Chronicles', image: 'https://images.unsplash.com/photo-1559163499-413811fb2344?w=200&q=80' },
  { name: 'The Witcher', image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200&q=80' },
];

const achievementCards = [
  { rarity: 'LEGENDARY', color: 'border-yellow-400/60', glow: 'shadow-yellow-500/20', bg: 'bg-yellow-500/10' },
  { rarity: 'COMMON', color: 'border-white/10', glow: '', bg: 'bg-white/5' },
  { rarity: 'RARE', color: 'border-blue-400/50', glow: 'shadow-blue-500/10', bg: 'bg-blue-500/10' },
  { rarity: 'COMMON', color: 'border-white/10', glow: '', bg: 'bg-white/5' },
  { rarity: 'EPIC', color: 'border-purple-400/50', glow: 'shadow-purple-500/10', bg: 'bg-purple-500/10' },
  { rarity: 'COMMON', color: 'border-white/10', glow: '', bg: 'bg-white/5' },
  { rarity: 'RARE', color: 'border-blue-400/50', glow: '', bg: 'bg-blue-500/10' },
  { rarity: 'LEGENDARY', color: 'border-yellow-400/60', glow: 'shadow-yellow-500/20', bg: 'bg-yellow-500/10' },
  { rarity: 'COMMON', color: 'border-white/10', glow: '', bg: 'bg-white/5' },
  { rarity: 'RARE', color: 'border-blue-400/50', glow: '', bg: 'bg-blue-500/10' },
  { rarity: 'COMMON', color: 'border-white/10', glow: '', bg: 'bg-white/5' },
  { rarity: 'EPIC', color: 'border-purple-400/50', glow: '', bg: 'bg-purple-500/10' },
  { rarity: 'COMMON', color: 'border-white/10', glow: '', bg: 'bg-white/5' },
];

// Liquid glass style — slightly darker translucent
const glassStyle = {
  background: 'rgba(6, 9, 16, 0.72)',
  backdropFilter: 'blur(60px) saturate(180%)',
  WebkitBackdropFilter: 'blur(60px) saturate(180%)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
};

export default function FriendProfileOverlay({ friend, onClose, onPanelChange }) {
  const [activeTab, setActiveTab] = useState('profile');

  const statusColor =
    friend.status === 'online' ? 'bg-green-400' :
    friend.status === 'idle' ? 'bg-yellow-400' : 'bg-gray-500';


  return (
    <AnimatePresence>
      <motion.div
        key="friend-profile-panel"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed z-[68] flex flex-col overflow-hidden"
        style={{
          left: '320px',   // 80px sidebar + 240px friends panel
          top: '64px',
          bottom: '52px',
          right: 0,
          ...glassStyle,
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-white font-bold text-sm tracking-wide">{friend.name}</span>
            {friend.game && <span className="text-white/35 text-xs">· {friend.game}</span>}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>

        {/* Body: two columns */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* LEFT column — avatar + stats */}
          <div
            className="w-[220px] flex-shrink-0 flex flex-col overflow-y-auto border-r border-white/[0.05]"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Avatar */}
            <div className="relative h-64 flex-shrink-0 overflow-hidden">
              <MiniAvatarViewer fill />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060910cc] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-3 pointer-events-none">
                <p className="text-white font-bold text-base leading-tight">{friend.name}</p>
                <p className="text-white/45 text-[10px]">Recruit · Lvl 5</p>
              </div>
              <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <Star className="w-3.5 h-3.5 text-yellow-400" />
              </div>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-3 space-y-1">
              {[
                { label: 'Gamer Score', value: '0' },
                { label: 'AI Points', value: '0' },
                { label: 'Influence', value: '0' },
                { label: 'Games Played', value: '0' },
                { label: 'Achievements', value: '0' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-white/40 text-[10px] flex items-center gap-1.5">
                    <TrendingUp className="w-2.5 h-2.5" /> {s.label}
                  </span>
                  <span className="text-white text-[10px] font-semibold">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Top Genre */}
            <div className="px-3.5 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/35 text-[9px] uppercase tracking-wider">Top Genre</span>
                <span className="text-white/40 text-[9px]">Lv. 7</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-white/70 text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Action
              </div>
            </div>

            {/* PUP Rank */}
            <div className="px-3.5 pb-3">
              <p className="text-white/35 text-[9px] uppercase tracking-wider mb-1.5">PUP Rank Score</p>
              <p className="text-yellow-400 font-black text-2xl mb-1">8,420</p>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(96,165,250,0.35)', color: '#93c5fd' }}>
                Diamond II
              </span>
              <div className="w-full h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: '71%', background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }} />
              </div>
              <p className="text-white/25 text-[9px] mt-1">71% to Diamond I</p>
            </div>

            {/* Action buttons */}
            <div className="px-3.5 pb-4 flex gap-1.5">
              <button
                onClick={() => {}}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400 text-[8px] font-semibold">Message</span>
              </button>
              <button
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Swords className="w-3.5 h-3.5 text-white/50" />
                <span className="text-white/40 text-[8px]">Challenge</span>
              </button>
              <button
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Users className="w-3.5 h-3.5 text-white/50" />
                <span className="text-white/40 text-[8px]">Interact</span>
              </button>
            </div>
          </div>

          {/* RIGHT column — Profile + Chat combined */}
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col" style={{ scrollbarWidth: 'none' }}>
            {/* Game Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-bold text-sm">{friend.game || 'No Game'}</h3>
              <p className="text-white/40 text-xs">Playing now</p>
            </div>

            {/* Main Profile + Chat Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Top: Recently Played & Achievement Cards */}
              <div className="flex-shrink-0 overflow-y-auto p-4 space-y-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', maxHeight: '40%' }}>
                {/* Recently Played */}
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-wider mb-2">Recently Played</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {recentGamesData.slice(0, 5).map((g, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden cursor-pointer">
                        <img src={g.image} alt={g.name} className="w-full h-full object-cover hover:scale-110 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievement Cards */}
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-wider mb-2">Achievement Cards</p>
                  <div className="grid grid-cols-8 gap-1.5">
                    {achievementCards.slice(0, 8).map((ac, i) => (
                      <div
                        key={i}
                        className={`aspect-[3/4] rounded-lg border ${ac.color} ${ac.bg} ${ac.glow ? `shadow-lg ${ac.glow}` : ''} flex flex-col items-center justify-center gap-0.5`}
                      >
                        <Trophy className="w-3 h-3 text-white/40" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom: Chat (always visible) */}
              <div className="flex-1 overflow-hidden">
                <FriendMessenger
                  friend={{
                    friend_id: friend.id?.toString() || 'temp',
                    friend_name: friend.name,
                    friend_avatar: friend.avatar,
                    status: friend.status,
                    current_game: friend.game
                  }}
                  onClose={onClose}
                  inline
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}