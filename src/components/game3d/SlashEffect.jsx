import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

/**
 * A single slash mark: a white line with glowing aura that looks like a cut.
 * angle: degrees, count: 1 (single) | 3 (triple), screenX/Y: pixel position
 */
function SlashMark({ id, x, y, angle, index, total, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [onDone]);

  // For multi-hit, fan out the slashes slightly
  const spread = total > 1 ? (index - (total - 1) / 2) * 22 : 0;
  const finalAngle = angle + spread;
  const delay = index * 55; // stagger each hit

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scaleX: 0, scaleY: 1 }}
      animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 0.8], scaleY: [1, 1, 1.15, 0.9] }}
      transition={{ duration: 0.45, delay: delay / 1000, ease: [0.2, 0.8, 0.4, 1] }}
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 120,
        height: 3,
        transformOrigin: 'left center',
        transform: `translate(-10px, -1.5px) rotate(${finalAngle}deg)`,
        zIndex: 9999,
      }}
    >
      {/* Outer glow aura */}
      <div
        style={{
          position: 'absolute',
          inset: '-6px -4px',
          borderRadius: 8,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, rgba(200,230,255,0.3) 50%, transparent 80%)',
          filter: 'blur(5px)',
        }}
      />
      {/* Inner white core line */}
      <div
        style={{
          position: 'absolute',
          inset: '0',
          borderRadius: 4,
          background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 20%, rgba(220,240,255,1) 70%, rgba(255,255,255,0) 100%)',
          boxShadow: '0 0 8px 3px rgba(180,220,255,0.9), 0 0 3px 1px rgba(255,255,255,1)',
        }}
      />
      {/* Impact flash at the tip */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
        transition={{ duration: 0.2, delay: delay / 1000 + 0.05 }}
        style={{
          position: 'absolute',
          right: -6,
          top: '50%',
          width: 14,
          height: 14,
          borderRadius: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 0 12px 6px rgba(180,230,255,0.8)',
        }}
      />
    </motion.div>
  );
}

/**
 * SlashEffectLayer — a full-screen overlay that manages active slash effects.
 * Other components fire slashes by dispatching 'spawnSlash' custom events:
 *   window.dispatchEvent(new CustomEvent('spawnSlash', {
 *     detail: { x, y, angle, count }
 *   }))
 * x/y = screen pixels (relative to viewport), angle = degrees, count = 1 or 3
 *
 * Also listens for 'spawnSlashWorld' with {wx, wy, wz, angle, count} to
 * auto-project a world-space position to screen using window.__gw3dCamera.
 */
export default function SlashEffectLayer() {
  const [slashes, setSlashes] = useState([]);
  const idRef = useRef(0);

  const spawnAt = (x, y, angle, count) => {
    const marks = Array.from({ length: count }, (_, i) => ({
      id: ++idRef.current,
      x, y, angle, index: i, total: count,
    }));
    setSlashes((prev) => [...prev, ...marks]);
  };

  useEffect(() => {
    const handler = (e) => {
      const { x, y, angle = -35, count = 1 } = e.detail || {};
      spawnAt(x, y, angle, count);
    };
    const worldHandler = (e) => {
      const { wx, wy, wz, angle = -35, count = 1 } = e.detail || {};
      const camera = window.__gw3dCamera;
      if (!camera) return;
      const v = new THREE.Vector3(wx, wy, wz);
      v.project(camera);
      if (v.z < -1 || v.z > 1) return;
      const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
      spawnAt(sx, sy, angle, count);
    };
    window.addEventListener('spawnSlash', handler);
    window.addEventListener('spawnSlashWorld', worldHandler);
    return () => {
      window.removeEventListener('spawnSlash', handler);
      window.removeEventListener('spawnSlashWorld', worldHandler);
    };
  }, []);

  const removeMark = (id) => {
    setSlashes((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      <AnimatePresence>
        {slashes.map((s) => (
          <SlashMark
            key={s.id}
            {...s}
            onDone={() => removeMark(s.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Helper to fire a slash effect from anywhere.
 * x/y = screen position (e.g. enemy's projected screen coords)
 * count = 1 for single hit, 3 for triple hit
 * angle = base rotation in degrees (default -35 = diagonal cut)
 */
export function fireSlash({ x, y, angle = -35, count = 1 }) {
  window.dispatchEvent(new CustomEvent('spawnSlash', { detail: { x, y, angle, count } }));
}