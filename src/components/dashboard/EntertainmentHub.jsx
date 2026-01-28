import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, Film, Play, ShoppingBag, Clapperboard, Monitor, 
  Mountain, Feather, Search, Bell, User, ChevronRight, 
  ChevronLeft, Star, Heart, TrendingUp, Menu, X, Zap, Gamepad2, Trophy,
  ExternalLink, Filter, Clock
} from 'lucide-react';

const STREAMING_APPS = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', icon: Film, url: 'https://www.netflix.com', description: 'Unlimited movies, TV shows, and more.' },
  { id: 'max', name: 'Max', color: '#002BE7', icon: Tv, url: 'https://www.max.com', description: 'Iconic series, award-winning movies, fresh originals.' },
  { id: 'disney', name: 'Disney+', color: '#113CCF', icon: Star, url: 'https://www.disneyplus.com', description: 'The home of Disney, Pixar, Marvel, Star Wars, and Nat Geo.' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', icon: Play, url: 'https://www.hulu.com', description: 'All your favorite TV shows, movies, and originals.' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', icon: ShoppingBag, url: 'https://www.amazon.com/primevideo', description: 'Watch movies, TV, and sports.' },
  { id: 'apple', name: 'Apple TV+', color: '#FFFFFF', icon: Monitor, url: 'https://tv.apple.com', description: 'Apple Original shows and movies.' },
  { id: 'peacock', name: 'Peacock', color: '#000000', icon: Feather, url: 'https://www.peacocktv.com', description: 'Stream current hits, hundreds of movies, and thousands of episodes.' },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', icon: Mountain, url: 'https://www.paramountplus.com', description: 'A mountain of entertainment.' },
  { id: 'starz', name: 'Starz', color: '#E4B314', icon: Star, url: 'https://www.starz.com', description: 'Obsessable original series and hit movies.' },
  { id: 'tubi', name: 'Tubi', color: '#F84C1E', icon: Film, url: 'https://tubitv.com', description: 'Watch Free Movies and TV Shows.' },
  { id: 'pluto', name: 'Pluto TV', color: '#FFFFFF', icon: Tv, url: 'https://pluto.tv', description: 'Drop in. It\'s free.' },
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521', icon: Zap, url: 'https://www.crunchyroll.com', description: 'The world\'s largest anime collection.' },
  { id: 'youtube_tv', name: 'YouTube TV', color: '#FF0000', icon: Tv, url: 'https://tv.youtube.com', description: 'Live TV from 100+ channels.' },
  { id: 'spotify', name: 'Spotify', color: '#1DB954', icon: Play, url: 'https://open.spotify.com', description: 'Music for everyone.' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF', icon: Gamepad2, url: 'https://www.twitch.tv', description: 'Live streaming for gamers.' },
  { id: 'sling', name: 'Sling TV', color: '#10069F', icon: Tv, url: 'https://www.sling.com', description: 'Live TV Streaming Service.' },
  { id: 'espn', name: 'ESPN+', color: '#CC0000', icon: Trophy, url: 'https://plus.espn.com', description: 'Live sports and original shows.' },
];

// Mock Data for Aggregated Content
const AGGREGATED_CONTENT = [
  { id: 1, title: "Stranger Things", type: "TV Show", serviceId: "netflix", image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070", rating: "9.8", progress: 85 },
  { id: 2, title: "The Mandalorian", type: "TV Show", serviceId: "disney", image: "https://images.unsplash.com/photo-1605218427368-35b8686e0269?q=80&w=2000", rating: "9.5", progress: 40 },
  { id: 3, title: "The Boys", type: "TV Show", serviceId: "prime", image: "https://images.unsplash.com/photo-1596727147705-06a880058bc4?q=80&w=2000", rating: "9.6" },
  { id: 4, title: "House of the Dragon", type: "TV Show", serviceId: "max", image: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?q=80&w=2000", rating: "9.4" },
  { id: 5, title: "The Bear", type: "TV Show", serviceId: "hulu", image: "https://images.unsplash.com/photo-1559563458-52c69f83555f?q=80&w=2000", rating: "9.7" },
  { id: 6, title: "Ted Lasso", type: "TV Show", serviceId: "apple", image: "https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2000", rating: "9.3", progress: 10 },
  { id: 7, title: "Wednesday", type: "TV Show", serviceId: "netflix", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cd4?q=80&w=2000", rating: "9.1" },
  { id: 8, title: "Yellowstone", type: "TV Show", serviceId: "peacock", image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2000", rating: "8.9" },
  { id: 9, title: "Reacher", type: "TV Show", serviceId: "prime", image: "https://images.unsplash.com/photo-1615555437812-70b791557930?q=80&w=2000", rating: "9.2" },
  { id: 10, title: "Loki", type: "TV Show", serviceId: "disney", image: "https://images.unsplash.com/photo-1627845348888-2970b5514f76?q=80&w=2000", rating: "9.4" },
  { id: 11, title: "Succession", type: "TV Show", serviceId: "max", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2000", rating: "9.9" },
  { id: 12, title: "Severance", type: "TV Show", serviceId: "apple", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000", rating: "9.5" }
];

const AppView = ({ app }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col relative bg-[#050505]"
    >
      <iframe 
        src={app.url}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        title={app.name}
      />
      {/* Fallback/External Link overlay if iframe is blocked (common with major streaming services) */}
      <div className="absolute top-0 right-0 p-4 pointer-events-none z-50">
        <a 
          href={app.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="pointer-events-auto bg-black/50 hover:bg-black/80 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/10 transition-colors flex items-center gap-1"
        >
          Open in New Tab <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
};

// Component for a Content Card (Show/Movie)
const ContentCard = ({ item, onClick, showProgress = false }) => {
  const service = STREAMING_APPS.find(app => app.id === item.serviceId);
  
  return (
    <div 
      onClick={() => onClick(service)}
      className="group relative aspect-[2/3] bg-white/5 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02]"
    >
      <img 
        src={item.image} 
        alt={item.title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      
      {/* Service Badge (Top Right) */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1.5 z-10">
        <service.icon className="w-3 h-3" style={{ color: service.color }} />
        <span className="text-[10px] font-bold text-white tracking-wide">{service.name}</span>
      </div>

      {/* Content Info (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <p className="text-[10px] font-medium text-white/60 mb-1 uppercase tracking-wider">{item.type}</p>
        <h3 className="text-white font-bold text-sm leading-tight mb-2 line-clamp-2">{item.title}</h3>
        
        {/* Progress Bar for 'Continue Watching' */}
        {showProgress && item.progress && (
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full rounded-full" 
              style={{ width: `${item.progress}%`, backgroundColor: service.color }} 
            />
          </div>
        )}
        
        {/* Hover Action */}
        <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button className="w-full mt-2 py-1.5 bg-white text-black text-xs font-bold rounded flex items-center justify-center gap-1.5 hover:bg-white/90">
            <Play className="w-3 h-3 fill-black" />
            Watch on {service.name}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EntertainmentHub() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeApp, setActiveApp] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // When an app is selected, the sidebar closes automatically
  const handleAppSelect = (app) => {
    setActiveApp(app);
    setSidebarOpen(false);
  };

  const CATEGORIES = ['All', 'Movies', 'TV Shows', 'Live TV', 'Sports', 'News'];

  return (
    <div 
      className="w-full h-full relative overflow-hidden font-sans"
      style={{
        background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)',
      }}
    >
      {/* Liquid Marble Effect Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 2000 2000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          filter: 'contrast(150%) brightness(100%)',
          backgroundSize: 'cover'
        }}
      />
      
      {/* 1. Toggle Arrow - Left Edge (Middle) */}
      <AnimatePresence>
        {!sidebarOpen && !activeApp && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-[60] w-8 h-24 rounded-r-xl flex items-center justify-center group transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderLeft: 'none'
            }}
          >
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Overlay Sidebar Menu - Styled like Layout Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80 z-[80] flex flex-col rounded-r-3xl"
              style={{ 
                background: 'rgba(100, 120, 140, 0.12)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                borderRight: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              }}
            >
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

              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                <button
                  onClick={() => handleAppSelect(null)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    !activeApp 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${!activeApp ? 'bg-white/20' : 'bg-white/5'}`}>
                    <Menu className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Discovery Home</span>
                </button>

                <div className="h-px bg-white/10 my-4 mx-2" />
                <p className="px-4 text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Connected Services</p>

                {STREAMING_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleAppSelect(app)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg border border-white/5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <app.icon className="w-5 h-5 text-current" style={{ color: app.color }} />
                    </div>
                    <span className="font-semibold truncate w-full group-hover:text-white transition-colors">{app.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Content - Hub or App View */}
      <div className="w-full h-full overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {activeApp ? (
            <div className="w-full h-full relative">
              {/* Back Button Overlay */}
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveApp(null)}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-2 backdrop-blur-xl rounded-full text-white/80 hover:text-white flex items-center gap-2 font-semibold text-sm shadow-xl transition-all"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Guide
              </motion.button>
              <AppView key={activeApp.id} app={activeApp} />
            </div>
          ) : (
            <motion.div 
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full overflow-y-auto custom-scrollbar"
            >
              {/* Hub Header */}
              <div 
                className="sticky top-0 z-40 px-12 py-6 flex items-center justify-between"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-8 ml-8">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Entertainment<span className="text-purple-500">Guide</span></h1>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          activeCategory === cat 
                            ? 'bg-white text-black' 
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Find movies, shows, sports..." 
                      className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all w-72"
                    />
                  </div>
                  <button className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
                  </button>
                </div>
              </div>

              <div className="px-16 py-10 space-y-12">
                
                {/* Section 1: Jump Back In (Resume) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <h2 className="text-xl font-bold text-white">Jump Back In</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {AGGREGATED_CONTENT.filter(item => item.progress).map((item) => (
                      <ContentCard key={item.id} item={item} onClick={handleAppSelect} showProgress={true} />
                    ))}
                  </div>
                </section>

                {/* Section 2: Trending Across Services */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <h2 className="text-xl font-bold text-white">Trending Across Services</h2>
                    </div>
                    <button className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {AGGREGATED_CONTENT.slice(0, 6).map((item) => (
                      <ContentCard key={item.id} item={item} onClick={handleAppSelect} />
                    ))}
                  </div>
                </section>

                {/* Section 3: New Releases */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <h2 className="text-xl font-bold text-white">Fresh Arrivals</h2>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-white/40 uppercase tracking-wider font-bold mr-2">Filtered By:</span>
                       <div className="flex -space-x-2">
                         {STREAMING_APPS.slice(0, 4).map(app => (
                           <div key={app.id} className="w-6 h-6 rounded-full border-2 border-[#050505] flex items-center justify-center bg-white/10" style={{backgroundColor: app.color}}>
                             <app.icon className="w-3 h-3 text-white" />
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {AGGREGATED_CONTENT.slice(6, 12).map((item) => (
                      <ContentCard key={item.id} item={item} onClick={handleAppSelect} />
                    ))}
                  </div>
                </section>

                {/* Section 4: Browse By Service */}
                <section className="pb-12">
                   <h2 className="text-xl font-bold text-white mb-6">Browse by Service</h2>
                   <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                     {STREAMING_APPS.map((app) => (
                       <button
                         key={app.id}
                         onClick={() => handleAppSelect(app)}
                         className="aspect-square bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:scale-105 transition-all group border border-white/5 hover:border-white/20"
                       >
                         <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: app.color }}>
                           <app.icon className="w-5 h-5 text-white" />
                         </div>
                         <span className="text-xs font-bold text-white/60 group-hover:text-white">{app.name}</span>
                       </button>
                     ))}
                   </div>
                </section>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}