import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Video, Camera, CameraOff, Star, Clock, TrendingUp, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Game Genre Categories
const STREAM_CATEGORIES = [
  'Party', 'FPS', 'Driving/Racing', 'Shooter', 'Gambling/Card and Board', 
  'Strategy', 'Fighting', 'Stealth', 'Game Overlay', 'Horror', 'Creative', 
  'Catch', 'Educational Games', 'RPG', 'Puzzle', 'Simulation', 'MOBA', 
  'Strategy in Real Life/IRL', 'Survival', 'Word/Spell', 'Metroidvania', 
  'Arcade', 'Action', 'Rhythm and Music', 'Indie', 'Fight Simulators', 
  'Penth Ball', 'Gambling Games', 'Open World', 'RTS', 'Hidden Objectives', 
  'Mobile Games', 'Roguelike', 'Point-and-Click', 'Platforms', 'Sports Games', 
  'Novel Games', 'MMO'
];

// Mock streamer data
const MOCK_STREAMERS = [
  { id: 1, name: 'ProGamer_Elite', intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', category: 'League of Legends', hasCamera: true, isNew: false, streamFrequency: 'daily', viewers: 12500 },
  { id: 2, name: 'CasualPlayer', intro: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop', category: 'Just Chatting', hasCamera: false, isNew: true, streamFrequency: 'weekly', viewers: 3200 },
  { id: 3, name: 'TechMaster', intro: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', category: 'Valorant', hasCamera: true, isNew: false, streamFrequency: 'daily', viewers: 8900 },
  { id: 4, name: 'CreativeArtist', intro: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop', category: 'Art', hasCamera: true, isNew: true, streamFrequency: 'occasional', viewers: 1500 },
  { id: 5, name: 'SpeedRunner99', intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', category: 'Minecraft', hasCamera: false, isNew: false, streamFrequency: 'daily', viewers: 15000 },
  { id: 6, name: 'MusicVibes', intro: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop', category: 'Music', hasCamera: true, isNew: false, streamFrequency: 'weekly', viewers: 5600 },
];

const FilterSidebar = ({ filters, setFilters }) => {
  const [categorySearch, setCategorySearch] = useState('');

  const FilterSection = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div className="border-b border-white/10 py-4">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left">
          <h3 className="text-white font-bold text-sm">{title}</h3>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && <div className="mt-3">{children}</div>}
      </div>
    );
  };

  const filteredCategories = STREAM_CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div 
      className="w-[280px] flex-shrink-0 p-5 rounded-3xl h-fit max-h-[calc(100vh-200px)] overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.8) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <FilterSection title="Categories">
        <input
          type="text"
          placeholder="Search categories..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm mb-3 placeholder:text-white/40 focus:outline-none focus:border-blue-500"
        />
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          <button
            onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
              filters.category === 'all' ? 'text-blue-400 font-medium bg-blue-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {filters.category === 'all' && <ChevronRight className="w-3 h-3" />}
            All Categories
          </button>
          {filteredCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                filters.category === cat ? 'text-blue-400 font-medium bg-blue-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {filters.category === cat && <ChevronRight className="w-3 h-3" />}
              {cat}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Camera">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.cameraOnly === 'with'}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, cameraOnly: checked ? 'with' : 'any' }))}
              className="border-white/30 data-[state=checked]:bg-blue-500 w-4 h-4"
            />
            <Camera className="w-4 h-4 text-white/60" />
            <span className="text-white/70 text-sm">With Camera</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.cameraOnly === 'without'}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, cameraOnly: checked ? 'without' : 'any' }))}
              className="border-white/30 data-[state=checked]:bg-blue-500 w-4 h-4"
            />
            <CameraOff className="w-4 h-4 text-white/60" />
            <span className="text-white/70 text-sm">Without Camera</span>
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Streamer Status">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.newStreamers}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, newStreamers: checked }))}
              className="border-white/30 data-[state=checked]:bg-blue-500 w-4 h-4"
            />
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-white/70 text-sm">New Streamers</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.establishedStreamers}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, establishedStreamers: checked }))}
              className="border-white/30 data-[state=checked]:bg-blue-500 w-4 h-4"
            />
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-white/70 text-sm">Established</span>
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Stream Frequency">
        <div className="space-y-2">
          {['daily', 'weekly', 'occasional'].map(freq => (
            <label key={freq} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.frequency === freq}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, frequency: checked ? freq : 'any' }))}
                className="border-white/30 data-[state=checked]:bg-blue-500 w-4 h-4"
              />
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-white/70 text-sm">{freq.charAt(0).toUpperCase() + freq.slice(1)}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Viewer Count">
        <div className="space-y-2">
          {[
            { label: '10k+', min: 10000 },
            { label: '5k-10k', min: 5000, max: 10000 },
            { label: '1k-5k', min: 1000, max: 5000 },
            { label: 'Under 1k', max: 1000 }
          ].map(range => (
            <label key={range.label} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.viewerRange?.min === range.min && filters.viewerRange?.max === range.max}
                onCheckedChange={(checked) => setFilters(prev => ({ 
                  ...prev, 
                  viewerRange: checked ? range : null 
                }))}
                className="border-white/30 data-[state=checked]:bg-blue-500 w-4 h-4"
              />
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-white/70 text-sm">{range.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

const StreamerIntroCard = ({ streamer }) => (
  <div className="group cursor-pointer">
    <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
      <img src={streamer.intro} alt={streamer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2 mb-1">
          {streamer.hasCamera && <Camera className="w-3 h-3 text-white/80" />}
          {streamer.isNew && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px]">NEW</Badge>}
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">{streamer.streamFrequency}</Badge>
        </div>
        <h4 className="text-white font-bold text-sm">{streamer.name}</h4>
      </div>
      <div className="absolute top-3 right-3">
        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>
    </div>
    <p className="text-white/60 text-xs mb-1">{streamer.category}</p>
    <div className="flex items-center gap-1 text-white/40 text-xs">
      <Users className="w-3 h-3" />
      {streamer.viewers.toLocaleString()} watching
    </div>
  </div>
);

export default function StreamingDiscovery() {
  const [filters, setFilters] = useState({
    category: 'all',
    cameraOnly: 'any',
    newStreamers: false,
    establishedStreamers: false,
    frequency: 'any',
    viewerRange: null
  });

  const filteredStreamers = MOCK_STREAMERS.filter(streamer => {
    if (filters.category !== 'all' && streamer.category !== filters.category) return false;
    if (filters.cameraOnly === 'with' && !streamer.hasCamera) return false;
    if (filters.cameraOnly === 'without' && streamer.hasCamera) return false;
    if (filters.newStreamers && !streamer.isNew) return false;
    if (filters.establishedStreamers && streamer.isNew) return false;
    if (filters.frequency !== 'any' && streamer.streamFrequency !== filters.frequency) return false;
    if (filters.viewerRange) {
      const { min = 0, max = Infinity } = filters.viewerRange;
      if (streamer.viewers < min || streamer.viewers > max) return false;
    }
    return true;
  });

  return (
    <div className="flex gap-6 h-full p-6">
      <FilterSidebar filters={filters} setFilters={setFilters} />

      <div className="flex-1 overflow-y-auto">
        {/* Introduce Yourself Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-400" />
            Introduce Yourself
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_STREAMERS.filter(s => s.isNew).map(streamer => (
              <StreamerIntroCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-8" />

        {/* Filtered Results */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {filters.category === 'all' ? 'All Streams' : filters.category}
            <span className="text-white/40 text-sm font-normal ml-2">
              ({filteredStreamers.length} live)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreamers.map(streamer => (
              <StreamerIntroCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
          {filteredStreamers.length === 0 && (
            <div className="text-center py-16">
              <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No streams found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}