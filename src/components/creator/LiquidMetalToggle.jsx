import React from 'react';
import { motion } from 'framer-motion';

export default function LiquidMetalToggle({ label, isOn, onToggle }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5">
      <span className="text-white/80 font-medium tracking-wide">{label}</span>
      
      <button 
        onClick={onToggle}
        className="relative w-14 h-8 rounded-full transition-colors duration-300"
        style={{
          background: isOn ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          boxShadow: isOn 
            ? 'inset 0 2px 5px rgba(0,0,0,0.5), 0 0 10px rgba(34, 211, 238, 0.3)' 
            : 'inset 0 2px 5px rgba(0,0,0,0.5)'
        }}
      >
        {/* Track liquid effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
             <motion.div 
               className="absolute inset-0"
               initial={false}
               animate={{ x: isOn ? 0 : '-100%' }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               style={{
                 background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                 opacity: 0.5
               }}
             />
        </div>

        {/* The Liquid Metal Switch Knob */}
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg"
          initial={false}
          animate={{ x: isOn ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          style={{
            background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)', // Chrome/Silver look
            boxShadow: '0 2px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -2px 5px rgba(0,0,0,0.2)'
          }}
        >
            {/* Specular highlight for liquid metal look */}
            <div className="absolute top-[2px] left-[4px] w-2 h-1 bg-white/90 rounded-full blur-[1px]" />
            <div className="absolute bottom-[2px] right-[4px] w-3 h-3 bg-black/10 rounded-full blur-[2px]" />
        </motion.div>
      </button>
    </div>
  );
}