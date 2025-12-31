import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Video, Camera, CameraOff, Star, Clock, TrendingUp, Users, ChevronLeft, Globe, Calendar, Play, Volume2, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import GameStreamersView from './GameStreamersView';

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
      className="w-[238px] flex-shrink-0 p-5 rounded-3xl h-fit max-h-[calc(100vh-200px)] overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.2) 0%, rgba(100, 116, 139, 0.3) 50%, rgba(71, 85, 105, 0.2) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        boxShadow: '0 8px 32px rgba(71, 85, 105, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <FilterSection title="Categories">
        <div className="relative mb-3">
          <Volume2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500"
          />
        </div>
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

const StreamerIntroCard = ({ streamer, onWatch }) => (
  <div className="group cursor-pointer" onClick={() => onWatch(streamer)}>
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
    viewerRange: null,
    gameSearch: ''
  });

  const [selectedStreamer, setSelectedStreamer] = useState(MOCK_STREAMERS.filter(s => s.isNew)[0]);
  const [detailView, setDetailView] = useState('overview'); // 'overview' or 'details'
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [currentUserName] = useState('ProStreamer_User'); // Mock current user
  const [selectedGame, setSelectedGame] = useState(null);

  // Mock games data
  const MOCK_GAMES = [
    { id: 'game1', title: 'Cyberpunk 2088', viewers: '125K', genre: 'RPG', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop', streamers: 450 },
    { id: 'game2', title: 'Elden Ring', viewers: '98K', genre: 'RPG', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop', streamers: 320 },
    { id: 'game3', title: 'Valorant', viewers: '250K', genre: 'FPS', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop', streamers: 680 },
    { id: 'game4', title: 'Minecraft', viewers: '185K', genre: 'Sandbox', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop', streamers: 520 },
    { id: 'game5', title: 'Apex Legends', viewers: '110K', genre: 'FPS', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop', streamers: 390 },
    { id: 'game6', title: 'Counter-Strike 2', viewers: '95K', genre: 'FPS', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop', streamers: 280 },
    { id: 'game7', title: 'Dota 2', viewers: '88K', genre: 'MOBA', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop', streamers: 210 },
    { id: 'game8', title: 'League of Legends', viewers: '220K', genre: 'MOBA', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop', streamers: 590 },
  ];

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

  const filteredGames = MOCK_GAMES.filter(game => {
    if (filters.gameSearch) {
      return game.title.toLowerCase().includes(filters.gameSearch.toLowerCase()) ||
             game.genre.toLowerCase().includes(filters.gameSearch.toLowerCase());
    }
    if (filters.category !== 'all') {
      return game.genre.toLowerCase().includes(filters.category.toLowerCase());
    }
    return true;
  });

  if (selectedGame) {
    return (
      <AnimatePresence>
        <GameStreamersView 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="flex gap-6 h-full p-6">
      {/* Left Column - Profile Button + Filter Sidebar */}
      <div className="flex flex-col gap-4">
        {/* User Profile Button - Above Categories */}
        <button
          onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-all w-[238px]"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(100, 116, 139, 0.3) 50%, rgba(59, 130, 246, 0.2) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-semibold text-sm">{currentUserName}</span>
            <p className="text-white/50 text-xs">Edit Profile</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>

        <FilterSidebar filters={filters} setFilters={setFilters} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Games Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Video className="w-6 h-6 text-cyan-400" />
            Games
          </h2>
          
          {/* Game Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search games or genres..."
              value={filters.gameSearch}
              onChange={(e) => setFilters(prev => ({ ...prev, gameSearch: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50 backdrop-blur-md"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filteredGames.map(game => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.03, y: -4 }}
                onClick={() => setSelectedGame(game)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img 
                    src={game.image} 
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                  
                  <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 bg-cyan-500/20 backdrop-blur-md rounded text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      {game.genre}
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-sm mb-1">{game.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-white/60">
                        <Users className="w-3 h-3" />
                        {game.viewers}
                      </div>
                      <span className="text-white/40">{game.streamers} streaming</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Streamers List Section */}
        <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-400" />
          Live Streamers
        </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreamers.length > 0 ? (
              filteredStreamers.map(streamer => (
                <StreamerIntroCard 
                  key={streamer.id} 
                  streamer={streamer} 
                  onWatch={(s) => navigate(createPageUrl(`StreamWatch?id=${s.id}`))}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No streamers currently live</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}