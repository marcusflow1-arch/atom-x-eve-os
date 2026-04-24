import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Zap, MessageSquare } from 'lucide-react';

const MOCK_STREAMERS = [
  {
    id: 'str_1',
    name: 'NovaKnight',
    avatar: 'https://i.pravatar.cc/400?img=10',
    game: 'Valorant',
    personality: ['competitive', 'energetic'],
    genre: ['fps', 'moba'],
    frequency: 'daily',
    viewers: 2840,
    description: 'Competitive FPS player grinding ranked',
    bio: 'Pro-level gameplay with high-energy commentary. Daily streams at 9PM EST.',
    rating: 4.8
  },
  {
    id: 'str_2',
    name: 'PixelSage',
    avatar: 'https://i.pravatar.cc/400?img=11',
    game: 'Elden Ring',
    personality: ['educational', 'chill'],
    genre: ['rpg', 'indie'],
    frequency: 'regular',
    viewers: 1240,
    description: 'Guide & walkthrough expert',
    bio: 'Teaching others about lore and mechanics. Chill but informative streams.',
    rating: 4.6
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
    bio: 'Professional CS2 player. High-level gameplay daily.',
    rating: 4.9
  },
  {
    id: 'str_4',
    name: 'LunaVox',
    avatar: 'https://i.pravatar.cc/400?img=13',
    game: 'Minecraft',
    personality: ['interactive', 'comedy'],
    genre: ['indie', 'survival'],
    frequency: 'regular',
    viewers: 2100,
    description: 'Creative building & community',
    bio: 'Building incredible creations with viewers. Always laughing.',
    rating: 4.7
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
    description: 'Story-focused gameplay',
    bio: 'Exploring every detail of Night City. Relaxed pace.',
    rating: 4.5
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
    description: 'Mid-lane specialist',
    bio: 'Climbing ranked with community. High skill, great chat interaction.',
    rating: 4.8
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
    bio: 'Clutch plays with hilarious reactions. Pure entertainment.',
    rating: 4.7
  },
  {
    id: 'str_8',
    name: 'FrostSpark',
    avatar: 'https://i.pravatar.cc/400?img=17',
    game: 'Genshin Impact',
    personality: ['interactive', 'chill'],
    genre: ['rpg', 'indie'],
    frequency: 'casual',
    viewers: 740,
    description: 'Casual exploration & events',
    bio: 'Exploring Teyvat at a relaxed pace. Very community-focused.',
    rating: 4.4
  }
];

function getStreamersByFilters(filters) {
  if (!filters.personalities?.length && !filters.genres?.length && !filters.frequency?.length) {
    return MOCK_STREAMERS;
  }

  return MOCK_STREAMERS.filter(streamer => {
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

export default function StreamerDiscoveryGrid({ filters = {} }) {
  const filteredStreamers = getStreamersByFilters(filters);

  return (
    <div className="w-full">
      {/* Results count */}
      <div className="mb-6">
        <p className="text-white/60 text-sm">
          Found <span className="text-white font-semibold">{filteredStreamers.length}</span> streamer{filteredStreamers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStreamers.map((streamer, idx) => (
          <motion.div
            key={streamer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Link
              to={`/streamer/${streamer.id}`}
              className="group h-full block"
            >
              <div className="h-full bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400/50 group-hover:border-cyan-300">
                    <img
                      src={streamer.avatar}
                      alt={streamer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-1 bg-cyan-500/30 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-300" />
                    <span className="text-xs text-cyan-200 font-semibold">{streamer.rating}</span>
                  </div>
                </div>

                {/* Name & Game */}
                <h3 className="text-white font-bold text-lg mb-1 group-hover:text-cyan-300 transition-colors">
                  {streamer.name}
                </h3>
                <p className="text-white/60 text-sm mb-3 line-clamp-1">
                  Playing <span className="text-white/80 font-medium">{streamer.game}</span>
                </p>

                {/* Description */}
                <p className="text-white/50 text-sm mb-4 line-clamp-2 flex-grow">
                  {streamer.description}
                </p>

                {/* Personality Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {streamer.personality.slice(0, 2).map(p => (
                    <span key={p} className="px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-300 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>

                {/* Footer Stats */}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{streamer.viewers.toLocaleString()} viewers</span>
                  </div>
                  <span className="text-emerald-400 font-medium">
                    {streamer.frequency === 'daily' ? '🔴 Online' : '⚪ Offline'}
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
          className="text-center py-16"
        >
          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 text-lg">No streamers found with those filters</p>
          <p className="text-white/30 text-sm mt-2">Try adjusting your preferences</p>
        </motion.div>
      )}
    </div>
  );
}