import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, TrendingUp, Flame, Zap, Star } from 'lucide-react';

const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
};

const GAME_RECOMMENDATIONS = {
  recommended: [
    { id: 1, title: 'Cyberpunk Chronicles', downloads: '2.4M', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=280&fit=crop' },
    { id: 2, title: 'Neural Warfare', downloads: '1.8M', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=280&fit=crop' },
    { id: 3, title: 'Shadow Legends', downloads: '1.5M', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=280&fit=crop' },
    { id: 4, title: 'Void Walker', downloads: '1.2M', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=280&fit=crop' },
  ],
  new: [
    { id: 5, title: 'Quantum Drift 2025', downloads: '890K', image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=200&h=280&fit=crop' },
    { id: 6, title: 'Abyss Reborn', downloads: '650K', image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=200&h=280&fit=crop' },
    { id: 7, title: 'Nexus Protocol', downloads: '520K', image: 'https://images.unsplash.com/photo-1535671066927-ab7641ecda809?w=200&h=280&fit=crop' },
    { id: 8, title: 'Titan Clash', downloads: '410K', image: 'https://images.unsplash.com/photo-1538481143235-5d630894cb4e?w=200&h=280&fit=crop' },
  ],
  hidden_gems: [
    { id: 9, title: 'Echoes of Eternity', downloads: '340K', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=280&fit=crop' },
    { id: 10, title: 'Silent Requiem', downloads: '280K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=280&fit=crop' },
    { id: 11, title: 'Phantom Realm', downloads: '215K', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=280&fit=crop' },
    { id: 12, title: 'Whisper Chronicles', downloads: '190K', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=280&fit=crop' },
  ],
  trending: [
    { id: 13, title: 'Neon City Rising', downloads: '3.2M', image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=200&h=280&fit=crop' },
    { id: 14, title: 'Inferno Battles', downloads: '2.9M', image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=200&h=280&fit=crop' },
    { id: 15, title: 'Crystal Dominion', downloads: '2.5M', image: 'https://images.unsplash.com/photo-1535671066927-ab7641ecda809?w=200&h=280&fit=crop' },
    { id: 16, title: 'Storm Riders', downloads: '2.1M', image: 'https://images.unsplash.com/photo-1538481143235-5d630894cb4e?w=200&h=280&fit=crop' },
  ],
  top_rated: [
    { id: 17, title: 'Masterpiece Quest', downloads: '1.7M', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=280&fit=crop' },
    { id: 18, title: 'Legacy of Legends', downloads: '1.6M', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=280&fit=crop' },
    { id: 19, title: 'Eternal Journey', downloads: '1.4M', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=280&fit=crop' },
    { id: 20, title: 'Ultimate Fantasy', downloads: '1.3M', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=280&fit=crop' },
  ],
};

export default function PlayerInteractionsPanel({ onGameSelect }) {
  const [activeTab, setActiveTab] = useState('recommended');

  const tabs = [
    { id: 'recommended', label: 'Recommended', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Zap },
    { id: 'hidden_gems', label: 'Hidden Gems', icon: Star },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'top_rated', label: 'Top-Rated', icon: Star },
  ];

  const games = GAME_RECOMMENDATIONS[activeTab];

  const handleGameClick = (game) => {
    if (onGameSelect) {
      onGameSelect(game);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,8,15,0.65)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="text-white/60 text-[10px] uppercase tracking-widest font-black">Game Recommendations</span>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex overflow-x-auto gap-1 px-2 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-semibold transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-transparent text-white/50 border border-transparent hover:text-white/80'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Games List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 min-h-0" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {games.map((game, idx) => (
            <motion.button
              key={game.id}
              onClick={() => handleGameClick(game)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.05 }}
              className="w-full flex gap-2 rounded-lg p-2 group cursor-pointer hover:bg-white/10 transition-all text-left"
            >
              <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="text-white font-semibold text-[11px] line-clamp-2 group-hover:text-cyan-300 transition-colors">{game.title}</p>
                  <p className="text-white/40 text-[9px] mt-0.5 flex items-center gap-1">
                    <Download className="w-2.5 h-2.5" />
                    {game.downloads}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}