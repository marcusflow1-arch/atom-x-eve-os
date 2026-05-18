// ─── HUDVitalsRow ─────────────────────────────────────────────────────────
// Bottom-center HUD row, screenshot-faithful layout:
//
//   [ Skills 1 2 3 4 ] [ HP gauge ] [ C-key character circle | weapon circle ] [ Fusion gauge ] [ Skills 5 6 7 8 ]
//
// The center cluster shows the currently equipped weapon class with a faded
// "next weapon" silhouette peeking out behind it. Press G (or ◄ / ►) to cycle
// weapon classes.
//
// Pure UI composition — all underlying stores and key handlers already exist.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sword, Sparkles, BookOpen } from 'lucide-react';
import { subscribeLoadout, getLoadout } from '../skills/loadoutStore';
import { getSkillById } from '../skills/skillRegistry';
import { subscribeBuffs } from '../skills/buffEngine';
import {
  setActiveWeaponPath,
  getActiveWeaponPath,
  subscribeWeaponBuffs,
  WEAPON_CLASS_BUFFS,
} from '../weaponClassBuffStore';
import HUDSkillsBookPanel from './HUDSkillsBookPanel';

// ── Skill slot button (mirrors HUDSkillSlots styling, condensed) ──────────
const TYPE_COLORS = {
  ACTIVE_ATTACK: '#f59e0b',
  ACTIVE_BUFF:   '#60a5fa',
  PASSIVE:       '#a78bfa',
};

function fmtTime(sec) {
  if (sec <= 0) return '0s';
  if (sec < 10) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

function getBuffStatusFromRecord(skill_id, buffs) {
  if (!skill_id || !buffs) return null;
  const b = buffs[skill_id];
  if (!b) return null;
  const remainingMs = b.expiresAt - performance.now();
  if (remainingMs <= 0) return null;
  if (skill_id === 'focus' && typeof b.hitsRemaining === 'number') {
    return { remaining: remainingMs / 1000, hits: b.hitsRemaining };
  }
  return { remaining: remainingMs / 1000 };
}

function SkillSlot({ slotKey, skill, cooldown, buffStatus }) {
  const cd    = cooldown || 0;
  const maxCd = skill?.cooldown || 1;
  const cdPct = Math.min(1, cd / maxCd);
  const color = skill ? (TYPE_COLORS[skill.skill_type] || '#4a90e2') : '#4a90e2';
  const icon  = skill?.icon || '';
  const onCooldown = cd > 0;
  const buffActive = !!buffStatus;

  return (
    <div className="relative">
      {buffActive && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-5 px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums whitespace-nowrap pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.78)',
            border: `1px solid ${color}aa`,
            color,
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            boxShadow: `0 0 6px ${color}66`,
          }}
        >
          {buffStatus.hits != null ? `×${buffStatus.hits}` : fmtTime(buffStatus.remaining)}
        </div>
      )}
      <button
        className="relative w-[46px] h-[46px] rounded-full transition-transform hover:scale-105 pointer-events-auto"
        style={{
          background: skill
            ? `radial-gradient(circle at 50% 35%, ${color}55 0%, ${color}11 70%, rgba(0,0,0,0.7) 100%)`
            : 'radial-gradient(circle at 50% 35%, rgba(40,50,60,0.65), rgba(8,10,14,0.9))',
          border: `1.5px solid ${buffActive ? color : (skill ? color + '99' : 'rgba(180,160,110,0.55)')}`,
          boxShadow: buffActive
            ? `0 3px 12px rgba(0,0,0,0.55), 0 0 12px ${color}cc, inset 0 1px 0 rgba(255,255,255,0.15)`
            : '0 3px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
          opacity: onCooldown ? 0.55 : 1,
        }}
      >
        {skill && (
          <div className="absolute inset-0 flex items-center justify-center text-lg">{icon}</div>
        )}
        {onCooldown && (
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <span className="text-white font-bold text-sm tabular-nums">{Math.ceil(cd)}</span>
          </div>
        )}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
          style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(220,200,150,0.6)',
          }}
        >
          {slotKey}
        </div>
      </button>

      {onCooldown && (
        <div
          className="absolute -bottom-1 left-1 right-1 h-[2px] rounded-full overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(1 - cdPct) * 100}%`, background: color, boxShadow: `0 0 4px ${color}` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Weapon cycler (center) ────────────────────────────────────────────────
const WEAPON_CLASSES = [
  { path: 'damage',  label: 'Greatsword',  className: 'Damage'  },
  { path: 'ranged',  label: 'Bow',         className: 'Ranged'  },
  { path: 'defense', label: 'Dual Blades', className: 'Defense' },
];

// Standalone weapon-switcher cluster: active weapon centered, other weapons
// peek out behind it like a fan/cross menu. A "G" tag sits above the cluster.
// Cycle with G or ◄ / ►.
function WeaponFanSwitcher() {
  const [idx, setIdx] = useState(() => {
    const cur = getActiveWeaponPath();
    return Math.max(0, WEAPON_CLASSES.findIndex((w) => w.path === cur));
  });
  const [, force] = useState(0);

  useEffect(() => subscribeWeaponBuffs(() => force((n) => n + 1)), []);

  const cycle = React.useCallback((dir) => {
    setIdx((prev) => {
      const next = (prev + dir + WEAPON_CLASSES.length) % WEAPON_CLASSES.length;
      setActiveWeaponPath(WEAPON_CLASSES[next].path);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.code === 'KeyG')             { cycle(1);  e.preventDefault(); }
      else if (e.code === 'ArrowRight')  { cycle(1);  }
      else if (e.code === 'ArrowLeft')   { cycle(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle]);

  const cur  = WEAPON_CLASSES[idx];
  const buff = WEAPON_CLASS_BUFFS[cur.path];

  // Position the non-active weapons in a fan around the active one (cross style).
  // Offsets are in pixels relative to the cluster center.
  const peekOffsets = [
    { x: -22, y: 6 },   // back-left
    { x:  22, y: 6 },   // back-right
    { x:   0, y: -18 }, // back-top
    { x:   0, y: 22 },  // back-bottom
  ];

  // Build list of non-active weapons in display order.
  const others = WEAPON_CLASSES
    .map((w, i) => ({ w, i }))
    .filter((e) => e.i !== idx);

  return (
    <div className="relative pointer-events-auto" style={{ width: 72, height: 72 }} title={`${cur.label} — Press G to swap`}>
      {/* G key tag — stays above the cluster */}
      <div
        className="absolute left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm text-[10px] font-black tracking-wider pointer-events-none z-30"
        style={{
          top: -14,
          background: 'linear-gradient(180deg, rgba(35,35,45,0.95) 0%, rgba(15,15,20,0.95) 100%)',
          border: '1px solid rgba(220,200,150,0.7)',
          color: '#fde68a',
          textShadow: '0 1px 1px rgba(0,0,0,0.9)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}
      >
        G
      </div>

      {/* Peek-out weapon icons (smaller, tucked behind the active one) */}
      {others.map((entry, k) => {
        const off = peekOffsets[k % peekOffsets.length];
        const oBuff = WEAPON_CLASS_BUFFS[entry.w.path];
        return (
          <button
            key={entry.w.path}
            onClick={() => {
              setActiveWeaponPath(entry.w.path);
              setIdx(entry.i);
            }}
            className="absolute rounded-full pointer-events-auto"
            style={{
              width: 26,
              height: 26,
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))`,
              background:
                'radial-gradient(circle at 50% 40%, rgba(40,45,60,0.85) 0%, rgba(10,12,18,0.95) 80%)',
              border: '1.5px solid rgba(220,200,150,0.45)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
              opacity: 0.7,
              zIndex: 5,
            }}
            title={entry.w.label}
          >
            <Sword
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: 12, height: 12, color: oBuff?.color || '#cbb98a' }}
              strokeWidth={2}
            />
          </button>
        );
      })}

      {/* Active weapon (big, centered, on top) */}
      <button
        onClick={() => cycle(1)}
        className="absolute rounded-full pointer-events-auto"
        style={{
          width: 48,
          height: 48,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle at 50% 40%, rgba(55,60,75,0.95) 0%, rgba(10,12,18,0.98) 80%)',
          border: '2px solid rgba(220,200,150,0.85)',
          boxShadow: `0 0 12px ${buff.color}77, 0 3px 10px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.55)`,
          zIndex: 10,
        }}
      >
        <Sword
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 22, height: 22, color: buff.color, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}
          strokeWidth={2.1}
        />
      </button>

      {/* Active weapon label tag — below the cluster */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold tracking-[0.2em] uppercase pointer-events-none"
        style={{
          bottom: -14,
          color: buff.color,
          textShadow: '0 1px 2px rgba(0,0,0,0.95)',
        }}
      >
        {cur.label}
      </div>
    </div>
  );
}

// Center column: weapon fan sits ABOVE the C-key character circle.
function WeaponCenterSwitcher({ unspentPoints }) {
  return (
    <div className="relative flex flex-col items-center" style={{ width: 96 }}>
      {/* Weapon fan on top */}
      <div className="mb-3">
        <WeaponFanSwitcher />
      </div>
      {/* C-key character circle below */}
      <div className="relative" style={{ width: 64, height: 64 }}>
        <CharacterRing unspentPoints={unspentPoints} />
      </div>
    </div>
  );
}

function CharacterRing({ unspentPoints }) {
  const hasPoints = unspentPoints > 0;
  return (
    <>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(40,45,60,0.92) 0%, rgba(10,12,18,0.98) 80%)',
          border: '2px solid rgba(220,200,150,0.75)',
          boxShadow: hasPoints
            ? '0 0 14px rgba(255,210,80,0.85), inset 0 0 12px rgba(255,210,80,0.35)'
            : '0 3px 10px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.55)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: 5,
          border: '1px solid rgba(220,200,150,0.45)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}
      />
      <User
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 26,
          height: 26,
          color: hasPoints ? '#ffe08a' : '#e8e0c8',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
        }}
        strokeWidth={2.2}
      />
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm text-[9px] font-black tracking-wider pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(35,35,45,0.95) 0%, rgba(15,15,20,0.95) 100%)',
          border: '1px solid rgba(220,200,150,0.65)',
          color: '#fde68a',
          textShadow: '0 1px 1px rgba(0,0,0,0.9)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}
      >
        C
      </div>
      {hasPoints && (
        <div
          className="absolute -top-2 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black animate-pulse z-20"
          style={{
            background: 'linear-gradient(180deg, #fff7b0 0%, #ffd24a 50%, #c98a00 100%)',
            border: '1.5px solid rgba(120,80,0,0.8)',
            color: '#3a2400',
            boxShadow: '0 0 10px rgba(255,210,70,0.8)',
          }}
          title="Press C to spend stat points"
        >
          +{unspentPoints}
        </div>
      )}
    </>
  );
}

// ── Horizontal gauge (HP / Fusion) ────────────────────────────────────────
function HorizontalGauge({ value, max, color, label, align }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isRightAligned = align === 'right';
  return (
    <div className="relative h-[14px]" style={{ width: 200 }}>
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(180,140,80,0.4)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        <motion.div
          className="absolute top-0 bottom-0"
          style={{
            [isRightAligned ? 'right' : 'left']: 0,
            background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 0 8px ${color}99`,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div
        className="absolute inset-0 flex items-center px-2 text-[9px] font-bold tabular-nums text-white pointer-events-none"
        style={{
          justifyContent: 'space-between',
          textShadow: '0 1px 2px rgba(0,0,0,0.95)',
          letterSpacing: '0.08em',
        }}
      >
        {isRightAligned ? (
          <>
            <span className="opacity-80">{label}</span>
            <span>{Math.round(value)} / {Math.round(max)}</span>
          </>
        ) : (
          <>
            <span>{Math.round(value)} / {Math.round(max)}</span>
            <span className="opacity-80">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Section divider: horizontal line with a small circle icon centered ───
// Matches the player-circle divider used between skill groups in the screenshot.
function SectionDivider({ icon: Icon, color = 'rgba(220,200,150,0.8)' }) {
  return (
    <div className="relative flex items-center w-full" style={{ height: 18 }}>
      {/* Left line segment */}
      <div
        className="flex-1"
        style={{
          height: 1.5,
          background:
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(220,200,150,0.55) 30%, rgba(220,200,150,0.65) 100%)',
        }}
      />
      {/* Center circle */}
      <div
        className="relative flex items-center justify-center rounded-full mx-1.5"
        style={{
          width: 18,
          height: 18,
          background: 'rgba(0,0,0,0.78)',
          border: `1.5px solid ${color}`,
          boxShadow: '0 0 6px rgba(0,0,0,0.6)',
        }}
      >
        <Icon
          style={{ width: 10, height: 10, color, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.9))' }}
          strokeWidth={2.2}
        />
      </div>
      {/* Right line segment */}
      <div
        className="flex-1"
        style={{
          height: 1.5,
          background:
            'linear-gradient(90deg, rgba(220,200,150,0.65) 0%, rgba(220,200,150,0.55) 70%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
  );
}

// ── Skills column (divider line ON TOP, then 4 slots below it) ────────────
// Width matches the gauge width below it so the divider line stretches end to end.
function SkillsColumn({ slotKeys, skillForSlot, cooldowns, buffStatusForSlot, offset, dividerIcon, dividerColor }) {
  return (
    <div className="flex flex-col items-stretch" style={{ width: 200 }}>
      {/* Section divider line + circle icon (ABOVE the skills) */}
      <SectionDivider icon={dividerIcon} color={dividerColor} />

      {/* Skill slots row (BELOW the line, above the gauge) */}
      <div className="flex items-center justify-between gap-1 mt-1.5">
        {slotKeys.map((key, i) => (
          <SkillSlot
            key={key}
            slotKey={key}
            skill={skillForSlot(offset + i)}
            cooldown={cooldowns[offset + i]}
            buffStatus={buffStatusForSlot(offset + i)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Skills Book button (sits to the far right of the Fusion gauge) ───────
function SkillsBookButton({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-[52px] h-[52px] rounded-full transition-transform hover:scale-105 pointer-events-auto flex flex-col items-center justify-center gap-0.5"
      style={{
        background: open
          ? 'radial-gradient(circle at 50% 35%, rgba(167,139,250,0.45) 0%, rgba(167,139,250,0.12) 70%, rgba(0,0,0,0.7) 100%)'
          : 'radial-gradient(circle at 50% 35%, rgba(40,50,60,0.65), rgba(8,10,14,0.9))',
        border: open
          ? '1.5px solid rgba(167,139,250,0.75)'
          : '1.5px solid rgba(220,200,150,0.55)',
        boxShadow: open
          ? '0 3px 12px rgba(0,0,0,0.55), 0 0 12px rgba(167,139,250,0.6)'
          : '0 3px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
      title="Skills Book"
    >
      <BookOpen
        className="w-4 h-4"
        style={{ color: open ? '#c4b5fd' : 'rgba(255,240,200,0.85)' }}
      />
      <span
        className="text-[7px] font-bold tracking-[0.15em] leading-none"
        style={{ color: open ? '#c4b5fd' : 'rgba(255,240,200,0.7)' }}
      >
        SKILLS
      </span>
    </button>
  );
}

// ── Main row component ────────────────────────────────────────────────────
export default function HUDVitalsRow({ hp, maxHp, fusion, unspentPoints }) {
  const [loadout, setLoadout] = useState(getLoadout());
  const [buffs, setBuffs] = useState({});
  const [, force] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => subscribeLoadout(setLoadout), []);
  useEffect(() => subscribeBuffs((s) => setBuffs(s.buffs || {})), []);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);

  const skillForSlot = (idx) => {
    const id = loadout.activeSlots[idx];
    return id ? getSkillById(id) : null;
  };
  const buffStatusForSlot = (idx) => getBuffStatusFromRecord(loadout.activeSlots[idx], buffs);

  const SLOTS_LEFT  = ['1', '2', '3', '4'];
  const SLOTS_RIGHT = ['5', '6', '7', '8'];

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        {/* TOP: skills columns + spacer for the center cluster (skills sit directly on top of gauges) */}
        <div className="flex items-end justify-center gap-2" style={{ marginBottom: -8 }}>
          {/* Skills 1–4 above HP gauge */}
          <SkillsColumn
            slotKeys={SLOTS_LEFT}
            skillForSlot={skillForSlot}
            cooldowns={loadout.cooldowns}
            buffStatusForSlot={buffStatusForSlot}
            offset={0}
            dividerIcon={User}
            dividerColor="rgba(220,200,150,0.85)"
          />

          {/* Spacer matching the center cluster width (weapon fan + character circle stacked) */}
          <div style={{ width: 96 }} />

          {/* Skills 5–8 above Fusion gauge */}
          <SkillsColumn
            slotKeys={SLOTS_RIGHT}
            skillForSlot={skillForSlot}
            cooldowns={loadout.cooldowns}
            buffStatusForSlot={buffStatusForSlot}
            offset={4}
            dividerIcon={Sparkles}
            dividerColor="rgba(192,164,250,0.9)"
          />

          {/* Spacer so top row aligns with the skill book sitting beside the Fusion gauge */}
          <div style={{ width: 52 }} />
        </div>

        {/* BOTTOM: HP gauge | center cluster | Fusion gauge | Skills Book */}
        <div className="flex items-center justify-center gap-2" style={{ position: 'relative', zIndex: 1 }}>
          <HorizontalGauge value={hp} max={maxHp} color="#e23b3b" label="HP" align="right" />
          <WeaponCenterSwitcher unspentPoints={unspentPoints} />
          <HorizontalGauge
            value={fusion.points}
            max={fusion.maxPoints}
            color={fusion.isFused ? '#c084fc' : '#a78bfa'}
            label={fusion.isFused ? 'FUSION ⚡' : 'FUSION'}
            align="left"
          />
          {/* Skills Book — vertically centered with the Fusion gauge */}
          <SkillsBookButton open={bookOpen} onToggle={() => setBookOpen((v) => !v)} />
        </div>
      </div>

      <HUDSkillsBookPanel open={bookOpen} onClose={() => setBookOpen(false)} />
    </>
  );
}