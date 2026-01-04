import React from 'react';
import { motion } from 'framer-motion';
import { Settings, BarChart2, Users, Layout, Video } from 'lucide-react';

export default function RefractingGearNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', icon: Layout, label: 'Overview' },
    { id: 'content', icon: Video, label: 'Content' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="relative w-20 flex flex-col items-center py-8 z-20 h-full border-r border-white/5 bg-white/5 backdrop-blur-xl">
      {/* 3D Refracting Gear - Nav Anchor */}
      <div className="mb-10 relative w-12 h-12 flex items-center justify-center group cursor-pointer">
        <motion.div
           className="absolute inset-0 rounded-full border-4 border-white/20 border-t-cyan-400/80 border-l-cyan-400/40"
           animate={{ rotate: 360 }}
           transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
           style={{
             boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)',
             backdropFilter: 'blur(4px)'
           }}
        />
        <motion.div
           className="absolute inset-2 rounded-full border-4 border-white/10 border-b-purple-400/80"
           animate={{ rotate: -360 }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-white to-slate-400 shadow-inner" />
      </div>

      {/* Nav Items */}
      <div className="flex flex-col gap-6 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative w-full flex flex-col items-center gap-1 group py-2"
            >
              <div className={`p-2 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive ? 'text-cyan-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <tab.icon size={20} className="relative z-10" />
                {isActive && (
                    <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-cyan-400/10 blur-md" 
                    />
                )}
              </div>
              <span className={`text-[9px] font-medium tracking-wider transition-colors ${isActive ? 'text-cyan-400' : 'text-white/20 group-hover:text-white/60'}`}>
                {tab.label}
              </span>
              
              {/* Active Indicator Line */}
              {isActive && (
                  <motion.div 
                    layoutId="activeLine"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}