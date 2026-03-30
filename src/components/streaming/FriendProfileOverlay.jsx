import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Swords, Users, Trophy, Star, Gamepad2, TrendingUp } from 'lucide-react';

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
  { rarity: 'LEGENDARY', color: 'border-yellow-400', glow: 'shadow-yellow-500/30', bg: 'bg-yellow-500/10' },
  { rarity: 'COMMON', color: 'border-white/20', glow: '', bg: 'bg-white/5' },
  { rarity: 'RARE', color: 'border-blue-400', glow: 'shadow-blue-500/20', bg: 'bg-blue-500/10' },
  { rarity: 'COMMON', color: 'border-white/20', glow: '', bg: 'bg-white/5' },
  { rarity: 'EPIC', color: 'border-purple-400', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10' },
  { rarity: 'COMMON', color: 'border-white/20', glow: '', bg: 'bg-white/5' },
  { rarity: 'RARE', color: 'border-blue-400', glow: '', bg: 'bg-blue-500/10' },
  { rarity: 'LEGENDARY', color: 'border-yellow-400', glow: 'shadow-yellow-500/30', bg: 'bg-yellow-500/10' },
  { rarity: 'COMMON', color: 'border-white/20', glow: '', bg: 'bg-white/5' },
  { rarity: 'RARE', color: 'border-blue-400', glow: '', bg: 'bg-blue-500/10' },
  { rarity: 'COMMON', color: 'border-white/20', glow: '', bg: 'bg-white/5' },
  { rarity: 'EPIC', color: 'border-purple-400', glow: '', bg: 'bg-purple-500/10' },
  { rarity: 'COMMON', color: 'border-white/20', glow: '', bg: 'bg-white/5' },
];

export default function FriendProfileOverlay({ friend, onClose }) {
  if (!friend) return null;

  const statusColor = friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500';
  const statusLabel = friend.status === 'online' ? 'Online' : friend.status === 'idle' ? 'Idle' : 'Offline';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="relative w-[900px] max-w-[96vw] max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
          style={{
            background: 'rgba(10, 14, 22, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top bar: friend name + status */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
              <span className="text-white font-bold text-base tracking-wide">{friend.name}</span>
              <span className="text-white/40 text-xs">{statusLabel}{friend.game ? ` · ${friend.game}` : ''}</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors">
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT: Avatar + stats */}
            <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-white/[0.06] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {/* Avatar */}
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e16] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-bold text-lg leading-tight">{friend.name}</p>
                  <p className="text-white/50 text-xs">Recruit · Lvl 5</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-400" />
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-1.5 flex-shrink-0">
                {[
                  { label: 'Gamer Score', value: '0' },
                  { label: 'AI Points', value: '0' },
                  { label: 'Influence', value: '0' },
                  { label: 'Games Played', value: '0' },
                  { label: 'Achievements', value: '0' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/50 text-xs flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" /> {s.label}
                    </span>
                    <span className="text-white text-xs font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Top Genre */}
              <div className="px-4 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/40 text-[10px] uppercase tracking-wider">Top Genre</span>
                  <span className="text-white/60 text-[10px]">Lv. 7</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 text-xs font-semibold">
                  Action
                </div>
              </div>

              {/* PUP Rank */}
              <div className="px-4 pb-4 flex-shrink-0">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">PUP Rank Score</p>
                <p className="text-yellow-400 font-black text-3xl mb-1">8,420</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold">Diamond II</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: '71%' }} />
                </div>
                <p className="text-white/30 text-[10px] mt-1">71% to Diamond I</p>
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-4 flex gap-2 flex-shrink-0">
                {[
                  { label: 'Message', icon: MessageSquare },
                  { label: 'Challenge', icon: Swords },
                  { label: 'Interact', icon: Users },
                ].map(btn => (
                  <button key={btn.label} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] transition-colors">
                    <btn.icon className="w-4 h-4 text-white/60" />
                    <span className="text-white/50 text-[9px]">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Main content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
              {/* Recent Games */}
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Recent Games</p>
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {recentGamesData.map((g, i) => (
                    <div key={i} className="flex-shrink-0 w-16 rounded-lg overflow-hidden border border-white/10 relative group cursor-pointer hover:border-white/30 transition-colors">
                      <img src={g.image} alt={g.name} className="w-full h-20 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-white/80" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievement Cards */}
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Achievement Cards</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {achievementCards.map((card, i) => (
                    <div key={i} className={`flex-shrink-0 w-14 h-20 rounded-lg border ${card.color} ${card.bg} shadow-lg ${card.glow} flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform`}>
                      <span className="text-white/30 text-2xl font-black">?</span>
                      <span className={`text-[7px] font-bold uppercase tracking-tight ${
                        card.rarity === 'LEGENDARY' ? 'text-yellow-400' :
                        card.rarity === 'EPIC' ? 'text-purple-400' :
                        card.rarity === 'RARE' ? 'text-blue-400' : 'text-white/30'
                      }`}>{card.rarity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trophies + Clip row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Trophies */}
                <div className="rounded-xl border border-white/[0.08] p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-xs font-semibold">Trophies</span>
                    <span className="text-white/40 text-[10px]">4,088 Total</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'Platinum', count: 0, color: 'text-cyan-300', emoji: '🏆' },
                      { type: 'Gold', count: 136, color: 'text-yellow-400', emoji: '🥇' },
                      { type: 'Silver', count: 652, color: 'text-slate-300', emoji: '🥈' },
                      { type: 'Bronze', count: '3.3K', color: 'text-amber-600', emoji: '🥉' },
                    ].map(t => (
                      <div key={t.type} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.04]">
                        <span className="text-base">{t.emoji}</span>
                        <div>
                          <p className={`text-sm font-black ${t.color}`}>{t.count}</p>
                          <p className="text-white/30 text-[9px] uppercase">{t.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Clip */}
                <div className="rounded-xl border border-white/[0.08] overflow-hidden relative cursor-pointer group" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <img
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80"
                    alt="Latest Clip"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white/50 text-[9px] uppercase tracking-wider">Latest Clip</p>
                    <p className="text-white text-xs font-bold">Shadow Realm – Boss Kill</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 rounded px-1 py-0.5 text-white/70 text-[9px]">0:08</div>
                </div>
              </div>

              {/* Top Genres + Status row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Top Genres */}
                <div className="rounded-xl border border-white/[0.08] p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Top Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['RPG', 'Action', 'Horror', 'Strategy'].map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          background: 'rgba(99,102,241,0.15)',
                          borderColor: 'rgba(99,102,241,0.3)',
                          color: '#a5b4fc'
                        }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Update */}
                <div className="rounded-xl border border-white/[0.08] p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white/50 text-[10px] uppercase tracking-wider">Status Update</span>
                  </div>
                  <p className="text-white/70 text-xs italic leading-relaxed">
                    "Going AFK for 30 mins, back for the raid at 9pm!"
                  </p>
                  <p className="text-white/30 text-[10px] mt-2">⏱ 12 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}