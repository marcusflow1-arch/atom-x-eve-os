import React, { useState } from 'react';
import { motion } from 'framer-motion';

const streamingServices = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600', icon: '🎬', url: 'https://www.netflix.com' },
  { id: 'prime', name: 'Prime Video', color: 'bg-blue-500', icon: '📺', url: 'https://www.primevideo.com' },
  { id: 'hulu', name: 'Hulu', color: 'bg-green-500', icon: '🟢', url: 'https://www.hulu.com' },
  { id: 'disney', name: 'Disney+', color: 'bg-blue-700', icon: '✨', url: 'https://www.disneyplus.com' },
  { id: 'max', name: 'MAX', color: 'bg-purple-700', icon: '⚡', url: 'https://www.max.com' },
  { id: 'paramount', name: 'Paramount+', color: 'bg-blue-600', icon: '⭐', url: 'https://www.paramountplus.com' },
  { id: 'appletv', name: 'Apple TV+', color: 'bg-black', icon: '🍎', url: 'https://tv.apple.com' },
  { id: 'peacock', name: 'Peacock', color: 'bg-gradient-to-br from-yellow-500 to-purple-600', icon: '🦚', url: 'https://www.peacocktv.com' },
  { id: 'showtime', name: 'Showtime', color: 'bg-red-700', icon: '🎭', url: 'https://www.showtime.com' },
  { id: 'starz', name: 'Starz', color: 'bg-black', icon: '⭐', url: 'https://www.starz.com' },
  { id: 'youtube', name: 'YouTube', color: 'bg-red-600', icon: '▶️', url: 'https://www.youtube.com' },
  { id: 'twitch', name: 'Twitch', color: 'bg-purple-600', icon: '🎮', url: 'https://www.twitch.tv' }
];

export default function EntertainmentTab() {
  const [activeService, setActiveService] = useState('netflix');
  const [loadedServices, setLoadedServices] = useState(new Set(['netflix'])); // Track which iframes have been loaded

  const handleServiceClick = (serviceId) => {
    setActiveService(serviceId);
    setLoadedServices(prev => new Set([...prev, serviceId]));
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - 15% */}
      <div className="w-[15%] bg-slate-800/30 rounded-l-xl border border-slate-700/50 p-3 overflow-y-auto">
        <h3 className="text-white font-bold text-sm mb-4">Streaming Services</h3>
        <div className="space-y-2">
          {streamingServices.map((service) => (
            <motion.button
              key={service.id}
              whileHover={{ scale: 1.02, x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceClick(service.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                activeService === service.id
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700/30 hover:bg-slate-700/50'
              }`}
            >
              <div className={`w-8 h-8 ${service.color} rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${service.id === 'appletv' || service.id === 'starz' ? 'border border-white/20' : ''}`}>
                {service.icon}
              </div>
              <span className={`text-sm font-semibold truncate ${activeService === service.id ? 'text-white' : 'text-slate-300'}`}>
                {service.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent"></div>

      {/* Right Stage - 85% */}
      <div className="flex-1 bg-slate-800/20 rounded-r-xl border border-slate-700/50 border-l-0 relative overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading {streamingServices.find(s => s.id === activeService)?.name}...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}