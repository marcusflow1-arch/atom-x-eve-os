import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Trophy, Users, X, Star, Clock, Video, Search, Gamepad2, 
  Settings, Bell, ChevronRight, ChevronLeft, User, Library, Mic, 
  ShoppingBag, MessageSquare, Download, Sparkles, Zap, Crown
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ClipsOverlay from '../components/dashboard/ClipsOverlay';
import GameHubOverlay from '../components/dashboard/GameHubOverlay';
import ConsoleHubOverlay from '../components/dashboard/ConsoleHubOverlay';
import { allMockGames } from '../components/store/mockData';

// Featured games data
const featuredGames = [
  {
    id: 1,
    title: "Cyberpunk 2088",
    subtitle: "Night City Awaits",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop",
    logo: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=100&fit=crop",
    genre: "Action RPG",
    rating: 4.8,
    players: "125K playing"
  },
  {
    id: 2,
    title: "Stellar Odyssey",
    subtitle: "Explore the Universe",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200&h=600&fit=crop",
    logo: null,
    genre: "Space Adventure",
    rating: 4.9,
    players: "89K playing"
  },
  {
    id: 3,
    title: "Shadow Legends",
    subtitle: "Your Legend Begins",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop",
    logo: null,
    genre: "Fantasy RPG",
    rating: 4.7,
    players: "200K playing"
  }
];

const recentGames = [
  { id: 1, title: "Cyberpunk 2088", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop", lastPlayed: "2 hours ago", progress: 68 },
  { id: 2, title: "Stellar Odyssey", image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=400&fit=crop", lastPlayed: "Yesterday", progress: 45 },
  { id: 3, title: "Shadow Legends", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop", lastPlayed: "3 days ago", progress: 92 },
  { id: 4, title: "Neon Racing", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop", lastPlayed: "1 week ago", progress: 23 },
  { id: 5, title: "Dragon's Quest", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop", lastPlayed: "2 weeks ago", progress: 100 },
];

const quickActions = [
  { id: 'store', icon: ShoppingBag, label: 'Store', color: 'from-blue-500 to-blue-600', page: 'Store' },
  { id: 'library', icon: Library, label: 'Library', color: 'from-purple-500 to-purple-600', page: 'Library' },
  { id: 'achievements', icon: Trophy, label: 'Achievements', color: 'from-yellow-500 to-amber-600', page: 'Achievements' },
  { id: 'community', icon: Users, label: 'Community', color: 'from-green-500 to-emerald-600', page: 'Community' },
  { id: 'clips', icon: Video, label: 'Clips', color: 'from-pink-500 to-rose-600', page: null },
  { id: 'profile', icon: User, label: 'Profile', color: 'from-cyan-500 to-teal-600', page: 'Profile' },
];

// Glass Card Component
const GlassCard = ({ children, className = "", onClick, hover = true }) => (
  <motion.div
    whileHover={hover ? { scale: 1.02, y: -4 } : {}}
    whileTap={hover ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`
      bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
      ${hover ? 'cursor-pointer hover:bg-white/10 hover:border-white/20' : ''}
      transition-all duration-300 ${className}
    `}
    style={{ WebkitBackdropFilter: 'blur(20px)' }}
  >
    {children}
  </motion.div>
);

// Hero Featured Section (PS5 Style)
const HeroSection = ({ games, currentIndex, setCurrentIndex }) => {
  const game = games[currentIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [games.length, setCurrentIndex]);

  return (
    <div className="relative h-[50vh] min-h-[400px] rounded-3xl overflow-hidden mb-8">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-8 md:p-12">
        <div className="max-w-2xl">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Badge className="mb-4 bg-white/20 backdrop-blur-md border-none text-white">
              <Sparkles className="w-3 h-3 mr-1" /> FEATURED
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
              {game.title}
            </h1>
            <p className="text-xl text-white/80 mb-4">{game.subtitle}</p>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-white font-semibold">{game.rating}</span>
              </div>
              <span className="text-white/60">•</span>
              <span className="text-white/70">{game.genre}</span>
              <span className="text-white/60">•</span>
              <span className="text-green-400 font-medium">{game.players}</span>
            </div>

            <div className="flex gap-3">
              <Button className="bg-white text-black hover:bg-white/90 font-bold px-8 h-12 rounded-xl">
                <Play className="w-5 h-5 mr-2 fill-current" /> Play Now
              </Button>
              <Button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-none font-medium px-6 h-12 rounded-xl">
                More Info
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        {games.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex 
                ? 'bg-white w-8' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + games.length) % games.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % games.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

// Game Tile Component (Xbox Style)
const GameTile = ({ game, size = "normal", onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
        size === "large" ? "aspect-[16/9]" : "aspect-[3/4]"
      }`}
      onClick={onPlay}
    >
      <img
        src={game.image}
        alt={game.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`} />

      {/* Progress Bar */}
      {game.progress !== undefined && (
        <div className="absolute top-3 left-3 right-3">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              style={{ width: `${game.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">
          {game.title}
        </h3>
        {game.lastPlayed && (
          <p className="text-white/60 text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" /> {game.lastPlayed}
          </p>
        )}
      </div>

      {/* Play Button Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Quick Action Button
const QuickActionButton = ({ action, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -4 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-3 group"
  >
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
      <action.icon className="w-7 h-7 text-white" />
    </div>
    <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
      {action.label}
    </span>
  </motion.button>
);

// User Profile Card
const UserProfileCard = ({ user }) => (
  <GlassCard className="p-4 flex items-center gap-4" hover={false}>
    <div className="relative">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-white/20">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User className="w-7 h-7 text-white" />
        )}
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-900" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-bold truncate">{user?.username || 'Player'}</h3>
      <p className="text-white/50 text-sm">Level 42 • Online</p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
        <Bell className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  </GlassCard>
);

// Activity Feed Item
const ActivityItem = ({ activity }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
      {activity.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-medium truncate">{activity.title}</p>
      <p className="text-white/50 text-xs">{activity.time}</p>
    </div>
  </div>
);

// Main Dashboard Component
export default function Dashboard() {
  const { user, isAuthenticated, showSignUp } = useAuth();
  const navigate = useNavigate();
  
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showClips, setShowClips] = useState(false);
  const [showGameHub, setShowGameHub] = useState(false);
  const [showConsoleHub, setShowConsoleHub] = useState(false);

  const activities = [
    { icon: <Trophy className="w-5 h-5 text-yellow-400" />, title: "Achievement Unlocked: Master Explorer", time: "2 hours ago" },
    { icon: <Users className="w-5 h-5 text-blue-400" />, title: "JaxRipper joined your party", time: "3 hours ago" },
    { icon: <Download className="w-5 h-5 text-green-400" />, title: "Cyberpunk 2088 update installed", time: "5 hours ago" },
    { icon: <Crown className="w-5 h-5 text-purple-400" />, title: "Reached Diamond rank in PvP", time: "Yesterday" },
  ];

  const handleQuickAction = (action) => {
    if (action.id === 'clips') {
      setShowClips(true);
    } else if (action.page) {
      navigate(createPageUrl(action.page));
    }
  };

  if (showSignUp) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-4 md:px-8 py-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              ATOM×EVE
            </h1>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 w-80">
              <Search className="w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search games, friends, content..."
                className="bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm flex-1"
              />
              <Mic className="w-4 h-4 text-white/40 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>

          {/* User Profile Card */}
          <div className="w-80">
            <UserProfileCard user={user} />
          </div>
        </div>

        {/* Quick Actions - Horizontal Strip (Xbox Style) */}
        <div className="flex items-center justify-center gap-8 mb-8 py-4">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => handleQuickAction(action)}
            />
          ))}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Hero Featured Section */}
          <div className="col-span-12 lg:col-span-8">
            <HeroSection 
              games={featuredGames} 
              currentIndex={featuredIndex} 
              setCurrentIndex={setFeaturedIndex} 
            />

            {/* Recent Games Row */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Continue Playing
                </h2>
                <button className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recentGames.map((game) => (
                  <div key={game.id} className="w-[180px] flex-shrink-0">
                    <GameTile game={game} onPlay={() => console.log('Play', game.title)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Game Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-5 text-center" onClick={() => navigate(createPageUrl('Store'))}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-1">New Releases</h3>
                <p className="text-white/50 text-sm">12 new games</p>
              </GlassCard>

              <GlassCard className="p-5 text-center" onClick={() => navigate(createPageUrl('Store'))}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-bold mb-1">AI Enhanced</h3>
                <p className="text-white/50 text-sm">8 games</p>
              </GlassCard>

              <GlassCard className="p-5 text-center" onClick={() => navigate(createPageUrl('Store'))}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-white font-bold mb-1">Multiplayer</h3>
                <p className="text-white/50 text-sm">24 games</p>
              </GlassCard>

              <GlassCard className="p-5 text-center" onClick={() => navigate(createPageUrl('Store'))}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-white font-bold mb-1">Free to Play</h3>
                <p className="text-white/50 text-sm">15 games</p>
              </GlassCard>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Friends Online */}
            <GlassCard className="p-5" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Friends Online
                </h3>
                <Badge className="bg-green-500/20 text-green-400 border-none">12</Badge>
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 overflow-hidden">
                        <img 
                          src={`https://i.pravatar.cc/100?u=friend${i}`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">Player{i}</p>
                      <p className="text-white/40 text-xs truncate">Playing Cyberpunk 2088</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl">
                View All Friends
              </Button>
            </GlassCard>

            {/* Activity Feed */}
            <GlassCard className="p-5" hover={false}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Recent Activity
              </h3>
              
              <div className="space-y-1">
                {activities.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))}
              </div>
            </GlassCard>

            {/* Stats Card */}
            <GlassCard className="p-5" hover={false}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Your Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">247</p>
                  <p className="text-white/50 text-xs">Achievements</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">1,847</p>
                  <p className="text-white/50 text-xs">Hours Played</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">89</p>
                  <p className="text-white/50 text-xs">Games Owned</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">42</p>
                  <p className="text-white/50 text-xs">Level</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showClips && <ClipsOverlay isVisible={true} onClose={() => setShowClips(false)} />}
        {showGameHub && <GameHubOverlay isVisible={true} onClose={() => setShowGameHub(false)} />}
        {showConsoleHub && <ConsoleHubOverlay isVisible={true} onClose={() => setShowConsoleHub(false)} />}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}