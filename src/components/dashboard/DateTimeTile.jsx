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
        
        {/* Left Side: Time, Date & Calendar */}
        <div className="flex-1 p-3 px-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-white tracking-tighter drop-shadow-md leading-none">{timeString}</div>
            <div className="flex flex-col items-start justify-center leading-tight">
              <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">{dateString}</div>
              <div className="text-[10px] text-white/40 font-mono">{yearString}</div>
            </div>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onCalendarClick(); }}
            className="absolute top-2 right-3 w-7 h-7 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all z-10"
            title="Calendar"
          >
            <CalendarIcon className="w-3 h-3 text-white/80" />
          </button>
        </div>

        {/* Divider Line */}
        <div className="w-px bg-white/10 h-full" />

        {/* Right Side: System Updates (Clickable) */}
        <motion.div 
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex-1 p-3 px-5 flex items-center justify-center cursor-pointer group transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span className="text-sm font-bold text-white/90">System Online</span>
            </div>
            <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-wider font-semibold">Updates</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}