import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Video, Camera, CameraOff, Star, Clock, TrendingUp, Users, ChevronLeft, Globe, Calendar, Play } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

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
  { 
    id: 1, 
    name: 'ProGamer_Elite', 
    intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    category: 'FPS', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'daily', 
    viewers: 12500,
    bio: 'Professional FPS player with 10+ years of competitive experience. Love high-action gameplay and engaging with chat!',
    favoriteGames: ['Counter-Strike 2', 'Valorant', 'Call of Duty', 'Apex Legends'],
    eventImages: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop'
    ],
    schedule: 'Mon-Fri, 7PM-11PM EST',
    languages: ['English', 'Spanish']
  },
  { 
    id: 2, 
    name: 'CasualPlayer', 
    intro: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    category: 'RPG', 
    hasCamera: false, 
    isNew: true, 
    streamFrequency: 'weekly', 
    viewers: 3200,
    bio: 'Just here to have fun and explore amazing RPG worlds. Cozy vibes and chill gaming sessions.',
    favoriteGames: ['Elden Ring', 'Baldurs Gate 3', 'Skyrim', 'The Witcher 3'],
    eventImages: [
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop'
    ],
    schedule: 'Weekends, 2PM-6PM EST',
    languages: ['English']
  },
  { 
    id: 3, 
    name: 'TechMaster', 
    intro: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    category: 'Strategy', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'daily', 
    viewers: 8900,
    bio: 'Strategy game enthusiast and tech reviewer. Breaking down complex tactics and builds for my community.',
    favoriteGames: ['Starcraft 2', 'Age of Empires', 'Civilization VI', 'Total War'],
    eventImages: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop'
    ],
    schedule: 'Daily, 5PM-9PM EST',
    languages: ['English', 'German']
  },
  { 
    id: 4, 
    name: 'CreativeArtist', 
    intro: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    category: 'Creative', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'occasional', 
    viewers: 1500,
    bio: 'Digital artist creating game-inspired artwork. Join me for art streams and creative challenges!',
    favoriteGames: ['Art', 'Music', 'Creative Tools'],
    eventImages: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&h=200&fit=crop'
    ],
    schedule: 'Tue, Thu, Sat - 3PM-7PM EST',
    languages: ['English', 'French']
  },
  { 
    id: 5, 
    name: 'SpeedRunner99', 
    intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    category: 'Action', 
    hasCamera: false, 
    isNew: true, 
    streamFrequency: 'daily', 
    viewers: 15000,
    bio: 'World record holder speedrunner. Watch me break games and set new records live!',
    favoriteGames: ['Minecraft', 'Dark Souls', 'Celeste', 'Hollow Knight'],
    eventImages: [
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop'
    ],
    schedule: 'Daily, 12PM-6PM EST',
    languages: ['English', 'Japanese']
  },
  { 
    id: 6, 
    name: 'MusicVibes', 
    intro: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    category: 'Rhythm and Music', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'weekly', 
    viewers: 5600,
    bio: 'Music producer and rhythm game master. Creating beats and hitting perfect combos live!',
    favoriteGames: ['Beat Saber', 'Guitar Hero', 'DJ Hero', 'Rhythm Heaven'],
    eventImages: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop'
    ],
    schedule: 'Wed, Sat - 8PM-12AM EST',
    languages: ['English']
  },
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
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: 'all',
    cameraOnly: 'any',
    newStreamers: false,
    establishedStreamers: false,
    frequency: 'any',
    viewerRange: null
  });

  const [selectedStreamer, setSelectedStreamer] = useState(MOCK_STREAMERS.filter(s => s.isNew)[0]);
  const [detailView, setDetailView] = useState('overview'); // 'overview' or 'details'
  const [carouselIndex, setCarouselIndex] = useState(0);

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
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-400" />
            Introduce Yourself
          </h2>
          
          {/* Main Streamer Showcase */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-6">
            <div className="flex flex-col lg:flex-row">
              {/* Left: Video/Images */}
              <div className="lg:w-[60%] p-6">
                {/* Main Intro Video */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 group cursor-pointer">
                  <img src={selectedStreamer.intro} alt={selectedStreamer.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </div>
                </div>

                {/* Event/Game Images Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {selectedStreamer.eventImages.map((img, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                      <img src={img} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setDetailView(detailView === 'overview' ? 'details' : 'overview')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    {detailView === 'overview' ? (
                      <>More Details <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <><ChevronLeft className="w-4 h-4" /> Back to Overview</>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Details */}
              <div className="lg:w-[40%] p-6 bg-slate-800/40">
                <AnimatePresence mode="wait">
                  {detailView === 'overview' ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <img src={selectedStreamer.avatar} alt={selectedStreamer.name} className="w-16 h-16 rounded-full border-2 border-blue-400" />
                        <div>
                          <h3 className="text-xl font-bold text-white">{selectedStreamer.name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{selectedStreamer.category}</Badge>
                            {selectedStreamer.isNew && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">NEW</Badge>}
                          </div>
                        </div>
                      </div>

                      <p className="text-white/70 text-sm leading-relaxed">{selectedStreamer.bio}</p>

                      <div>
                        <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          {selectedStreamer.viewers.toLocaleString()} watching now
                        </h4>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold text-sm mb-2">Favorite Games</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedStreamer.favoriteGames.map((game, idx) => (
                            <span key={idx} className="px-3 py-1 bg-slate-700/50 text-white/80 text-xs rounded-full">
                              {game}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full overflow-y-auto space-y-6"
                    >
                      <div 
                        className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-slate-700/20 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => navigate(createPageUrl(`StreamerProfile?id=${selectedStreamer.id}`))}
                      >
                        <img src={selectedStreamer.avatar} alt={selectedStreamer.name} className="w-20 h-20 rounded-full border-2 border-blue-400" />
                        <div>
                          <h3 className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">{selectedStreamer.name}</h3>
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{selectedStreamer.category}</Badge>
                            {selectedStreamer.isNew && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">NEW</Badge>}
                          </div>
                        </div>
                      </div>

                      {/* About Section */}
                      <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">About Me</h4>
                        <p className="text-white/70 text-sm leading-relaxed">{selectedStreamer.bio}</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <div className="text-white/50 text-xs mb-1">Viewers</div>
                          <div className="text-white font-bold text-lg">{selectedStreamer.viewers.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <div className="text-white/50 text-xs mb-1">Frequency</div>
                          <div className="text-white font-bold text-sm capitalize">{selectedStreamer.streamFrequency}</div>
                        </div>
                      </div>

                      {/* Games I Play */}
                      <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Games I Play</h4>
                        <div className="space-y-2">
                          {selectedStreamer.favoriteGames.map((game, idx) => (
                            <div key={idx} className="bg-slate-700/30 rounded-lg p-2 text-white/80 text-sm">
                              {game}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hobbies & Interests */}
                      <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Hobbies & Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">Gaming</span>
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Tech</span>
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">Music</span>
                          <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full">Travel</span>
                        </div>
                      </div>

                      {/* Stream Details */}
                      <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Stream Info</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                              <h5 className="text-white font-semibold text-sm">Schedule</h5>
                              <p className="text-white/60 text-sm">{selectedStreamer.schedule}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                              <h5 className="text-white font-semibold text-sm">Languages</h5>
                              <p className="text-white/60 text-sm">{selectedStreamer.languages.join(', ')}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Camera className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                              <h5 className="text-white font-semibold text-sm">Camera Setup</h5>
                              <p className="text-white/60 text-sm">{selectedStreamer.hasCamera ? 'Camera enabled' : 'No camera'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                        Follow {selectedStreamer.name}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Carousel of Other Streamers */}
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 5))}
                disabled={carouselIndex === 0}
                className="w-12 h-12 rounded-full bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="text-lg font-bold text-white">More Streamers</h3>
              <button
                onClick={() => setCarouselIndex(prev => prev + 5)}
                className="w-12 h-12 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {MOCK_STREAMERS.filter(s => s.isNew).slice(carouselIndex % MOCK_STREAMERS.length, (carouselIndex % MOCK_STREAMERS.length) + 5).map((streamer) => (
                <div
                  key={streamer.id}
                  onClick={() => navigate(createPageUrl(`StreamerProfile?id=${streamer.id}`))}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    selectedStreamer.id === streamer.id 
                      ? 'border-blue-400 ring-2 ring-blue-400/50' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-square">
                    <img src={streamer.avatar} alt={streamer.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="text-white font-bold text-sm truncate">{streamer.name}</h4>
                      <p className="text-white/60 text-xs truncate">{streamer.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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