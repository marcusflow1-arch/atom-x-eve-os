import React, { useEffect, useState } from 'react';
import MiniAvatarViewer from '@/components/dashboard/MiniAvatarViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Swords, Users, Trophy, TrendingUp, Gamepad2, Star, Phone, Video, Mic, Paperclip, Image as ImageIcon, Smile, MoreHorizontal } from 'lucide-react';
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
  const [showChat, setShowChat] = useState(false);

  const statusColor =
    friend.status === 'online' ? 'bg-green-400' :
    friend.status === 'idle' ? 'bg-yellow-400' : 'bg-gray-500';

  const handleOpenMessenger = () => {
    setShowChat((current) => !current);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      if (showChat) {
        setShowChat(false);
        return;
      }

      onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChat, onClose]);

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
                onClick={handleOpenMessenger}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400 text-[8px] font-semibold">{showChat ? 'Profile' : 'Message'}</span>
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

          {/* RIGHT column — main content OR inline chat */}
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col" style={{ scrollbarWidth: 'none' }}>
            {showChat ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white/80 text-[11px] font-semibold leading-none">{friend.name}</p>
                      <p className="text-white/35 text-[9px] mt-0.5">{friend.status === 'online' ? 'Active now' : friend.game ? `Playing ${friend.game}` : 'Available'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { icon: Phone, color: 'text-cyan-300', label: 'Call', eventName: 'friendMessengerStartVoiceCall' },
                      { icon: Video, color: 'text-violet-300', label: 'Video', eventName: 'friendMessengerStartVideoCall' },
                      { icon: Paperclip, color: 'text-amber-300', label: 'Files' },
                      { icon: MoreHorizontal, color: 'text-white/60', label: 'More' },
                    ].map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => {
                            if (action.eventName) {
                              window.dispatchEvent(new CustomEvent(action.eventName));
                            }
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                          title={action.label}
                        >
                          <Icon className={`w-3.5 h-3.5 ${action.color}`} />
                        </button>
                      );
                    })}

                  </div>
                </div>

                <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.16)', boxShadow: 'inset 0 -10px 30px rgba(0,0,0,0.18)' }}>
                  <button className="px-2.5 py-1 rounded-full text-[9px] font-semibold text-cyan-300" style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.22)' }}>Messages</button>
                  <button className="px-2.5 py-1 rounded-full text-[9px] font-semibold text-white/45" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>Voice Chat</button>
                  <button className="px-2.5 py-1 rounded-full text-[9px] font-semibold text-white/45" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>Files</button>
                </div>

                <div className="flex-1 overflow-hidden min-h-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0.18))', boxShadow: 'inset 0 18px 40px rgba(0,0,0,0.22)' }}>
                  <FriendMessenger
                    friend={{
                      friend_id: friend.id?.toString() || 'temp',
                      friend_name: friend.name,
                      friend_avatar: friend.avatar,
                      status: friend.status,
                      current_game: friend.game
                    }}
                    onClose={() => setShowChat(false)}
                    inline
                  />
                </div>

                <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} title="Send file">
                    <Paperclip className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} title="Send image">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-300" />
                  </button>
                  <div className="flex-1 h-10 rounded-2xl flex items-center px-3" style={{ background: 'rgba(0,0,0,0.26)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 8px 18px rgba(0,0,0,0.18)' }}>
                    <span className="text-white/30 text-[10px]">Message {friend.name}...</span>
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} title="Emoji">
                    <Smile className="w-3.5 h-3.5 text-cyan-300" />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} title="Voice message">
                    <Mic className="w-3.5 h-3.5 text-emerald-300" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

            {/* Recent Games */}
            <div>
              <p className="text-white/35 text-[9px] uppercase tracking-wider mb-2">Recent Games</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {recentGamesData.map((g, i) => (
                  <div key={i} className="flex-shrink-0 w-14 rounded-lg overflow-hidden border border-white/10 relative group cursor-pointer hover:border-white/25 transition-colors">
                    <img src={g.image} alt={g.name} className="w-full h-[72px] object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Gamepad2 className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Cards */}
            <div>
              <p className="text-white/35 text-[9px] uppercase tracking-wider mb-2">Achievement Cards</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {achievementCards.map((card, i) => (
                  <div key={i}
                    className={`flex-shrink-0 w-12 h-[68px] rounded-lg border ${card.color} ${card.bg} ${card.glow ? `shadow-lg ${card.glow}` : ''} flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-105 transition-transform`}>
                    <span className="text-white/25 text-xl font-black">?</span>
                    <span className={`text-[6px] font-bold uppercase ${
                      card.rarity === 'LEGENDARY' ? 'text-yellow-400' :
                      card.rarity === 'EPIC' ? 'text-purple-400' :
                      card.rarity === 'RARE' ? 'text-blue-400' : 'text-white/25'
                    }`}>{card.rarity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trophies + Clip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-white/45 text-[10px] font-semibold flex items-center gap-1.5">
                    <Trophy className="w-3 h-3" /> Trophies
                  </span>
                  <span className="text-white/30 text-[9px]">4,088 Total</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { type: 'Platinum', count: 0, color: 'text-cyan-300', emoji: '🏆' },
                    { type: 'Gold', count: 136, color: 'text-yellow-400', emoji: '🥇' },
                    { type: 'Silver', count: 652, color: 'text-slate-300', emoji: '🥈' },
                    { type: 'Bronze', count: '3.3K', color: 'text-amber-600', emoji: '🥉' },
                  ].map(t => (
                    <div key={t.type} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-sm">{t.emoji}</span>
                      <div>
                        <p className={`text-xs font-black ${t.color}`}>{t.count}</p>
                        <p className="text-white/25 text-[8px] uppercase">{t.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden relative cursor-pointer group" style={{ border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px' }}>
                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80" alt="Latest Clip" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <p className="text-white/40 text-[8px] uppercase tracking-wider">Latest Clip</p>
                  <p className="text-white text-[10px] font-bold leading-tight">Shadow Realm – Boss Kill</p>
                </div>
                <div className="absolute top-1.5 right-1.5 z-10 px-1 py-0.5 rounded text-white/50 text-[8px]" style={{ background: 'rgba(0,0,0,0.5)' }}>0:08</div>
              </div>
            </div>

            {/* Top Genres + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-white/35 text-[9px] uppercase tracking-wider mb-2">Top Genres</p>
                <div className="flex flex-wrap gap-1.5">
                  {['RPG', 'Action', 'Horror', 'Strategy'].map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.28)', color: '#a5b4fc' }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                    <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white/35 text-[9px] uppercase tracking-wider">Status Update</span>
                </div>
                <p className="text-white/60 text-[10px] italic leading-relaxed">
                  "Going AFK for 30 mins, back for the raid at 9pm!"
                </p>
                <p className="text-white/25 text-[9px] mt-1.5">⏱ 12 minutes ago</p>
              </div>
            </div>

              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}