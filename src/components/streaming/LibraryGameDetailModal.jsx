import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Radio, Info, RefreshCw, ShoppingBag, Trophy, Users, ChevronDown, ChevronRight } from 'lucide-react';

const glassStyle = {
  background: 'rgba(10, 14, 20, 0.92)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
};

const mockChapters = [
  { name: 'Prologue: The Awakening', progress: 100, completed: true },
  { name: 'Ch. 1: Dark Crossing', progress: 60, completed: false },
  { name: 'Ch. 2: Cyber Breach', progress: 0, completed: false },
];

const mockExpansions = [
  { name: 'Neural Expansion Pack', price: 14.99 },
  { name: 'Void Walker Arsenal', price: 14.99 },
  { name: 'Season Pass: Year One', price: 29.99 },
];

const mockPatches = [
  {
    version: 'V2.1.8',
    title: 'Patch 2.1 - Cyber Dawn',
    body: 'New neon city district, 5 new weapons, and improved ray-tracing performance. Fixed minor bugs in the inventory system.',
    date: 'TODAY',
    tag: 'PATCH',
  },
  {
    version: 'EVENT',
    title: 'Event: Void Walker\'s Return',
    body: 'Limited time event! Earn double XP and exclusive void skins for your character.',
    date: '2 DAYS AGO',
    tag: 'EVENT',
  },
];

const mockSideQuests = [
  { name: 'The Glitch Hunter', available: true },
  { name: 'Lost Data Archives', available: false },
];

export default function LibraryGameDetailModal({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('content');
  const [expandedChapter, setExpandedChapter] = useState(null);
  const overallProgress = 35;

  if (!game) return null;

  const title = game.title || game.name || 'Unknown Game';
  const banner = game.banner || game.cover_image || game.cover || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1400&q=80';
  const cover = game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
          style={glassStyle}
          onClick={e => e.stopPropagation()}
        >
          {/* Top Banner */}
          <div className="relative h-48 flex-shrink-0 overflow-hidden">
            <img src={banner} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#0a0e14]" />

            {/* Title overlay */}
            <div className="absolute bottom-4 left-6 flex items-end gap-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{title}</h1>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 flex-shrink-0">
            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors">
              <Play className="w-4 h-4 fill-current" /> Play
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors">
              <Radio className="w-4 h-4" /> Stream
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors">
              <Info className="w-4 h-4" /> Info
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 flex-shrink-0">
            {[
              { id: 'content', label: 'Content' },
              { id: 'community', label: 'Community' },
              { id: 'achievements', label: 'Achievements' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-white border-cyan-400'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Left: Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>
              {activeTab === 'content' && (
                <>
                  {/* Game Updates & Patch Notes */}
                  <section>
                    <h3 className="flex items-center gap-2 text-white font-bold mb-4">
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      Game Updates & Patch Notes
                    </h3>
                    <div className="space-y-3">
                      {mockPatches.map((patch, i) => (
                        <div key={i} className="border-l-2 border-cyan-500/60 pl-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-white font-semibold text-sm">{patch.title}</p>
                          </div>
                          <p className="text-white/50 text-xs leading-relaxed">{patch.body}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-cyan-400 font-bold">{patch.date}</span>
                            <span className="text-[10px] text-white/30">•</span>
                            <span className="text-[10px] text-white/40">{patch.version}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Expansion Content */}
                  <section>
                    <h3 className="flex items-center gap-2 text-white font-bold mb-4">
                      <ShoppingBag className="w-4 h-4 text-purple-400" />
                      Expansion Content
                    </h3>
                    <div className="space-y-2">
                      {mockExpansions.map((exp, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-white/80 text-sm font-medium">{exp.name}</span>
                            <ChevronRight className="w-4 h-4 text-white/30" />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/60 text-sm">$ {exp.price.toFixed(2)}</span>
                            <button className="px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 text-xs font-bold transition-colors border border-cyan-500/30">
                              Buy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Quests & Experience */}
                  <section>
                    <h3 className="flex items-center gap-2 text-white font-bold mb-4">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      Quests & Experience
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Active Quests', value: '3', color: 'text-cyan-400' },
                        { label: 'Completed', value: '12', color: 'text-green-400' },
                        { label: 'XP Earned', value: '4,820', color: 'text-yellow-400' },
                        { label: 'Next Reward', value: 'Level 8', color: 'text-purple-400' },
                      ].map((stat, i) => (
                        <div key={i} className="rounded-xl bg-white/5 border border-white/5 p-3">
                          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{stat.label}</p>
                          <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'community' && (
                <div className="flex items-center justify-center h-32 text-white/30">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Community features coming soon</p>
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="flex items-center justify-center h-32 text-white/30">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Achievements loading...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Game Progress */}
            <div className="w-72 flex-shrink-0 border-l border-white/5 p-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">Game Progress</h3>
                <span className="text-cyan-400 font-bold text-sm">{overallProgress}%</span>
              </div>

              {/* Overall progress bar */}
              <div className="w-full h-2 rounded-full bg-white/10 mb-5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Main Story */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Main Story</p>
                  <span className="text-white/30 text-[10px]">7/17 Completed</span>
                </div>
                <div className="space-y-2">
                  {mockChapters.map((ch, i) => (
                    <div key={i} className="rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === i ? null : i)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {ch.completed && <span className="text-green-400 text-xs">✓</span>}
                          <span className={`text-xs font-medium ${ch.completed ? 'text-white/70' : 'text-white'}`}>{ch.name}</span>
                        </div>
                        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${expandedChapter === i ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedChapter === i && (
                        <div className="px-3 pb-3">
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ch.completed ? 'bg-green-500' : 'bg-yellow-400'}`}
                              style={{ width: `${ch.progress}%` }}
                            />
                          </div>
                          <p className="text-white/30 text-[10px] mt-1">{ch.progress}% complete</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Quests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Side Quests</p>
                  <span className="text-white/30 text-[10px]">4 Available</span>
                </div>
                <div className="space-y-2">
                  {mockSideQuests.map((q, i) => (
                    <div key={i} className="rounded-lg bg-white/5 border border-white/5 px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-white/70">{q.name}</span>
                      {q.available && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}