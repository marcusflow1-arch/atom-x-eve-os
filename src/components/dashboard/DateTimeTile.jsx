import React from 'react';
import { motion } from 'framer-motion';

export default function DateTimeTile({ onClick }) {
  return (
    <div
      className="w-full flex-1 rounded-2xl relative overflow-hidden border border-white/10"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
      <div className="relative h-full flex flex-row items-stretch">
        
        {/* System Updates (Clickable) */}
        <motion.div 
          style={{ flex: 100 }}
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
          className="flex flex-col justify-center cursor-pointer group transition-colors relative overflow-hidden p-3 px-6 h-full"
        >
          {/* Updates Header */}
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/20 w-max">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-xs text-white/90 font-bold truncate uppercase tracking-widest">System Status</span>
          </div>
          
          {/* Updates List */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/50 group-hover:text-white/70 truncate transition-colors">v2.1 - Cyberpunk Expansion</span>
            <span className="text-[10px] text-white/50 group-hover:text-white/70 truncate transition-colors">All systems operational</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}