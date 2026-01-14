import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, Film, Play, ShoppingBag, Clapperboard, Monitor, 
  Mountain, Feather, Search, Bell, User, ChevronRight, 
  ChevronLeft, Star, Heart, TrendingUp, Menu, X
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
  <div className="relative w-full h-[85vh] overflow-hidden mb-8 group">
    <img 
      src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" 
      alt="Featured" 
      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
    
    <div className="absolute bottom-0 left-0 p-16 w-full max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
            #1 in Movies Today
          </span>
          <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider border border-white/20">
            Sci-Fi Adventure
          </span>
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black text-white mb-6 leading-none tracking-tighter drop-shadow-2xl">
          DUNE: PART TWO
        </h1>
        
        <p className="text-white/90 text-xl mb-10 line-clamp-3 max-w-2xl font-medium drop-shadow-md leading-relaxed">
          Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe.
        </p>
        
        <div className="flex gap-6">
          <button 
            onClick={onPlay}
            className="px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <Play fill="currentColor" className="w-6 h-6" />
            Watch Now
          </button>
          <button className="px-10 py-5 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-white/20 transition-colors border border-white/10">
            <Heart className="w-6 h-6" />
            Add to List
          </button>
        </div>
      </motion.div>
    </div>
  </div>
);

const AppView = ({ app, onClose }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full h-full flex flex-col relative bg-[#050505]"
  >
    {/* Hero Section */}
    <div className="relative w-full h-[70vh]">
      <div className="absolute inset-0">
        <img 
          src={`https://source.unsplash.com/random/1920x1080?${app.id},cinema`} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
      </div>

      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-20">
        <div className="flex items-center gap-4">
          {/* App Logo */}
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
            <app.icon className="w-5 h-5" style={{ color: app.color }} />
            <span className="font-bold text-white tracking-wide">{app.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 transition-colors text-white">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 transition-colors text-white">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 p-16 z-20 max-w-3xl">
        <h1 className="text-6xl font-black text-white mb-4 leading-tight">
          {app.name} Originals
        </h1>
        <p className="text-white/80 text-xl mb-8 leading-relaxed">
          {app.description} Experience exclusive content available only on {app.name}.
        </p>
        <button className="px-8 py-4 bg-white text-black font-bold rounded-xl text-lg hover:scale-105 transition-transform flex items-center gap-2">
          <Play fill="currentColor" className="w-5 h-5" />
          Start Watching
        </button>
      </div>
    </div>

    {/* Content Rows */}
    <div className="flex-1 overflow-y-auto px-16 pb-16 -mt-20 relative z-10 custom-scrollbar">
      <h3 className="text-white font-bold text-2xl mb-6">Trending Now</h3>
      <div className="grid grid-cols-5 gap-6 mb-12">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl overflow-hidden hover:scale-105 hover:ring-2 ring-white/50 transition-all cursor-pointer relative group shadow-lg">
             <img 
               src={`https://source.unsplash.com/random/400x600?movie,${i}`} 
               alt="Movie Poster" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
               <div className="flex items-center gap-2 text-sm text-white font-bold">
                 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                 <span>4.{8 + i}</span>
               </div>
               <button className="mt-2 w-full py-2 bg-white text-black text-xs font-bold rounded">Play</button>
             </div>
          </div>
        ))}
      </div>

      <h3 className="text-white font-bold text-2xl mb-6">Because you watched Sci-Fi</h3>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-video bg-white/5 rounded-xl overflow-hidden hover:scale-105 transition-all cursor-pointer relative group">
            <img 
               src={`https://source.unsplash.com/random/600x340?cinema,${i}`} 
               alt="Thumbnail" 
               className="w-full h-full object-cover"
             />
            <div className="absolute bottom-0 left-0 h-1 bg-red-600 z-20" style={{ width: `${Math.random() * 80 + 20}%` }} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Play className="w-5 h-5 text-white fill-white ml-1" />
              </div>
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

  // When an app is selected, the sidebar closes automatically (optional, but cleaner)
  const handleAppSelect = (app) => {
    setActiveApp(app);
    setSidebarOpen(false);
  };

  return (
    <div className="w-full h-full relative bg-[#050505] overflow-hidden font-sans">
      
      {/* 1. Toggle Arrow - Left Edge (Middle) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-[60] w-8 h-24 bg-white/5 hover:bg-white/10 backdrop-blur-md border-r border-y border-white/10 rounded-r-xl flex items-center justify-center group transition-all"
          >
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Overlay Sidebar Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70]"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 z-[80] flex flex-col shadow-2xl"
            >
              {/* Sidebar Header */}
              <div className="h-24 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="font-bold text-xl text-white tracking-tight">MEDIA<span className="text-purple-500">HUB</span></span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Apps List */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                <button
                  onClick={() => handleAppSelect(null)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    !activeApp 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${!activeApp ? 'bg-white/20' : 'bg-white/5'}`}>
                    <Menu className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Home</span>
                </button>

                <div className="h-px bg-white/5 my-4 mx-2" />
                <p className="px-4 text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Streaming Apps</p>

                {STREAMING_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleAppSelect(app)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                      activeApp?.id === app.id 
                        ? 'bg-white/10 text-white border border-white/5' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
                      style={{ backgroundColor: activeApp?.id === app.id ? app.color : 'rgba(255,255,255,0.05)' }}
                    >
                      <app.icon className={`w-5 h-5 ${activeApp?.id === app.id ? 'text-white' : 'text-current'}`} />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="font-semibold truncate w-full">{app.name}</span>
                      {activeApp?.id === app.id && (
                        <span className="text-[10px] text-white/50 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* User Footer */}
              <div className="p-6 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white/10 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Marcus</p>
                    <p className="text-xs text-white/40 truncate">Premium Member</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Content - Full Screen */}
      <div className="w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {activeApp ? (
            <AppView key={activeApp.id} app={activeApp} onClose={() => setActiveApp(null)} />
          ) : (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full overflow-y-auto custom-scrollbar bg-[#050505]"
            >
              {/* Home Header */}
              <div className="absolute top-0 left-0 right-0 z-30 px-12 py-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex gap-6 ml-12"> {/* ml-12 to clear the toggle button */}
                  {['Movies', 'TV Shows', 'Live TV', 'Sports'].map((tab) => (
                    <button key={tab} className="text-white/70 hover:text-white font-bold text-lg transition-colors drop-shadow-md">
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="pointer-events-auto flex items-center gap-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 group-focus-within:text-white transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:bg-black/60 focus:border-purple-500/50 transition-all w-64"
                    />
                  </div>
                  <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 border border-white/10 transition-colors">
                    <Bell className="w-5 h-5 text-white/80" />
                  </button>
                </div>
              </div>

              {/* Featured Hero */}
              <FeaturedContent onPlay={() => handleAppSelect(STREAMING_APPS[1])} />
              
              {/* Categories */}
              <div className="px-16 pb-16 space-y-12">
                
                {/* Apps Row */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                      Your Apps
                    </h2>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {STREAMING_APPS.map((app) => (
                      <button 
                        key={app.id}
                        onClick={() => handleAppSelect(app)}
                        className="flex-shrink-0 w-48 aspect-video bg-white/5 rounded-2xl relative group cursor-pointer border border-white/5 hover:border-white/20 hover:scale-105 transition-all overflow-hidden snap-start"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: app.color }}>
                            <app.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="font-bold text-white">{app.name}</span>
                        </div>
                        {/* Background Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: app.color }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue Watching */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Continue Watching</h2>
                  <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-video bg-white/5 rounded-2xl overflow-hidden hover:scale-105 transition-all cursor-pointer relative group border border-white/5 hover:border-white/20">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                        <img src={`https://source.unsplash.com/random/800x450?scifi,${i}`} alt="Show" className="w-full h-full object-cover" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                          <h4 className="font-bold text-white mb-2">Show Title {i}</h4>
                          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                          </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 hover:scale-110 transition-all">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}