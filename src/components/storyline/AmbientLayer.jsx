import React from 'react';

export default function AmbientLayer({ effectType, parallaxDepth = 0 }) {
  if (effectType === 'none') return null;

  const style = {
    transform: `translateX(${parallaxDepth * -50}px)`,
    transition: 'transform 0.5s ease-out',
  };

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" style={style}>
      {effectType === 'particles' && (
        <div className="absolute inset-0 bg-transparent opacity-20">
          {/* CSS-based particle effect */}
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
          <div className="absolute w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ top: '20%', left: '80%', animationDelay: '0.5s' }}></div>
          <div className="absolute w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ top: '60%', left: '25%', animationDelay: '1s' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '80%', left: '70%', animationDelay: '1.5s' }}></div>
          <div className="absolute w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ top: '30%', left: '50%', animationDelay: '2s' }}></div>
          <div className="absolute w-1 h-1 bg-purple-200 rounded-full animate-pulse" style={{ top: '70%', left: '10%', animationDelay: '2.5s' }}></div>
        </div>
      )}
      {effectType === 'scanlines' && (
        <div className="absolute inset-0 bg-transparent opacity-10">
          <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f633,transparent)]"></div>
        </div>
      )}
    </div>
  );
}