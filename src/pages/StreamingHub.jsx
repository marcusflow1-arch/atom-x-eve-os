import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import DiscoverySidebar from '../components/streaming/DiscoverySidebar';
import FeaturedRightPanel from '../components/streaming/FeaturedRightPanel';
import IntroCarousel from '../components/streaming/IntroCarousel';
import { MOCK_STREAMERS, MOCK_GAMES } from '../components/streaming/mockData';

export default function StreamingHub() {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [filters, setFilters] = useState({ cameraOn: false, newStreamers: false });
  const [selectedGame, setSelectedGame] = useState(null); // If a game is selected, show game grid
  const [tab, setTab] = useState('all'); // 'all' | 'live' | 'new'
  const navigate = useNavigate();

  // Filter Streamers
  const filteredStreamers = MOCK_STREAMERS.filter(s => {
    if (selectedGenre !== 'all' && s.category !== selectedGenre) return false;
    if (filters.cameraOn && !s.intro_video_url) return false; // Rough proxy
    return true;
  });

  const tabFiltered = filteredStreamers.filter(s => {
    if (tab === 'live') return s.is_live;
    if (tab === 'new') return (s.followers || 0) < 8000;
    return true;
  });

  return (
    <div 
      className="h-screen w-full text-white overflow-hidden flex relative"
      style={{ 
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' 
      }}
    >
      {/* Liquid Glass Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-400/8 rounded-full blur-[120px]" />
      </div>

      {/* LEFT ZONE: Filters (20%) */}
      <div className="w-72 h-full p-6 z-10 flex-shrink-0 border-r border-white/5 bg-slate-900/30 backdrop-blur-xl flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 mb-1">
            ATOM<span className="text-cyan-400">×</span>STREAM
          </h1>
          <p className="text-[10px] text-white/40 font-medium tracking-wide">HUMAN FIRST DISCOVERY</p>
        </div>
        <DiscoverySidebar 
          selectedGenre={selectedGenre} 
          onSelectGenre={(g) => { setSelectedGenre(g); setSelectedGame(null); }}
          filters={filters}
          onUpdateFilters={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
        />
      </div>

      {/* CENTER ZONE: Main Content (60%) */}
      <div className="flex-1 h-full flex flex-col z-10 overflow-y-auto custom-scrollbar relative px-8 py-6">
        
        {/* Aura-style Top Bar */}
        <div className="mb-8">
          <div className="w-full rounded-2xl px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-700/40 via-indigo-600/30 to-blue-600/40 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 font-extrabold tracking-wider">Aura</div>
              <button className="px-3 py-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">Home</button>
              <button className="px-3 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">Discover</button>
              <button className="px-3 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Now
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-3 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-sm">marcus flowers</div>
            </div>
          </div>
        </div>

        {/* Gradient Hero */}
        <div className="mb-8 text-center">
          <button className="mx-auto mb-4 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-sm hover:bg-white/15">
            Discover the person behind the stream
          </button>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">Aura</span>
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            A streaming platform that celebrates identity, authenticity, and human connection. No algorithms. No numbers. Just real people sharing their stories.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-full border ${tab==='all' ? 'bg-white/15 text-white border-white/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>All Streamers</button>
          <button onClick={() => setTab('live')} className={`px-4 py-2 rounded-full border ${tab==='live' ? 'bg-white/15 text-white border-white/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>Live Now</button>
          <button onClick={() => setTab('new')} className={`px-4 py-2 rounded-full border ${tab==='new' ? 'bg-white/15 text-white border-white/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>New Voices</button>
        </div>

        {/* Streamer Cards Grid */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tabFiltered.map((s) => (
            <motion.div
              key={s.id}
              whileHover={{ y: -4 }}
              onClick={() => navigate(createPageUrl('StreamerProfile') + `?id=${s.id}`)}
              className="cursor-pointer rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl relative"
            >
              <div className="relative aspect-[16/11]">
                <img src={s.avatar_url} alt={s.username} className="w-full h-full object-cover" />
                {s.is_live && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">LIVE</div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="p-4">
                <div className="font-bold text-white">{s.username}</div>
                <div className="text-sm text-white/60 line-clamp-2">{s.tagline}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(s.tags || []).slice(0,3).map((t,i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">{t}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                  <span>{s.followers?.toLocaleString()} followers</span>
                  {s.is_live ? <span className="text-red-300 font-medium">Live Now</span> : <span className="text-white/40">Offline</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Discovery: Games */}
        <div className="mb-8">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
               <Gamepad2 size={16} /> Explore by Game
             </h3>
           </div>
           
           <div className="grid grid-cols-5 gap-4">
              {MOCK_GAMES.map(game => (
                <motion.div 
                  key={game.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedGame(game)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden cursor-pointer relative group ${selectedGame?.id === game.id ? 'ring-2 ring-cyan-400' : ''}`}
                >
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs font-bold text-white">{game.title}</p>
                    <p className="text-[10px] text-white/60">{game.viewers} watching</p>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Streamer Grid (Contextual) */}
        {selectedGame && (
          <div className="mb-20">
             <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">
               Streamers playing {selectedGame.title}
             </h3>
             <div className="grid grid-cols-3 gap-6">
               {/* Just reusing mock streamers for demo */}
               {filteredStreamers.map(s => (
                 <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={s.avatar_url} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="text-sm font-bold text-white">{s.username}</p>
                        <p className="text-xs text-white/50">{s.tagline}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-red-500/20 text-red-300 border-0 text-[10px]">LIVE</Badge>
                      <Badge variant="outline" className="border-white/10 text-white/40 text-[10px]">{s.category}</Badge>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>

      {/* RIGHT ZONE: Highlights (20%) */}
      <div className="w-72 h-full p-6 z-10 flex-shrink-0 border-l border-white/5 bg-slate-900/30 backdrop-blur-xl">
        <FeaturedRightPanel streamers={MOCK_STREAMERS} />
      </div>

    </div>
  );
}