import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function DateTimeTile({ onClick, onCalendarClick = () => {} }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const yearString = time.getFullYear();

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex-1 rounded-2xl relative overflow-hidden group border border-white/10 cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between p-6">
        <div className="flex items-center gap-6">
          <div className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{timeString}</div>
          <div className="flex flex-col gap-1 text-left">
            <div className="text-sm font-bold text-cyan-300 uppercase tracking-widest">{dateString}</div>
            <div className="text-xs text-white/40 font-mono">{yearString}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-xs text-white/60 font-medium uppercase tracking-wider">System Online</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCalendarClick(); }}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
            title="Add to Calendar"
          >
            <CalendarIcon className="w-5 h-5 text-white/90" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}