import React, { useState } from 'react';
import { motion } from 'framer-motion';

const streamingServices = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', icon: '🎬', url: 'https://www.netflix.com' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', icon: '📺', url: 'https://www.primevideo.com' },
  { id: 'disney', name: 'Disney+', color: '#113CCF', icon: '✨', url: 'https://www.disneyplus.com' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', icon: '🟢', url: 'https://www.hulu.com' },
  { id: 'max', name: 'MAX', color: '#6B3FA0', icon: '⚡', url: 'https://www.max.com' },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', icon: '⭐', url: 'https://www.paramountplus.com' },
  { id: 'appletv', name: 'Apple TV+', color: '#555555', icon: '🍎', url: 'https://tv.apple.com' },
  { id: 'peacock', name: 'Peacock', color: '#FFC107', icon: '🦚', url: 'https://www.peacocktv.com' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: '▶️', url: 'https://www.youtube.com' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF', icon: '🎮', url: 'https://www.twitch.tv' },
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521', icon: '🍥', url: 'https://www.crunchyroll.com' },
  { id: 'tubi', name: 'Tubi', color: '#FA382F', icon: '📽️', url: 'https://www.tubi.tv' },
];

export default function EntertainmentTab() {
  const [activeService, setActiveService] = useState('netflix');
  const [loadedServices, setLoadedServices] = useState(new Set(['netflix']));

  const handleServiceClick = (serviceId) => {
    setActiveService(serviceId);
    setLoadedServices(prev => new Set([...prev, serviceId]));
  };

  const activeServiceData = streamingServices.find(s => s.id === activeService);

  return (
    <div className="flex h-full gap-3 p-3">
      {/* Left Sidebar - Content Only */}
      <div className="w-[90px] flex-shrink-0 flex flex-col gap-2 p-3 overflow-y-auto">
        {streamingServices.map((service) => (
          <motion.button
            key={service.id}
            onClick={() => handleServiceClick(service.id)}
            className="relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: activeService === service.id 
                ? `linear-gradient(135deg, ${service.color}40 0%, ${service.color}20 100%)`
                : 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: activeService === service.id 
                ? `2px solid ${service.color}` 
                : '1px solid rgba(255,255,255,0.08)',
              boxShadow: activeService === service.id 
                ? `0 8px 24px ${service.color}40, inset 0 1px 0 rgba(255,255,255,0.2)` 
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            whileHover={{ 
              scale: 1.08, 
              y: -2,
              boxShadow: `0 12px 28px ${service.color}30`
            }}
            whileTap={{ scale: 0.92 }}
          >
            <span className="text-2xl drop-shadow-lg">{service.icon}</span>
            
            {/* Active indicator dot */}
            {activeService === service.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-lg"
                style={{ boxShadow: `0 0 8px ${service.color}` }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Right Stage - Content Only */}
      <div className="flex-1 overflow-hidden relative">
        {/* Service Header Bar */}
        <div 
          className="absolute top-0 left-0 right-0 z-10 h-12 flex items-center px-4 gap-3"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}
        >
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-lg"
            style={{ 
              backgroundColor: activeServiceData?.color,
              boxShadow: `0 4px 12px ${activeServiceData?.color}50`
            }}
          >
            {activeServiceData?.icon}
          </div>
          <span className="text-white font-semibold text-sm">{activeServiceData?.name}</span>
        </div>

        {/* Iframe Container */}
        {streamingServices.map((service) => (
          <div
            key={service.id}
            style={{
              display: activeService === service.id ? 'block' : 'none',
              width: '100%',
              height: '100%'
            }}
          >
            {loadedServices.has(service.id) && (
              <iframe
                src={service.url}
                title={service.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ))}

        {/* Loading State */}
        {!loadedServices.has(activeService) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto animate-pulse"
                style={{ 
                  backgroundColor: activeServiceData?.color,
                  boxShadow: `0 8px 32px ${activeServiceData?.color}50`
                }}
              >
                {activeServiceData?.icon}
              </div>
              <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white/60 text-sm">Loading {activeServiceData?.name}...</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}