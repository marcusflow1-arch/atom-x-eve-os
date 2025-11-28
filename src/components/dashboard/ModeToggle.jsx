import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Store, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

const modes = [
  { id: 'ai', label: 'AI Nexus', icon: Bot, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/25' },
  { id: 'user', label: 'User Interface', icon: User, color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/25' },
  { id: 'economy', label: 'Economy District', icon: Store, color: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/25' },
  { id: 'records', label: 'Hall of Records', icon: Trophy, color: 'from-yellow-500 to-orange-500', shadow: 'shadow-yellow-500/25' }
];

export default function ModeToggle({ currentMode, onModeChange }) {
  const currentModeData = modes.find(m => m.id === currentMode) || modes[0];
  const currentIndex = modes.findIndex(m => m.id === currentMode);
  const Icon = currentModeData.icon;

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
    onModeChange(modes[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % modes.length;
    onModeChange(modes[nextIndex].id);
  };

  return (
    <div className="flex flex-col items-center w-full gap-6">
      <div className="flex items-center justify-center w-full gap-4">
        {/* Left Arrow */}
        <motion.button
          onClick={handlePrev}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shadow-lg backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        {/* Center Display Box */}
        <motion.div
          className={`
            relative
            flex items-center justify-between
            w-full max-w-sm h-16 px-2
            bg-slate-900/80 backdrop-blur-xl
            border border-white/10 rounded-full
            shadow-xl ${currentModeData.shadow}
            transition-all duration-300
          `}
        >
          {/* Active Mode Indicator / Icon */}
          <div className={`
            flex items-center justify-center
            w-12 h-12 rounded-full
            bg-gradient-to-br ${currentModeData.color}
            shadow-lg
          `}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Text Content */}
          <div className="flex-1 px-4 text-center">
            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-0.5">
              Current Sector
            </div>
            <div className="text-lg font-bold text-white tracking-wide">
              {currentModeData.label}
            </div>
          </div>

          {/* Spacer to balance the icon on the left for centering text roughly */}
          <div className="w-12" />
        </motion.div>

        {/* Right Arrow */}
        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shadow-lg backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Interactive Dots */}
      <div className="flex gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              h-2 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none
              ${mode.id === currentMode 
                ? `w-8 bg-gradient-to-r ${currentModeData.color} shadow-lg` 
                : 'w-2 bg-slate-700 hover:bg-slate-600'}
            `}
            aria-label={`Switch to ${mode.label}`}
          />
        ))}
      </div>
    </div>
  );
}