import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Zap, Star, Calendar, Trophy } from 'lucide-react';

export default function GameTrailerBox({ game }) {
  const [hoveredPreview, setHoveredPreview] = useState(null);
  
  // Mock preview images for the smaller boxes
  const previewBoxes = [
    { id: 1, title: 'Campaign Intro', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd8d2c17?w=200&h=200&fit=crop' },
    { id: 2, title: 'Multiplayer Chaos', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop' },
    { id: 3, title: 'Boss Battle', image: 'https://images.unsplash.com/photo-1552168324-d612d080e601?w=200&h=200&fit=crop' },
    { id: 4, title: 'Story Arc', image: 'https://images.unsplash.com/photo-1578482846511-04ba529f0b50?w=200&h=200&fit=crop' },
    { id: 5, title: 'Endgame Content', image: 'https://images.unsplash.com/photo-1579546589027-ed7b1cdd7f86?w=200&h=200&fit=crop' },
  ];

  // Get YouTube ID from trailer URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const trailerUrl = game?.trailer_url || (game?.video_urls?.[0] || null);
  const youtubeId = getYouTubeId(trailerUrl);
  const trailerEmbedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0` : null;

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
        
        {/* LEFT 50%: Trailer & Preview Boxes */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 pr-6">
          
          {/* Main Trailer */}
          <div className="relative rounded-xl overflow-hidden flex items-center justify-center flex-1 min-h-0 bg-black/40 border border-white/10">
            {trailerEmbedUrl ? (
              <iframe
                src={trailerEmbedUrl}
                title="Game Trailer"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40">
                <div className="text-center">
                  <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">Trailer not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview Boxes Grid */}
          <div className="grid grid-cols-5 gap-2">
            {previewBoxes.map((box) => (
              <motion.div
                key={box.id}
                onMouseEnter={() => setHoveredPreview(box.id)}
                onMouseLeave={() => setHoveredPreview(null)}
                whileHover={{ scale: 1.05 }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 cursor-pointer"
              >
                <img
                  src={box.image}
                  alt={box.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-1 text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {box.title}
                </div>
              </motion.div>
            ))}
          </div>
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
              Check out the gameplay previews above to see the game in action. Each video showcases different aspects of the experience.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}