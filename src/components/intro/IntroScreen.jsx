import React, { useEffect } from 'react';

export default function IntroScreen({ onComplete }) {
  // Hard timeout fallback — guarantee intro never blocks the app forever.
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), 6000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black cursor-pointer font-sans"
      onClick={onComplete}
    >
      <div className="relative w-full h-full overflow-hidden bg-black">
        <div className="absolute inset-0">
          <video
            src="https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/e15ddf60a_Crafting_Premium_AI_Intro_Screen_Prompt.mp4"
            className="w-full h-full object-cover opacity-90"
            autoPlay
            muted
            playsInline
            onEnded={onComplete}
            onError={onComplete}
          />
        </div>
      </div>
    </div>
  );
}