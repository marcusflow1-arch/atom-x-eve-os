import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, X, Trophy, Clock, Users, Star, Download,
  Heart, Settings, Radio, Zap, ChevronUp, ChevronRight,
} from 'lucide-react';
import GameLandingDLC from './GameLandingDLC';
import GameLandingAchievements from './GameLandingAchievements';
import CommunityMomentsSection from '@/components/store/CommunityMomentsSection';

const TABS = ['Overview', 'Achievements', 'Community Moments', 'News', 'Friends'];

const MOCK_NEWS = [
  { title: 'Season 4 — Void Ascendancy Launch', desc: 'A new era begins. New map, new heroes, and massive balance changes.', time: 'May 17', tag: 'New Season', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300' },
  { title: 'Balance Patch v4.2.1', desc: 'Multiple hero adjustments and bug fixes across all game modes.', time: 'March 18', tag: 'Patch Notes', image: null },
  { title: 'Double XP Weekend Active', desc: 'Earn 2x XP on all matches this weekend only. Don\'t miss out!', time: 'March 10', tag: 'Event', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300' },
  { title: 'New Map: The Shattered Keep', desc: 'Explore the newly added Shattered Keep map with unique mechanics.', time: 'February 25', tag: 'Content', image: null },
  { title: 'Hotfix 2/25', desc: 'Minor crash fixes and performance improvements.', time: 'February 23', tag: 'Hotfix', image: null },
];

const RARITY_COLOR = {
  Common: 'text-white/50 bg-white/10',
  Rare: 'text-blue-300 bg-blue-500/15',
  Epic: 'text-purple-300 bg-purple-500/15',
  Legendary: 'text-amber-300 bg-amber-500/15',
};

const TAG_COLOR = {
  'New Season': 'text-purple-300 bg-purple-500/15',
  'Patch Notes': 'text-blue-300 bg-blue-500/15',
  'Event': 'text-amber-300 bg-amber-500/15',
  'Content': 'text-green-300 bg-green-500/15',
  'Hotfix': 'text-white/40 bg-white/10',
};

export default function GameLandingPage({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [wishlisted, setWishlisted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 200);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* ── SCROLLABLE BODY ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain min-h-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* HERO BANNER */}
        <div className="relative flex-shrink-0" style={{ height: '200px' }}>
          <img
            src={game.image}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.7) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18] via-[#0a0e18]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e18]/60 via-transparent to-transparent" />

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-colors z-10 border border-white/10"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          )}

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
              game.status === 'Playing' || game.status === 'In Progress' ? 'bg-green-500/80' :
              game.status === 'New' ? 'bg-emerald-500/80' : 'bg-blue-500/70'
            }`}>
              {game.status}
            </span>
          </div>

          {/* Title */}
          <div className="absolute bottom-4 left-5 right-5">
            <h1 className="text-white text-xl font-black leading-tight drop-shadow-xl">{game.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-white/50 text-[10px]">{game.genre}</span>
              <span className="w-px h-2.5 bg-white/20" />
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-amber-300 text-[10px] font-bold">{game.rating}</span>
              </div>
              <span className="w-px h-2.5 bg-white/20" />
              <div className="flex items-center gap-1">
                <Users className="w-2.5 h-2.5 text-blue-400" />
                <span className="text-white/40 text-[10px]">{game.players} playing</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION ROW */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05]">
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.2))',
              border: '1px solid rgba(34,211,238,0.4)',
              color: '#fff',
              boxShadow: '0 2px 16px rgba(34,211,238,0.15)',
            }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/55 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Radio className="w-3 h-3 text-purple-400" />
            Stream
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/55 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Download className="w-3 h-3" />
            Update
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setWishlisted(v => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${wishlisted ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-white/[0.05] border-white/[0.08] text-white/30 hover:text-white'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all border bg-white/[0.05] border-white/[0.08] text-white/30 hover:text-white">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-3 gap-0 border-b border-white/[0.05]">
          {[
            { label: 'PLAY TIME', value: game.playtime, sub: '', icon: Clock },
            { label: 'LAST PLAYED', value: '2h ago', sub: '', icon: Zap },
            { label: 'ACHIEVEMENTS', value: game.achievements, sub: '', icon: Trophy },
          ].map(({ label, value, icon: Icon }, i) => (
            <div key={i} className={`flex flex-col items-center py-3 gap-0.5 ${i < 2 ? 'border-r border-white/[0.05]' : ''}`}>
              <span className="text-white/25 text-[8px] uppercase tracking-widest">{label}</span>
              <span className="text-white text-sm font-bold">{value}</span>
            </div>
          ))}
        </div>

        {/* COMPLETION BAR */}
        <div className="px-5 py-3 border-b border-white/[0.05]">
          <div className="flex justify-between text-[9px] text-white/25 mb-1.5">
            <span>Completion</span>
            <span className="text-white/40 font-bold">{game.progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${game.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #22d3ee, #818cf8)' }}
            />
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-0 border-b border-white/[0.05]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[11px] font-semibold transition-all relative ${
                activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, #22d3ee, #818cf8)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* OVERVIEW */}
            {activeTab === 'Overview' && (
              <div>
                {/* Description */}
                <div className="px-5 py-4 border-b border-white/[0.04]">
                  <p className="text-white/50 text-xs leading-relaxed">{game.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(game.tags || []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-medium text-white/40 border border-white/[0.07]"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Season Pass */}
                <div className="px-5 py-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold">Season Pass Active</p>
                      <p className="text-white/35 text-[9px] mt-0.5">Earn bonus XP & exclusive cards this season</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                  </div>
                </div>

                {/* DLC & Add-ons */}
                <div className="px-5 py-4 border-b border-white/[0.04]">
                  <GameLandingDLC />
                </div>

                {/* Recent Activity */}
                <div className="px-5 py-4">
                  <p className="text-white/20 text-[9px] uppercase tracking-widest mb-3">Recent Activity</p>
                  <div className="space-y-3">
                    {[
                      { icon: Trophy, color: 'text-amber-400', text: 'Unlocked "First Strike"', time: '2h ago' },
                      { icon: Users, color: 'text-blue-400', text: 'Shadow_Striker started playing', time: '4h ago' },
                      { icon: Zap, color: 'text-purple-400', text: 'Weekly Tournament started', time: '1d ago' },
                    ].map(({ icon: Icon, color, text, time }, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Icon className={`w-3 h-3 flex-shrink-0 ${color}`} />
                        <p className="text-white/40 text-[10px] flex-1 truncate">{text}</p>
                        <span className="text-white/15 text-[9px] flex-shrink-0">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            {activeTab === 'Achievements' && (
              <GameLandingAchievements summary={game.achievements} />
            )}

            {/* COMMUNITY MOMENTS */}
            {activeTab === 'Community Moments' && (
              <div className="px-5 pb-4">
                <CommunityMomentsSection game={game} />
              </div>
            )}

            {/* NEWS */}
            {activeTab === 'News' && (
              <div>
                {MOCK_NEWS.map(({ title, desc, time, tag, image }, i) => (
                  <div key={i} className="border-b border-white/[0.04] last:border-none">
                    <p className="px-5 pt-4 pb-2 text-white/25 text-[9px] uppercase tracking-widest">{time}</p>
                    <div className="px-5 pb-4 flex gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
                      {image && (
                        <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={image} alt={title} className="w-full h-full object-cover opacity-80" />
                        </div>
                      )}
                      {!image && (
                        <div className="w-24 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Zap className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold mb-1 ${TAG_COLOR[tag] || 'text-white/40 bg-white/10'}`}>{tag}</span>
                        <p className="text-white text-[11px] font-semibold leading-snug">{title}</p>
                        <p className="text-white/35 text-[9px] mt-1 leading-relaxed line-clamp-2">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FRIENDS */}
            {activeTab === 'Friends' && (
              <div className="px-5 py-4 space-y-2">
                {[
                  { name: 'Shadow_Striker', status: 'Playing now', avatar: 'S', online: true },
                  { name: 'CyberVixen', status: 'In lobby', avatar: 'C', online: true },
                  { name: 'NovaStar99', status: 'Online', avatar: 'N', online: true },
                  { name: 'GhostBlade', status: 'Away', avatar: 'G', online: false },
                ].map(({ name, status, avatar, online }) => (
                  <div key={name} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/[0.04]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0e18] ${online ? 'bg-green-400' : 'bg-white/20'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold">{name}</p>
                      <p className={`text-[9px] ${online ? 'text-green-400' : 'text-white/30'}`}>{status}</p>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-cyan-300 border border-cyan-400/25 hover:bg-cyan-400/10 transition-colors">
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom padding so content doesn't hide behind scroll-to-top */}
        <div className="h-12" />
      </div>

      {/* SCROLL TO TOP */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={scrollToTop}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-semibold text-white/60 hover:text-white transition-all"
            style={{
              background: 'rgba(20,25,35,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            <ChevronUp className="w-3 h-3" />
            Scroll to Top
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}