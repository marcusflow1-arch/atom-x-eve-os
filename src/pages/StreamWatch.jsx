import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  X, Send, Trophy, Star, Gift, Award, Crown, Users, Flame, Zap, 
  Settings, Shield, Ban, MessageSquare, AlertTriangle, CheckCircle,
  Play, Pause, Volume2, VolumeX, UserPlus, Heart, Hash, Gamepad2,
  Calendar, Clock, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShinyCard from '@/components/shared/ShinyCard';

// --- MOCK DATA ---

const MOCK_STREAMER = {
  id: 1, 
  name: 'ProGamer_Elite', 
  intro_video: 'https://cdn.coverr.co/videos/coverr-person-playing-video-games-5234/1080p.mp4', 
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  category: 'FPS', 
  game: 'Counter-Strike 2',
  viewers: 12500,
  bio: "Tactical genius with a love for high-stakes plays. I hunt rare weapon skins and coach new players on weekends.",
  tags: ['Competitive', 'Skin Collector', 'Coach', 'High Skill'],
  focus: 'Card Hunter', // Stream Identity Mode
  recent_games: ['Valorant', 'Apex Legends', 'The Finals'],
  schedule: 'Mon-Fri 7PM EST',
  interests: ['Mechanical Keyboards', 'Coffee', 'Sci-Fi Novels']
};

const MOCK_CHAT = [
  { id: 1, user: 'Viewer123', message: 'That intro was clean!', timestamp: '10:23' },
  { id: 2, user: 'FanGamer', message: 'Ready for the card hunt?', timestamp: '10:24' },
  { id: 3, user: 'ProWatcher', message: 'Lets goooo', timestamp: '10:25' }
];

const STREAM_MODES = {
  'Card Hunter': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Trophy },
  'Explorer': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Calendar },
  'Completionist': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: CheckCircle },
  'Strategist': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: LayoutGrid },
  'Economy Expert': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Zap },
};

// --- COMPONENTS ---

const IntroPlayer = ({ src, poster }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative w-full h-full group bg-black">
      <video 
        src={src} 
        poster={poster}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        autoPlay
        muted={isMuted}
        loop
        playsInline
      />
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const StreamerIdentityCard = ({ streamer, onWatchStream }) => {
  const ModeIcon = STREAM_MODES[streamer.focus]?.icon || Star;
  const modeStyle = STREAM_MODES[streamer.focus] || STREAM_MODES['Strategist'];

  return (
    <div className="h-full flex flex-col justify-between p-6 md:p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden">
      {/* Background Decor */}
      <div className={`absolute top-0 right-0 w-64 h-64 ${modeStyle.bg} blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

      <div>
        {/* Header: Name & Badge */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={streamer.avatar} alt={streamer.name} className="w-16 h-16 rounded-2xl border-2 border-white/10 shadow-lg object-cover" />
              <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-900 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">{streamer.name}</h1>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${modeStyle.bg} ${modeStyle.border} border mt-1`}>
                <ModeIcon className={`w-3 h-3 ${modeStyle.color}`} />
                <span className={`text-xs font-bold ${modeStyle.color}`}>{streamer.focus}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
             <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs">
               <UserPlus className="w-3 h-3 mr-2" /> Add Friend
             </Button>
             <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs text-pink-400 hover:text-pink-300">
               <Heart className="w-3 h-3 mr-2" /> Follow
             </Button>
          </div>
        </div>

        {/* Bio */}
        <p className="text-slate-300 leading-relaxed text-sm mb-6 max-w-lg">
          "{streamer.bio}"
        </p>

        {/* Tags & Interests */}
        <div className="space-y-4">
          <div>
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Stream Focus</h4>
            <div className="flex flex-wrap gap-2">
              {streamer.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-slate-300 border-white/5">
                  <Hash className="w-3 h-3 mr-1 opacity-50" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Real Life Interests</h4>
            <div className="flex flex-wrap gap-2">
              {streamer.interests.map(interest => (
                <span key={interest} className="text-xs text-slate-400 bg-black/20 px-2 py-1 rounded border border-white/5">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Area */}
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          <p>Currently playing <span className="text-white font-bold">{streamer.game}</span></p>
          <p>{streamer.viewers.toLocaleString()} viewers waiting</p>
        </div>
        <Button 
          onClick={onWatchStream}
          className="bg-white text-black hover:bg-slate-200 font-bold px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105"
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          Enter Live Stream
        </Button>
      </div>
    </div>
  );
};

export default function StreamWatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamerId = searchParams.get('id');
  const [viewState, setViewState] = useState('intro'); // 'intro' or 'live'
  const [chatMessage, setChatMessage] = useState('');
  
  const streamer = MOCK_STREAMER; // In real app, find by ID

  const handleEnterStream = () => {
    setViewState('live');
    // Scroll to live section or just switch view? Instruction says "Step 4: Stream Engagement... Viewer enters live stream".
    // "Introduction Section (Top) ... Stream & Games Section (Below)".
    // Let's scroll smooth to the live section if it's below, or reveal it.
    // Actually, distinct states might be cleaner for the "Entry Point" feeling.
    // But instructions say "Introduction Section... Below Introduction: Stream & Games".
    // This implies a single page scroll.
    // Let's implement auto-scroll.
    const liveSection = document.getElementById('live-section');
    if (liveSection) {
      liveSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Profile Preview State
  if (viewState === 'intro') {
    return (
      <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 opacity-30">
          <img src={streamer.avatar} className="w-full h-full object-cover blur-3xl scale-150" />
        </div>

        {/* Back Button */}
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Visual Hero */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
              >
                <img 
                  src={streamer.avatar} 
                  alt={streamer.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                
                <div className="absolute top-6 left-6 px-4 py-2 bg-red-500 rounded-full flex items-center gap-2 font-bold text-white shadow-lg">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  LIVE NOW
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                  <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
                    {streamer.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{streamer.focus}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                      <Users className="w-4 h-4 text-white" />
                      <span className="text-white font-bold text-sm">{streamer.viewers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Profile Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">About</h3>
                  <p className="text-white/90 leading-relaxed text-lg">
                    {streamer.bio}
                  </p>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Recent Games</h3>
                  <div className="flex flex-wrap gap-2">
                    {streamer.recent_games.map((game, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white cursor-pointer hover:bg-white/20 transition-all"
                      >
                        <Gamepad2 className="w-3 h-3 inline mr-2 opacity-60" />
                        {game}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Stream Schedule</h3>
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">{streamer.schedule}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button className="flex-1 py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    Follow
                  </button>
                </div>
              </div>

              <motion.button
                onClick={handleEnterStream}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-6 rounded-2xl font-black text-xl uppercase tracking-wider relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 1) 100%)',
                  boxShadow: '0 20px 60px rgba(239, 68, 68, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10 flex items-center justify-center gap-3 text-white">
                  <Play className="w-6 h-6 fill-white" />
                  Enter Live Stream
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Live Stream State
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-[1800px] mx-auto p-6 space-y-8">
        {/* Stream + Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stream Player - 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video relative">
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&h=900&fit=crop" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-5 rounded-full text-xl shadow-[0_0_50px_rgba(220,38,38,0.6)] flex items-center gap-3"
                >
                  <Play className="w-7 h-7 fill-current" />
                  Watch Live
                </motion.button>
              </div>
              
              <div className="absolute top-6 left-6 flex gap-3">
                <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  LIVE
                </div>
                <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 border border-white/20">
                  <Users className="w-4 h-4" />
                  {streamer.viewers.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Streamer Header */}
            <div className="flex items-center justify-between mt-6 px-2">
              <div className="flex items-center gap-4">
                <img 
                  src={streamer.avatar} 
                  alt={streamer.name}
                  className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg"
                />
                <div>
                  <h2 className="text-2xl font-bold text-white">{streamer.name}</h2>
                  <p className="text-white/60 text-sm">Playing {streamer.game}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </button>
                <button className="px-5 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 font-medium transition-all flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Follow
                </button>
                <button className="px-5 py-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 font-medium transition-all flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Donate
                </button>
              </div>
            </div>
          </div>

          {/* Chat Panel - 1 column */}
          <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Live Chat
              </h3>
              <p className="text-white/40 text-xs mt-1">{streamer.viewers} watching</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {MOCK_CHAT.map(msg => (
                <div key={msg.id} className="text-sm">
                  <span className="font-bold text-cyan-400 mr-2">{msg.user}:</span>
                  <span className="text-white/80">{msg.message}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  placeholder="Say something..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <button className="w-10 h-10 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg flex items-center justify-center text-cyan-400">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Streamer Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Why I Stream */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl">Why I Stream</h3>
            </div>
            
            <p className="text-white/80 leading-relaxed text-lg">
              I love connecting with people who share my passion for gaming. Every stream is a journey—whether we're hunting rare cards, tackling impossible challenges, or just vibing to great gameplay.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {[
                { label: 'Favorite Genre', value: 'RPG & FPS', icon: Trophy },
                { label: 'Total Hours', value: '2,400+', icon: Clock },
                { label: 'Followers', value: '15K', icon: Users },
                { label: 'Rarest Card', value: 'Void Emperor', icon: Flame }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <stat.icon className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsors */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-bold text-lg">Sponsored By</h3>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'RazerGear', logo: '🎮' },
                { name: 'EnergyDrink Co.', logo: '⚡' },
                { name: 'TechSetup', logo: '💻' }
              ].map((sponsor, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
                    {sponsor.logo}
                  </div>
                  <span className="text-white font-medium">{sponsor.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Viewer Seasonal Pass */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-2xl">Viewer Seasonal Pass</h3>
                <p className="text-white/40 text-sm">Watch, engage, and earn exclusive rewards</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-white">
                12<span className="text-white/40 text-2xl">/30</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Current Tier</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/60">
              <span>Season Progress</span>
              <span>40%</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>

          <div>
            <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Upcoming Rewards</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { tier: 15, reward: '+20% XP', icon: '⚡⚡', next: true },
                { tier: 20, reward: 'Legendary Card', icon: '🎴' },
                { tier: 25, reward: 'Exclusive Emote', icon: '😎' },
                { tier: 30, reward: '+30% XP', icon: '⚡⚡⚡' }
              ].map((reward, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    reward.next
                      ? 'bg-cyan-500/20 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border-white/10 opacity-70'
                  }`}
                >
                  <div className="text-3xl mb-2">{reward.icon}</div>
                  <div className="text-[10px] font-bold uppercase text-white/40 mb-1">Tier {reward.tier}</div>
                  <p className={`text-xs font-medium ${reward.next ? 'text-cyan-300' : 'text-white/60'}`}>
                    {reward.reward}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
            <Zap className="w-6 h-6 text-green-400" />
            <div className="flex-1">
              <p className="text-white font-bold">Active Viewer Boost</p>
              <p className="text-white/60 text-sm">+10% XP while watching this stream</p>
            </div>
            <div className="text-3xl font-black text-green-400">+10%</div>
          </div>
        </div>

      </div>
    </div>
  );
}