import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeBuffs } from '../activeBuffsStore';

/**
 * Small horizontal strip of icons shown ABOVE the HP bar.
 * Each icon represents one active self-cast buff and displays the
 * remaining seconds. Icons appear/disappear as buffs activate / expire.
 *
 * Buffs tracked here are only those activated via the skill-slot keys 1–8
 * (Aegis Shield, Focus, Decisive Blow, Haste, God's Deflection, Power
 * Charge, Evasion / Dodge). Passive auras are NOT shown here.
 */

const BUFF_META = {
  shield:        { icon: '🛡️', label: 'Shield',        color: '#60a5fa' },
  focus:         { icon: '🧠', label: 'Focus',         color: '#f59e0b' },
  crit:          { icon: '🎯', label: 'Crit Dmg',      color: '#ef4444' },
  haste:         { icon: '⚡', label: 'Haste',         color: '#fbbf24' },
  reflect:       { icon: '✨', label: 'Reflect',       color: '#a78bfa' },
  power_charge:  { icon: '🔥', label: 'Power Charge',  color: '#fb923c' },
  dodge:         { icon: '💨', label: 'Evasion',       color: '#22d3ee' },
};

function fmt(sec) {
  if (sec <= 0) return '0s';
  if (sec < 10) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

export default function ActiveBuffsStrip() {
  const [, force] = useState(0);
  const [buffs, setBuffs] = useState(null);

  useEffect(() => subscribeBuffs(setBuffs), []);

  // Tick once per second so seconds counters update smoothly without burning CPU
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);

  if (!buffs) return null;
  const n = performance.now();

  const active = [];
  if (buffs.shield > 0 && buffs.shieldExpiresAt > n)
    active.push({ key: 'shield', remaining: (buffs.shieldExpiresAt - n) / 1000 });
  if (buffs.damageBonusHitsLeft > 0)
    active.push({ key: 'focus', remaining: null, hits: buffs.damageBonusHitsLeft });
  if (buffs.critDamageBonusPct > 0 && buffs.critDamageBonusExpiresAt > n)
    active.push({ key: 'crit', remaining: (buffs.critDamageBonusExpiresAt - n) / 1000 });
  if (buffs.attackSpeedBonusPct > 0 && buffs.attackSpeedExpiresAt > n)
    active.push({ key: 'haste', remaining: (buffs.attackSpeedExpiresAt - n) / 1000 });
  if (buffs.reflectChancePct > 0 && buffs.reflectExpiresAt > n)
    active.push({ key: 'reflect', remaining: (buffs.reflectExpiresAt - n) / 1000 });
  if (buffs.powerChargeHitsLeft > 0 && buffs.powerChargeExpiresAt > n)
    active.push({ key: 'power_charge', remaining: (buffs.powerChargeExpiresAt - n) / 1000, hits: buffs.powerChargeHitsLeft });
  if (buffs.dodgeChancePct > 0 && buffs.dodgeExpiresAt > n)
    active.push({ key: 'dodge', remaining: (buffs.dodgeExpiresAt - n) / 1000 });

  return (
    <div className="flex items-center gap-1.5 min-h-[26px]">
      <AnimatePresence>
        {active.map(({ key, remaining, hits }) => {
          const meta = BUFF_META[key];
          if (!meta) return null;
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.6, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.6, x: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                background: `linear-gradient(135deg, ${meta.color}33 0%, ${meta.color}11 100%)`,
                border: `1px solid ${meta.color}88`,
                boxShadow: `0 0 6px ${meta.color}55`,
              }}
              title={meta.label}
            >
              <span className="text-[12px] leading-none">{meta.icon}</span>
              <span
                className="text-[9px] font-black tabular-nums leading-none"
                style={{ color: meta.color, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
              >
                {remaining !== null ? fmt(remaining) : `×${hits}`}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}