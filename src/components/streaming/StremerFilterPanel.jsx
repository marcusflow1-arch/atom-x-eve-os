import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

const PERSONALITY_TYPES = [
  { id: 'chill', label: 'Chill & Relaxed', icon: '😎' },
  { id: 'energetic', label: 'Energetic & Hype', icon: '⚡' },
  { id: 'competitive', label: 'Competitive', icon: '🏆' },
  { id: 'educational', label: 'Educational', icon: '📚' },
  { id: 'comedy', label: 'Comedy & Humor', icon: '😂' },
  { id: 'interactive', label: 'Interactive', icon: '🤝' }
];

const GAME_GENRES = [
  { id: 'fps', label: 'FPS', icon: '🎮' },
  { id: 'rpg', label: 'RPG', icon: '⚔️' },
  { id: 'strategy', label: 'Strategy', icon: '♟️' },
  { id: 'moba', label: 'MOBA', icon: '🎯' },
  { id: 'survival', label: 'Survival', icon: '🌲' },
  { id: 'indie', label: 'Indie', icon: '🎨' }
];

const STREAM_FREQUENCY = [
  { id: 'daily', label: 'Daily Streamer', desc: '4+ hours/day' },
  { id: 'regular', label: 'Regular', desc: '4-6 days/week' },
  { id: 'casual', label: 'Casual', desc: '1-3 days/week' },
  { id: 'weekend', label: 'Weekend Only', desc: 'Weekends' }
];

export default function StreamerFilterPanel({ onFiltersChange }) {
  const [personalities, setPersonalities] = useState([]);
  const [genres, setGenres] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const handlePersonalityToggle = (id) => {
    const updated = personalities.includes(id)
      ? personalities.filter(p => p !== id)
      : [...personalities, id];
    setPersonalities(updated);
    onFiltersChange({ personalities: updated, genres, frequency });
  };

  const handleGenreToggle = (id) => {
    const updated = genres.includes(id)
      ? genres.filter(g => g !== id)
      : [...genres, id];
    setGenres(updated);
    onFiltersChange({ personalities, genres: updated, frequency });
  };

  const handleFrequencyToggle = (id) => {
    const updated = frequency.includes(id)
      ? frequency.filter(f => f !== id)
      : [...frequency, id];
    setFrequency(updated);
    onFiltersChange({ personalities, genres, frequency: updated });
  };

  const clearFilters = () => {
    setPersonalities([]);
    setGenres([]);
    setFrequency([]);
    onFiltersChange({ personalities: [], genres: [], frequency: [] });
  };

  const activeFilterCount = personalities.length + genres.length + frequency.length;

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Discover Streamers</h2>
          {activeFilterCount > 0 && (
            <span className="px-3 py-1 bg-cyan-500/30 text-cyan-300 text-sm rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/10 rounded-lg transition-all"
        >
          <ChevronDown
            className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Filters */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Personality */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Personality Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {PERSONALITY_TYPES.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePersonalityToggle(p.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    personalities.includes(p.id)
                      ? 'bg-cyan-500/40 border-cyan-400/60 text-cyan-100'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game Genres */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Game Genre</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {GAME_GENRES.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleGenreToggle(g.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    genres.includes(g.id)
                      ? 'bg-purple-500/40 border-purple-400/60 text-purple-100'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <span className="mr-1">{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stream Frequency */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Stream Frequency</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {STREAM_FREQUENCY.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleFrequencyToggle(f.id)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    frequency.includes(f.id)
                      ? 'bg-emerald-500/40 border-emerald-400/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className={`font-medium ${frequency.includes(f.id) ? 'text-emerald-100' : 'text-white/80'}`}>
                    {f.label}
                  </p>
                  <p className={`text-xs ${frequency.includes(f.id) ? 'text-emerald-200/70' : 'text-white/50'}`}>
                    {f.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Clear Button */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}