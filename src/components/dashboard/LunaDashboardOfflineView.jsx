import React from 'react';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Brain, Trophy, Star, Newspaper } from 'lucide-react';

export default function LunaDashboardOfflineView() {
  const boxStyle = {
    background: 'linear-gradient(135deg, rgba(15, 20, 30, 0.7) 0%, rgba(8, 12, 18, 0.85) 100%)',
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="absolute z-10 pointer-events-auto"
      style={{
        left: '440px',
        top: '190px',
        width: '247px',
        height: '380px'
      }}
    >
      {/* Box 1: Friends News */}
      <div 
        className="w-full h-full rounded-2xl p-3 flex flex-col gap-2 overflow-hidden relative group hover:border-white/20 transition-colors"
        style={boxStyle}
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <h3 className="text-white font-bold tracking-wider uppercase text-[10px]">Friends Network</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {[
            { name: "Shadow_Striker", action: "Unlocked Legendary Sword", time: "10m ago", color: "text-orange-400" },
            { name: "CyberVixen", action: "Started streaming", time: "1h ago", color: "text-purple-400" },
            { name: "NovaStar", action: "Reached Level 50", time: "2h ago", color: "text-green-400" },
            { name: "IronFist", action: "Defeated the Abyss Boss", time: "5h ago", color: "text-red-400" },
            { name: "GhostReaper", action: "Defeated the Abyss Boss", time: "5h ago", color: "text-red-400" }
          ].map((news, i) => (
            <div key={i} className="flex gap-2 items-start mb-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white/90">{news.name}</p>
                <p className={`text-[10px] ${news.color}`}>{news.action}</p>
                <p className="text-[8px] text-white/40 mt-0.5">{news.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}