import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Play, ChevronRight, Star, Clock, TrendingUp, Sparkles, Volume2, X, Maximize2, ExternalLink } from 'lucide-react';

const streamingServices = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', icon: '🎬', url: 'https://www.netflix.com', gradient: 'from-red-600 to-red-900' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', icon: '📺', url: 'https://www.primevideo.com', gradient: 'from-blue-500 to-blue-800' },
  { id: 'disney', name: 'Disney+', color: '#113CCF', icon: '✨', url: 'https://www.disneyplus.com', gradient: 'from-blue-600 to-indigo-900' },
  { id: 'max', name: 'MAX', color: '#6B3FA0', icon: '⚡', url: 'https://www.max.com', gradient: 'from-purple-600 to-purple-900' },
  { id: 'appletv', name: 'Apple TV+', color: '#000000', icon: '🍎', url: 'https://tv.apple.com', gradient: 'from-slate-700 to-slate-900' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: '▶️', url: 'https://www.youtube.com', gradient: 'from-red-500 to-red-800' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF', icon: '🎮', url: 'https://www.twitch.tv', gradient: 'from-purple-500 to-purple-800' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', icon: '🟢', url: 'https://www.hulu.com', gradient: 'from-green-500 to-green-800' },
];

// Featured content mock data
const featuredContent = [
  { id: 1, title: 'Stranger Things', service: 'netflix', image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&h=450&fit=crop', rating: 4.9, category: 'Sci-Fi Horror' },
  { id: 2, title: 'The Mandalorian', service: 'disney', image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&h=450&fit=crop', rating: 4.8, category: 'Sci-Fi Action' },
  { id: 3, title: 'The Boys', service: 'prime', image: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=800&h=450&fit=crop', rating: 4.7, category: 'Action Drama' },
];

const continueWatching = [
  { id: 1, title: 'Breaking Bad', episode: 'S5 E12', progress: 65, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=170&fit=crop', service: 'netflix' },
  { id: 2, title: 'House of Dragon', episode: 'S2 E4', progress: 30, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=170&fit=crop', service: 'max' },
  { id: 3, title: 'The Last of Us', episode: 'S1 E8', progress: 80, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=170&fit=crop', service: 'max' },
  { id: 4, title: 'Loki', episode: 'S2 E5', progress: 45, image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=170&fit=crop', service: 'disney' },
];

// --- Liquid Glass Components ---
const LiquidGlassCard = ({ children, className = "", onClick, glow = false }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl cursor-pointer group ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: glow 
          ? '0 8px 32px rgba(100, 150, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)' 
          : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Liquid shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          transform: 'translateX(-100%)',
        }}
        animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      />
      {children}
    </motion.div>
  );
};

const GlassServicePill = ({ service, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
      isActive 
        ? 'bg-white/20 shadow-lg shadow-white/10' 
        : 'bg-white/5 hover:bg-white/10'
    }`}
    style={{
      backdropFilter: 'blur(20px)',
      border: isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
    }}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
  >
    <span className="text-lg">{service.icon}</span>
    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
      {service.name}
    </span>
    {isActive && (
      <motion.div
        layoutId="activeIndicator"
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20"
        style={{ zIndex: -1 }}
      />
    )}
  </motion.button>
);

const FeaturedHeroCard = ({ content, onPlay }) => {
  const service = streamingServices.find(s => s.id === content.service);
  
  return (
    <LiquidGlassCard className="relative h-[320px] w-full overflow-hidden" glow>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={content.image} alt={content.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8">
        <div className="flex items-center gap-2 mb-3">
          <span 
            className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: service?.color }}
          >
            {service?.name}
          </span>
          <span className="flex items-center gap-1 text-yellow-400 text-sm">
            <Star className="w-4 h-4 fill-current" />
            {content.rating}
          </span>
          <span className="text-white/50 text-sm">{content.category}</span>
        </div>

        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{content.title}</h2>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={onPlay}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-xl text-white font-medium rounded-2xl border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5" />
            Add to List
          </motion.button>
        </div>
      </div>

      {/* Floating Service Icon */}
      <div className="absolute top-6 right-6">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
          style={{ 
            backgroundColor: service?.color,
            boxShadow: `0 8px 24px ${service?.color}50`
          }}
        >
          {service?.icon}
        </div>
      </div>
    </LiquidGlassCard>
  );
};

const ContinueWatchingCard = ({ item, onPlay }) => {
  const service = streamingServices.find(s => s.id === item.service);
  
  return (
    <LiquidGlassCard className="w-[260px] flex-shrink-0" onClick={onPlay}>
      <div className="relative">
        <img src={item.image} alt={item.title} className="w-full aspect-video object-cover rounded-t-3xl" />
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{ width: `${item.progress}%` }}
          />
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-t-3xl">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-black fill-current ml-1" />
          </div>
        </div>

        {/* Service Badge */}
        <div 
          className="absolute top-3 left-3 w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-lg"
          style={{ backgroundColor: service?.color }}
        >
          {service?.icon}
        </div>
      </div>

      <div className="p-4">
        <h4 className="text-white font-semibold text-sm mb-1 truncate">{item.title}</h4>
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs">{item.episode}</span>
          <span className="text-white/40 text-xs">{item.progress}%</span>
        </div>
      </div>
    </LiquidGlassCard>
  );
};

const ServiceCard = ({ service, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`relative w-full aspect-video rounded-2xl overflow-hidden transition-all duration-300 ${
      isActive ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900' : ''
    }`}
    style={{
      background: `linear-gradient(135deg, ${service.color}40 0%, ${service.color}20 100%)`,
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}
    whileHover={{ scale: 1.05, y: -4 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <span className="text-4xl">{service.icon}</span>
      <span className="text-white font-medium text-sm">{service.name}</span>
    </div>
    
    {isActive && (
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
    )}
  </motion.button>
);

export default function EntertainmentTab() {
  const [activeService, setActiveService] = useState('netflix');
  const [showPlayer, setShowPlayer] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const handlePlay = (service) => {
    setActiveService(service?.id || activeService);
    setShowPlayer(true);
  };

  return (
    <div className="h-full overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative h-full flex">
        {/* Left Side - Service Grid (iPhone 17 style compact sidebar) */}
        <div className="w-[100px] flex-shrink-0 p-4 flex flex-col gap-3 overflow-y-auto">
          {streamingServices.map((service) => (
            <motion.button
              key={service.id}
              onClick={() => setActiveService(service.id)}
              className={`relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 ${
                activeService === service.id 
                  ? 'bg-white/20 shadow-lg' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              style={{
                backdropFilter: 'blur(20px)',
                border: activeService === service.id 
                  ? '1px solid rgba(255,255,255,0.3)' 
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: activeService === service.id 
                  ? `0 8px 24px ${service.color}30` 
                  : 'none',
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <span className="text-2xl">{service.icon}</span>
              {activeService === service.id && (
                <motion.div
                  layoutId="activeBorder"
                  className="absolute inset-0 rounded-2xl border-2"
                  style={{ borderColor: service.color }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-8">
          {/* Featured Hero */}
          <section>
            <FeaturedHeroCard 
              content={featuredContent[featuredIndex]} 
              onPlay={() => handlePlay(streamingServices.find(s => s.id === featuredContent[featuredIndex].service))}
            />
            
            {/* Hero Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {featuredContent.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === featuredIndex ? 'w-6 bg-white' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </section>

          {/* Continue Watching */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-white/50" />
                <h3 className="text-white font-bold text-lg">Continue Watching</h3>
              </div>
              <button className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300">
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {continueWatching.map((item) => (
                <ContinueWatchingCard 
                  key={item.id} 
                  item={item} 
                  onPlay={() => handlePlay(streamingServices.find(s => s.id === item.service))}
                />
              ))}
            </div>
          </section>

          {/* Quick Access Services (Luna-style grid) */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-white/50" />
              <h3 className="text-white font-bold text-lg">Your Services</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {streamingServices.slice(0, 8).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isActive={activeService === service.id}
                  onClick={() => handlePlay(service)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Full Screen Player Overlay */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black"
          >
            {/* Player Controls Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setShowPlayer(false)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
                <span className="text-white font-medium">
                  {streamingServices.find(s => s.id === activeService)?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20"
                  whileHover={{ scale: 1.1 }}
                >
                  <Volume2 className="w-5 h-5 text-white" />
                </motion.button>
                <motion.button
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20"
                  whileHover={{ scale: 1.1 }}
                >
                  <Maximize2 className="w-5 h-5 text-white" />
                </motion.button>
                <motion.a
                  href={streamingServices.find(s => s.id === activeService)?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20"
                  whileHover={{ scale: 1.1 }}
                >
                  <ExternalLink className="w-5 h-5 text-white" />
                </motion.a>
              </div>
            </div>

            {/* Player Content */}
            <iframe
              src={streamingServices.find(s => s.id === activeService)?.url}
              title={streamingServices.find(s => s.id === activeService)?.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}