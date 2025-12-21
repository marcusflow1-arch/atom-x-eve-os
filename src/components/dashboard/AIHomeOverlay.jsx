import React from 'react';
import { motion } from 'framer-motion';
import { Home, X, Sparkles, Gamepad2, Trophy, Target } from 'lucide-react';

export default function AIHomeOverlay({ onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-[120] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Home</h1>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full h-full relative pt-24 px-8 pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Your Personal Space</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Your AI companion's home base. Manage your progression, view stats, and customize your experience.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">AI Level</p>
                  <p className="text-2xl font-bold text-white">24</p>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '68%' }} />
              </div>
              <p className="text-white/40 text-xs mt-2">3,200 / 4,700 XP to next level</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Games Played</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
              </div>
              <p className="text-white/40 text-sm">142 hours total playtime</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Achievements</p>
                  <p className="text-2xl font-bold text-white">87</p>
                </div>
              </div>
              <p className="text-white/40 text-sm">15 legendary unlocked</p>
            </div>
          </div>

          {/* AI Personality Traits */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              AI Personality Traits
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { trait: 'Aggressive', value: 72, color: 'from-red-500 to-orange-500' },
                { trait: 'Strategic', value: 85, color: 'from-blue-500 to-cyan-500' },
                { trait: 'Explorative', value: 63, color: 'from-green-500 to-emerald-500' },
                { trait: 'Social', value: 41, color: 'from-purple-500 to-pink-500' },
              ].map((item) => (
                <div key={item.trait} className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80 text-sm font-medium">{item.trait}</span>
                    <span className="text-white/60 text-xs">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full`} 
                      style={{ width: `${item.value}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-2xl">
            <Sparkles className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/40 text-lg">More features coming soon...</p>
            <p className="text-white/30 text-sm mt-2">AI customization, memory viewer, and more</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}