import React, { useState } from 'react';
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

  // Filter Streamers
  const filteredStreamers = MOCK_STREAMERS.filter(s => {
    if (selectedGenre !== 'all' && s.category !== selectedGenre) return false;
    if (filters.cameraOn && !s.intro_video_url) return false; // Rough proxy
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
        
        {/* Top Section: Intro Carousel or Game Header */}
        <div className="mb-8">
           <IntroCarousel streamers={filteredStreamers} />
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
                  <img src={game.image} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
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