import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Camera, Users, Zap, Hash, Compass, Heart, Sword, Sparkles, Monitor, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const GENRES = [
  { id: 'all', label: 'Discovery', icon: Compass },
  { id: 'rpg', label: 'RPG Journeys', icon: BookOpen },
  { id: 'fps', label: 'Tactical FPS', icon: CrosshairIcon },
  { id: 'card', label: 'Card Collecting', icon: Sparkles },
  { id: 'retro', label: 'Retro & Classics', icon: Monitor },
  { id: 'indie', label: 'Indie Gems', icon: Zap },
  { id: 'lore', label: 'Lore Hunters', icon: BookOpen },
  { id: 'strategy', label: 'Strategy', icon: Sword },
];

function CrosshairIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </svg>
  )
}

export default function DiscoverySidebar({ selectedGenre, onSelectGenre, filters, onUpdateFilters }) {
  return (
    <div className="h-full flex flex-col gap-8 pr-4 overflow-y-auto custom-scrollbar">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input 
          placeholder="Find people, not just games..." 
          className="bg-white/5 border-white/10 rounded-full pl-10 text-white placeholder:text-white/30 h-12 focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-md"
        />
      </div>

      {/* Genres Vertical List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest px-4 mb-2">Identity & Genre</h3>
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
              selectedGenre === genre.id 
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-white/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedGenre === genre.id ? 'bg-cyan-500 text-black' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <genre.icon size={18} />
            </div>
            <span className="font-medium text-sm tracking-wide">{genre.label}</span>
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest px-4">Vibe Check</h3>
        
        {/* Camera Toggle */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/70">
              <Camera size={16} />
              <span className="text-sm font-medium">Camera On</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={filters.cameraOn} onChange={() => onUpdateFilters('cameraOn', !filters.cameraOn)} />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/70">
              <Sparkles size={16} />
              <span className="text-sm font-medium">New Faces</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={filters.newStreamers} onChange={() => onUpdateFilters('newStreamers', !filters.newStreamers)} />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* Personality Tags */}
        <div className="px-2">
          <h4 className="text-[10px] font-bold text-white/30 uppercase mb-3">Personality</h4>
          <div className="flex flex-wrap gap-2">
            {['Chill', 'Analytical', 'Hype', 'Cozy', 'Teacher', 'Speedrunner'].map(tag => (
              <Badge 
                key={tag}
                variant="outline" 
                className="cursor-pointer hover:bg-white/10 hover:border-white/30 text-white/50 transition-all border-white/10"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}