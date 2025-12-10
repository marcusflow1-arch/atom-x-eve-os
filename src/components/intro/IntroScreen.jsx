import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function IntroScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Sequence Timeline
    // 0: Walk Cycle (0-5s)
    // 1: Look Up (5-7s)
    // 2: Morph to Moon (7-10s)
    // 3: "Flawless Creativity" (10-13s)
    // 4: "Adam X Eve" (13s+)
    
    const sequence = [
      { time: 5000, stage: 1 },
      { time: 2000, stage: 2 },
      { time: 3000, stage: 3 },
      { time: 3000, stage: 4 }
    ];

    let currentStep = 0;
    
    const runSequence = () => {
      if (currentStep < sequence.length) {
        setTimeout(() => {
          setStage(sequence[currentStep].stage);
          currentStep++;
          runSequence();
        }, sequence[currentStep].time);
      }
    };

    runSequence();
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f4f1ea] cursor-pointer font-sans"
      onClick={onComplete}
    >
      {/* SVG Filters for Watercolor Effect */}
      <svg className="hidden">
        <filter id="watercolor">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        </filter>
      </svg>

      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none z-50" 
           style={{ filter: 'url(#paper)' }} />

      {/* SCENE CONTAINER */}
      <div className="relative w-full h-full overflow-hidden">
        
        {/* BACKGROUNDS */}
        <div className="absolute inset-0 transition-colors duration-[3000ms] ease-in-out"
             style={{ backgroundColor: stage >= 2 ? '#0f172a' : '#fdfbf7' }}>
          
          {/* Grass (Day) */}
          <motion.div 
            className="absolute bottom-0 left-0 w-full h-1/3 bg-green-200/50 blur-3xl mix-blend-multiply origin-bottom"
            initial={{ scaleY: 1, opacity: 1 }}
            animate={{ 
              scaleY: stage >= 2 ? 0 : 1, 
              opacity: stage >= 2 ? 0 : 1 
            }}
            transition={{ duration: 2 }}
          />

          {/* Sky (Night) */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 opacity-0"
            animate={{ opacity: stage >= 2 ? 1 : 0 }}
            transition={{ duration: 3 }}
          >
             {/* Stars */}
             {[...Array(20)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute bg-white rounded-full w-1 h-1"
                  initial={{ opacity: 0, x: Math.random() * 1000, y: Math.random() * 500 }}
                  animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
                  transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() }}
                />
             ))}
          </motion.div>
        </div>


        {/* THE CHARACTER (Walker) */}
        <AnimatePresence>
          {stage < 2 && (
            <motion.div
              className="absolute bottom-[25%] left-0 w-32 h-48"
              initial={{ x: '-20%' }}
              animate={{ 
                x: stage === 0 ? '45%' : '45%', // Walk to center then stop
              }}
              exit={{ opacity: 0, scale: 0, y: -200 }} // Morph exit
              transition={{ 
                x: { duration: 5, ease: "linear" },
                exit: { duration: 2 }
              }}
            >
              {/* Abstract Watercolor Body */}
              <motion.div 
                className="w-full h-full relative"
                animate={{ 
                  y: stage === 0 ? [0, -10, 0] : 0, // Bounce while walking
                }}
                transition={{ 
                  y: { duration: 0.6, repeat: Infinity, ease: "easeInOut" } 
                }}
              >
                {/* Head */}
                <motion.div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-800/80 rounded-full blur-sm"
                  animate={{ 
                    rotate: stage === 1 ? -30 : 0, // Look up
                    y: stage === 1 ? -5 : 0
                  }}
                  transition={{ duration: 1 }}
                />
                {/* Torso */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-10 h-20 bg-slate-800/70 rounded-3xl blur-sm" />
                
                {/* Legs (Simulated with scaling blobs) */}
                <motion.div 
                  className="absolute bottom-0 left-4 w-4 h-16 bg-slate-800/60 rounded-full blur-sm"
                  animate={{ height: stage === 0 ? [64, 40, 64] : 64, rotate: stage === 0 ? [15, -15, 15] : 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute bottom-0 right-4 w-4 h-16 bg-slate-800/60 rounded-full blur-sm"
                  animate={{ height: stage === 0 ? [40, 64, 40] : 64, rotate: stage === 0 ? [-15, 15, -15] : 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* THE TRANSFORMATION (Moon) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center">
          {/* Expansion Ring (The "Poof") */}
          <AnimatePresence>
            {stage === 2 && (
               <motion.div 
                 className="absolute inset-0 rounded-full border-4 border-white/50"
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 2, opacity: 0 }}
                 transition={{ duration: 1.5 }}
               />
            )}
          </AnimatePresence>

          {/* The Moon */}
          <motion.div
            className="relative w-full h-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: stage >= 2 ? 1 : 0, 
              opacity: stage >= 2 ? 1 : 0,
              y: stage >= 4 ? -100 : 0 // Move up slightly for text
            }}
            transition={{ duration: 2, type: "spring", bounce: 0.3 }}
          >
            {/* Watercolor Moon Base */}
            <div className="w-full h-full rounded-full bg-slate-100 shadow-[0_0_80px_rgba(255,255,255,0.3)] overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-100/30 mix-blend-overlay" />
              {/* Craters as watercolor blots */}
              <div className="absolute top-[20%] right-[30%] w-16 h-12 bg-indigo-200/40 blur-xl rounded-full" />
              <div className="absolute bottom-[30%] left-[20%] w-20 h-20 bg-purple-200/30 blur-xl rounded-full" />
            </div>
            {/* Glow */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-white/20 blur-2xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </div>


        {/* TEXT SEQUENCE */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            
            {/* Stage 3: Flawless Creativity */}
            {stage === 3 && (
              <motion.div
                key="text-flawless"
                initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.5 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.8 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full text-center mt-32"
              >
                <h2 className="text-4xl md:text-6xl text-white font-light tracking-[0.2em] uppercase mix-blend-overlay" style={{ fontFamily: 'serif' }}>
                  Flawless Creativity
                </h2>
              </motion.div>
            )}

            {/* Stage 4: Adam X Eve */}
            {stage >= 4 && (
              <motion.div
                key="text-logo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full text-center mt-48"
              >
                <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] tracking-tighter">
                  Adam <span className="text-blue-400 font-light mx-2">X</span> Eve
                </h1>
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  transition={{ delay: 1, duration: 1.5 }}
                  className="h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto mt-6"
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 13 }}
        className="absolute bottom-8 w-full text-center text-white/50 text-xs tracking-[0.5em] uppercase"
      >
        Click to Enter
      </motion.div>
    </div>
  );
}