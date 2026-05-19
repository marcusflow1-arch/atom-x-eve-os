// ─── FPSMonitor ───────────────────────────────────────────────────────────
// Lightweight requestAnimationFrame loop that measures FPS / frame time
// and feeds it into the performance store. Mount once at the app level
// (or in the Admin panel) — it's free when nothing is reading the values.

import { useEffect } from 'react';
import { usePerformanceStore } from './performanceStore';

export default function FPSMonitor() {
  const reportFrame = usePerformanceStore((s) => s.reportFrame);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let lastReport = last;

    const tick = (now) => {
      frames++;
      const frameTime = now - last;
      last = now;

      // Report ~2x per second
      if (now - lastReport >= 500) {
        const fps = Math.round((frames * 1000) / (now - lastReport));
        reportFrame(fps, +frameTime.toFixed(2));
        frames = 0;
        lastReport = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reportFrame]);

  return null;
}