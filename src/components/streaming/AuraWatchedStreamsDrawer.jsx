import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, MonitorPlay, Star, Users, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function AuraWatchedStreamsDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState(null);

  // Fetch real data when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      base44.entities.Game.list('-original_year', 20).catch(() => []),
      base44.entities.Stream.filter({ is_live: true }, '-viewer_count', 30).catch(() => [])
    ]).then(([gRes, sRes]) => {
      const g = gRes?.data || gRes || [];
      const s = sRes?.data || sRes || [];
      setGames(g.slice(0, 12));
      setStreams(s);
    }).finally(() => setLoading(false));
  }, [isOpen]);

  // Map streams to games
  const gamesWithStreamers = games.map(game => {
    const relatedStreams = streams.filter(s =>
      s.game_id === game.id || s.game === game.title || s.game_title === game.title
    );
    return { ...game, liveStreamers: relatedStreams };
  });

  const handleGameNameClick = (game) => {
    onClose();
    // Navigate to Aura page — StreamingGamesLive will show the game's streamers via selectedGame state
    // We pass state so the Aura page can open GameStreamersView for this game
    navigate(createPageUrl('Aura'), {
      state: { openGame: { id: game.id, title: game.title, image: game.cover_image, cover_image: game.cover_image } }
    });
  };

  const handleStreamerClick = (stream) => {
    onClose();
    if (stream.streamer_id) {
      navigate(createPageUrl('StreamWatch') + `?id=${stream.streamer_id}`);
    }
  };

  const toggleExpand = (gameId) => {
    setExpandedGameId(prev => prev === gameId ? null : gameId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] z-[101] flex flex-col border-r border-white/10"
            style={{
              background: 'rgba(10, 14, 20, 0.92)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Header */}
            <div className="p-4 shrink-0 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <MonitorPlay className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">Aura Streams</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider px-4 mb-2">
                    Games — click name to see streamers
                  </p>
                  <div className="space-y-0.5 px-2">
                    {gamesWithStreamers.map(game => (
                      <div key={game.id} className="rounded-xl overflow-hidden">
                        {/* Game Row */}
                        <div className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors group">
                          {/* Game image — just decorative */}
                          <img
                            src={game.cover_image || game.banner_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80'}
                            alt={game.title}
                            className="w-8 h-10 rounded object-cover border border-white/10 shrink-0"
                          />

                          {/* Game name — navigates to streamers list */}
                          <button
                            onClick={() => handleGameNameClick(game)}
                            className="flex-1 text-left min-w-0"
                          >
                            <span className="text-white text-sm font-semibold truncate block group-hover:text-cyan-300 transition-colors">
                              {game.title}
                            </span>
                            {game.liveStreamers.length > 0 ? (
                              <span className="text-red-400 text-[10px] flex items-center gap-1 mt-0.5">
                                <Radio className="w-2.5 h-2.5" />
                                {game.liveStreamers.length} live
                              </span>
                            ) : (
                              <span className="text-white/30 text-[10px]">No active streams</span>
                            )}
                          </button>

                          {/* Arrow — only shown if there are streamers, expands/collapses */}
                          {game.liveStreamers.length > 0 && (
                            <button
                              onClick={() => toggleExpand(game.id)}
                              className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedGameId === game.id ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Expandable Streamer List */}
                        <AnimatePresence>
                          {expandedGameId === game.id && game.liveStreamers.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden ml-4 pl-3 border-l border-white/10 space-y-1 pb-1"
                            >
                              {game.liveStreamers.map(stream => (
                                <button
                                  key={stream.id}
                                  onClick={() => handleStreamerClick(stream)}
                                  className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors group text-left"
                                >
                                  <div className="relative shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                                      <Users className="w-3.5 h-3.5 text-white/40" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0a0e14]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium truncate group-hover:text-cyan-300 transition-colors">
                                      {stream.title || `Stream #${stream.id?.slice(0, 6)}`}
                                    </p>
                                    <p className="text-white/30 text-[10px]">
                                      {stream.viewer_count ? `${stream.viewer_count.toLocaleString()} watching` : 'Live'}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {gamesWithStreamers.length === 0 && (
                      <div className="text-center py-12 text-white/30 text-sm">
                        No games available
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer — Go to Aura */}
            <div className="p-3 border-t border-white/5 shrink-0">
              <button
                onClick={() => { onClose(); navigate(createPageUrl('Aura')); }}
                className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                Open Aura Streaming
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}