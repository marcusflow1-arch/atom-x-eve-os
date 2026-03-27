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
            src="https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/e15ddf60a_Crafting_Premium_AI_Intro_Screen_Prompt.mp4"
            className="w-full h-full object-cover opacity-90"
            autoPlay 
            muted={false}
            playsInline
            onEnded={() => {
              // Mark intro as seen but send to character creation first
              sessionStorage.setItem('atom_eve_intro_seen_session', 'true');
              if (!localStorage.getItem('atom_eve_character_created')) {
                window.location.href = '/CharacterCreation';
              } else {
                onComplete();
              }
            }}
          />
        </div>

      </div>

      {/* Click to enter removed */}
    </div>
  );
}