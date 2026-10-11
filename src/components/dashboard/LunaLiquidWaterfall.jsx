import { useEffect, useRef } from 'react';
import './luna-liquid-waterfall.css';

// Decorative transparent foreground: no changes to the panel, stats, or controls.
const hash = (seed) => {
  const n = Math.sin(seed * 127.1 + 78.233) * 43758.5453;
  return n - Math.floor(n);
};

function streamX(x, y, seconds, seed) {
  return x
    + Math.sin(y * 0.014 + seconds * 0.56 + seed) * (2.4 + hash(seed + 3) * 4.5)
    + Math.sin(y * 0.035 - seconds * 0.31 + seed * 1.7) * 1.6;
}

function paintWaterfall(ctx, width, height, seconds) {
  ctx.clearRect(0, 0, width, height);
  if (!width || !height) return;

  // A nearly clear sheet of water across the entire front, not a border effect.
  const veil = ctx.createLinearGradient(0, 0, width, 0);
  veil.addColorStop(0, 'rgba(36, 148, 184, 0.018)');
  veil.addColorStop(0.3, 'rgba(105, 218, 248, 0.034)');
  veil.addColorStop(0.65, 'rgba(44, 155, 210, 0.024)');
  veil.addColorStop(1, 'rgba(111, 208, 245, 0.021)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  const streams = 31;
  for (let i = 0; i < streams; i += 1) {
    const seed = i * 1.713 + 4.2;
    const originX = (i + 0.35 + hash(seed) * 0.35) / streams * width;
    const thickness = 1.2 + hash(seed + 1.2) * 6.5;
    const strength = 0.025 + hash(seed + 2.1) * 0.047;
    const shade = ctx.createLinearGradient(originX - thickness, 0, originX + thickness, 0);
    shade.addColorStop(0, 'rgba(9, 110, 170, 0)');
    shade.addColorStop(0.36, 'rgba(35, 157, 201, 0.045)');
    shade.addColorStop(0.65, 'rgba(183, 246, 255, 0.095)');
    shade.addColorStop(1, 'rgba(9, 110, 170, 0)');

    ctx.save();
    ctx.globalAlpha = strength / 0.065;
    ctx.lineWidth = thickness;
    ctx.strokeStyle = shade;
    ctx.beginPath();
    for (let y = -12; y <= height + 12; y += 12) {
      const x = streamX(originX, y, seconds, seed);
      if (y === -12) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Short bright caustic threads travel downward at unsynchronized speeds.
    const travel = height + 155;
    const speed = 23 + hash(seed + 6.1) * 39;
    const phase = hash(seed + 7.4) * travel;
    const head = ((seconds * speed + phase) % travel) - 85;
    const length = 18 + hash(seed + 8.6) * 77;
    const highlight = ctx.createLinearGradient(0, head - length, 0, head + 3);
    highlight.addColorStop(0, 'rgba(205, 249, 255, 0)');
    highlight.addColorStop(0.72, 'rgba(160, 239, 255, 0.035)');
    highlight.addColorStop(1, 'rgba(225, 255, 255, 0.13)');
    ctx.beginPath();
    for (let step = 0; step <= 12; step += 1) {
      const y = head - length + step * length / 12;
      const x = streamX(originX, y, seconds, seed) + thickness * 0.15;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 0.65 + hash(seed + 9.3) * 1.15;
    ctx.strokeStyle = highlight;
    ctx.stroke();
  }

  // Fine droplet details are deterministically seeded, so there's no flicker.
  for (let i = 0; i < 66; i += 1) {
    const seed = i * 2.47 + 10.4;
    const travel = height + 20;
    const y = ((hash(seed + 1) * travel + seconds * (15 + 34 * hash(seed + 2))) % travel) - 10;
    const x = width * hash(seed + 3) + Math.sin(y * 0.019 + seconds * 0.4 + seed) * 3;
    const r = 0.35 + hash(seed + 5) * 1.25;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.65, r * 1.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(193, 246, 255, ' + (0.025 + hash(seed + 7) * 0.068) + ')';
    ctx.fill();
  }
}

/** Subtle waterfall glass inside the unchanged Luna attribute panel. */
export default function LunaLiquidWaterfall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return undefined;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let intersecting = true;
    let frame = 0;
    let lastPaint = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(0, bounds.width);
      height = Math.max(0, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintWaterfall(ctx, width, height, 0);
    };

    const shouldAnimate = () => intersecting
      && document.visibilityState === 'visible'
      && !motion.matches;

    const tick = (now) => {
      frame = 0;
      if (!shouldAnimate()) return;
      // Cap this isolated effect at 30 FPS.
      if (now - lastPaint >= 1000 / 30) {
        paintWaterfall(ctx, width, height, now / 1000);
        lastPaint = now;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const sync = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (shouldAnimate()) frame = window.requestAnimationFrame(tick);
      else paintWaterfall(ctx, width, height, 0);
    };

    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
        intersecting = entry.isIntersecting;
        sync();
      }, { threshold: 0.01 });
    observer?.observe(canvas);

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null : new ResizeObserver(resize);
    resizeObserver?.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener?.('change', sync);
    resize();
    sync();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener?.('change', sync);
    };
  }, []);

  return (
    <div className="axe-waterfall-glass" aria-hidden="true">
      <canvas ref={canvasRef} className="axe-waterfall-glass__canvas" />
    </div>
  );
}
