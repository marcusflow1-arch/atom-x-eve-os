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

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Navbar Placeholder / Back */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-12">
        
        {/* --- SECTION 1: INTRODUCTION (Identity First) --- */}
        <section className="min-h-[85vh] flex flex-col lg:flex-row gap-6">
          {/* Left: Intro Video */}
          <div className="flex-1 rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl bg-black">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <IntroPlayer src={streamer.intro_video} />
            
            {/* Overlay Info */}
            <div className="absolute bottom-8 left-8 right-8 z-20">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
                MEET {streamer.name.toUpperCase()}
              </h2>
              <p className="text-white/80 text-lg font-medium drop-shadow-md max-w-xl">
                Watch the intro to see what this channel is really about.
              </p>
            </div>
          </div>

          {/* Right: Identity Card */}
          <div className="w-full lg:w-[480px] flex-shrink-0">
            <StreamerIdentityCard streamer={streamer} onWatchStream={handleEnterStream} />
          </div>
        </section>


        {/* --- SECTION 2: LIVE STREAM & GAMES --- */}
        <section id="live-section" className="pt-8 border-t border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Live Broadcast</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px] lg:h-[700px]">
            {/* Live Player */}
            <div className="lg:col-span-3 bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">
              {/* Mock Player */}
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&h=900&fit=crop" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-full text-xl shadow-[0_0_40px_rgba(220,38,38,0.5)]">
                  <Play className="w-6 h-6 mr-3 fill-current" />
                  Watch Live Now
                </Button>
              </div>
              
              {/* Stream Overlay UI */}
              <div className="absolute top-6 left-6 flex gap-3">
                <Badge className="bg-red-600 text-white border-none animate-pulse">LIVE</Badge>
                <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10">
                  <Users className="w-3 h-3 mr-1" /> {streamer.viewers.toLocaleString()}
                </Badge>
              </div>
            </div>

            {/* Chat / Games Side Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
              {/* Games Panel */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex-shrink-0">
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Current Session</h3>
                <div className="flex gap-3 mb-4">
                  <div className="w-16 h-20 bg-slate-800 rounded-lg overflow-hidden border border-white/10">
                    <img src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&h=300&fit=crop" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{streamer.game}</h4>
                    <p className="text-slate-400 text-xs">FPS • Competitive</p>
                    <Badge variant="outline" className="mt-2 text-[10px] border-white/10 text-blue-400">Drops Enabled</Badge>
                  </div>
                </div>
                
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2 pt-2 border-t border-white/5">Recently Played</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {streamer.recent_games.map((g, i) => (
                    <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-[10px] whitespace-nowrap">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Chat Panel */}
              <div className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Stream Chat</h3>
                  <Settings className="w-4 h-4 text-white/40 cursor-pointer hover:text-white" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {MOCK_CHAT.map(msg => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-bold text-blue-400 mr-2">{msg.user}:</span>
                      <span className="text-slate-300">{msg.message}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-white/5">
                  <div className="bg-black/40 rounded-lg flex items-center px-3 py-2 border border-white/5 focus-within:border-blue-500/50 transition-colors">
                    <input 
                      type="text" 
                      placeholder="Say hello..." 
                      className="bg-transparent border-none outline-none text-sm text-white flex-1 placeholder:text-white/20"
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-transparent">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: SUPPORT & PROGRESSION --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" />
                Support the Stream
              </h3>
              <p className="text-slate-400 text-sm mb-4">Use Atom Points to support {streamer.name} directly.</p>
              <div className="flex gap-3">
                <Button className="flex-1 bg-white/10 hover:bg-white/20">Donate AGP</Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700">Subscribe</Button>
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Streamer Pass
              </h3>
              <p className="text-slate-400 text-sm mb-4">Level 5 • 60% to Gold Card Reward</p>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[60%]" />
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Next Stream
              </h3>
              <p className="text-slate-400 text-sm mb-1">Card Hunting Event</p>
              <p className="text-white font-mono text-lg">Tomorrow, 7:00 PM</p>
           </div>
        </section>

      </div>
    </div>
  );
}