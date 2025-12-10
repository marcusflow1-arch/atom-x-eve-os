import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage progression
    const stageTimer = setTimeout(() => {
      if (stage < 3) {
        setStage(stage + 1);
      } else {
        onComplete();
      }
    }, 3500); // 3.5 seconds per stage

    return () => {
      clearTimeout(stageTimer);
    };
  }, [stage, onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer bg-white"
      onClick={onComplete}
    >
      {/* Watercolor Background Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#fdfbf7]">
        {/* Abstract Watercolor Blobs */}
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300/40 rounded-full blur-[80px] mix-blend-multiply"
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] bg-pink-300/40 rounded-full blur-[100px] mix-blend-multiply"
          animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] bg-purple-300/40 rounded-full blur-[90px] mix-blend-multiply"
          animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full blur-[70px] mix-blend-multiply"
          animate={{ x: [0, -20, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Moon - Always Visible */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-blue-100 via-white to-white shadow-[0_0_60px_rgba(100,149,237,0.4)]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          {/* Subtle Moon Details/Watercolor strokes on moon */}
          <div className="absolute inset-0 rounded-full overflow-hidden opacity-50">
             <div className="absolute top-[20%] left-[20%] w-[30%] h-[20%] bg-blue-200/30 blur-xl rounded-full" />
             <div className="absolute bottom-[30%] right-[20%] w-[40%] h-[30%] bg-purple-200/20 blur-xl rounded-full" />
          </div>
          {/* Glowing ring */}
          <div className="absolute inset-0 rounded-full border border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
        </motion.div>
      </div>

      {/* Text Content */}
      <div className="relative z-20 w-full h-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          
          {/* Stage 0: "Adam X Eve" - Middle Top */}
          {stage === 0 && (
            <motion.div
              key="stage0"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute top-[15%] w-full text-center"
            >
              <h1 className="text-4xl md:text-6xl font-serif tracking-widest text-slate-800 font-light" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                Adam <span className="text-blue-500/80">X</span> Eve
              </h1>
            </motion.div>
          )}

          {/* Stage 1: "Dreams through Reality" - Center (Overlaying Moon slightly or below) */}
          {stage === 1 && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none"
            >
              <h2 className="text-3xl md:text-5xl font-serif text-slate-800/90 font-thin italic tracking-wide mix-blend-color-burn">
                Dreams through Reality
              </h2>
            </motion.div>
          )}

          {/* Stage 2: "Your ideals are unreal" - Center */}
          {stage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none"
            >
              <h2 className="text-3xl md:text-5xl font-serif text-slate-800/90 font-thin italic tracking-wide mix-blend-color-burn">
                Your ideals are unreal
              </h2>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Skip/Enter hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 5 }}
        className="absolute bottom-8 text-slate-400 text-sm tracking-widest font-light"
      >
        CLICK TO ENTER
      </motion.div>
    </div>
  );
}