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

            {/* Stage 4 Removed - Text is in video */}

          </AnimatePresence>
        </div>

      </div>

      {/* Click to enter removed */}
    </div>
  );
}