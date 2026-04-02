import React, { useEffect, useState } from 'react';
import { Play, Radio, Info, Clock, AlertCircle, ShoppingCart, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const glassStyle = {
  background: 'rgba(15, 20, 26, 0.65)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
  border: '1px solid rgba(165, 243, 252, 0.15)',
};

export default function LibraryGameDetailModal({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!game) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed left-[320px] right-0 z-[69] shadow-2xl flex flex-col overflow-hidden"
      style={{
        ...glassStyle,
        top: '64px',
        bottom: '52px',
      }}
    >
      {/* Header with Game Title */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white">{game.title || game.name}</h2>
          <p className="text-sm text-white/50 mt-1">Ready to play</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-6 py-4 border-b border-white/10">
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold transition-colors">
          <Play className="w-4 h-4 fill-current" /> Play
        </button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-colors">
          <Radio className="w-4 h-4" /> Stream
        </button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-colors">
          <Info className="w-4 h-4" /> Info
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 px-6 py-4 border-b border-white/10 text-sm font-medium">
        {['content', 'community', 'achievements'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'text-white border-cyan-400'
                : 'text-white/50 border-transparent hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="p-6 space-y-8">
            {/* Game Updates & Patch Notes */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Game Updates & Patch Notes</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <h4 className="font-bold text-white">Patch 2.1 - Cyber Dawn</h4>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 ml-4">New roam city district, 5 new weapons, and improved ray tracing performance. Fixed minor bugs in the inventory system.</p>
                  <p className="text-xs text-white/40 mt-2 ml-4">3 days ago</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <h4 className="font-bold text-white">Event: Void Walker's Return</h4>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 ml-4">Limited time event! Fam double XP and exclusive void skins for your character.</p>
                  <p className="text-xs text-white/40 mt-2 ml-4">2 days ago • Ends</p>
                </div>
              </div>
            </section>

            {/* Expansion Content */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Expansion Content</h3>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">Neural Expansion Pack</h4>
                    <p className="text-sm text-white/50">Advanced AI storylines & weapons</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">$ 14.99</span>
                    <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                      Buy
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">Void Walker Arsenal</h4>
                    <p className="text-sm text-white/50">10 legendary weapons & skins</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">$ 14.99</span>
                    <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                      Buy
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">Season Pass: Year One</h4>
                    <p className="text-sm text-white/50">All seasonal content & rewards</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">$ 29.99</span>
                    <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Quests & Experience */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Quests & Experience</h3>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm">Complete quests and missions to earn XP, rewards, and unlock exclusive items.</p>
                <button className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                  View Quest Log
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="p-6">
            <div className="text-center text-white/60">
              <p>Community discussions and reviews coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="p-6">
            <div className="text-center text-white/60">
              <p>Achievement tracking and progress coming soon</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}