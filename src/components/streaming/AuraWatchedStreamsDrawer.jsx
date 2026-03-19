import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, TrendingUp, Sparkles, Star, Users } from 'lucide-react';

export default function AuraWatchedStreamsDrawer({ isOpen, onClose }) {
  const categories = [
    {
      id: 'recent',
      title: 'Recently Watched',
      icon: Clock,
      streams: [
        { id: 1, title: 'Speedrunning Cyberpunk 2077', streamer: 'NeonRunner', viewers: '12K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', game: 'Cyberpunk 2077', live: false },
        { id: 2, title: 'No Hit Run - Elden Ring', streamer: 'TarnishedPro', viewers: '8.5K', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=800&q=80', game: 'Elden Ring', live: false },
      ]
    },
    {
      id: 'top',
      title: 'Most Viewed',
      icon: TrendingUp,
      streams: [
        { id: 3, title: 'World First Raid Clear!', streamer: 'GuildMaster', viewers: '45K', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80', game: 'WoW', live: true },
        { id: 4, title: 'Championship Grand Finals', streamer: 'EsportsLive', viewers: '120K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', game: 'Valorant', live: true },
      ]
    },
    {
      id: 'new',
      title: 'New Streamers',
      icon: Sparkles,
      streams: [
        { id: 5, title: 'Checking out new Indie games', streamer: 'PixelHunter', viewers: '1.2K', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', game: 'Indie Showcase', live: true },
      ]
    },
    {
      id: 'recommended',
      title: 'Recommended',
      icon: Star,
      streams: [
        { id: 6, title: 'Late Night Chill RPGs', streamer: 'CozyGamer', viewers: '3.4K', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80', game: 'Persona 5', live: true },
      ]
    }
  ];

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
            className="fixed top-0 left-0 bottom-0 w-[400px] z-[101] flex flex-col rounded-r-3xl overflow-hidden"
            style={{
              background: 'rgba(100, 120, 140, 0.12)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Header */}
            <div className="p-6 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Play className="w-5 h-5 text-cyan-400 fill-cyan-400/50 ml-0.5" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-wider">Aura Streams</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-8 custom-scrollbar">
              {categories.map((category) => (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <category.icon className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold tracking-wide">{category.title}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {category.streams.map(stream => (
                      <div 
                        key={stream.id}
                        className="group relative flex gap-4 p-2 rounded-2xl cursor-pointer transition-all hover:bg-white/[0.04] border border-transparent hover:border-white/10"
                      >
                        <div className="w-32 h-20 shrink-0 rounded-xl overflow-hidden relative shadow-lg">
                          <img src={stream.image} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                          
                          {stream.live && (
                            <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider">
                              <div className="w-1 h-1 rounded-full bg-white animate-pulse" /> Live
                            </div>
                          )}
                          
                          {!stream.live && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              VOD
                            </div>
                          )}
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                          <h4 className="text-white text-sm font-bold line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                            {stream.title}
                          </h4>
                          <div>
                            <p className="text-white/60 text-xs font-medium truncate">{stream.streamer}</p>
                            <div className="flex items-center justify-between mt-1 text-[10px]">
                              <span className="text-cyan-400/80 bg-cyan-400/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                {stream.game}
                              </span>
                              {stream.live && (
                                <span className="flex items-center gap-1 text-white/50">
                                  <Users className="w-3 h-3" />
                                  {stream.viewers}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}