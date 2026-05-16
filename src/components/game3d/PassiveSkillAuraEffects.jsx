import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PassiveSkillAuraEffects
 * Renders CSS/canvas-based visual aura effects on the player character
 * based on which passive skills are currently active.
 *
 * Skills handled:
 *  - repulsion / gods_repulsion  → Lightning orb ring around player (ozone layer)
 *  - guardian_wall / barrier     → Outline aura around body
 *  - heavens_destruction         → Dark angled lightning ring (tilted ~35°)
 *  - power_charge                → Arm/hand glow
 */

// ── Skill ID sets (base name → evolved name mapping) ────────────────────────
const REPULSION_IDS    = new Set(['repulsion', 'gods_repulsion', 'reflective_guard']);
const BARRIER_IDS      = new Set(['barrier_aura', 'guardian_wall', 'iron_fortress', 'counter_pulse']);
const DESTRUCTION_IDS  = new Set(['heavens_destruction', 'dark_judgment']);
const POWER_CHARGE_IDS = new Set(['power_charge', 'berserker_slash', 'titan_breaker']);

export default function PassiveSkillAuraEffects({ activeSkillIds = [] }) {
  const hasRepulsion   = activeSkillIds.some(id => REPULSION_IDS.has(id));
  const hasBarrier     = activeSkillIds.some(id => BARRIER_IDS.has(id));
  const hasDestruction = activeSkillIds.some(id => DESTRUCTION_IDS.has(id));
  const hasPowerCharge = activeSkillIds.some(id => POWER_CHARGE_IDS.has(id));

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[35]"
      style={{ overflow: 'hidden' }}
    >
      {/* All effects are centered on the player position (center-bottom of screen) */}
      <div
        className="absolute"
        style={{
          left: '50%',
          bottom: '18%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 260,
        }}
      >
        {/* ── 1. GOD'S REPULSION — Orbital lightning ozone ring ── */}
        <AnimatePresence>
          {hasRepulsion && <RepulsionAura key="repulsion" />}
        </AnimatePresence>

        {/* ── 2. BARRIER / GUARDIAN WALL — Body outline aura ── */}
        <AnimatePresence>
          {hasBarrier && <BarrierAura key="barrier" />}
        </AnimatePresence>

        {/* ── 3. HEAVEN'S DESTRUCTION — Tilted dark lightning ring ── */}
        <AnimatePresence>
          {hasDestruction && <HeavensDestructionAura key="destruction" />}
        </AnimatePresence>

        {/* ── 4. POWER CHARGE — Arm/hand glow ── */}
        <AnimatePresence>
          {hasPowerCharge && <PowerChargeAura key="powercharge" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GOD'S REPULSION — lightning orbits player like an ozone layer
// ─────────────────────────────────────────────────────────────────────────────
function RepulsionAura() {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const draw = (dt) => {
      timeRef.current += dt * 0.001;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      const rx = W * 0.46; // horizontal radius
      const ry = H * 0.28; // vertical radius (ellipse for perspective)

      // Draw 3 orbital arcs of lightning
      for (let arc = 0; arc < 3; arc++) {
        const offset = (arc / 3) * Math.PI * 2;
        const segments = 40;

        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + t * 1.2 + offset;
          // Jitter for lightning feel
          const jitter = Math.sin(i * 7.3 + t * 8 + arc * 2.1) * 4;
          const x = cx + (rx + jitter) * Math.cos(angle);
          const y = cy + (ry + jitter * 0.5) * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Outer glow
        ctx.strokeStyle = arc === 0 ? 'rgba(150,200,255,0.18)' : 'rgba(100,170,255,0.12)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Inner bright bolt
        ctx.strokeStyle = arc === 0 ? 'rgba(220,240,255,0.85)' : 'rgba(180,220,255,0.65)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Sparks at intervals
        for (let s = 0; s < 5; s++) {
          const sAngle = (s / 5) * Math.PI * 2 + t * 1.2 + offset + Math.sin(t * 3 + s) * 0.4;
          const sx = cx + rx * Math.cos(sAngle);
          const sy = cy + ry * Math.sin(sAngle);
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 10);
          grad.addColorStop(0, 'rgba(200,230,255,0.9)');
          grad.addColorStop(1, 'rgba(100,160,255,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    let last = performance.now();
    const loop = (now) => {
      draw(now - last);
      last = now;
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      width={360}
      height={320}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BARRIER AURA — glowing outline around the player body
// ─────────────────────────────────────────────────────────────────────────────
function BarrierAura() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Outer shield shell */}
      <motion.div
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -18,
          borderRadius: '50% 50% 44% 44%',
          border: '2px solid rgba(100,220,255,0.75)',
          boxShadow: '0 0 18px rgba(100,220,255,0.5), inset 0 0 24px rgba(100,220,255,0.15)',
          background: 'rgba(100,220,255,0.04)',
        }}
      />
      {/* Flowing inner energy lines */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ rotate: [i * 45, i * 45 + 360] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: -8 - i * 4,
            borderRadius: '50% 50% 44% 44%',
            border: `1px solid rgba(80,200,255,${0.2 - i * 0.04})`,
          }}
        />
      ))}
      {/* Bright edge shimmer */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -14,
          borderRadius: '50% 50% 44% 44%',
          background: 'conic-gradient(from 0deg, transparent 60%, rgba(120,240,255,0.6) 75%, transparent 90%)',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HEAVEN'S DESTRUCTION — dark tilted lightning ring
// ─────────────────────────────────────────────────────────────────────────────
function HeavensDestructionAura() {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const draw = (dt) => {
      timeRef.current += dt * 0.001;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      // Tilted ring: we save/restore + rotate by 35°
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 5); // 36° tilt
      ctx.translate(-cx, -cy);

      const rx = W * 0.42;
      const ry = H * 0.22;

      for (let arc = 0; arc < 2; arc++) {
        const offset = arc * Math.PI;
        const segments = 36;

        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + t * -0.9 + offset;
          const jitter = Math.sin(i * 5.7 + t * 11 + arc * 3.3) * 5;
          const x = cx + (rx + jitter) * Math.cos(angle);
          const y = cy + (ry + jitter * 0.4) * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }

        // Dark purple outer glow
        ctx.strokeStyle = 'rgba(140,40,220,0.2)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Dark core bolt
        ctx.strokeStyle = arc === 0 ? 'rgba(200,80,255,0.9)' : 'rgba(160,60,220,0.75)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Dark sparks
        for (let s = 0; s < 4; s++) {
          const sAngle = (s / 4) * Math.PI * 2 + t * -0.9 + offset + Math.sin(t * 4 + s * 1.3) * 0.5;
          const sx = cx + rx * Math.cos(sAngle);
          const sy = cy + ry * Math.sin(sAngle);
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
          grad.addColorStop(0, 'rgba(180,60,255,0.85)');
          grad.addColorStop(1, 'rgba(100,0,180,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    let last = performance.now();
    const loop = (now) => {
      draw(now - last);
      last = now;
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      width={360}
      height={320}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POWER CHARGE — arm/hand glow around the player's weapon side
// ─────────────────────────────────────────────────────────────────────────────
function PowerChargeAura() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/* Right arm region glow — sits at right side, upper portion of character */}
      <motion.div
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          right: -10,
          top: '20%',
          width: 55,
          height: 95,
          borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%',
          background: 'radial-gradient(ellipse at center, rgba(255,160,40,0.55) 0%, rgba(255,80,0,0.25) 50%, transparent 75%)',
          boxShadow: '0 0 20px rgba(255,120,0,0.5), 0 0 40px rgba(255,80,0,0.25)',
          filter: 'blur(2px)',
        }}
      />
      {/* Spark trails emanating from fist */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 20, y: '30%', opacity: 0, scale: 0 }}
          animate={{
            x: [20, 20 + Math.cos((i / 5) * Math.PI * 2) * 30],
            y: ['30%', `${30 + Math.sin((i / 5) * Math.PI * 2) * 25}%`],
            opacity: [0, 0.9, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.16,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(255,200,80,0.95)' : 'rgba(255,100,0,0.9)',
            boxShadow: '0 0 8px rgba(255,150,0,0.8)',
          }}
        />
      ))}
      {/* Forearm wrapping energy lines */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          animate={{ scaleY: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 0.6 + i * 0.2, repeat: Infinity, delay: i * 0.1 }}
          style={{
            position: 'absolute',
            right: 2 + i * 6,
            top: '18%',
            width: 2,
            height: '28%',
            background: `linear-gradient(to bottom, transparent, rgba(255,${140 + i * 30},0,0.8), transparent)`,
            borderRadius: 2,
          }}
        />
      ))}
    </motion.div>
  );
}