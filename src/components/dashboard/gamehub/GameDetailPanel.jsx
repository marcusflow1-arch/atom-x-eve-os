import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Trophy, Users, Clock, Percent, Gamepad2, Zap } from 'lucide-react';

const TABS = ['Overview', 'Achievements', 'Inventory', 'Friends', 'News'];

const ACTIVITY_FEED = [
  { icon: Trophy, color: 'text-yellow-400', text: 'You unlocked "First Strike"', time: '2h ago' },
  { icon: Users, color: 'text-blue-400', text: 'Shadow_Striker started playing', time: '4h ago' },
  { icon: Zap, color: 'text-purple-400', text: 'New event: Weekly Tournament', time: '1d ago' },
];

export default function GameDetailPanel({ game }) {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!game) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Select a game to view details</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={game.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full flex flex-col overflow-hidden"
      >
        {/* Banner */}
        <div className="relative h-40 rounded-xl overflow-hidden flex-shrink-0 mb-4">
          <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-white text-2xl font-bold mb-1 drop-shadow-lg">{game.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs">{game.genre}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span
                className={`text-xs font-semibold ${
                  game.status === 'Playing' || game.status === 'In Progress'
                    ? 'text-green-400'
                    : game.status === 'New'
                    ? 'text-emerald-400'
                    : 'text-blue-400'
                }`}
              >
                {game.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4 flex-shrink-0">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.3) 0%, rgba(6,182,212,0.2) 100%)',
              border: '1px solid rgba(34,211,238,0.5)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(34,211,238,0.2)',
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            Play
          </button>
          <button
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <Download className="w-4 h-4" />
            Install
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>Progress</span>
            <span>{game.progress || 68}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${game.progress || 68}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #22d3ee, #6366f1)' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 flex-shrink-0 bg-white/5 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white/15 text-white shadow'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'Overview' && (
                <div className="space-y-3">
                  <p className="text-white/50 text-xs leading-relaxed">
                    {game.description || 'Dive into an immersive world of action, strategy, and exploration. Forge your legend across epic campaigns and online battles.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Clock, label: 'Playtime', value: game.playtime || '24.5h' },
                      { icon: Trophy, label: 'Achievements', value: game.achievements || '12/50' },
                      { icon: Clock, label: 'Last Played', value: '2h ago' },
                      { icon: Percent, label: 'Completion', value: `${game.progress || 68}%` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3 flex items-center gap-3"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <Icon className="w-4 h-4 text-cyan-400/70 flex-shrink-0" />
                        <div>
                          <p className="text-white/35 text-[10px]">{label}</p>
                          <p className="text-white font-bold text-sm">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Achievements' && (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: i < 3 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)' }}
                      >
                        <Trophy className={`w-4 h-4 ${i < 3 ? 'text-yellow-400' : 'text-white/25'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${i < 3 ? 'text-white' : 'text-white/35'}`}>
                          Achievement {i + 1}
                        </p>
                        <p className="text-white/30 text-xs">{i < 3 ? 'Unlocked' : 'Locked'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Inventory' && (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Gamepad2 className="w-5 h-5 text-white/20" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Friends' && (
                <div className="space-y-2">
                  {['Shadow_Striker', 'CyberVixen', 'NovaStar'].map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {name[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{name}</p>
                        <p className="text-green-400 text-xs">Playing now</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'News' && (
                <div className="space-y-2">
                  {['New Season Update', 'Balance Patch v2.1', 'Double XP Weekend'].map((title, i) => (
                    <div
                      key={title}
                      className="p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-white text-sm font-semibold">{title}</p>
                      <p className="text-white/35 text-xs mt-1">{i + 1}d ago</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Activity Feed */}
        <div className="mt-4 flex-shrink-0 pt-4 border-t border-white/10">
          <p className="text-white/35 text-xs uppercase tracking-wider mb-3">Recent Activity</p>
          <div className="space-y-2">
            {ACTIVITY_FEED.map(({ icon: Icon, color, text, time }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                <p className="text-white/55 text-xs flex-1 truncate">{text}</p>
                <span className="text-white/25 text-[10px] flex-shrink-0">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}