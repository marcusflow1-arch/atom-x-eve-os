import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OctagonSkillTree = () => {
  const [activeLayer, setActiveLayer] = useState(0); // 0: inner, 1: middle, 2: outer

  // Inner layer - Central octagon hexagonal slots
  const innerSlots = [
    { id: 'center-top', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-20', rotation: 0 },
    { id: 'center-right', position: 'top-1/2 right-8 -translate-y-1/2', rotation: 90 },
    { id: 'center-bottom', position: 'bottom-8 left-1/2 -translate-x-1/2', rotation: 180 },
    { id: 'center-left', position: 'top-1/2 left-8 -translate-y-1/2', rotation: 270 },
  ];

  // Middle layer - Triangular shapes around center
  const middleSlots = [
    { id: 'mid-top', position: 'top-0 left-1/2 -translate-x-1/2', label: 'SKILL SLOT 1' },
    { id: 'mid-right', position: 'top-1/2 right-0 -translate-y-1/2', label: 'SKILL SLOT 2' },
    { id: 'mid-bottom', position: 'bottom-0 left-1/2 -translate-x-1/2', label: 'SKILL SLOT 3' },
    { id: 'mid-left', position: 'top-1/2 left-0 -translate-y-1/2', label: 'SKILL SLOT 4' },
  ];

  // Outer layer - Corner triangular decorations
  const outerSlots = [
    { id: 'outer-top-left', position: 'top-4 left-4' },
    { id: 'outer-top-right', position: 'top-4 right-4' },
    { id: 'outer-bottom-left', position: 'bottom-4 left-4' },
    { id: 'outer-bottom-right', position: 'bottom-4 right-4' },
  ];

  const HexSlot = ({ rotation }) => (
    <div className="w-16 h-16 relative">
      <div 
        className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
        style={{ 
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
          transform: `rotate(${rotation}deg)`
        }}
      />
    </div>
  );

  const TriangleSlot = ({ label }) => (
    <div className="w-20 h-20 relative flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
        style={{ 
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
        }}
      />
      {label && (
        <span className="absolute text-white/60 text-[8px] font-bold tracking-wider whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );

  const DiamondSlot = () => (
    <div className="w-12 h-12 relative">
      <div 
        className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md rotate-45 rounded-sm"
      />
    </div>
  );

  return (
    <div className="relative">
      {/* Main Skill Tree Container */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Inner Layer */}
        <AnimatePresence>
          {activeLayer === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {innerSlots.map((slot) => (
                <div key={slot.id} className={`absolute ${slot.position}`}>
                  <HexSlot rotation={slot.rotation} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Middle Layer */}
        <AnimatePresence>
          {activeLayer === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {middleSlots.map((slot) => (
                <div key={slot.id} className={`absolute ${slot.position}`}>
                  <TriangleSlot label={slot.label} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer Layer */}
        <AnimatePresence>
          {activeLayer === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {outerSlots.map((slot) => (
                <div key={slot.id} className={`absolute ${slot.position}`}>
                  <DiamondSlot />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layer Selector Dots */}
      <div className="flex justify-center gap-3 mt-4">
        {[0, 1, 2].map((layer) => (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              activeLayer === layer
                ? 'bg-white w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OctagonSkillTree;