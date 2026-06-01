import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, X, Trophy, Clock, Users, Star, Download,
  Heart, Share2, Zap, ChevronRight, Settings, Radio,
} from 'lucide-react';

const TABS = ['Overview', 'Achievements', 'Friends', 'News'];

const MOCK_ACHIEVEMENTS = [
  { name: 'First Blood', icon: '⚔️', desc: 'Win your first match', unlocked: true, rarity: 'Common' },
  { name: 'Dragon Slayer', icon: '🐉', desc: 'Defeat the final boss', unlocked: true, rarity: 'Legendary' },
  { name: 'Speed Demon', icon: '⚡', desc: 'Complete a run under 5 min', unlocked: true, rarity: 'Epic' },
  { name: 'Lorekeeper', icon: '📖', desc: 'Read all in-game codex entries', unlocked: false, rarity: 'Rare' },
  { name: 'Untouchable', icon: '🛡️', desc: 'Finish a chapter without taking damage', unlocked: false, rarity: 'Epic' },
  { name: 'World Ender', icon: '💀', desc: 'Reach the true ending', unlocked: false, rarity: 'Legendary' },
];

const RARITY_COLOR = {
  Common: 'text-white/50 bg-white/10',
  Rare: 'text-blue-300 bg-blue-500/15',
  Epic: 'text-purple-300 bg-purple-500/15',
  Legendary: 'text-amber-300 bg-amber-500/15',
};

export default function GameLandingPage({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* ── HERO BANNER ── */}
      <div className="relative flex-shrink-0" style={{ height: '180px' }}>
        <img
          src={game.image}
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.65) saturate(1.2)' }}
        />
        {/* Multi-layer gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18] via-[#0a0e18]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e18]/70 via-transparent to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-3.5 h-3.5 text-white/70" />
        </button>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
            game.status === 'Playing' || game.status === 'In Progress' ? 'bg-green-500/70' :
            game.status === 'New' ? 'bg-emerald-500/70' : 'bg-blue-500/70'
          }`}>
            {game.status}
          </span>
        </div>

        {/* Title block */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white text-2xl font-black leading-tight drop-shadow-xl">{game.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/50 text-xs">{game.genre}</span>
            <span className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-amber-300 text-xs font-bold">{game.rating}</span>
            </div>
            <span className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-400" />
              <span className="text-white/50 text-xs">{game.players} playing</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION ROW ── */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0 border-b border-white/[0.06]">
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.35), rgba(99,102,241,0.25))',
            border: '1px solid rgba(34,211,238,0.45)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(34,211,238,0.2)',
          }}
        >
          <Play className="w-4 h-4 fill-current" />
          Play Now
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          Stream
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Download className="w-3.5 h-3.5" />
          Update
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setWishlisted(v => !v)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${wishlisted ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/[0.06] border-white/10 text-white/40 hover:text-white'}`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>
        <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all border bg-white/[0.06] border-white/10 text-white/40 hover:text-white">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="px-4 py-2.5 flex-shrink-0">
        <div className="flex justify-between text-[10px] text-white/30 mb-1">
          <span>Completion</span>
          <span className="text-white/50 font-bold">{game.progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${game.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #22d3ee, #818cf8)' }}
          />
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3 flex-shrink-0">
        {[
          { icon: Clock, label: 'Playtime', value: game.playtime, color: 'text-cyan-400' },
          { icon: Trophy, label: 'Achievements', value: game.achievements, color: 'text-amber-400' },
          { icon: Zap, label: 'Last Played', value: '2h ago', color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
            <div className="min-w-0">
              <p className="text-white/30 text-[8px] leading-none">{label}</p>
              <p className="text-white text-xs font-bold mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white/[0.12] text-white border border-white/15'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.05]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'Overview' && (
              <div className="space-y-4">
                {/* Description */}
                <p className="text-white/55 text-xs leading-relaxed">{game.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(game.tags || []).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-medium text-white/50 border border-white/[0.08]"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* DLC / Season Pass banner */}
                <div
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold">Season Pass Active</p>
                    <p className="text-white/40 text-[9px] mt-0.5">Earn bonus XP & exclusive cards this season</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                </div>

                {/* Recent activity */}
                <div>
                  <p className="text-white/25 text-[9px] uppercase tracking-widest mb-2">Recent Activity</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: Trophy, color: 'text-amber-400', text: 'Unlocked "First Strike"', time: '2h ago' },
                      { icon: Users, color: 'text-blue-400', text: 'Shadow_Striker started playing', time: '4h ago' },
                      { icon: Zap, color: 'text-purple-400', text: 'Weekly Tournament started', time: '1d ago' },
                    ].map(({ icon: Icon, color, text, time }, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1">
                        <Icon className={`w-3 h-3 flex-shrink-0 ${color}`} />
                        <p className="text-white/45 text-[10px] flex-1 truncate">{text}</p>
                        <span className="text-white/20 text-[9px] flex-shrink-0">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Achievements' && (
              <div className="space-y-2">
                {/* Progress summary */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/40 text-[10px]">{game.achievements} unlocked</p>
                  <p className="text-white/25 text-[9px]">Right-click to pin</p>
                </div>
                {MOCK_ACHIEVEMENTS.map((ach, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${ach.unlocked ? '' : 'opacity-40'}`}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${ach.unlocked ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
                      {ach.unlocked ? ach.icon : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-semibold truncate">{ach.name}</p>
                      <p className="text-white/35 text-[9px] truncate mt-0.5">{ach.desc}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold flex-shrink-0 ${RARITY_COLOR[ach.rarity]}`}>
                      {ach.rarity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Friends' && (
              <div className="space-y-2">
                {[
                  { name: 'Shadow_Striker', status: 'Playing now', avatar: 'S' },
                  { name: 'CyberVixen', status: 'In lobby', avatar: 'C' },
                  { name: 'NovaStar99', status: 'Online', avatar: 'N' },
                  { name: 'GhostBlade', status: 'Away', avatar: 'G' },
                ].map(({ name, status, avatar }) => (
                  <div key={name} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold">{name}</p>
                      <p className={`text-[9px] ${status === 'Playing now' || status === 'In lobby' ? 'text-green-400' : 'text-white/35'}`}>{status}</p>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors">
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'News' && (
              <div className="space-y-2">
                {[
                  { title: 'Season 4 — Void Ascendancy', time: '2 days ago', tag: 'New Season', color: 'text-purple-300 bg-purple-500/15' },
                  { title: 'Balance Patch v4.2.1', time: '5 days ago', tag: 'Patch Notes', color: 'text-blue-300 bg-blue-500/15' },
                  { title: 'Double XP Weekend Active', time: '1 week ago', tag: 'Event', color: 'text-amber-300 bg-amber-500/15' },
                  { title: 'New Map: The Shattered Keep', time: '2 weeks ago', tag: 'Content', color: 'text-green-300 bg-green-500/15' },
                ].map(({ title, time, tag, color }, i) => (
                  <div key={i} className="p-3 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-white text-[11px] font-semibold leading-tight">{title}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold flex-shrink-0 ${color}`}>{tag}</span>
                    </div>
                    <p className="text-white/25 text-[9px]">{time}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}