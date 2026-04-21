import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';

export default function GameTrailerBox({ game }) {
  const previewBoxes = [
    { id: 1, image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd8d2c17?w=200&h=200&fit=crop' },
    { id: 2, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop' },
    { id: 3, image: 'https://images.unsplash.com/photo-1552168324-d612d080e601?w=200&h=200&fit=crop' },
    { id: 4, image: 'https://images.unsplash.com/photo-1578482846511-04ba529f0b50?w=200&h=200&fit=crop' },
  ];

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const trailerUrl = game?.trailer_url || (game?.video_urls?.[0] || null);
  const youtubeId = getYouTubeId(trailerUrl);
  const trailerEmbedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0` : null;

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-bold text-white">Trailers & Gameplay</h3>
      
      {/* 70-30 Layout */}
      <div className="flex gap-6" style={{ minHeight: '420px' }}>
        
        {/* LEFT 70%: Trailer & Preview Boxes */}
        <div className="flex-1 min-w-0 flex flex-col gap-3" style={{ flex: '0 0 70%' }}>
          
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
          <div className="grid grid-cols-4 gap-2">
            {previewBoxes.map((box) => (
              <motion.div
                key={box.id}
                whileHover={{ scale: 1.05 }}
                className="group relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40 cursor-pointer"
              >
                <img
                  src={box.image}
                  alt={`Preview ${box.id}`}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT 30%: Game Info */}
        <div className="flex-shrink-0 w-[30%] flex flex-col gap-4 overflow-y-auto scrollbar-hide">
          
          {/* Game Cover & Title */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <img
              src={game?.cover_image}
              alt={game?.title}
              className="w-full aspect-[2/3] object-cover"
            />
            <div className="p-3">
              <h4 className="font-bold text-white text-sm truncate">{game?.title}</h4>
              <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{game?.description}</p>
            </div>
          </div>

          {/* Rating */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-2"
          >
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-white">4.8/5</span>
            <span className="text-[10px] text-white/40">(2.4K reviews)</span>
          </motion.div>

          {/* Quick Info */}
          <div className="space-y-2">
            {game?.genre && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Genre</p>
                <p className="text-sm text-white capitalize">{game.genre}</p>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Type</p>
              <p className="text-sm text-white">Multiplayer</p>
            </div>

            {game?.original_year && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Released</p>
                <p className="text-sm text-white">{game.original_year}</p>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Publisher</p>
              <p className="text-sm text-white">Atom Studios</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Platform</p>
              <p className="text-sm text-white">PC, PlayStation, Xbox</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}