import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Trophy, Users, Settings, Search, Bell, ChevronRight, ChevronDown,
  Star, Clock, Gift, Target, Swords, Shield, Zap, Crown, Flame,
  MessageSquare, UserPlus, Volume2, VolumeX, Gamepad2, Store, Calendar,
  CheckCircle, Circle, Lock, Sparkles, TrendingUp, Award, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../components/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Quest Item Component
const QuestItem = ({ quest, isComplete }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group ${
      isComplete 
        ? 'bg-green-500/10 border border-green-500/30' 
        : 'bg-black/30 border border-white/5 hover:bg-white/5 hover:border-white/10'
    }`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
      isComplete ? 'bg-green-500' : 'bg-slate-700'
    }`}>
      {isComplete ? (
        <CheckCircle className="w-5 h-5 text-white" />
      ) : (
        <Circle className="w-5 h-5 text-slate-400" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className={`text-sm font-semibold truncate ${isComplete ? 'text-green-400' : 'text-white'}`}>
        {quest.title}
      </h4>
      <p className="text-xs text-slate-400">{quest.description}</p>
    </div>
    {quest.reward && (
      <div className="flex items-center gap-1 text-yellow-400">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-bold">{quest.reward}</span>
      </div>
    )}
  </motion.div>
);

// Weekly Quest with Progress
const WeeklyQuestItem = ({ quest }) => (
  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
          WEEKLY
        </Badge>
        <span className="text-xs text-slate-400">{quest.progress}/{quest.total}</span>
      </div>
      <span className="text-xs text-yellow-400 font-bold">+{quest.xp} XP</span>
    </div>
    <h4 className="text-sm font-semibold text-white mb-2">{quest.title}</h4>
    <Progress value={(quest.progress / quest.total) * 100} className="h-1.5 bg-slate-700" />
  </div>
);

// Friend Item Component
const FriendItem = ({ friend }) => (
  <motion.div
    whileHover={{ x: 3 }}
    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
  >
    <div className="relative">
      <img
        src={friend.avatar}
        alt={friend.name}
        className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
      />
      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
        friend.status === 'online' ? 'bg-green-500' :
        friend.status === 'in-game' ? 'bg-blue-500' :
        friend.status === 'away' ? 'bg-yellow-500' : 'bg-slate-500'
      }`} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-white truncate">{friend.name}</h4>
      <p className="text-xs text-slate-400 truncate">{friend.activity}</p>
    </div>
  </motion.div>
);

// Promo Card Component
const PromoCard = ({ promo }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="relative rounded-xl overflow-hidden cursor-pointer group"
  >
    <img
      src={promo.image}
      alt={promo.title}
      className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <Badge className="mb-2 bg-red-500 text-white border-none text-[10px] font-bold">
        {promo.badge}
      </Badge>
      <h3 className="text-white font-bold text-sm">{promo.title}</h3>
    </div>
  </motion.div>
);

// Nav Item Component
const NavItem = ({ icon: Icon, label, isActive, badge, onClick }) => (
  <motion.button
    whileHover={{ y: -2 }}
    onClick={onClick}
    className={`relative px-4 py-2 flex items-center gap-2 text-sm font-semibold transition-all ${
      isActive 
        ? 'text-white' 
        : 'text-slate-400 hover:text-white'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    <span>{label}</span>
    {badge && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
        {badge}
      </span>
    )}
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    )}
  </motion.button>
);

// Matchmaking Panel Component
const MatchmakingPanel = ({ gameMode, onCancel, isSearching, time }) => (
  <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] mb-1">
          CLASSIC
        </Badge>
        <h3 className="text-xl font-black text-white">{gameMode}</h3>
      </div>
      <div className="text-right">
        <p className="text-2xl font-mono text-white">{time}</p>
        <p className="text-xs text-cyan-400 animate-pulse">SEARCHING...</p>
      </div>
    </div>
    
    <div className="mb-3">
      <p className="text-xs text-slate-400 mb-2">Preferred Role:</p>
      <div className="flex gap-2">
        {['Carry', 'Solo', 'Middle', 'Support', 'Jungle'].map((role, i) => (
          <button
            key={role}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              i < 2 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
    
    <Button
      onClick={onCancel}
      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600"
    >
      CANCEL SEARCH
    </Button>
  </div>
);

// Main Home Component
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('home');
  const [isMuted, setIsMuted] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState('00:00');
  const [selectedGameMode, setSelectedGameMode] = useState('CONQUEST');

  // Search timer effect
  useEffect(() => {
    if (!isSearching) return;
    
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setSearchTime(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching]);

  // Mock Data
  const dailyQuests = [
    { id: 1, title: 'Wandering Market', description: 'First Win of the Day 1/1', isComplete: true, reward: '100' },
    { id: 2, title: 'Wandering Market', description: 'Slay 40/40 Minions', isComplete: true, reward: '50' },
    { id: 3, title: 'Wandering Market', description: 'Knockup Gods for 0/10 seconds', isComplete: false, reward: '1,000' },
  ];

  const weeklyQuests = [
    { id: 1, title: 'Weekly Quest 1 of 3', description: 'Play 4/4 games of SMITE 2', progress: 4, total: 4, xp: 300 },
  ];

  const friends = [
    { id: 1, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=shadow', status: 'online', activity: 'In Lobby' },
    { id: 2, name: 'NeonBlade', avatar: 'https://i.pravatar.cc/150?u=neon', status: 'in-game', activity: 'Playing Conquest' },
    { id: 3, name: 'CyberPhantom', avatar: 'https://i.pravatar.cc/150?u=cyber', status: 'away', activity: 'Away' },
    { id: 4, name: 'VoidWalker', avatar: 'https://i.pravatar.cc/150?u=void', status: 'offline', activity: 'Offline' },
  ];

  const promos = [
    { id: 1, title: "Last Chance: BIG Discounts!", badge: 'SALE', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop' },
  ];

  const userStats = {
    level: 75,
    currency1: 2565,
    currency2: 7450,
    username: user?.username || 'Player',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950/30 to-purple-950/20" />
        {/* Particle Effect Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-50">
        <div className="flex items-center justify-between px-6 py-2 bg-black/40 backdrop-blur-md border-b border-white/5">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ATOM×EVE
            </h1>
            
            {/* Main Nav */}
            <nav className="flex items-center">
              <NavItem label="HOME" isActive={activeNav === 'home'} onClick={() => setActiveNav('home')} />
              <NavItem label="GODS" badge="2" isActive={activeNav === 'gods'} onClick={() => navigate(createPageUrl('Library'))} />
              <NavItem label="SEASON" isActive={activeNav === 'season'} onClick={() => navigate(createPageUrl('Events'))} />
              <NavItem label="STORE" isActive={activeNav === 'store'} onClick={() => navigate(createPageUrl('Store'))} />
              <NavItem label="PROFILE" badge="3" isActive={activeNav === 'profile'} onClick={() => navigate(createPageUrl('Profile'))} />
              <NavItem label="EVENTS" isActive={activeNav === 'events'} onClick={() => navigate(createPageUrl('Challenges'))} />
            </nav>
          </div>

          {/* Event Badges */}
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              POLAR PRANKSTER
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 px-3 py-1">
              <Gift className="w-3 h-3 mr-1" />
              CHEST AVAILABLE
            </Badge>
            <Badge className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30 px-3 py-1">
              <Flame className="w-3 h-3 mr-1" />
              YULEFEST
            </Badge>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
              <img
                src={user?.avatar_url || 'https://i.pravatar.cc/150?u=player'}
                alt="Player"
                className="w-8 h-8 rounded-full border-2 border-cyan-500"
              />
              <div>
                <p className="text-sm font-bold text-white">{userStats.username}</p>
                <p className="text-xs text-slate-400">LEVEL {userStats.level}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 bg-black/30 rounded-lg px-3 py-1.5 border border-white/5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500" />
                <span className="font-bold">{userStats.currency1.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 bg-black/30 rounded-lg px-3 py-1.5 border border-white/5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                <span className="font-bold">{userStats.currency2.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-56px)]">
        
        {/* Left Panel - Quests */}
        <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-white/5 bg-black/20">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              QUESTS
            </h2>
            <div className="space-y-2">
              {dailyQuests.map((quest) => (
                <QuestItem key={quest.id} quest={quest} isComplete={quest.isComplete} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              WEEKLY QUESTS
            </h2>
            <div className="space-y-2">
              {weeklyQuests.map((quest) => (
                <WeeklyQuestItem key={quest.id} quest={quest} />
              ))}
            </div>
          </div>

          {/* Matchmaking Section */}
          <div className="pt-4 border-t border-white/5">
            {isSearching ? (
              <MatchmakingPanel
                gameMode={selectedGameMode}
                time={searchTime}
                isSearching={isSearching}
                onCancel={() => setIsSearching(false)}
              />
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedGameMode}
                  onChange={(e) => setSelectedGameMode(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="CONQUEST">CONQUEST</option>
                  <option value="ARENA">ARENA</option>
                  <option value="JOUST">JOUST</option>
                  <option value="ASSAULT">ASSAULT</option>
                </select>
                <Button
                  onClick={() => setIsSearching(true)}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-lg shadow-lg shadow-cyan-500/25"
                >
                  <Play className="w-5 h-5 mr-2" fill="currentColor" />
                  PLAY
                </Button>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Region: N. America - East</span>
              <div className="flex items-center gap-2">
                <button className="hover:text-white transition-colors">ESC</button>
                <button className="hover:text-white transition-colors">Options</button>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Character Showcase */}
        <div className="flex-1 relative flex items-end justify-center pb-8">
          {/* Character Display Area */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Circular Platform */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-8 bg-cyan-500/30 rounded-full blur-md" />
            </div>

            {/* 3D Character Placeholder */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <iframe 
                title="Character Model" 
                frameBorder="0" 
                allowFullScreen 
                mozallowfullscreen="true" 
                webkitallowfullscreen="true" 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                src="https://sketchfab.com/models/a6493956f268493c8e40db5bbbca140f/embed?autostart=1&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_hint=0&transparent=1"
                className="w-full h-full"
                style={{ background: 'transparent' }}
              />
            </div>
          </div>

          {/* Featured Skin Banner */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 backdrop-blur-md rounded-xl px-8 py-4 border border-white/10 flex items-center gap-6"
            >
              <div className="text-center">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] font-bold mb-1">
                  NEW SKIN!
                </Badge>
                <h3 className="text-lg font-black text-white">Winter's Wish</h3>
                <p className="text-sm text-slate-400">Legendary Collection</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors z-20"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Right Panel - Friends & Promos */}
        <div className="w-72 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-l border-white/5 bg-black/20">
          {/* Friends Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" />
                FRIENDS
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {friends.filter(f => f.status !== 'offline').length} online
                </span>
                <button className="p-1 hover:bg-white/5 rounded transition-colors">
                  <UserPlus className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {friends.map((friend) => (
                <FriendItem key={friend.id} friend={friend} />
              ))}
            </div>
          </div>

          {/* Promotional Content */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              FEATURED
            </h2>
            <div className="space-y-3">
              {promos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="bg-black/30 border-white/10 text-white hover:bg-white/10 text-xs h-9"
              onClick={() => navigate(createPageUrl('Store'))}
            >
              <Store className="w-3 h-3 mr-1" />
              Store
            </Button>
            <Button
              variant="outline"
              className="bg-black/30 border-white/10 text-white hover:bg-white/10 text-xs h-9"
              onClick={() => navigate(createPageUrl('Achievements'))}
            >
              <Trophy className="w-3 h-3 mr-1" />
              Rewards
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-white/5 px-6 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-green-400" />
            Connected
          </span>
          <span>v2.0.1</span>
        </div>
        <div className="text-xs text-slate-500">
          ATOM×EVE <span className="text-cyan-400 font-bold">BETA</span> - NOT FINAL
        </div>
      </div>
    </div>
  );
}