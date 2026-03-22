import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Bell, Settings } from 'lucide-react';

export default function DateTimeTile({ onClick, onCalendarClick = () => {} }) {
  const [time, setTime] = useState(new Date());
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);

  const reminders = [
    "Raid at 8:00 PM tonight",
    "Collect daily rewards",
    "Check out new game release",
    "Clan meeting tomorrow"
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const reminderTimer = setInterval(() => {
      setCurrentReminderIdx((prev) => (prev + 1) % reminders.length);
    }, 5000);
    return () => {
      clearInterval(timer);
      clearInterval(reminderTimer);
    };
  }, [reminders.length]);

  const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
        
        <div className="flex-1 p-2.5 px-4 flex items-center gap-3 overflow-hidden relative">
          {/* Calendar Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onCalendarClick(); }}
            className="w-8 h-8 flex-shrink-0 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all z-10 self-center"
            title="Calendar"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-white/80" />
          </button>

          {/* Date, Time, Reminders, Updates */}
          <div className="flex flex-col justify-center flex-1 min-w-0 relative h-full">
            
            <div className="flex items-center justify-between w-full mb-0.5">
              {/* Date above */}
              <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest truncate">
                {dateString}
              </div>
              
              {/* Top Right System Updates Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); onClick(); }} 
                className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors group px-1.5 py-0.5 rounded hover:bg-white/5 z-20"
              >
                <span className="text-[9px] uppercase tracking-wider font-bold">System Updates</span>
                <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
            
            {/* Time and Info split */}
            <div className="flex items-center gap-3 w-full">
              <div className="text-3xl font-black text-white tracking-tighter drop-shadow-md leading-none flex-shrink-0">
                {timeString}
              </div>
              
              {/* Reminders & Updates Area */}
              <div className="flex-1 flex items-stretch gap-3 overflow-hidden border-l border-white/10 pl-3 h-8">
                {/* Reminders Side */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Bell className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[8px] uppercase tracking-wider text-amber-400/80 font-bold">0 Reminders</span>
                  </div>
                  <div className="relative w-full h-4 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentReminderIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 text-[10px] text-white/80 font-medium truncate"
                      >
                        {reminders[currentReminderIdx]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-white/10 h-full" />

                {/* Updates Side */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    <span className="text-[8px] uppercase tracking-wider text-green-400/80 font-bold">Updates</span>
                  </div>
                  <div className="text-[10px] text-white/80 font-medium truncate">
                    v2.1 - Cyberpunk Exp...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}