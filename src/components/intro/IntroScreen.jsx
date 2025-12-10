import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';

export default function IntroScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Timeline configuration
    // Stage 0: Walking on grass (0-4s)
    // Stage 1: Looking up & Transformation to Moon (4-7s)
    // Stage 2: "Flawless Creativity" (7-10s)
    // Stage 3: "Adam X Eve" (10-13s)
    // End: Complete

    const times = [4000, 3000, 3000, 3500];
    let currentStage = 0;

    const runStage = () => {
      if (currentStage < 3) {
        currentStage++;
        setStage(currentStage);
        setTimeout(runStage, times[currentStage]);
      } else {
        onComplete();
      }
    };

    const initialTimer = setTimeout(runStage, times[0]);

    return () => clearTimeout(initialTimer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer bg-[#fdfbf7]"
      onClick={onComplete}
    >
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-40 z-50 pointer-events-none mix-blend-multiply" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }} />

      {/* Dynamic Backgrounds (Watercolor Blobs) */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {stage === 0 ? (
            /* Day/Grass Theme */
            <motion.div key="bg-day" className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 1 }}>
               <motion.div 
                 className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[50%] bg-green-300/40 rounded-[100%] blur-[60px] mix-blend-multiply"
                 animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -1, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               />
               <motion.div 
                 className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-sky-200/40 rounded-[100%] blur-[80px] mix-blend-multiply"
               />
            </motion.div>
          ) : (
            /* Night/Sky Theme */
            <motion.div key="bg-night" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
               <motion.div 
                 className="absolute inset-0 bg-blue-950/10" 
               />
               <motion.div 
                 className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-indigo-400/30 rounded-[100%] blur-[80px] mix-blend-multiply"
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 8, repeat: Infinity }}
               />
               <motion.div 
                 className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-purple-400/30 rounded-[100%] blur-[80px] mix-blend-multiply"
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ duration: 10, repeat: Infinity }}
               />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Animation Container */}
      <div className="relative z-10 w-full h-full">
        
        {/* CHARACTER / WALKER ANIMATION */}
        <AnimatePresence>
          {stage === 0 && (
            <motion.div
              key="walker"
              className="absolute bottom-[30%] left-0 w-24 h-24 text-slate-700"
              initial={{ x: '-20vw' }}
              animate={{ x: '50vw', rotate: [0, 5, -5, 0] }} // Walk to center
              exit={{ opacity: 0, scale: 0.5, y: -50 }} // Fade out upward into moon
              transition={{ 
                x: { duration: 3.5, ease: "linear" },
                rotate: { duration: 0.5, repeat: Infinity, ease: "linear" },
                exit: { duration: 1 }
              }}
              style={{ x: '-50%' }} // Center alignment adjustment
            >
               {/* Cartoon/Anime Style Character Silhouette */}
               <div className="relative w-full h-full">
                 {/* Head */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-800 rounded-full" />
                 {/* Body */}
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-10 bg-slate-800 rounded-lg" />
                 {/* Legs (Animated via CSS for simplicity in framer context) */}
                 <motion.div className="absolute top-16 left-1/2 -translate-x-1/2 w-2 h-8 bg-slate-800 rounded-full origin-top" 
                   animate={{ rotate: [-20, 20, -20] }} transition={{ duration: 0.5, repeat: Infinity }}
                 />
                 <motion.div className="absolute top-16 left-1/2 -translate-x-1/2 w-2 h-8 bg-slate-800 rounded-full origin-top" 
                   animate={{ rotate: [20, -20, 20] }} transition={{ duration: 0.5, repeat: Infinity }}
                 />
                 
                 {/* "Thinking/Looking Up" Pause at end of stage 0 handled by exit transition visually merging to sky */}
               </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* MOON TRANSFORMATION */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              key="moon"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.2, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 2, ease: "circOut" }}
            >
               {/* Watercolor Moon */}
               <div className="relative w-64 h-64">
                 <motion.div 
                    className="absolute inset-0 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.6)]"
                    animate={{ boxShadow: ["0 0 50px rgba(255,255,255,0.6)", "0 0 80px rgba(255,255,255,0.8)", "0 0 50px rgba(255,255,255,0.6)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                 />
                 {/* Abstract Craters / Watercolor stains */}
                 <div className="absolute top-[20%] right-[30%] w-12 h-12 bg-blue-100/50 rounded-full blur-md mix-blend-multiply" />
                 <div className="absolute bottom-[30%] left-[20%] w-16 h-16 bg-purple-100/50 rounded-full blur-md mix-blend-multiply" />
                 
                 {/* Sparkles around moon */}
                 <motion.div className="absolute -top-4 -right-4 text-yellow-200" animate={{ scale: [1, 1.5, 1], rotate: 180 }} transition={{ duration: 2, repeat: Infinity }}><Sparkles className="w-8 h-8" /></motion.div>
                 <motion.div className="absolute top-10 -left-8 text-blue-200" animate={{ scale: [1, 1.2, 1], rotate: -90 }} transition={{ duration: 3, repeat: Infinity }}><Sparkles className="w-6 h-6" /></motion.div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* TEXT SEQUENCE */}
        <div className="absolute top-[65%] left-0 w-full text-center">
          <AnimatePresence mode="wait">
            {stage === 2 && (
              <motion.div
                key="text1"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 1.5 }}
              >
                <h2 className="text-5xl md:text-7xl font-serif text-slate-800 mix-blend-color-burn tracking-widest font-thin italic">
                  Flawless Creativity
                </h2>
              </motion.div>
            )}

            {stage === 3 && (
              <motion.div
                key="text2"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5 }}
              >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 drop-shadow-lg" style={{ fontFamily: 'sans-serif' }}>
                  Adam <span className="text-slate-400 font-light mx-2">X</span> Eve
                </h1>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "200px" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-1 bg-slate-800 mx-auto mt-4 rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 10 }}
        className="absolute bottom-8 text-slate-400 text-xs tracking-[0.3em]"
      >
        PRESS START
      </motion.div>
    </div>
  );
}