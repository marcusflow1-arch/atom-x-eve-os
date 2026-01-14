import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, Film, Play, ShoppingBag, Clapperboard, Monitor, 
  Mountain, Feather, Search, Bell, User, ChevronRight, 
  ChevronLeft, Star, Heart, TrendingUp, Menu, X, Maximize2
} from 'lucide-react';

const STREAMING_APPS = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', icon: Film, description: 'Unlimited movies, TV shows, and more.' },
  { id: 'hbo', name: 'HBO Max', color: '#5C2D91', icon: Tv, description: 'Iconic series, award-winning movies, fresh originals.' },
  { id: 'disney', name: 'Disney+', color: '#113CCF', icon: Star, description: 'The home of Disney, Pixar, Marvel, Star Wars, and Nat Geo.' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', icon: Play, description: 'All your favorite TV shows, movies, and originals.' },
  { id: 'starz', name: 'Starz', color: '#E4B314', icon: Star, description: 'Obsessable original series and hit movies.' },
  { id: 'showtime', name: 'Showtime', color: '#E31837', icon: Clapperboard, description: 'Critically acclaimed original series and movies.' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', icon: ShoppingBag, description: 'Watch movies, TV, and sports.' },
  { id: 'apple', name: 'Apple TV+', color: '#FFFFFF', icon: Monitor, description: 'Apple Original shows and movies.' },
  { id: 'peacock', name: 'Peacock', color: '#000000', icon: Feather, description: 'Stream current hits, hundreds of movies, and thousands of episodes.' },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', icon: Mountain, description: 'A mountain of entertainment.' },
];

const FeaturedContent = ({ onPlay }) => (
  <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-8 group">
    <img 
      src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" 
      alt="Featured" 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    <div className="absolute bottom-0 left-0 p-12 w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
          Trending Now
        </span>
        <h1 className="text-6xl font-black text-white mb-4 leading-tight tracking-tight">
          DUNE: PART TWO
        </h1>
        <p className="text-white/80 text-lg mb-8 line-clamp-2 max-w-2xl">
          Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onPlay}
            className="px-8 py-4 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Play fill="currentColor" className="w-5 h-5" />
            Watch Trailer
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-colors">
            <Heart className="w-5 h-5" />
            Add to List
          </button>
        </div>
      </motion.div>
    </div>
  </div>
);

const AppView = ({ app, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex-1 h-full flex flex-col relative"
  >
    {/* Simulated App Header */}
    <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: app.color }}
        >
          <app.icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">{app.name}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* App Content Placeholder */}
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div className="w-full h-96 rounded-2xl mb-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent z-10" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{ backgroundColor: app.color }}
        />
        <img 
          src={`https://source.unsplash.com/random/1200x600?${app.id},movie`} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-8 left-8 z-20">
          <h3 className="text-4xl font-bold text-white mb-2">{app.name} Originals</h3>
          <p className="text-white/70 max-w-xl text-lg mb-6">{app.description}</p>
          <button className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
            Start Watching
          </button>
        </div>
      </div>

      <h3 className="text-white font-bold text-lg mb-4">Recommended For You</h3>
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer relative group">
             <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
             <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-1 text-xs text-white">
                 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                 <span>4.{i}</span>
               </div>
             </div>
             <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse" />
          </div>
        ))}
      </div>

      <h3 className="text-white font-bold text-lg mb-4">Continue Watching</h3>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-video bg-white/5 rounded-xl overflow-hidden hover:ring-2 ring-white/20 transition-all cursor-pointer relative">
            <div className="absolute bottom-0 left-0 h-1 bg-red-600" style={{ width: `${Math.random() * 100}%` }} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
              <Play className="w-12 h-12 text-white fill-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default function EntertainmentHub() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeApp, setActiveApp] = useState(null);

  return (
    <div className="w-full h-full flex bg-[#050505] overflow-hidden text-white font-sans selection:bg-purple-500/30">
      
      {/* Collapsible Sidebar */}
      <motion.div 
        initial={{ width: 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col relative z-20 transition-all duration-300 ease-in-out"
      >
        {/* Toggle Handle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-12 w-6 h-12 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 hover:border-purple-500 transition-colors z-30 shadow-xl"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Header/Logo Area */}
        <div className="h-24 flex items-center justify-center border-b border-white/5 mb-2">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">MEDIA<span className="text-purple-500">HUB</span></span>
            </div>
          ) : (
             <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
          )}
        </div>

        {/* Apps List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
          <button
            onClick={() => setActiveApp(null)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              !activeApp 
                ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${!activeApp ? 'bg-purple-600' : 'bg-white/5'}`}>
              <Menu className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-semibold whitespace-nowrap"
              >
                Dashboard
              </motion.span>
            )}
          </button>

          <div className="h-px bg-white/5 my-4 mx-2" />

          {STREAMING_APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                activeApp?.id === app.id 
                  ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: activeApp?.id === app.id ? app.color : 'rgba(255,255,255,0.05)' }}
              >
                <app.icon className={`w-5 h-5 ${activeApp?.id === app.id ? 'text-white' : 'text-current'}`} />
              </div>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-start min-w-0"
                >
                  <span className="font-semibold whitespace-nowrap truncate w-full text-left">{app.name}</span>
                  <span className="text-[10px] text-white/30 truncate w-32 text-left">Click to launch</span>
                </motion.div>
              )}
            </button>
          ))}
        </div>
        
        {/* User Profile / Footer */}
        <div className="p-4 border-t border-white/5">
           <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white/10" />
             {sidebarOpen && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left">
                 <p className="text-sm font-bold">Marcus</p>
                 <p className="text-xs text-white/40">Premium Plan</p>
               </motion.div>
             )}
           </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] relative">
        <AnimatePresence mode="wait">
          {activeApp ? (
            <AppView key={activeApp.id} app={activeApp} onClose={() => setActiveApp(null)} />
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              {/* Dashboard Header */}
              <div className="sticky top-0 z-30 px-8 py-6 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Entertainment Center</h1>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Search movies, shows..." 
                      className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all w-64"
                    />
                  </div>
                  <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors relative">
                    <Bell className="w-5 h-5 text-white/70" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </button>
                </div>
              </div>

              <div className="px-8 pb-12">
                <FeaturedContent onPlay={() => setActiveApp(STREAMING_APPS[1])} />
                
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Popular on Your Apps
                  </h2>
                </div>

                {/* Horizontal Scroll List */}
                <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar snap-x">
                  {STREAMING_APPS.slice(0, 6).map((app, i) => (
                    <div 
                      key={app.id} 
                      onClick={() => setActiveApp(app)}
                      className="flex-shrink-0 w-64 aspect-[2/3] bg-white/5 rounded-2xl overflow-hidden relative group cursor-pointer snap-start border border-white/5 hover:border-white/20 transition-all hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                      <div className="absolute top-4 left-4 z-20">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: app.color }}>
                          <app.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 z-20">
                        <p className="font-bold text-lg leading-tight mb-1">{app.name} Top Pick</p>
                        <p className="text-xs text-white/60">Trending today</p>
                      </div>
                      <div className="w-full h-full bg-white/5 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}