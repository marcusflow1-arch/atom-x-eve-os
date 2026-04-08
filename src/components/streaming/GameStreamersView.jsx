import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Users, Clock, Camera, Star, Zap, TrendingUp, Crown, Play } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

const StreamerCard = ({ streamer, onClick, size = 'normal' }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    onClick={onClick}
    className="cursor-pointer group"
  >
    <div className={`relative ${size === 'small' ? 'aspect-[4/3]' : 'aspect-video'} rounded-xl overflow-hidden border border-white/10 bg-black`}>
      <img 
        src={streamer.avatar} 
        alt={streamer.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      
      <div className="absolute top-3 left-3 flex gap-2">
        <div className="px-2 py-1 bg-red-600 rounded text-white text-[10px] font-bold flex items-center gap-1">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
          LIVE
        </div>
        {streamer.hasCamera && (
          <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-medium border border-white/20">
            <Camera className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-white font-bold text-sm mb-1">{streamer.name}</h4>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Users className="w-3 h-3" />
          {streamer.viewers?.toLocaleString() || 0}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function GameStreamersView({ game, onClose }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('new');
  const [gameStreamers, setGameStreamers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreamers = async () => {
      try {
        // Find streams matching either game_id or game title (since sometimes relations aren't perfect)
        const allLiveStreams = await base44.entities.Stream.filter({ is_live: true });
        const streams = allLiveStreams.filter(s => 
          s.game_id === game.id || 
          s.game === game.title || 
          s.game_title === game.title
        );
        
        const streamersData = [];
        for (const stream of streams) {
          const users = await base44.entities.User.filter({ id: stream.streamer_id });
          if (users.length > 0) {
            streamersData.push({
              id: stream.streamer_id,
              name: users[0].username || users[0].full_name,
              avatar: users[0].avatar_url,
              viewers: stream.viewer_count || 0,
              streamDuration: Math.floor((new Date() - new Date(stream.started_at)) / 60000),
              hasCamera: stream.stream_settings?.has_camera || false,
              chatEngagement: 75,
              isFeatured: stream.viewer_count > 1000,
              isDeveloper: users[0].role === 'developer',
              isCardFocus: users[0].stream_focus === 'Card Collector'
            });
          }
        }
        
        setGameStreamers(streamersData);
      } catch (error) {
        console.error('Failed to load streamers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreamers();
  }, [game.id]);

  const getSortedStreamers = () => {
    let sorted = [...gameStreamers];
    
    switch(sortBy) {
      case 'longest':
        sorted.sort((a, b) => b.streamDuration - a.streamDuration);
        break;
      case 'engagement':
        sorted.sort((a, b) => b.chatEngagement - a.chatEngagement);
        break;
      case 'developer':
        sorted = sorted.filter(s => s.isDeveloper);
        break;
      case 'card_gamer':
        sorted = sorted.filter(s => s.isCardFocus);
        break;
      case 'new':
      default:
        sorted.sort((a, b) => a.streamDuration - b.streamDuration);
        break;
    }
    
    return sorted;
  };

  const featuredStreamers = gameStreamers.filter(s => s.isFeatured).slice(0, 3);
  const allStreamers = getSortedStreamers();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center">
        <div className="text-white/40">Loading streamers...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505] pt-20"
    >
      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1800px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white border border-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <img 
              src={game.cover_image || game.image} 
              alt={game.title}
              className="w-12 h-12 rounded-lg border border-white/20"
              />
              <div>
                <h1 className="text-2xl font-black text-white">{game.title}</h1>
                <p className="text-white/40 text-sm">{(game.viewers || allStreamers.reduce((sum, s) => sum + (s.viewers || 0), 0)).toLocaleString()} watching • {allStreamers.length} streamers live</p>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            {[
              { id: 'new', label: 'New Streamers', icon: Star },
              { id: 'longest', label: 'Longest Stream', icon: Clock },
              { id: 'engagement', label: 'Most Engaged', icon: TrendingUp },
              { id: 'developer', label: 'Developer', icon: Crown },
              { id: 'card_gamer', label: 'Card Gamer', icon: Zap }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  sortBy === option.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-8 overflow-y-auto h-[calc(100vh-180px)]">
        {gameStreamers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No streamers currently broadcasting this game</p>
          </div>
        ) : (
          <>
            {featuredStreamers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  Featured Highlights
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {featuredStreamers.map(streamer => (
                    <StreamerCard
                      key={streamer.id}
                      streamer={streamer}
                      size="small"
                      onClick={() => navigate(createPageUrl(`StreamWatch?id=${streamer.id}`))}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-white mb-4">
                All Streams
                <span className="text-white/40 font-normal ml-2 text-sm">
                  {allStreamers.length} live
                </span>
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {allStreamers.map(streamer => (
                  <StreamerCard
                    key={streamer.id}
                    streamer={streamer}
                    onClick={() => navigate(createPageUrl(`StreamWatch?id=${streamer.id}`))}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}