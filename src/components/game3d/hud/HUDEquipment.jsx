import React, { useEffect, useState } from 'react';
import { Sword, ChevronLeft, ChevronRight } from 'lucide-react';
import { setActiveWeaponPath, getActiveWeaponPath, subscribeWeaponBuffs, getBuffValuesFor, WEAPON_CLASS_BUFFS } from '../weaponClassBuffStore';

/**
 * Bottom-right HUD: "EQUIPMENT" label with weapon switcher (◄ weapon ►)
 * plus two paired skill slots above it.
 *
 * Switching between the 3 weapon CLASSES (Damage / Ranged / Defense) also
 * swaps the active native passive buff — Brutal Force / Swift Marksman /
 * Iron Stance — applied to combat at runtime.
 */
const WEAPON_CLASSES = [
  { path: 'damage',  label: 'Greatsword',  className: 'Damage'  },
  { path: 'ranged',  label: 'Bow',         className: 'Ranged'  },
  { path: 'defense', label: 'Dual Blades', className: 'Defense' },
];

export default function HUDEquipment() {
  const [idx, setIdx] = useState(() => {
    const cur = getActiveWeaponPath();
    return Math.max(0, WEAPON_CLASSES.findIndex((w) => w.path === cur));
  });
  const [, force] = useState(0);

  // Re-render when buff levels change so the tooltip stat reflects current level.
  useEffect(() => subscribeWeaponBuffs(() => force((n) => n + 1)), []);

  const cycle = (dir) => {
    const next = (idx + dir + WEAPON_CLASSES.length) % WEAPON_CLASSES.length;
    setIdx(next);
    setActiveWeaponPath(WEAPON_CLASSES[next].path);
  };

  const cur = WEAPON_CLASSES[idx];
  const buff = WEAPON_CLASS_BUFFS[cur.path];
  const values = getBuffValuesFor(cur.path);

  return (
    <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col items-end gap-2">
      <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-amber-200/80">
        Equipment
      </div>

      {/* Two parallel skill slots */}
      <div className="flex gap-2">
        <PairSlot keyLabel="1" />
        <PairSlot keyLabel="2" />
      </div>

      {/* Weapon switcher */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
        style={{
          background: 'linear-gradient(180deg, rgba(15,20,28,0.85), rgba(10,14,20,0.85))',
          border: '1px solid rgba(180,140,80,0.5)',
          boxShadow: '0 3px 10px rgba(0,0,0,0.55)',
        }}
      >
        <button
          onClick={() => cycle(-1)}
          className="w-6 h-6 rounded-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-white/80" />
        </button>

        <div
          className="flex flex-col items-center gap-0.5 min-w-[120px] justify-center"
          title={`${buff.name} (Lvl ${getBuffLevel(cur.path)}/${buff.maxLevel})`}
        >
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4" style={{ color: buff.color }} />
            <span className="text-white text-xs font-medium tracking-wider">{cur.label}</span>
          </div>
          <span className="text-[9px] tracking-[0.18em] uppercase" style={{ color: buff.color }}>
            {buff.icon} {buff.name}
          </span>
        </div>

        <button
          onClick={() => cycle(1)}
          className="w-6 h-6 rounded-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center"
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/80" />
        </button>
      </div>

      {/* Active-buff stat readout — tiny, only shows non-zero values */}
      <BuffReadout values={values} color={buff.color} />
    </div>
  );
}

// Tiny helper: current level for a path (used for the tooltip).
function getBuffLevel(path) {
  try {
    const raw = localStorage.getItem('weapon_class_buffs_v1');
    if (raw) return JSON.parse(raw)[path] ?? 1;
  } catch {}
  return 1;
}

function BuffReadout({ values, color }) {
  const fmt = (k, v) => {
    if (!v) return null;
    const pct = (v * 100).toFixed(v < 0.01 ? 1 : 0);
    const labels = {
      damageBonusPct:     'DMG',
      lethalBlowPct:      'Lethal',
      moveSpeedBonusPct:  'Move',
      hitChanceBonusPct:  'Hit',
      critChanceBonusPct: 'Crit',
      defenseBonusPct:    'DEF',
      dodgeChancePct:     'Dodge',
      guardChancePct:     'Guard',
    };
    return { label: labels[k] || k, val: `${pct}%` };
  };
  const rows = Object.keys(values).map((k) => fmt(k, values[k])).filter(Boolean);
  if (!rows.length) return null;
  return (
    <div
      className="px-2 py-1 rounded-sm flex gap-2 text-[9px] tracking-wider"
      style={{
        background: 'rgba(10,14,20,0.85)',
        border: `1px solid ${color}55`,
      }}
    >
      {rows.map((r) => (
        <span key={r.label} className="flex items-center gap-0.5">
          <span style={{ color }}>{r.label}</span>
          <span className="text-white">+{r.val}</span>
        </span>
      ))}
    </div>
  );
}

function PairSlot({ keyLabel }) {
  return (
    <div
      className="relative w-[48px] h-[48px] rounded-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(40,50,60,0.75), rgba(15,20,28,0.85))',
        border: '1.5px solid rgba(180,140,80,0.5)',
        boxShadow: '0 3px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className="absolute inset-1 rounded-[2px] bg-black/30" />
      <div
        className="absolute bottom-0 right-0 px-1 py-0.5 text-[9px] font-bold text-white"
        style={{ background: 'rgba(0,0,0,0.75)', borderTopLeftRadius: 3 }}
      >
        {keyLabel}
      </div>
    </div>
  );
}