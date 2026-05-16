import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeBuffs, isPowerChargeActive, isRepulsionActive, isBarrierActive, isDestructionActive } from './activeBuffsStore.jsx';

/**
 * PassiveSkillAuraEffects
 * Renders CSS/canvas-based visual aura effects on the player character.
 *
 * Two categories:
 *   1. ALWAYS-ON passives (learned skills always show): repulsion, barrier, destruction.
 *   2. BUFF-BASED skills — only visible while their timer is active:
 *      - power_charge → hand glow, lasts ~90s OR until 5 hits consumed
 */

export default function PassiveSkillAuraEffects() {
  const [buffState, setBuffState] = useState({
    hasRepulsion: false,
    hasBarrier: false,
    hasDestruction: false,
    hasPowerCharge: false,
  });

  useEffect(() => subscribeBuffs(() => setBuffState({
    hasRepulsion: isRepulsionActive(),
    hasBarrier: isBarrierActive(),
    hasDestruction: isDestructionActive(),
    hasPowerCharge: isPowerChargeActive(),
  })), []);

  const { hasRepulsion, hasBarrier, hasDestruction, hasPowerCharge } = buffState;

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
// 4. POWER CHARGE — glowing hands aura (both hands light up around the model)
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
      {/* Both hand glows — mirror left + right */}
      <HandGlow side="right" />
      <HandGlow side="left" />
    </motion.div>
  );
}

function HandGlow({ side }) {
  const isRight = side === 'right';
  const sideStyle = isRight ? { right: -10 } : { left: -10 };
  const sparkAnchor = isRight ? { right: 8 } : { left: 8 };
  const lineAnchor  = (i) => isRight ? { right: 2 + i * 6 } : { left: 2 + i * 6 };

  return (
    <>
      {/* Hand region glow */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          ...sideStyle,
          top: '38%',
          width: 50,
          height: 75,
          borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%',
          background: 'radial-gradient(ellipse at center, rgba(255,160,40,0.65) 0%, rgba(255,80,0,0.30) 50%, transparent 75%)',
          boxShadow: '0 0 22px rgba(255,120,0,0.55), 0 0 44px rgba(255,80,0,0.28)',
          filter: 'blur(2px)',
        }}
      />
      {/* Spark trails emanating from fist */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`${side}-spark-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            x: [0, Math.cos((i / 5) * Math.PI * 2) * (isRight ? 30 : -30)],
            y: ['45%', `${45 + Math.sin((i / 5) * Math.PI * 2) * 22}%`],
            opacity: [0, 0.9, 0],
            scale: [0, 1, 0],
          }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.16, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            ...sparkAnchor,
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
          key={`${side}-line-${i}`}
          animate={{ scaleY: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 0.6 + i * 0.2, repeat: Infinity, delay: i * 0.1 }}
          style={{
            position: 'absolute',
            ...lineAnchor(i),
            top: '35%',
            width: 2,
            height: '22%',
            background: `linear-gradient(to bottom, transparent, rgba(255,${140 + i * 30},0,0.8), transparent)`,
            borderRadius: 2,
          }}
        />
      ))}
    </>
  );
}