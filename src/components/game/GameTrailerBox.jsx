import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GameTrailerBox({ game }) {
  const [screenshots, setScreenshots] = useState([]);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch trailer from internet if not provided
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      try {
        // Use provided trailer or screenshots
        let finalTrailerUrl = game?.trailer_url || game?.video_urls?.[0];
        let finalScreenshots = game?.screenshots || [];

        // If no trailer URL, search the internet for one
        if (!finalTrailerUrl && game?.title) {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Find a YouTube trailer link for the game "${game.title}". Only return the direct YouTube URL (youtube.com/watch?v=... or youtu.be/...). If you cannot find one, return "NOT_FOUND".`,
            add_context_from_internet: true
          });
          if (response && response !== 'NOT_FOUND') {
            finalTrailerUrl = response;
          }
        }

        // If no screenshots, use the cover image or search for them
        if (finalScreenshots.length === 0) {
          if (game?.cover_image) {
            finalScreenshots = [game.cover_image];
          } else {
            const screenshotResponse = await base44.integrations.Core.InvokeLLM({
              prompt: `Find 3-4 official screenshot/gameplay image URLs for the game "${game?.title}". Return as a JSON array of URLs. If none found, return empty array.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: 'object',
                properties: {
                  urls: { type: 'array', items: { type: 'string' } }
                }
              }
            });
            finalScreenshots = screenshotResponse?.urls || [game?.cover_image].filter(Boolean);
          }
        }

        setTrailerUrl(finalTrailerUrl);
        setScreenshots(finalScreenshots);
      } catch (error) {
        console.error('Error fetching game data:', error);
        setScreenshots(game?.screenshots || [game?.cover_image].filter(Boolean));
        setTrailerUrl(game?.trailer_url || game?.video_urls?.[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [game]);

  const previewBoxes = screenshots.slice(0, 4).map((img, idx) => ({
    id: idx + 1,
    image: img
  }));

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(trailerUrl);
  const trailerEmbedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0` : null;

  return (
    <div className="mb-8">
      {/* 70-30 Layout - No vertical divider */}
      <div className="flex gap-0" style={{ minHeight: '480px' }}>
        
        {/* LEFT 70%: Trailer & Preview Boxes */}
        <div className="flex-1 flex flex-col gap-3" style={{ flex: '0 0 70%' }}>
          
          {/* Main Trailer with Label */}
          <div className="relative rounded-xl overflow-hidden flex items-center justify-center flex-1 min-h-0 bg-black/40 border border-white/10 group">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-white/40 mx-auto mb-4 animate-spin" />
                  <p className="text-white/40 text-sm">Loading trailer...</p>
                </div>
              </div>
            ) : trailerEmbedUrl ? (
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
            {/* Gameplay Trailer Label */}
            {!loading && (
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-white text-xs font-bold">
                Gameplay Trailer
              </div>
            )}
          </div>

          {/* Preview Boxes Grid */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previewBoxes.map((box) => (
              <motion.div
                key={box.id}
                whileHover={{ scale: 1.05 }}
                className="group relative flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/40 cursor-pointer"
                style={{ width: '100px', height: '70px' }}
              >
                <img
                  src={box.image}
                  alt={`Preview ${box.id}`}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT 30%: Game Info Panel */}
        <div className="flex-shrink-0 flex flex-col gap-3 pl-6 overflow-y-auto scrollbar-hide" style={{ width: '30%' }}>
          
          {/* Game Cover - Small */}
          <div className="rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
            <img
              src={game?.cover_image}
              alt={game?.title}
              className="w-full aspect-[2/3] object-cover"
              style={{ maxWidth: '150px' }}
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-white/70 leading-relaxed">{game?.description}</p>
          </div>

          {/* Metadata Items */}
          <div className="space-y-2 text-xs">
            {game?.original_year && (
              <div className="flex items-start gap-2">
                <span className="text-white/40 font-bold uppercase tracking-wider min-w-fit flex-shrink-0">Release Date:</span>
                <span className="text-white">{game.original_year}</span>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <span className="text-white/40 font-bold uppercase tracking-wider min-w-fit flex-shrink-0">Developer:</span>
              <span className="text-cyan-400">Studio Unknown</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-white/40 font-bold uppercase tracking-wider min-w-fit flex-shrink-0">Publisher:</span>
              <span className="text-white">Atom Publishing</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {game?.genre && (
              <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-semibold text-white/80 hover:bg-white/15 transition-colors cursor-pointer">
                {game.genre.replace(/_/g, ' ')}
              </span>
            )}
            <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-semibold text-white/80 hover:bg-white/15 transition-colors cursor-pointer">
              Action
            </span>
            <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-semibold text-white/80 hover:bg-white/15 transition-colors cursor-pointer">
              Multiplayer
            </span>
            <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-semibold text-white/80 hover:bg-white/15 transition-colors cursor-pointer">
              Open World
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}