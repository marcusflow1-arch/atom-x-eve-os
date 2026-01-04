import React from 'react';

export default function LiquidBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes auraFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `,
        }}
      />
      <div
        className="w-full h-full"
        style={{
          // Base fluid gradient: Dark Teal → Navy → Deep Purple
          backgroundImage:
            'radial-gradient(60% 80% at 18% 22%, rgba(13, 148, 136, 0.28) 0%, rgba(13, 148, 136, 0) 60%),\
             radial-gradient(50% 70% at 82% 28%, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0) 60%),\
             radial-gradient(40% 50% at 50% 80%, rgba(34, 211, 238, 0.18) 0%, rgba(34, 211, 238, 0) 55%),\
             linear-gradient(135deg, #0a1929 0%, #1e3a5f 42%, #2d1b4e 100%)',
          backgroundSize: '160% 160%',
          animation: 'auraFlow 20s ease-in-out infinite',
          filter: 'saturate(120%)',
        }}
      />

      {/* Soft inner light / vignette for eye comfort */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(40% 45% at 50% 60%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.0) 60%),\
             radial-gradient(120% 100% at 50% 120%, rgba(0,0,0,0.45) 20%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.0) 80%)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle grain for glass refraction feel */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '2px 2px, 2px 2px',
        }}
      />
    </div>
  );
}