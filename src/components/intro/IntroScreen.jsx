import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const sequence = [
      { time: 3000, next: 1 }, // "Adam X Eve"
      { time: 3000, next: 2 }, // "Dreams Through Reality"
      { time: 3500, next: 3 }, // "Your Ideals Are Unreal"
      { time: 1000, next: 4 }  // Fade out
    ];

    const currentStage = sequence[stage];
    
    if (currentStage) {
      const timer = setTimeout(() => {
        if (currentStage.next === 4) {
          onComplete();
        } else {
          setStage(currentStage.next);
        }
      }, currentStage.time);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={onComplete}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
      }}
    >
      {/* Anime Abstract Paint Background Effect */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        {/* Abstract "Paint" Blobs */}
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-blue-500 blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-purple-500 blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-500 blur-[100px]"
          animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Central Moon */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="relative w-96 h-96 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 shadow-[0_0_100px_rgba(255,255,255,0.3)] overflow-hidden">
          {/* Moon Texture/Craters */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-slate-300/30 blur-sm"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-slate-300/20 blur-sm"></div>
          <div className="absolute top-2/3 left-1/3 w-12 h-12 rounded-full bg-slate-300/40 blur-sm"></div>
          
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-full bg-inner-shadow shadow-[inset_0_0_50px_rgba(0,0,0,0.1)]"></div>
        </div>
        
        {/* Outer Glow Ring */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
           <div className="absolute top-0 left-1/2 w-4 h-4 bg-white/50 rounded-full blur-md"></div>
        </motion.div>
      </motion.div>

      {/* Text Sequences */}
      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div
            key="text1"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-[15%] left-0 right-0 text-center z-20"
          >
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              Adam X Eve
            </h1>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div
            key="text2"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 text-center z-20 mix-blend-overlay"
          >
            <h2 className="text-5xl md:text-7xl font-thin text-white tracking-widest italic font-serif">
              Dreams Through Reality
            </h2>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="text3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 text-center z-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-widest uppercase" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8)' }}>
              Your Ideals Are Unreal
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles/Petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/40 rounded-full"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -100],
              x: [0, Math.random() * 50 - 25],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}