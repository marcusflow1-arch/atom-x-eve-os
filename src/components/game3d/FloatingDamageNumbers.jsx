import React, { useEffect, useState } from 'react';

/**
 * Renders fading damage numbers anchored to screen-space positions.
 * Each entry: { id, x, y, value, type: 'damage' | 'xp', born }
 * Lifetime ~1.0s — fades in fast, holds, then fades out while drifting up.
 */
const LIFETIME = 1.0;

export default function FloatingDamageNumbers({ entries }) {
  const [now, setNow] = useState(performance.now());

  useEffect(() => {
    let raf;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {entries.map((e) => {
        const age = (now - e.born) / 1000;
        if (age >= LIFETIME) return null;
        const t = age / LIFETIME;
        // Fade in first 15%, hold, fade out last 50%
        let opacity;
        if (t < 0.15) opacity = t / 0.15;
        else if (t > 0.5) opacity = Math.max(0, 1 - (t - 0.5) / 0.5);
        else opacity = 1;
        // Drift up ~40px over lifetime
        const driftY = -t * 40;
        const scale = t < 0.15 ? 0.7 + (t / 0.15) * 0.4 : 1.1 - t * 0.15;

        const isXP = e.type === 'xp';
        return (
          <div
            key={e.id}
            className="absolute font-bold tabular-nums select-none"
            style={{
              left: e.x,
              top: e.y,
              transform: `translate(-50%, calc(-100% + ${driftY}px)) scale(${scale})`,
              opacity,
              color: isXP ? '#fde68a' : '#ffffff',
              fontSize: isXP ? '18px' : '22px',
              textShadow: isXP
                ? '0 0 8px rgba(253, 224, 71, 0.9), 0 2px 4px rgba(0,0,0,0.9)'
                : '0 0 8px rgba(255, 80, 80, 0.85), 0 2px 4px rgba(0,0,0,0.95)',
              letterSpacing: '0.02em',
            }}
          >
            {isXP ? `+${e.value} XP` : e.value}
          </div>
        );
      })}
    </div>
  );
}