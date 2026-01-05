import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Compass, Radio, Gamepad2, Search, SlidersHorizontal,
  Play, Users, Eye, ChevronLeft, ChevronRight, Settings,
  Bell, Calendar, Heart, Share2, Twitter, Instagram, MessageCircle,
  ExternalLink, Gift, Star, Trophy, Lock, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trendingGames, newReleases, classicBestSellers, aiGamesList, androidGames } from '@/components/store/mockData';

// Mock Data
const mockStreamers = [
  {
    id: 1,
    name: 'Ava Morrison',
    tagline: 'Science nerd meets competitive gamer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    isLive: true,
    followers: 6234,
    bio: 'PhD student studying marine biology by day, competitive FPS player by night.'
  },
  {
    id: 2,
    name: 'Jordan Chen',
    tagline: 'Chill vibes and good gameplay',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    isLive: true,
    followers: 1800
  },
  {
    id: 3,
    name: 'Sam Rivers',
    tagline: 'Tournament Practice | Midcard',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    isLive: true,
    followers: 3200
  }
];

const mockGames = [
  {
    id: 1,
    name: 'Valorant',
    category: 'FPS',
    viewers: 45000,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'
  },
  {
    id: 2,
    name: 'Counter-Strike 2',
    category: 'FPS',
    viewers: 38000,
    image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400'
  },
  {
    id: 3,
    name: 'Apex Legends',
    category: 'FPS',
    viewers: 28000,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'
  },
  {
    id: 4,
    name: 'Call of Duty',
    category: 'FPS',
    viewers: 22000,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'
  },
  {
    id: 5,
    name: 'Overwatch 2',
    category: 'FPS',
    viewers: 15000,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400'
  }
];

const mockStreams = [
  {
    id: 1,
    title: 'Ranked Grind - Road to Radiant',
    streamer: 'ProGamer123',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    viewers: 2500,
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    isLive: true
  },
  {
    id: 2,
    title: 'Chill vibes and good gameplay',
    streamer: 'StreamQueen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    viewers: 1800,
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    isLive: true
  },
  {
    id: 3,
    title: 'Tournament Practice | Midcard',
    streamer: 'TacticalSheep',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    viewers: 3200,
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    isLive: true
  }
];

// Genre Scroll Section Component
const GenreScrollSection = ({ title, games, onGameClick }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6">{title}</h2>
      <div className="relative group">
        {/* Left Arrow */}
        <motion.button
          initial={{ opacity: 0.3 }}
          whileHover={{ opacity: 1 }}
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            showLeftArrow ? 'opacity-30 group-hover:opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>

        {/* Right Arrow */}
        <motion.button
          initial={{ opacity: 0.3 }}
          whileHover={{ opacity: 1 }}
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            showRightArrow ? 'opacity-30 group-hover:opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </motion.button>

        {/* Scrollable Games */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {games.map((game) => (
            <motion.div
              key={game.id}
              onClick={() => onGameClick(game)}
              className="relative rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 w-48"
              whileHover={{ scale: 1.05 }}
              style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <div className="aspect-[3/4] relative">
                <img
                  src={game.cover_image}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">{game.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-cyan-400">
                    <span>{game.genre}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default function Aura() {
  const [activeTab, setActiveTab] = useState('discover');
  const [activeSetupTab, setActiveSetupTab] = useState('video');
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Nav Items
  const navItems = [
    { id: 'home', icon: Home },
    { id: 'discover', icon: Compass },
    { id: 'live', icon: Radio },
    { id: 'games', icon: Gamepad2 },
    { id: 'notifications', icon: Bell },
    { id: 'settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2640 50%, #0f1c35 100%)' }}>
      {/* Sidebar */}
      <div className="w-16 flex flex-col items-center py-6 gap-6" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {/* Logo */}
        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
          <Radio className="w-6 h-6 text-white" />
        </div>

        <div className="h-px w-8 bg-white/10" />

        {/* Nav Items */}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSelectedGame(null);
              setSelectedStreamer(null);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === item.id
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-4" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xl font-bold text-white">Aura</span>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'home' ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'discover' ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab('live')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'live' ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Live Now
                </button>
                <button
                  onClick={() => setActiveTab('games')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'games' ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  Games
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-all">
                <Bell className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-all">
                <Settings className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
                <span className="text-sm text-white font-medium">marcus flowers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'discover' && !selectedStreamer && (
              <motion.div
                key="discover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                      Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Authentic Voices</span>
                    </h1>
                    <p className="text-white/60 text-lg">
                      Find streamers who share your passions and values. It's not about the numbers—it's about connection.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, bio, or interests..."
                        className="w-full pl-12 pr-4 py-6 rounded-2xl text-white placeholder:text-white/40 border-white/10"
                        style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
                      />
                    </div>
                    <Button
                      className="px-6 py-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    >
                      <SlidersHorizontal className="w-5 h-5 mr-2" />
                      Filters
                    </Button>
                  </div>

                  <p className="text-white/40 text-sm mb-6">Found {mockStreamers.length} streamers</p>

                  {/* Streamer Cards */}
                  <div className="grid grid-cols-3 gap-6">
                    {mockStreamers.map((streamer) => (
                      <motion.div
                        key={streamer.id}
                        onClick={() => setSelectedStreamer(streamer)}
                        className="relative rounded-3xl overflow-hidden cursor-pointer group"
                        style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {streamer.isLive && (
                          <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-red-500 flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-white text-xs font-bold uppercase tracking-wider">LIVE</span>
                          </div>
                        )}
                        
                        <div className="aspect-[3/4] relative">
                          <img
                            src={streamer.avatar}
                            alt={streamer.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h3 className="text-xl font-bold text-white mb-1">{streamer.name}</h3>
                            <p className="text-white/70 text-sm mb-3">{streamer.tagline}</p>
                            <div className="flex items-center gap-2 text-white/50 text-sm">
                              <Users className="w-4 h-4" />
                              <span>{streamer.followers.toLocaleString()} followers</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'games' && !selectedGame && (
              <motion.div
                key="games"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto pt-8"
              >
                <div className="px-8 pb-12">
                  <h1 className="text-4xl font-bold text-white mb-2">BROWSE GAMES</h1>
                  <p className="text-white/60 mb-8">Find streams by your favorite games</p>

                  {/* Search */}
                  <div className="relative mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      placeholder="Search for a game..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder:text-white/40 border-white/10"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
                    />
                  </div>

                  {/* Genre Sections with Horizontal Scroll */}
                  <GenreScrollSection title="Trending Games" games={trendingGames} onGameClick={setSelectedGame} />
                  <GenreScrollSection title="New Releases" games={newReleases} onGameClick={setSelectedGame} />
                  <GenreScrollSection title="Classic Best Sellers" games={classicBestSellers} onGameClick={setSelectedGame} />
                  <GenreScrollSection title="AI Enhanced" games={aiGamesList} onGameClick={setSelectedGame} />
                  <GenreScrollSection title="Mobile Games" games={androidGames} onGameClick={setSelectedGame} />
                </div>
              </motion.div>
            )}

            {selectedGame && (
              <motion.div
                key="game-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                <div className="max-w-7xl mx-auto">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Games
                  </button>

                  <div className="flex items-center gap-4 mb-8">
                    <img src={selectedGame.image} alt={selectedGame.name} className="w-20 h-20 rounded-xl object-cover" />
                    <div>
                      <h1 className="text-3xl font-bold text-white uppercase">{selectedGame.name}</h1>
                      <div className="flex items-center gap-2 text-white/50">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span>{selectedGame.viewers.toLocaleString()} viewers</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Streams Grid */}
                  <div className="grid grid-cols-3 gap-6">
                    {mockStreams.map((stream) => (
                      <motion.div
                        key={stream.id}
                        className="relative rounded-2xl overflow-hidden cursor-pointer group"
                        style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="aspect-video relative">
                          <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-red-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span className="text-white text-xs font-bold uppercase">LIVE</span>
                          </div>
                          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-sm flex items-center gap-1 text-white text-xs">
                            <Eye className="w-3 h-3" />
                            <span>{stream.viewers.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="p-4 flex items-start gap-3">
                          <img src={stream.avatar} alt={stream.streamer} className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <h3 className="text-white font-semibold line-clamp-1">{stream.title}</h3>
                            <p className="text-white/60 text-sm">{stream.streamer}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedStreamer && (
              <motion.div
                key="streamer-profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-y-auto"
              >
                {/* Hero Section */}
                <div className="relative h-64">
                  <img
                    src={selectedStreamer.cover || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a1628]" />
                </div>

                {/* Profile Info */}
                <div className="max-w-7xl mx-auto px-8 -mt-32 relative z-10">
                  <div className="flex items-end gap-6 mb-8">
                    <div className="relative">
                      <img
                        src={selectedStreamer.avatar}
                        alt={selectedStreamer.name}
                        className="w-40 h-40 rounded-3xl border-4 border-[#0a1628] object-cover"
                      />
                      {selectedStreamer.isLive && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500 flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span className="text-white text-xs font-bold uppercase">LIVE</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <h1 className="text-4xl font-bold text-white mb-2">{selectedStreamer.name}</h1>
                      <p className="text-white/70 text-lg italic mb-4">"{selectedStreamer.tagline}"</p>
                      <div className="flex items-center gap-3 text-white/60 mb-4">
                        <Users className="w-5 h-5" />
                        <span>{selectedStreamer.followers.toLocaleString()} followers</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                          <Heart className="w-4 h-4 mr-2" />
                          Follow
                        </Button>
                        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Bell className="w-4 h-4 mr-2" />
                          Notify
                        </Button>
                        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 mb-8">
                    {[Twitter, Instagram, MessageCircle].map((Icon, i) => (
                      <button
                        key={i}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-3 gap-6 mb-12">
                    {/* Left Column - Games */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">GAMES PLAYE</h2>
                        <button className="text-white/60 hover:text-white">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {['Valorant', 'Counter-Strike 2'].map((game, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                            <img src={mockGames[i].image} alt={game} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <p className="text-white font-semibold text-sm">{game}</p>
                              <p className="text-white/40 text-xs">FPS</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Middle Column - Stream */}
                    <div className="relative">
                      <div className="aspect-video rounded-2xl bg-slate-800 flex items-center justify-center mb-4 overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600"
                          alt="Stream"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </button>
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-red-500 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span className="text-white text-xs font-bold">LIVE</span>
                        </div>
                      </div>
                      <p className="text-center text-white/60 text-sm">Click Play to Watch</p>
                    </div>

                    {/* Right Column - Chat */}
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Live Chat</h2>
                      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div className="p-4 border-b border-white/10">
                          <h3 className="text-white font-semibold text-sm mb-2">Chat Rules</h3>
                          <ul className="text-white/60 text-xs space-y-1">
                            <li>• Be respectful to everyone</li>
                            <li>• No spam or self-promotion</li>
                            <li>• Keep it positive and fun</li>
                          </ul>
                        </div>
                        <div className="p-4 space-y-3 h-64 overflow-y-auto">
                          {['Luna', 'Alex', 'Jordan', 'Sam'].map((name, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-semibold text-sm">{name}</span>
                                  <span className="text-white/40 text-xs">4:32 PM</span>
                                </div>
                                <p className="text-white/80 text-sm">
                                  {i === 0 ? 'Hey everyone! Thanks for joining!' : 
                                   i === 1 ? 'Love this game!' :
                                   i === 2 ? 'First time here, this is awesome' : 
                                   'That was close!'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-white/10">
                          <Input
                            placeholder="Send a message..."
                            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About Section */}
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">About Me</h2>
                    <p className="text-white/70 text-lg leading-relaxed mb-6">
                      {selectedStreamer.bio || 'PhD student studying marine biology by day, competitive FPS player by night. I love the challenge of games that require precision and strategy, just like research.'}
                    </p>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {/* Exclusive Deals */}
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Gift className="w-5 h-5 text-purple-400" />
                          <h3 className="text-white font-bold">Exclusive Deals & Codes</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Gaming Store</p>
                            <div className="flex items-center gap-2">
                              <code className="text-lg font-mono font-bold text-purple-300">AURA10</code>
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">10% OFF</Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-white/60 mb-1">Streaming Platform</p>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-300 font-semibold">Free Month Trial</span>
                              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">SPECIAL OFFER</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Things I Love */}
                      <div className="p-6 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="w-5 h-5 text-pink-400" />
                          <h3 className="text-white font-bold">Things I Love</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Marine Biology', 'Competitive Gaming', 'Ocean Conservation'].map((tag, i) => (
                            <Badge key={i} className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Season Pass Section */}
                  <div className="mb-12">
                    <div className="p-8 rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">PILOT</Badge>
                            <span className="text-white/60 text-sm">Level 7 / 50</span>
                            <span className="text-white/60 text-sm">Season 0</span>
                          </div>
                          <h2 className="text-3xl font-bold text-white">AURA MASTERY</h2>
                          <p className="text-white/60">Level 7 / 50 • Season 0 Pass</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm mb-1">FRESH XP</p>
                          <p className="text-4xl font-bold text-white">78 <span className="text-white/40">/ 100</span></p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: '78%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>

                      {/* Rewards */}
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <h3 className="text-xl font-bold text-white">EXCLUSIVE SEASON REWARDS</h3>
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                          {[1, 4, 6, 7, 10, 11].map((level, i) => {
                            const isUnlocked = level <= 7;
                            return (
                              <div
                                key={i}
                                className={`relative aspect-square rounded-xl overflow-hidden ${
                                  isUnlocked ? 'opacity-100' : 'opacity-40'
                                }`}
                                style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                              >
                                <div className="absolute top-2 left-2">
                                  <Badge className={`text-[10px] ${level <= 3 ? 'bg-orange-500/80' : i === 4 ? 'bg-pink-500/80' : i === 5 ? 'bg-orange-500/80' : 'bg-pink-500/80'}`}>
                                    {level <= 3 ? 'LEGENDARY' : level === 6 ? 'EPIC' : 'LEGENDARY'}
                                  </Badge>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3].map((star) => (
                                      <Star key={star} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    ))}
                                  </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {isUnlocked ? (
                                    <Check className="w-8 h-8 text-green-400" />
                                  ) : (
                                    <Lock className="w-8 h-8 text-white/40" />
                                  )}
                                </div>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-white text-[10px] font-bold text-center">
                                    AURA MASTERY Reward {level}
                                  </p>
                                  <p className="text-white/60 text-[9px] text-center">
                                    Exclusive Season reward for reaching rank {level}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-4xl font-bold text-white mb-8">Welcome to Aura</h1>
                  <p className="text-white/60 text-lg">Your streaming platform is ready. Explore features and start streaming!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}