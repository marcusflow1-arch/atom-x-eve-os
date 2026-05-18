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
import { User, Sword, Sparkles, BookOpen, Crosshair, Zap, Skull } from 'lucide-react';
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
import BuffDividerLine from './BuffDividerLine';

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

function SkillSlot({ slotKey, skill, cooldown, buffStatus, size = 38 }) {
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
        className="relative rounded-full transition-transform hover:scale-105 pointer-events-auto"
        style={{
          width: size,
          height: size,
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
  { path: 'damage',  label: 'Greatsword',  className: 'Damage',  Icon: Sword  },
  { path: 'ranged',  label: 'Bow',         className: 'Ranged',  Icon: Zap    },
  { path: 'defense', label: 'Dual Blades', className: 'Defense', Icon: Crosshair },
];

function WeaponCenterSwitcher({ unspentPoints }) {
  const [idx, setIdx] = useState(() => {
    const cur = getActiveWeaponPath();
    return Math.max(0, WEAPON_CLASSES.findIndex((w) => w.path === cur));
  });
  const [, force] = useState(0);

  useEffect(() => subscribeWeaponBuffs(() => force((n) => n + 1)), []);

  // Single source of truth for cycling so keys + UI use the same path.
  const cycle = React.useCallback((dir) => {
    setIdx((prev) => {
      const next = (prev + dir + WEAPON_CLASSES.length) % WEAPON_CLASSES.length;
      setActiveWeaponPath(WEAPON_CLASSES[next].path);
      return next;
    });
  }, []);

  // Key bindings: G cycles forward, ◄ / ► cycle backward / forward.
  useEffect(() => {
    const onKey = (e) => {
      // Ignore typing in inputs
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.code === 'KeyG')        { cycle(1);  e.preventDefault(); }
      else if (e.code === 'ArrowRight') { cycle(1);  }
      else if (e.code === 'ArrowLeft')  { cycle(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle]);

  const cur  = WEAPON_CLASSES[idx];
  const buff = WEAPON_CLASS_BUFFS[cur.path];

  // Faded "other" weapons stacked upward behind the active icon
  const others = WEAPON_CLASSES
    .map((w, i) => ({ w, i }))
    .filter(({ i }) => i !== idx);
  const ActiveIcon = cur.Icon;

  return (
    <div className="relative flex items-center" style={{ height: 64 }}>
      {/* C-key character circle */}
      <div className="relative" style={{ width: 64, height: 64 }}>
        <CharacterRing unspentPoints={unspentPoints} />

        {/* Weapon icon stack sits DIRECTLY above the C circle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ bottom: 'calc(100% + 4px)', zIndex: 4 }}
        >
          <div className="pointer-events-auto">
            <WeaponIconStack />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weapon icon stack (placed above the right end of HP tank) ────────────
function WeaponIconStack() {
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
      if (e.code === 'KeyG')        { cycle(1);  e.preventDefault(); }
      else if (e.code === 'ArrowRight') { cycle(1);  }
      else if (e.code === 'ArrowLeft')  { cycle(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle]);

  const cur  = WEAPON_CLASSES[idx];
  const buff = WEAPON_CLASS_BUFFS[cur.path];
  const others = WEAPON_CLASSES.map((w, i) => ({ w, i })).filter(({ i }) => i !== idx);
  const ActiveIcon = cur.Icon;

  return (
    <button
      onClick={() => cycle(1)}
      className="relative pointer-events-auto flex flex-col items-center"
      style={{ width: 32, height: 60 }}
      title={`${cur.label} — Press G or ◄ ► to swap`}
    >
      {/* Faded other-weapon icons stacking upward behind active */}
      {others.map(({ w }, k) => {
        const ob = WEAPON_CLASS_BUFFS[w.path];
        const OtherIcon = w.Icon;
        const offsetY = -(10 + k * 9);
        const opacity = 0.45 - k * 0.18;
        const scale = 0.78 - k * 0.1;
        return (
          <OtherIcon
            key={w.path}
            className="absolute left-1/2 bottom-2 -translate-x-1/2"
            style={{
              width: 22,
              height: 22,
              color: ob?.color || '#cbb98a',
              opacity,
              transform: `translate(-50%, ${offsetY}px) scale(${scale})`,
              filter: 'blur(0.3px) drop-shadow(0 1px 1px rgba(0,0,0,0.7))',
              pointerEvents: 'none',
            }}
            strokeWidth={2}
          />
        );
      })}

      {/* Active weapon icon */}
      <ActiveIcon
        className="absolute left-1/2 bottom-2 -translate-x-1/2"
        style={{
          width: 24,
          height: 24,
          color: buff.color,
          filter: `drop-shadow(0 0 4px ${buff.color}99) drop-shadow(0 1px 2px rgba(0,0,0,0.9))`,
        }}
        strokeWidth={2.2}
      />

      {/* G key tag */}
      <div
        className="absolute left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm text-[9px] font-black tracking-wider pointer-events-none"
        style={{
          top: -2,
          background: 'linear-gradient(180deg, rgba(35,35,45,0.95) 0%, rgba(15,15,20,0.95) 100%)',
          border: '1px solid rgba(220,200,150,0.65)',
          color: '#fde68a',
          textShadow: '0 1px 1px rgba(0,0,0,0.9)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}
      >
        G
      </div>
    </button>
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
function HorizontalGauge({ value, max, color, label, align, killCount, playerName }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isRightAligned = align === 'right';
  const isHPGauge = label === 'HP';
  
  return (
    <div className="relative h-[14px]" style={{ width: 320 }}>
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
        {isHPGauge ? (
          <>
            <span className="opacity-80">{label}</span>
            {playerName && (
              <span style={{ color: '#cffafe', textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(34,211,238,0.5)' }}>
                {playerName}
              </span>
            )}
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
// Skills column — packs icons tightly to one side (no spread).
// align="left"  → packs to the left edge (icons 1-4 above HP tank)
// align="right" → packs to the right edge (icons 5-8 above Fusion tank)
function SkillsColumn({ slotKeys, skillForSlot, cooldowns, buffStatusForSlot, offset, dividerIcon, dividerColor, align = 'left' }) {
  return (
    <div className="flex flex-col items-stretch" style={{ width: 320 }}>
      <SectionDivider icon={dividerIcon} color={dividerColor} />

      <div
        className="flex items-center gap-1.5 mt-1.5"
        style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
      >
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

// ── Companion skill slots (diamond of rotated clear squares) ──────────────
// 4 square buttons rotated 45° (so they appear as diamonds), arranged around
// a central point. Buttons are clear (no fill) matching the other companion
// HUD style. Layout:
//   • Skill 1 → left
//   • Skill 2 → top
//   • Skill 3 → bottom
//   • Skill 4 → right
function CompanionSkillSlots() {
  // Scale outer boxes 1.2× (33 → ~40), add spacing between them so the
  // diagonal X is visible, and add a 5th box at the center.
  const BTN = 40;             // outer square button edge length (33 × 1.2)
  const CENTER_BTN = 28;      // smaller center box so it doesn't crowd
  const OFFSET = 30;          // distance from center to each diamond point (spaced out)
  const SIZE = 70;            // container size — same footprint as before (no layout shift)

  const positions = [
    { key: '1', tx: -OFFSET, ty: 0,        title: 'Companion skill 1' },
    { key: '2', tx: 0,        ty: -OFFSET, title: 'Companion skill 2' },
    { key: '3', tx: 0,        ty: OFFSET,  title: 'Companion skill 3' },
    { key: '4', tx: OFFSET,   ty: 0,       title: 'Companion skill 4' },
  ];

  const diagLineStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SIZE * 0.95,
    height: 1,
    background:
      'linear-gradient(90deg, rgba(120,180,230,0) 0%, rgba(120,180,230,0.55) 50%, rgba(120,180,230,0) 100%)',
    transformOrigin: 'center',
    pointerEvents: 'none',
  };

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      {/* Diagonal accent lines crossing the center */}
      <div style={{ ...diagLineStyle, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
      <div style={{ ...diagLineStyle, transform: 'translate(-50%, -50%) rotate(-45deg)' }} />

      {positions.map(({ key, tx, ty, title }) => (
        <button
          key={key}
          title={title}
          className="absolute pointer-events-auto transition-transform hover:scale-110"
          style={{
            top: '50%',
            left: '50%',
            width: BTN,
            height: BTN,
            // Translate to slot position, then rotate 45° so the square looks like a diamond
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(45deg)`,
            background: 'rgba(20, 30, 45, 0.25)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1.5px solid rgba(140,190,235,0.65)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 6px rgba(120,180,230,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)',
            borderRadius: 3,
          }}
        />
      ))}

      {/* 5th center diamond — sits at the intersection of the X */}
      <button
        title="Companion skill 5"
        className="absolute pointer-events-auto transition-transform hover:scale-110"
        style={{
          top: '50%',
          left: '50%',
          width: CENTER_BTN,
          height: CENTER_BTN,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          background: 'rgba(20, 30, 45, 0.25)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: '1.5px solid rgba(140,190,235,0.65)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 6px rgba(120,180,230,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)',
          borderRadius: 3,
        }}
      />
    </div>
  );
}

// ── Main row component ────────────────────────────────────────────────────
export default function HUDVitalsRow({ hp, maxHp, fusion, unspentPoints, killCount = 0, playerName = '' }) {
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

  const SLOTS_ALL = ['1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        {/* TOP: all 8 skills packed to HP side — pulled down so icons rest ON the HP gauge */}
        <div className="flex items-end justify-start gap-2" style={{ marginBottom: -28, position: 'relative', zIndex: 3, marginLeft: -125 }}>
          {/* All 8 skills (1-8) — fit exactly within HP bar width (320px) */}
          <div className="flex flex-col items-stretch" style={{ width: 320 }}>
            <BuffDividerLine icon={User} color="rgba(220,200,150,0.85)" />
            <div className="flex items-center justify-between mt-1.5" style={{ width: 320 }}>
              {SLOTS_ALL.map((key, i) => (
                <SkillSlot
                  key={key}
                  slotKey={key}
                  skill={skillForSlot(i)}
                  cooldown={loadout.cooldowns[i]}
                  buffStatus={buffStatusForSlot(i)}
                  size={34}
                />
              ))}
            </div>
          </div>

          {/* Spacer matching the center cluster width (character + weapon circles) */}
          <div style={{ width: 118 }} />

          {/* Spacer so layout is preserved */}
          <div style={{ width: 52 }} />
        </div>

        {/* BOTTOM: Companion skills | Kill count | HP gauge | center cluster | Fusion gauge | Skills Book */}
        <div className="flex items-center justify-center gap-2">
          {/* Companion skill slots (to the left of kill count) */}
          <CompanionSkillSlots />

          {/* Kill count box with "KILLS" label above */}
          {killCount > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[7px] font-bold tracking-wider" style={{ color: 'rgba(255, 180, 180, 0.7)' }}>
                KILLS
              </span>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider whitespace-nowrap"
                style={{
                  background: 'rgba(20, 8, 8, 0.55)',
                  border: '1px solid rgba(255, 90, 90, 0.4)',
                  color: '#ffb4b4',
                  textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                }}
                title="Total rogue AI kills"
              >
                <Skull className="w-2.5 h-2.5" />
                <span className="tabular-nums">{killCount}</span>
              </div>
            </div>
          )}
          <HorizontalGauge value={hp} max={maxHp} color="#e23b3b" label="HP" align="right" playerName={playerName} />
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