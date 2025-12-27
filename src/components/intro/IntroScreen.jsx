import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Sequence Timeline
    // 0: Start (0-100ms)
    // 1: Stage 2 (Wait/Intro)
    // 2: "Flawless Creativity"
    // 3: "ATOM X Eve"
    
    const sequence = [
      { time: 100, stage: 2 },
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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black cursor-pointer font-sans"
      onClick={onComplete}
    >
      {/* SCENE CONTAINER */}
      <div className="relative w-full h-full overflow-hidden bg-black">
        
        {/* Background Video */}
        <div className="absolute inset-0">
          <video 
            src="https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/1aeb3b2cd_AI_Intro_Concept_and_Video_Generation.mp4"
            className="w-full h-full object-cover opacity-90"
            autoPlay 
            loop 
            muted 
            playsInline
          />
          <div className="absolute inset-0 bg-black/20" /> {/* Slight overlay for text readability */}
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

            {/* Stage 4: ATOM X Eve */}
            {stage >= 4 && (
              <motion.div
                key="text-logo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full text-center mt-48"
              >
                <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] tracking-tighter">
                  ATOM <span className="text-blue-400 font-light mx-2">X</span> Eve
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
        transition={{ delay: 8 }}
        className="absolute bottom-8 w-full text-center text-white/50 text-xs tracking-[0.5em] uppercase"
      >
        Click to Enter
      </motion.div>
    </div>
  );
}