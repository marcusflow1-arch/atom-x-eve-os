import React from 'react';

/**
 * Dark moonlight aesthetic background for the Lunar Dashboard.
 * Deep blue-gray night gradient with a bright, cool-blue glowing moon,
 * subtle stars and atmospheric haze. Sits behind the liquid-glass UI.
 */
export default function MoonlightBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base deep night gradient — dark blues fading into near-black gray */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 75% 18%, #1b2a44 0%, #131d30 32%, #0c1320 58%, #070a11 85%)',
        }}
      />

      {/* Cool blue atmospheric wash from the top-right (moon side) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 78% 12%, rgba(96,150,230,0.28) 0%, rgba(60,100,180,0.10) 40%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* The Moon — bright, with a soft blue halo */}
      <div
        className="absolute"
        style={{
          top: '4%',
          right: '8%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 38% 38%, #ffffff 0%, #e8f0ff 32%, #b9cdf0 58%, #7d9bd0 78%, rgba(120,150,200,0) 100%)',
          boxShadow:
            '0 0 60px 20px rgba(170,200,255,0.35), 0 0 160px 80px rgba(90,140,220,0.25), 0 0 320px 160px rgba(60,100,180,0.15)',
        }}
      />

      {/* Faint moon surface shading for depth */}
      <div
        className="absolute"
        style={{
          top: '4%',
          right: '8%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 65% 70%, rgba(60,90,140,0.35) 0%, rgba(0,0,0,0) 45%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Starfield — subtle scattered dots */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.7) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 28% 14%, rgba(255,255,255,0.5) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 44% 30%, rgba(255,255,255,0.6) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 18% 48%, rgba(255,255,255,0.4) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 58% 12%, rgba(255,255,255,0.5) 50%, transparent 50%),' +
            'radial-gradient(1.4px 1.4px at 8% 70%, rgba(255,255,255,0.5) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 36% 60%, rgba(255,255,255,0.35) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 50% 78%, rgba(255,255,255,0.3) 50%, transparent 50%)',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Bottom ground haze — darker grays for the horizon depth */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'linear-gradient(to top, rgba(8,11,17,0.95) 0%, rgba(12,18,30,0.55) 45%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Subtle vignette to add depth around the edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}