import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Sparkles } from 'lucide-react';

const MOCK_STREAMERS = [
  {
    id: 'str_1',
    name: 'NovaKnight',
    avatar: 'https://i.pravatar.cc/400?img=10',
    game: 'Valorant',
    personality: ['competitive', 'energetic'],
    genre: ['fps'],
    frequency: 'daily',
    viewers: 2840,
    description: 'Competitive FPS grinding ranked',
    rating: 4.8,
    isOnline: true
  },
  {
    id: 'str_2',
    name: 'PixelSage',
    avatar: 'https://i.pravatar.cc/400?img=11',
    game: 'Elden Ring',
    personality: ['educational', 'chill'],
    genre: ['rpg'],
    frequency: 'regular',
    viewers: 1240,
    description: 'Guide & walkthrough expert',
    rating: 4.6,
    isOnline: false
  },
  {
    id: 'str_3',
    name: 'ZeroShift',
    avatar: 'https://i.pravatar.cc/400?img=12',
    game: 'CS2',
    personality: ['competitive'],
    genre: ['fps'],
    frequency: 'daily',
    viewers: 3100,
    description: 'Esports competitor',
    rating: 4.9,
    isOnline: true
  },
  {
    id: 'str_4',
    name: 'LunaVox',
    avatar: 'https://i.pravatar.cc/400?img=13',
    game: 'Minecraft',
    personality: ['interactive', 'comedy'],
    genre: ['indie'],
    frequency: 'regular',
    viewers: 2100,
    description: 'Creative building & community',
    rating: 4.7,
    isOnline: true
  },
  {
    id: 'str_5',
    name: 'CrimsonByte',
    avatar: 'https://i.pravatar.cc/400?img=14',
    game: 'Cyberpunk 2077',
    personality: ['chill', 'educational'],
    genre: ['rpg'],
    frequency: 'casual',
    viewers: 890,
    description: 'Story-focused deep dive',
    rating: 4.5,
    isOnline: false
  },
  {
    id: 'str_6',
    name: 'EchoBlade',
    avatar: 'https://i.pravatar.cc/400?img=15',
    game: 'League of Legends',
    personality: ['competitive', 'interactive'],
    genre: ['moba'],
    frequency: 'daily',
    viewers: 2650,
    description: 'Mid-lane specialist climbing',
    rating: 4.8,
    isOnline: true
  },
  {
    id: 'str_7',
    name: 'SolarFlare',
    avatar: 'https://i.pravatar.cc/400?img=16',
    game: 'Fortnite',
    personality: ['comedy', 'energetic'],
    genre: ['fps'],
    frequency: 'regular',
    viewers: 1950,
    description: 'Funny moments & creative plays',
    rating: 4.7,
    isOnline: true
  },
  {
    id: 'str_8',
    name: 'FrostSpark',
    avatar: 'https://i.pravatar.cc/400?img=17',
    game: 'Genshin Impact',
    personality: ['interactive', 'chill'],
    genre: ['rpg'],
    frequency: 'casual',
    viewers: 740,
    description: 'Casual exploration & events',
    rating: 4.4,
    isOnline: false
  }
];

function getStreamersByFilters(filters, search) {
  let results = MOCK_STREAMERS;

  if (search.trim()) {
    const q = search.toLowerCase();
    results = results.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.game.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }

  if (!filters.personalities?.length && !filters.genres?.length && !filters.frequency?.length) {
    return results;
  }

  return results.filter(streamer => {
    if (filters.personalities?.length) {
      const hasPersonality = streamer.personality.some(p => filters.personalities.includes(p));
      if (!hasPersonality) return false;
    }

    if (filters.genres?.length) {
      const hasGenre = streamer.genre.some(g => filters.genres.includes(g));
      if (!hasGenre) return false;
    }

    if (filters.frequency?.length) {
      if (!filters.frequency.includes(streamer.frequency)) return false;
    }

    return true;
  });
}

export default function StreamerDiscoveryGrid({ filters = {}, search = '' }) {
  const filteredStreamers = getStreamersByFilters(filters, search);

  return (
    <div className="flex-1">
      {/* Results Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Streamers</h2>
        </div>
        <p className="text-white/50 text-sm">
          {filteredStreamers.length} streamer{filteredStreamers.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 pr-1 custom-scrollbar overflow-y-auto max-h-[calc(100vh-10rem)]">
        {filteredStreamers.map((streamer, idx) => (
          <motion.div
            key={streamer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Link to={`/streamer/${streamer.id}`} className="group">
              <div className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 rounded-xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] h-full flex flex-col">
                
                {/* Avatar + Rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <img
                      src={streamer.avatar}
                      alt={streamer.name}
                      className="w-full h-full rounded-lg object-cover border border-white/20 group-hover:border-cyan-400/50 transition-all"
                    />
                    {streamer.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white/20 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs font-bold text-white/80">{streamer.rating}</span>
                  </div>
                </div>

                {/* Name & Game */}
                <h3 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {streamer.name}
                </h3>
                <p className="text-white/60 text-xs mb-3">
                  {streamer.game}
                </p>

                {/* Description */}
                <p className="text-white/50 text-xs mb-3 line-clamp-2 flex-grow">
                  {streamer.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {streamer.personality.slice(0, 2).map(p => (
                    <span key={p} className="px-2 py-0.5 text-[10px] font-medium bg-cyan-500/20 text-cyan-300 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Users className="w-3 h-3" />
                    <span>{(streamer.viewers / 1000).toFixed(1)}K</span>
                  </div>
                  <span className={`text-xs font-medium ${streamer.isOnline ? 'text-red-400' : 'text-white/40'}`}>
                    {streamer.isOnline ? '● Live' : '○ Offline'}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredStreamers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-white/50 text-sm">No streamers match your filters</p>
          <p className="text-white/30 text-xs mt-1">Try adjusting your preferences</p>
        </motion.div>
      )}
    </div>
  );
}