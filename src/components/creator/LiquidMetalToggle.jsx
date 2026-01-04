import React from 'react';
import { motion } from 'framer-motion';

export default function LiquidMetalToggle({ label, isOn, onToggle }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5">
      <span className="text-white/80 font-medium tracking-wide">{label}</span>
      
      <button 
        onClick={onToggle}
        className="relative w-16 h-8 rounded-full transition-all duration-500 cursor-pointer group"
        style={{
          background: 'rgba(0, 0, 0, 0.3)', // Dark glass slot background
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1)' // Deep inset for slot
        }}
      >
        {/* Glass Glare / Slot Reflection */}
        <div className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
             style={{
               background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%, rgba(255,255,255,0.05) 100%)'
             }}
        />

        {/* Liquid Trail (Mercury Flow) */}
        <div className="absolute inset-1 rounded-full overflow-hidden pointer-events-none">
             <motion.div 
               className="absolute inset-0 rounded-full"
               initial={false}
               animate={{ 
                 x: isOn ? 0 : '-100%',
                 opacity: isOn ? 1 : 0
               }}
               transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
               style={{
                 background: 'linear-gradient(90deg, #94a3b8, #cbd5e1, #e2e8f0)', // Silver flow
                 filter: 'blur(4px)',
                 opacity: 0.5
               }}
             />
        </div>

        {/* The Droplet (Switch Knob) */}
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 rounded-full"
          initial={false}
          animate={{ x: isOn ? 32 : 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            mass: 0.8 // Slightly lighter for fluid feel
          }}
          style={{
            background: 'conic-gradient(from 180deg at 50% 50%, #cbd5e1 0deg, #f8fafc 180deg, #94a3b8 360deg)', // Metallic Silver
            boxShadow: `
              0 2px 6px rgba(0,0,0,0.5), 
              inset 0 2px 3px rgba(255,255,255,0.9), 
              inset 0 -2px 4px rgba(0,0,0,0.4)
            `
          }}
        >
            {/* Liquid Surface Tension/Highlight */}
            <div className="absolute top-[20%] left-[20%] w-[30%] h-[15%] bg-white rounded-full blur-[0.5px] opacity-90" />
            
            {/* Environment Reflection */}
            <div className="absolute bottom-[20%] right-[20%] w-[20%] h-[20%] bg-blue-300/20 rounded-full blur-[1px]" />
        </motion.div>
      </button>
    </div>
  );
}