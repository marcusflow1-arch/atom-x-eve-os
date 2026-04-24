import React, { useState } from 'react';
import { Search } from 'lucide-react';

const PERSONALITY_TYPES = [
  { id: 'chill', label: 'Chill' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'educational', label: 'Educational' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'interactive', label: 'Interactive' }
];

const GAME_GENRES = [
  { id: 'fps', label: 'FPS' },
  { id: 'rpg', label: 'RPG' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'moba', label: 'MOBA' },
  { id: 'survival', label: 'Survival' },
  { id: 'indie', label: 'Indie' }
];

const STREAM_FREQUENCY = [
  { id: 'daily', label: 'Daily' },
  { id: 'regular', label: 'Regular' },
  { id: 'casual', label: 'Casual' },
  { id: 'weekend', label: 'Weekend' }
];

export default function StreamerFilterPanel({ onFiltersChange, search, onSearchChange }) {
  const [personalities, setPersonalities] = useState([]);
  const [genres, setGenres] = useState([]);
  const [frequency, setFrequency] = useState([]);

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

  const activeCount = personalities.length + genres.length + frequency.length;

  return (
    <div className="w-[260px] hidden lg:flex flex-col flex-shrink-0 sticky top-20 self-start gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search streamers..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:bg-white/10 focus:border-white/30 outline-none transition"
        />
      </div>

      {/* Personality */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Personality</h3>
        <div className="space-y-1.5">
          {PERSONALITY_TYPES.map(p => (
            <button
              key={p.id}
              onClick={() => handlePersonalityToggle(p.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                personalities.includes(p.id)
                  ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-100'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all ${
                personalities.includes(p.id) ? 'bg-cyan-400' : 'bg-white/30'
              }`} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game Genre */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Game Genre</h3>
        <div className="space-y-1.5">
          {GAME_GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => handleGenreToggle(g.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                genres.includes(g.id)
                  ? 'bg-purple-500/20 border-purple-400/30 text-purple-100'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all ${
                genres.includes(g.id) ? 'bg-purple-400' : 'bg-white/30'
              }`} />
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Frequency */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Frequency</h3>
        <div className="space-y-1.5">
          {STREAM_FREQUENCY.map(f => (
            <button
              key={f.id}
              onClick={() => handleFrequencyToggle(f.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                frequency.includes(f.id)
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all ${
                frequency.includes(f.id) ? 'bg-emerald-400' : 'bg-white/30'
              }`} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Count */}
      {activeCount > 0 && (
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-white/50">{activeCount} filter{activeCount !== 1 ? 's' : ''} active</p>
        </div>
      )}
    </div>
  );
}