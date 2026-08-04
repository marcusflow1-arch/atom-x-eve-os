import React, { useEffect, useState } from 'react';
import { getMoonPosition } from './moonPhase';

/**
 * Dashboard sky that tracks real life: the sky colour follows the actual
 * local hour, and a large bright moon rises, crosses and sets on real
 * timing, showing tonight's true phase. Sits behind the glass UI.
 */
export default function RealTimeMoonSky() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000); // re-sync each minute
    return () => clearInterval(id);
  }, []);

  // Dashboard keeps its native dark moonlight look — the sky never brightens
  // into daylight, only the moon's phase and position track real time.
  const sky = { top: '#050914', mid: '#0a1226', bot: '#101a2e', light: 0.06 };
  const moon = getMoonPosition(now);

  const MOON_SIZE = 340;
  const night = 1 - sky.light;                       // 1 = deep night
  // Bright at night, washed out but still visible in daylight.
  const moonOpacity = moon.aboveHorizon
    ? Math.min(1, Math.max(0, moon.altitude * 1.8)) * (0.25 + night * 0.75)
    : 0;
  // Terminator offset: the shadow disc slides off the face as the moon fills.
  // Full moon (illum 1) pushes it fully clear; new moon (illum 0) covers the
  // whole disc. Waxing keeps the dark limb on the left, waning on the right.
  const shadowShift = MOON_SIZE * moon.illumination * (moon.phase < 0.5 ? -1 : 1);
  const glow = 0.25 + moon.illumination * 0.75;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sky gradient for the current hour */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ background: `linear-gradient(to bottom, ${sky.top} 0%, ${sky.mid} 48%, ${sky.bot} 100%)` }}
      />

      {/* Stars — only once the sky darkens */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: Math.max(0, night - 0.35) * 1.4,
          backgroundImage:
            'radial-gradient(1.2px 1.2px at 12% 22%, rgba(255,255,255,0.85) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 28% 14%, rgba(255,255,255,0.6) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 44% 30%, rgba(255,255,255,0.7) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 18% 48%, rgba(255,255,255,0.5) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 58% 10%, rgba(255,255,255,0.6) 50%, transparent 50%),' +
            'radial-gradient(1.5px 1.5px at 72% 34%, rgba(255,255,255,0.7) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 86% 18%, rgba(255,255,255,0.5) 50%, transparent 50%),' +
            'radial-gradient(1.4px 1.4px at 8% 66%, rgba(255,255,255,0.55) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 36% 58%, rgba(255,255,255,0.4) 50%, transparent 50%),' +
            'radial-gradient(1px 1px at 64% 62%, rgba(255,255,255,0.35) 50%, transparent 50%)',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Moonlight wash spilling from wherever the moon actually is */}
      {moonOpacity > 0.02 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(55% 55% at ${moon.x * 100}% ${moon.y * 100}%, rgba(180,210,255,${0.30 * moonOpacity * glow}) 0%, rgba(110,150,220,${0.12 * moonOpacity}) 42%, rgba(0,0,0,0) 72%)`,
          }}
        />
      )}

      {/* The moon itself — bright disc, real phase, real position */}
      {moonOpacity > 0.01 && (
        <div
          className="absolute"
          style={{
            left: `calc(${moon.x * 100}% - ${MOON_SIZE / 2}px)`,
            top: `calc(${moon.y * 100}% - ${MOON_SIZE / 2}px)`,
            width: MOON_SIZE,
            height: MOON_SIZE,
            opacity: moonOpacity,
            borderRadius: '50%',
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 40% 36%, #ffffff 0%, #f4f8ff 45%, #dfe8fa 72%, #c3d2ee 100%)',
            boxShadow:
              `0 0 70px 24px rgba(200,225,255,${0.45 * glow}),` +
              `0 0 190px 90px rgba(120,170,240,${0.30 * glow}),` +
              `0 0 360px 180px rgba(70,120,200,${0.18 * glow})`,
          }}
        >
          {/* Maria — faint surface mottling, kept light so the disc stays bright */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(22% 20% at 36% 40%, rgba(150,170,205,0.30) 0%, rgba(0,0,0,0) 70%),' +
                'radial-gradient(16% 15% at 62% 32%, rgba(150,170,205,0.22) 0%, rgba(0,0,0,0) 70%),' +
                'radial-gradient(26% 22% at 56% 66%, rgba(150,170,205,0.26) 0%, rgba(0,0,0,0) 70%)',
            }}
          />
          {/* Phase shadow — slides across as the real phase advances */}
          <div
            className="absolute rounded-full"
            style={{
              width: MOON_SIZE,
              height: MOON_SIZE,
              left: shadowShift,
              top: 0,
              background:
                'radial-gradient(circle at 50% 50%, rgba(6,10,20,0.92) 42%, rgba(6,10,20,0.55) 66%, rgba(6,10,20,0.15) 82%, rgba(6,10,20,0) 92%)',
            }}
          />
        </div>
      )}

      {/* Horizon haze + vignette for depth */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: `linear-gradient(to top, rgba(6,9,16,${0.55 + night * 0.4}) 0%, rgba(10,16,28,${0.30 * night + 0.12}) 45%, rgba(0,0,0,0) 100%)` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(110% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }}
      />
    </div>
  );
}