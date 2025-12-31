import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Users, Clock, Camera, Star, Zap, TrendingUp, Crown, Play } from 'lucide-react';
import { createPageUrl } from '@/utils';

const StreamerCard = ({ streamer, onClick, size = 'normal' }) => {
  const cardClass = size === 'small' 
    ? 'aspect-[4/3]' 
    : 'aspect-video';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className={`relative ${cardClass} rounded-xl overflow-hidden border border-white/10 bg-black`}>
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
            {streamer.viewers.toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function GameStreamersView({ game, onClose }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('new'); // new, longest, favorite, developer, card_gamer

  // Mock streamers for this game
  const gameStreamers = [
    { 
      id: 1, 
      name: 'ProGamer_Elite', 
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
      viewers: 12500,
      streamDuration: 240, // minutes
      hasCamera: true,
      chatEngagement: 85,
      isFeatured: true,
      isDeveloper: false,
      isCardFocus: true
    },
    { 
      id: 2, 
      name: 'SpeedRunner99', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      viewers: 8900,
      streamDuration: 180,
      hasCamera: false,
      chatEngagement: 92,
      isFeatured: true,
      isDeveloper: false,
      isCardFocus: false
    },
    { 
      id: 3, 
      name: 'NewStreamer23', 
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      viewers: 45,
      streamDuration: 30,
      hasCamera: true,
      chatEngagement: 65,
      isFeatured: false,
      isDeveloper: false,
      isCardFocus: false
    },
    { 
      id: 4, 
      name: 'DevStudio_Official', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      viewers: 5600,
      streamDuration: 120,
      hasCamera: true,
      chatEngagement: 78,
      isFeatured: true,
      isDeveloper: true,
      isCardFocus: false
    },
    { 
      id: 5, 
      name: 'CardHunter', 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      viewers: 3200,
      streamDuration: 360,
      hasCamera: true,
      chatEngagement: 88,
      isFeatured: false,
      isDeveloper: false,
      isCardFocus: true
    },
    { 
      id: 6, 
      name: 'CasualGamer', 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      viewers: 150,
      streamDuration: 90,
      hasCamera: false,
      chatEngagement: 55,
      isFeatured: false,
      isDeveloper: false,
      isCardFocus: false
    },
  ];

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505]"
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
                src={game.image} 
                alt={game.title}
                className="w-12 h-12 rounded-lg border border-white/20"
              />
              <div>
                <h1 className="text-2xl font-black text-white">{game.title}</h1>
                <p className="text-white/40 text-sm">{game.viewers} watching • {allStreamers.length} streamers live</p>
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
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-8 overflow-y-auto h-[calc(100vh-100px)]">
        {/* Featured Highlights */}
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

        {/* All Streamers Grid */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            All Streams
            <span className="text-white/40 font-normal ml-2 text-sm">
              Sorted by: {sortBy === 'new' ? 'Newest' : sortBy === 'longest' ? 'Duration' : sortBy === 'engagement' ? 'Engagement' : sortBy}
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
      </div>
    </motion.div>
  );
}