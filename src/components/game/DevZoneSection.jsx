import React, { useState } from 'react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Code, Newspaper, Users, Zap, Star, ArrowUpCircle, Bug, Sparkles, MessageSquare, ChevronRight, Radio } from 'lucide-react';

const MOCK_DEV_TEAM = [
  { name: 'Marcus Vael', role: 'Creative Director', avatar: 'MV', color: 'from-violet-600 to-purple-700', quote: 'The world bends to those who dare to build it.' },
  { name: 'Sora Kim', role: 'Lead Programmer', avatar: 'SK', color: 'from-cyan-600 to-blue-700', quote: 'Every bug is just a feature in disguise.' },
  { name: 'Elara Dusk', role: 'Art Director', avatar: 'ED', color: 'from-rose-600 to-pink-700', quote: 'Pixels are the atoms of imagination.' },
  { name: 'Dex Orion', role: 'Narrative Designer', avatar: 'DO', color: 'from-amber-600 to-orange-700', quote: 'Stories are the soul of every great game.' },
  { name: 'Yuki Tanaka', role: 'Sound Engineer', avatar: 'YT', color: 'from-emerald-600 to-teal-700', quote: 'Sound is the invisible architecture of experience.' },
];

const MOCK_DEV_FEED = [
  {
    id: 1,
    author: 'Marcus Vael',
    role: 'Creative Director',
    avatar: 'MV',
    color: 'from-violet-600 to-purple-700',
    time: '2h ago',
    type: 'update',
    title: 'Season 2 Vision — Behind the Curtain',
    content: "We're rethinking the progression loop entirely. Season 2 won't just add content — it'll redefine what \"endgame\" means. Expect systems that reward playstyle diversity over pure grind.",
    reactions: { fire: 248, heart: 91 },
    tag: 'Design'
  },
  {
    id: 2,
    author: 'Sora Kim',
    role: 'Lead Programmer',
    avatar: 'SK',
    color: 'from-cyan-600 to-blue-700',
    time: '6h ago',
    type: 'patch',
    title: 'Shader Optimization — 40% GPU Reduction',
    content: "Just shipped a new shader pipeline that cuts GPU load by ~40% on mid-range cards. No visual quality loss. The trick was culling shadow maps on non-player-facing geometry. Took 3 weeks but worth it.",
    reactions: { fire: 612, heart: 134 },
    tag: 'Tech'
  },
  {
    id: 3,
    author: 'Elara Dusk',
    role: 'Art Director',
    avatar: 'ED',
    color: 'from-rose-600 to-pink-700',
    time: '1d ago',
    type: 'art',
    title: 'New Biome Concepts — The Void Reach',
    content: "Sharing some early concept art for the upcoming Void Reach zone. We drew from bioluminescent deep-sea creatures and crystalline cave formations. The palette is deliberately alien — expect purples, silvers, and deep blacks.",
    reactions: { fire: 891, heart: 420 },
    tag: 'Art'
  },
  {
    id: 4,
    author: 'Dex Orion',
    role: 'Narrative Designer',
    avatar: 'DO',
    color: 'from-amber-600 to-orange-700',
    time: '2d ago',
    type: 'lore',
    title: 'The Lore of the Ancients — Expanded Codex',
    content: "We've added 47 new codex entries for Season 2. The history of the Void Walkers finally gets a proper treatment — who they were, why they vanished, and what their artifacts actually do. No spoilers, but... it recontextualizes everything.",
    reactions: { fire: 319, heart: 205 },
    tag: 'Story'
  },
  {
    id: 5,
    author: 'Yuki Tanaka',
    role: 'Sound Engineer',
    avatar: 'YT',
    color: 'from-emerald-600 to-teal-700',
    time: '3d ago',
    type: 'audio',
    title: 'Adaptive Audio System — Dev Notes',
    content: "Season 2 introduces a fully adaptive audio engine. The music dynamically shifts between 12 layered tracks based on combat state, stealth level, and environmental context. Recorded with a live 40-piece orchestra.",
    reactions: { fire: 204, heart: 88 },
    tag: 'Audio'
  },
];

const TAG_COLORS = {
  Design: 'text-violet-400 bg-violet-900/20 border-violet-700/30',
  Tech: 'text-cyan-400 bg-cyan-900/20 border-cyan-700/30',
  Art: 'text-rose-400 bg-rose-900/20 border-rose-700/30',
  Story: 'text-amber-400 bg-amber-900/20 border-amber-700/30',
  Audio: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30',
};

const TYPE_ICONS = {
  update: ArrowUpCircle,
  patch: Bug,
  art: Sparkles,
  lore: MessageSquare,
  audio: Radio,
};

export default function DevZoneSection({ game }) {
  const [activeSection, setActiveSection] = useState('feed');
  const [expandedPost, setExpandedPost] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative rounded-2xl overflow-hidden border border-white/8"
      style={{
        background: 'linear-gradient(160deg, rgba(10,12,20,0.85) 0%, rgba(15,18,30,0.9) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-4 border-b border-white/7">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Code className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Developer Zone</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1">
          {game?.title || 'Game'} <span className="text-white/30 font-light">— Dev Hub</span>
        </h2>
        <p className="text-white/40 text-xs mb-4">Direct updates from the studio</p>

        {/* Section Toggle */}
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setActiveSection('feed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeSection === 'feed'
                ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Dev Feed
          </button>
          <button
            onClick={() => setActiveSection('team')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeSection === 'team'
                ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Meet the Team
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {activeSection === 'feed' ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-3"
            >
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                <span className="text-white/50 text-[10px] uppercase tracking-wider font-bold">Studio is Active</span>
                <span className="ml-auto text-white/25 text-[10px]">5 posts this week</span>
              </div>

              {MOCK_DEV_FEED.map((post, i) => {
                const TypeIcon = TYPE_ICONS[post.type] || ArrowUpCircle;
                const isExpanded = expandedPost === post.id;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl border border-white/[0.07] overflow-hidden transition-all hover:border-white/[0.12]"
                    style={{ background: 'rgba(255,255,255,0.025)' }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${post.color} flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black shadow-lg`}>
                        {post.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs truncate">{post.author}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${TAG_COLORS[post.tag] || 'text-white/40 bg-white/5 border-white/10'}`}>
                            {post.tag}
                          </span>
                        </div>
                        <span className="text-white/30 text-[10px]">{post.role} · {post.time}</span>
                      </div>
                      <TypeIcon className="w-4 h-4 text-white/20 flex-shrink-0" />
                    </div>
                    <div className="px-4 py-3">
                      <h4 className="text-white font-bold text-sm mb-2 leading-tight">{post.title}</h4>
                      <p className={`text-white/55 text-xs leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {post.content}
                      </p>
                      <button
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                        className="mt-2 text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 px-4 pb-3">
                      <button className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-orange-400 transition-colors group">
                        <span className="text-sm group-hover:scale-125 transition-transform">🔥</span>
                        <span>{post.reactions.fire}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-rose-400 transition-colors group">
                        <span className="text-sm group-hover:scale-125 transition-transform">❤️</span>
                        <span>{post.reactions.heart}</span>
                      </button>
                      <button className="ml-auto flex items-center gap-1 text-[10px] text-white/20 hover:text-white/50 transition-colors">
                        <MessageSquare className="w-3 h-3" />
                        Reply
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-3"
            >
              {/* Studio banner */}
              <div className="relative rounded-xl overflow-hidden p-5 mb-2"
                style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(6,182,212,0.12) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="relative z-10">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Studio</div>
                  <h3 className="text-white font-black text-lg tracking-tight">{game?.developer || 'Unknown Studio'}</h3>
                  <p className="text-white/40 text-xs mt-1">Crafting worlds since {game?.original_year ? game.original_year - 4 : '2020'}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="text-center">
                      <div className="text-white font-black text-base">{MOCK_DEV_TEAM.length}</div>
                      <div className="text-white/30 text-[9px] uppercase tracking-wider">Dev Team</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <div className="text-white font-black text-base">12</div>
                      <div className="text-white/30 text-[9px] uppercase tracking-wider">Updates</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <div className="text-white font-black text-base">4.8</div>
                      <div className="text-white/30 text-[9px] uppercase tracking-wider">Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-bold px-1">The Minds Behind the Game</p>
                {MOCK_DEV_TEAM.map((member, i) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="group flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.025)' }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${member.color} flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white font-bold text-sm">{member.name}</span>
                        <Star className="w-3 h-3 text-yellow-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">{member.role}</span>
                      <p className="text-white/40 text-xs leading-relaxed mt-2 italic">"{member.quote}"</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-2 p-4 rounded-xl border border-cyan-500/20 bg-cyan-900/10">
                <p className="text-cyan-300 text-xs font-bold mb-1 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Got feedback for the team?
                </p>
                <p className="text-white/40 text-[11px] mb-3">Share your thoughts directly with the developers.</p>
                <button className="w-full py-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all">
                  Send Feedback
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 py-4 border-t border-white/6">
        <p className="text-white/20 text-[10px] text-center">
          Developer Zone · {game?.title || 'Game'} · Powered by Atom×Eve
        </p>
      </div>
    </motion.div>
  );
}