import React, { useState } from 'react';
import { Menu, Search, Filter, Play, Clock, Cloud, Star, Settings, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SteamLibrary() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#1b2838] text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* Top Bar - Steam Header Style */}
      <div className="h-16 bg-[#171a21] flex items-center justify-between px-6 shadow-lg z-20">
        <div className="flex items-center gap-6">
          {/* The "Three-line it button" */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
          
          <div className="text-2xl font-bold tracking-wider text-white uppercase">
            LIBRARY
          </div>

          <div className="flex items-center gap-6 text-sm font-semibold tracking-wide ml-8">
            <button className="text-white border-b-2 border-[#1a9fff] pb-4 mt-4">HOME</button>
            <button className="hover:text-white transition-colors pb-4 mt-4">COLLECTIONS</button>
            <button className="hover:text-white transition-colors pb-4 mt-4">DOWNLOADS</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Placeholder for user/settings */}
           <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-sm"></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Game List */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#1b2838] flex flex-col border-r border-black/20"
            >
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search by name" 
                    className="w-full bg-[#1e2025] text-sm px-9 py-2 rounded-sm border border-transparent focus:border-white/20 outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 px-1">
                   <Filter className="w-3 h-3" />
                   <span>GAMES</span>
                   <span className="ml-auto flex items-center gap-1 cursor-pointer hover:text-white">
                     <Clock className="w-3 h-3" /> RECENT
                   </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
                {/* Placeholder List Items */}
                <div className="space-y-0.5">
                  <div className="px-3 py-1.5 bg-[#253243] text-white text-sm rounded-sm cursor-pointer">
                    Counter-Strike 2
                  </div>
                  {['Apex Legends', 'Baldur\'s Gate 3', 'Cyberpunk 2077', 'Dota 2', 'Elden Ring', 'Hades II', 'Rust', 'Team Fortress 2', 'Valheim'].map(game => (
                    <div key={game} className="px-3 py-1.5 hover:bg-white/5 text-gray-400 hover:text-white text-sm rounded-sm cursor-pointer transition-colors">
                      {game}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#1b2838] overflow-y-auto relative">
           {/* Detail View Placeholder */}
           <div className="h-full flex flex-col">
              {/* Hero Banner Area */}
              <div className="h-[400px] relative bg-slate-900 group">
                <img 
                  src="https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200&q=80" 
                  className="w-full h-full object-cover opacity-60 mask-image-gradient"
                  alt="Game Banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b2838] via-[#1b2838]/40 to-transparent" />
                
                <div className="absolute bottom-8 left-8 space-y-6">
                   <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Steam_Logo_2016.svg/640px-Steam_Logo_2016.svg.png" 
                      className="h-16 object-contain opacity-0" // Just a placeholder for logo position
                      alt="Logo" 
                   />
                   <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">Counter-Strike 2</h1>
                   
                   <div className="flex items-center gap-4 bg-[#1e252e]/80 backdrop-blur-sm p-4 rounded-md border border-white/5">
                      <button className="bg-[#47b032] hover:bg-[#57c042] text-white px-8 py-3 rounded-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20">
                        <Play className="w-5 h-5 fill-current" />
                        PLAY
                      </button>
                      <div className="flex flex-col text-xs text-gray-400 px-2 border-l border-white/10">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> LAST PLAYED</span>
                        <span className="text-white">Today</span>
                      </div>
                      <div className="flex flex-col text-xs text-gray-400 px-2 border-l border-white/10">
                        <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> PLAY TIME</span>
                        <span className="text-white">1,240 hours</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Game Info Section */}
              <div className="flex-1 bg-[#1b2838] px-8 py-6">
                 <div className="flex gap-8">
                    <div className="flex-1 space-y-6">
                       {/* Activity Feed Placeholder */}
                       <div className="bg-[#1f2c3d] p-4 rounded-sm border border-white/5">
                          <h3 className="text-sm font-bold text-gray-400 mb-2">POST-GAME SUMMARY</h3>
                          <div className="h-32 bg-black/20 rounded-sm flex items-center justify-center text-gray-600">
                             Match Results Graph
                          </div>
                       </div>
                    </div>
                    
                    <div className="w-80 space-y-6">
                       {/* Right Column Stats */}
                       <div className="space-y-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase">Achievements</h3>
                          <div className="bg-[#1f2c3d] p-3 rounded-sm flex items-center gap-3">
                             <Trophy className="w-8 h-8 text-[#ffe600]" />
                             <div>
                                <div className="text-xl font-bold text-white leading-none">34/167</div>
                                <div className="text-xs text-gray-500">Unlocked</div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          background: #1b2838;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3d4450;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #626c7d;
        }
      `}</style>
    </div>
  );
}