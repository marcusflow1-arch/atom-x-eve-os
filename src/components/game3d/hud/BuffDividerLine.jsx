// ─── BuffDividerLine ──────────────────────────────────────────────────────
// Renders the gold divider line (with a small icon circle in the middle) that
// sits ABOVE the 8 skill icons in HUDVitalsRow.
//
// Active self-cast buffs (and weapon-class buffs / passives) are drawn
// SITTING ON the left and right segments of the line — never crossing the
// center circle. They alternate left / right and wrap to additional rows
// stacked upward when they overflow.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeBuffs } from '../activeBuffsStore';

const BUFF_META = {
  shield:        { icon: '🛡️', label: 'Aegis Shield',      color: '#60a5fa' },
  focus:         { icon: '🧠', label: 'Focus',             color: '#f59e0b' },
  crit:          { icon: '🎯', label: 'Decisive Blow',     color: '#ef4444' },
  haste:         { icon: '⚡', label: 'Haste',             color: '#fbbf24' },
  reflect:       { icon: '✨', label: "God's Deflection", color: '#a78bfa' },
  power_charge:  { icon: '🔥', label: 'Power Charge',      color: '#fb923c' },
  dodge:         { icon: '💨', label: 'Evasion',           color: '#22d3ee' },
};

const BUFF_ICON = 22;          // icon size
const BUFFS_PER_ROW = 5;       // per side before wrapping to next row above
const ROW_GAP = 4;             // vertical gap between wrapped rows

function fmt(sec) {
  if (sec <= 0) return '0s';
  if (sec < 10) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

function BuffIcon({ buffKey, remaining, hits }) {
  const meta = BUFF_META[buffKey];
  if (!meta) return null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="relative flex items-center justify-center rounded"
      style={{
        width: BUFF_ICON,
        height: BUFF_ICON,
        background: `linear-gradient(135deg, ${meta.color}33 0%, ${meta.color}11 100%)`,
        border: `1px solid ${meta.color}88`,
        boxShadow: `0 0 5px ${meta.color}55`,
      }}
      title={meta.label}
    >
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-black tabular-nums leading-none whitespace-nowrap"
        style={{ color: meta.color, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
      >
        {remaining !== null && remaining !== undefined ? fmt(remaining) : `×${hits}`}
      </span>
      <span className="text-[11px] leading-none">{meta.icon}</span>
    </motion.div>
  );
}

// Build rows of buffs (max BUFFS_PER_ROW each). The first row is the bottom
// row (the one resting on the divider line); extra rows stack upward.
function chunkRows(buffs) {
  const rows = [];
  for (let i = 0; i < buffs.length; i += BUFFS_PER_ROW) {
    rows.push(buffs.slice(i, i + BUFFS_PER_ROW));
  }
  return rows;
}

function SideStack({ buffs, side }) {
  // side: 'left' | 'right'
  // Bottom row sits ON the line (y = 0 → icons centered on the line baseline).
  // Additional rows stack UPWARD.
  const rows = chunkRows(buffs);
  return (
    <div
      className="relative flex-1 h-full"
      style={{ minWidth: 0 }}
    >
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="absolute flex items-center gap-1"
          style={{
            // Sit the icon centered on the line: line is at the vertical
            // middle of the parent (height 18). Pull icons up so their
            // CENTER is on the line — half the icon height above the line.
            bottom: `calc(50% - ${BUFF_ICON / 2}px + ${rowIdx * (BUFF_ICON + ROW_GAP)}px)`,
            [side]: 0,
            // Pack right-aligned buffs end-to-start so they grow toward the
            // outer edge as more are added.
            flexDirection: side === 'right' ? 'row' : 'row',
          }}
        >
          <AnimatePresence>
            {row.map((b) => (
              <BuffIcon key={b.key} buffKey={b.key} remaining={b.remaining} hits={b.hits} />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function BuffDividerLine({ icon: Icon, color = 'rgba(220,200,150,0.85)' }) {
  const [, force] = useState(0);
  const [buffs, setBuffs] = useState(null);

  useEffect(() => subscribeBuffs(setBuffs), []);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);

  // Collect active buffs
  const active = [];
  if (buffs) {
    const n = performance.now();
    if (buffs.shield > 0 && buffs.shieldExpiresAt > n)
      active.push({ key: 'shield', remaining: (buffs.shieldExpiresAt - n) / 1000 });
    if (buffs.damageBonusHitsLeft > 0)
      active.push({ key: 'focus', remaining: buffs.damageBonusExpiresAt > n ? (buffs.damageBonusExpiresAt - n) / 1000 : null, hits: buffs.damageBonusHitsLeft });
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
  }

  // Split alternating: even indexes → left, odd → right
  const leftBuffs  = active.filter((_, i) => i % 2 === 0);
  const rightBuffs = active.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative flex items-center w-full" style={{ height: 18 }}>
      {/* Left line segment */}
      <div
        className="relative flex-1 h-full"
        style={{ minWidth: 0 }}
      >
        {/* the visible line itself */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{
            height: 1.5,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(220,200,150,0.55) 30%, rgba(220,200,150,0.65) 100%)',
          }}
        />
        {/* buffs sitting on the line, growing toward the outer (left) edge */}
        <SideStack buffs={leftBuffs} side="left" />
      </div>

      {/* Center circle (untouched — buffs never enter this zone) */}
      <div
        className="relative flex items-center justify-center rounded-full mx-1.5"
        style={{
          width: 18,
          height: 18,
          background: 'rgba(0,0,0,0.78)',
          border: `1.5px solid ${color}`,
          boxShadow: '0 0 6px rgba(0,0,0,0.6)',
          flex: '0 0 auto',
        }}
      >
        <Icon
          style={{ width: 10, height: 10, color, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.9))' }}
          strokeWidth={2.2}
        />
      </div>

      {/* Right line segment */}
      <div
        className="relative flex-1 h-full"
        style={{ minWidth: 0 }}
      >
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{
            height: 1.5,
            background:
              'linear-gradient(90deg, rgba(220,200,150,0.65) 0%, rgba(220,200,150,0.55) 70%, rgba(255,255,255,0) 100%)',
          }}
        />
        <SideStack buffs={rightBuffs} side="right" />
      </div>
    </div>
  );
}