import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Heart, MessageSquare, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuraWatchedStreamsDrawer({ isOpen, onClose }) {
  const [selectedTab, setSelectedTab] = useState('recent');

  const tabs = [
    { id: 'recent', label: 'Recently Watched' },
    { id: 'top', label: 'Top Streams' },
    { id: 'new', label: 'New Choices' },
    { id: 'recommended', label: 'Recommended' }
  ];

  const mockStreams = {
    recent: [
      { id: 1, title: 'Speedrunning Cyberpunk 2077', streamer: 'NeonRunner', viewers: '12K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', game: 'Cyberpunk 2077' },
      { id: 2, title: 'No Hit Run - Elden Ring', streamer: 'TarnishedPro', viewers: '8.5K', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=800&q=80', game: 'Elden Ring' },
    ],
    top: [
      { id: 3, title: 'World First Raid Clear!', streamer: 'GuildMaster', viewers: '45K', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80', game: 'WoW' },
      { id: 4, title: 'Championship Grand Finals', streamer: 'EsportsLive', viewers: '120K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', game: 'Valorant' },
    ],
    new: [
      { id: 5, title: 'Checking out new Indie games', streamer: 'PixelHunter', viewers: '1.2K', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', game: 'Indie Showcase' },
    ],
    recommended: [
      { id: 6, title: 'Late Night Chill RPGs', streamer: 'CozyGamer', viewers: '3.4K', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80', game: 'Persona 5' },
    ]
  };

  const activeStreams = mockStreams[selectedTab] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[400px] z-[101] flex flex-col border-r border-white/10"
            style={{
              background: 'rgba(15, 20, 30, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white tracking-wide">Aura Streams</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 py-3 gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedTab === tab.id 
                      ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Stream List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {activeStreams.map((stream) => (
                <div 
                  key={stream.id}
                  className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-500/50 transition-all bg-black/40"
                >
                  <div className="aspect-video relative">
                    <img src={stream.image} alt={stream.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {stream.viewers} Viewers
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/80 backdrop-blur flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-bold text-sm line-clamp-1 mb-1 group-hover:text-cyan-400 transition-colors">{stream.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{stream.streamer}</span>
                      <span className="text-cyan-500/80">{stream.game}</span>
                    </div>
                  </div>
                </div>
              ))}

              {activeStreams.length === 0 && (
                <div className="text-center py-20 text-white/40">
                  <p>No streams found for this category.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}