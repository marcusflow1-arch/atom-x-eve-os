import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Camera, Users, Zap, Hash, Compass, Heart, Sword, Sparkles, Monitor, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const GENRES = [
  { id: 'all', label: 'Discovery', icon: Compass },
  { id: 'rpg', label: 'RPG Journeys', icon: BookOpen },
  { id: 'fps', label: 'Tactical FPS', icon: Users }, // Changed icon to Users for fps
  { id: 'card', label: 'Card Collecting', icon: Sparkles },
  { id: 'retro', label: 'Retro & Classics', icon: Monitor },
  { id: 'indie', label: 'Indie Gems', icon: Zap },
  { id: 'lore', label: 'Lore Hunters', icon: BookOpen },
  { id: 'strategy', label: 'Strategy', icon: Sword },
];

export default function DiscoverySidebar({ selectedGenre, onSelectGenre, filters, onUpdateFilters }) {
  return (
    <div className="h-full flex flex-col gap-6 pr-2 overflow-y-auto custom-scrollbar">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input 
          placeholder="Search creators..." 
          className="bg-white/5 border-white/10 rounded-xl pl-10 text-white placeholder:text-white/30 h-10 focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-md"
        />
      </div>

      {/* Genres */}
      <div>
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Categories</h3>
        <div className="space-y-1">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onSelectGenre(genre.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                selectedGenre === genre.id 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <genre.icon size={16} className={selectedGenre === genre.id ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/70'} />
              <span className="font-medium text-sm">{genre.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Filters</h3>
        <div className="space-y-2">
          {/* Camera Toggle */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onUpdateFilters('cameraOn', !filters.cameraOn)}>
            <div className="flex items-center gap-2 text-white/70">
              <Camera size={14} />
              <span className="text-sm">Camera On</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${filters.cameraOn ? 'bg-cyan-500' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${filters.cameraOn ? 'left-4.5' : 'left-0.5'}`} style={{ left: filters.cameraOn ? '18px' : '2px' }} />
            </div>
          </div>

           {/* New Faces Toggle */}
           <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onUpdateFilters('newStreamers', !filters.newStreamers)}>
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles size={14} />
              <span className="text-sm">New Faces</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${filters.newStreamers ? 'bg-cyan-500' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${filters.newStreamers ? 'left-4.5' : 'left-0.5'}`} style={{ left: filters.newStreamers ? '18px' : '2px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}