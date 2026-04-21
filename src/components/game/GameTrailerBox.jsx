import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Zap, Star, Calendar, Trophy, ChevronRight } from 'lucide-react';

export default function GameTrailerBox({ game, videos = [], screenshots = [] }) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showNavArrows, setShowNavArrows] = useState(false);
  
  // Get YouTube ID from trailer URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const realVideos = (game?.video_urls?.length > 0 ? game.video_urls : (game?.trailer_url ? [game.trailer_url] : []))
    .filter(url => url && typeof url === 'string')
    .map((url, i) => {
      const id = getYouTubeId(url);
      return {
        type: 'video',
        title: i === 0 ? 'Gameplay Trailer' : `Video Showcase ${i + 1}`,
        url: url,
        image: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : game?.cover_image,
        embedUrl: id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null
      };
    });

  const allMedia = realVideos.length > 0 ? realVideos : [
    { title: 'Gameplay Trailer', image: game?.cover_image, type: 'image' }
  ];

  const currentMedia = allMedia[currentMediaIndex] || allMedia[0];

  const gameInfo = [
    { 
      label: 'Free to Play', 
      value: game?.price === 0 ? 'Yes' : 'No',
      icon: Zap,
      color: 'text-yellow-400'
    },
    { 
      label: 'Multiplayer', 
      value: 'Yes',
      icon: Users,
      color: 'text-cyan-400'
    },
    { 
      label: 'Release Year', 
      value: game?.original_year || '2025',
      icon: Calendar,
      color: 'text-purple-400'
    },
    { 
      label: 'Genre', 
      value: game?.genre ? game.genre.charAt(0).toUpperCase() + game.genre.slice(1) : 'Adventure',
      icon: Trophy,
      color: 'text-orange-400'
    },
    { 
      label: 'Rating', 
      value: '4.8/5',
      icon: Star,
      color: 'text-pink-400'
    },
    { 
      label: 'Status', 
      value: game?.status === 'available' ? 'Live' : 'Coming Soon',
      icon: Zap,
      color: 'text-green-400'
    },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Section Title */}
      <h3 className="text-lg font-bold text-white">Trailers & Gameplay</h3>
      
      {/* Main 50/50 Container */}
      <div className="flex gap-0" style={{ minHeight: '480px' }}>
        
        {/* LEFT 50%: Media Viewer & Thumbnails */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 pr-6">
          
          {/* Main Media Viewer */}
          <div 
            className="relative rounded-xl overflow-hidden flex items-center justify-center flex-1 min-h-0 bg-black/40 border border-white/10"
            onMouseEnter={() => setShowNavArrows(true)}
            onMouseLeave={() => setShowNavArrows(false)}
          >
            {currentMedia?.type === 'video' && currentMedia?.embedUrl ? (
              <iframe 
                src={currentMedia.embedUrl} 
                title={currentMedia.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img 
                src={currentMedia?.image || game?.cover_image}
                alt={currentMedia?.title || 'Game Media'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Navigation Arrows */}
            {showNavArrows && allMedia.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5 text-white rotate-180" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </motion.button>
              </>
            )}
          </div>

          {/* Preview Thumbnails */}
          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allMedia.map((media, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentMediaIndex(idx)}
                  whileHover={{ scale: 1.05 }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentMediaIndex 
                      ? 'border-cyan-400 shadow-lg shadow-cyan-500/50' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={media.image}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                  {media.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* White Vertical Divider */}
        <div className="w-px bg-white/20 self-stretch flex-shrink-0" />

        {/* RIGHT 50%: Game Info */}
        <div className="flex-1 min-w-0 pl-6 overflow-hidden flex flex-col">
          <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Game Information</h4>
          
          <div className="space-y-3 flex-1">
            {gameInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10`}>
                      <Icon className={`w-5 h-5 ${info.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">{info.label}</p>
                      <p className="text-white font-bold text-sm truncate">{info.value}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Additional Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl"
          >
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">Pro Tip</p>
            <p className="text-xs text-white/70 leading-relaxed">
              Check out the trailers above to see the game in action. Click thumbnails to switch between videos.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}