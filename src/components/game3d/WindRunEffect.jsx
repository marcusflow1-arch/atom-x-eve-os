// Wind streak overlay — renders fast-moving wind lines across the screen while
// the player is sprinting (Shift held + moving). Subscribes to the
// playerPositionStore which carries an isRunning flag set by GameWorld3D.
import React, { useEffect, useRef, useState } from 'react';
import { subscribePlayerPosition } from './playerPositionStore';

const STREAK_COUNT = 28;

export default function WindRunEffect() {
  const [running, setRunning] = useState(false);
  const canvasRef = useRef(null);
  const streaksRef = useRef([]);
  const rafRef = useRef(null);
  const runningRef = useRef(false);

  // Subscribe to live player position store — pulls isRunning flag from game loop
  useEffect(() => {
    return subscribePlayerPosition((s) => {
      const next = !!s.isRunning;
      if (next !== runningRef.current) {
        runningRef.current = next;
        setRunning(next);
      }
    });
  }, []);

  // Animation loop — runs continuously; streaks only render/move while running
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed streaks — distributed across the screen, each with its own length/speed/alpha
    const spawnStreak = (initial = false) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return {
        // Streaks travel horizontally L→R or R→L randomly so it looks like
        // wind whipping past the camera from both sides.
        dir: Math.random() < 0.5 ? 1 : -1,
        x: initial ? Math.random() * w : (Math.random() < 0.5 ? -80 : w + 80),
        y: Math.random() * h,
        length: 60 + Math.random() * 180,
        speed: 900 + Math.random() * 1200, // px / second
        alpha: 0.15 + Math.random() * 0.35,
        thickness: 0.6 + Math.random() * 1.4,
      };
    };
    streaksRef.current = Array.from({ length: STREAK_COUNT }, () => spawnStreak(true));

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (runningRef.current) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const streaks = streaksRef.current;
        for (let i = 0; i < streaks.length; i++) {
          const s = streaks[i];
          s.x += s.dir * s.speed * dt;
          // Recycle when off screen
          if (s.dir > 0 && s.x - s.length > w + 50) {
            streaks[i] = spawnStreak(false);
            streaks[i].dir = 1;
            streaks[i].x = -streaks[i].length - 20;
            streaks[i].y = Math.random() * h;
          } else if (s.dir < 0 && s.x + s.length < -50) {
            streaks[i] = spawnStreak(false);
            streaks[i].dir = -1;
            streaks[i].x = w + streaks[i].length + 20;
            streaks[i].y = Math.random() * h;
          }
          // Draw — a soft glowing white line, thin and motion-blurred
          const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.dir * s.length, s.y);
          grad.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
          grad.addColorStop(0.5, `rgba(200,230,255,${s.alpha * 0.6})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.thickness;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.dir * s.length, s.y);
          ctx.stroke();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Subtle vignette + chromatic edge pulse while running, on top of streaks */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[45]"
        style={{
          mixBlendMode: 'screen',
          opacity: running ? 1 : 0,
          transition: 'opacity 180ms ease-out',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[44]"
        style={{
          opacity: running ? 1 : 0,
          transition: 'opacity 220ms ease-out',
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </>
  );
}