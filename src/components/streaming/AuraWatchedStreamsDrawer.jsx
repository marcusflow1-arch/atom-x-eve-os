import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, MonitorPlay, Star, Users, Radio, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function AuraWatchedStreamsDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [showNewStreamers, setShowNewStreamers] = useState(false);

  // Fetch real data when drawer opens
  useEffect(() => {
    if (!isOpen) {
      setShowNewStreamers(false);
      return;
    }
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

  const newStreamers = streams.slice(0, 5); // mock new streamers
  const recommendedStreamers = streams.slice(0, 3); // mock recommended
  const recentWatched = streams.slice(1, 4); // mock recent watched
  const popularStreams = [...streams].sort((a,b) => b.viewer_count - a.viewer_count).slice(0, 4); // mock most watched
  const topStreamedGames = games.slice(0, 3); // mock top streamed
  const newGames = games.slice(3, 6); // mock new games

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

            {/* Top Button for New Streamers */}
            <div className="p-4 border-b border-white/5">
                <button 
                  onClick={() => setShowNewStreamers(!showNewStreamers)}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${
                    showNewStreamers 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                      : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  New Streamers
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-3 custom-scrollbar space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Recent Watch */}
                  <section>
                    <div className="flex items-center gap-2 mb-3 px-4">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Recent Watch</h3>
                    </div>
                    <div className="space-y-1 px-2">
                        {recentWatched.map(stream => (
                            <button
                                key={`rw_${stream.id}`}
                                onClick={() => handleStreamerClick(stream)}
                                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left"
                            >
                                <img src={stream.preview_image_url || 'https://source.unsplash.com/random/100x100?face'} className="w-8 h-8 rounded-full border border-white/10" alt="streamer" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold truncate group-hover:text-blue-300 transition-colors">{stream.title || `Stream #${stream.id?.slice(0, 6)}`}</p>
                                    <p className="text-white/40 text-[10px] truncate">{stream.game_id || 'Variety'}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                  </section>

                  {/* Most Streamers Watched */}
                  <section>
                    <div className="flex items-center gap-2 mb-3 px-4">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Most Watched</h3>
                    </div>
                    <div className="space-y-1 px-2">
                        {mostWatched.map(stream => (
                            <button
                                key={`mw_${stream.id}`}
                                onClick={() => handleStreamerClick(stream)}
                                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left"
                            >
                                <img src={stream.preview_image_url || 'https://source.unsplash.com/random/100x100?face'} className="w-8 h-8 rounded-full border border-white/10" alt="streamer" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold truncate group-hover:text-orange-300 transition-colors">{stream.title || `Stream #${stream.id?.slice(0, 6)}`}</p>
                                    <p className="text-white/40 text-[10px] flex items-center gap-1">
                                        <Radio className="w-3 h-3 text-red-500" /> {stream.viewer_count || 0} viewers
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                  </section>

                  {/* Browse by Game section */}
                  <section>
                    <div className="flex items-center gap-2 mb-3 px-4">
                        <MonitorPlay className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Browse by Game</h3>
                    </div>
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
                  </section>
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

          {/* Connected Pullout Menu: New Streamers */}
          <AnimatePresence>
            {showNewStreamers && (
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 bottom-0 left-[300px] w-[300px] z-[100] flex flex-col border-r border-white/10"
                    style={{
                        background: 'rgba(15, 20, 26, 0.95)',
                        backdropFilter: 'blur(30px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                        boxShadow: '20px 0 50px rgba(0, 0, 0, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.05)'
                    }}
                >
                    <div className="p-4 shrink-0 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-bold text-white tracking-wide">New Streamers</h2>
                        </div>
                        <button
                            onClick={() => setShowNewStreamers(false)}
                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                        >
                            <X className="w-4 h-4 text-white/60" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                            </div>
                        ) : newStreamers.length > 0 ? (
                            newStreamers.map(stream => (
                                <button
                                    key={`ns_${stream.id}`}
                                    onClick={() => handleStreamerClick(stream)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-cyan-500/30 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img src={stream.preview_image_url || 'https://source.unsplash.com/random/100x100?face'} className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-cyan-400 transition-colors z-10 object-cover" alt="streamer" />
                                    <div className="flex-1 min-w-0 z-10">
                                        <p className="text-white text-sm font-semibold truncate group-hover:text-cyan-300 transition-colors">{stream.title || `Stream #${stream.id?.slice(0, 6)}`}</p>
                                        <p className="text-white/50 text-[10px] truncate mt-0.5">{stream.game_id || 'Variety'}</p>
                                    </div>
                                    <Badge className="z-10 bg-cyan-500/20 text-cyan-300 border-none text-[9px] px-1.5 py-0.5">NEW</Badge>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12 text-white/30 text-sm">
                                No new streamers found.
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}