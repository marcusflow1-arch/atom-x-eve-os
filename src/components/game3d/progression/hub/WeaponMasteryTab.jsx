import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { WEAPONS, MASTERY_MAX_LEVEL, getTreeForWeapon, getDamageScalingFor } from '../weaponSynergyData';
import { subscribeMastery, setActiveWeapon } from '../weaponMasteryStore';
import WeaponSkillTree from './WeaponSkillTree';
import WeaponMasteryTreePanel from '../weaponMastery/WeaponMasteryTreePanel';
import { resolveWeaponType } from '../weaponMastery/weaponMasteryConfig';

// Weapon Mastery — picker grid → per-weapon two-branch skill tree page.
export default function WeaponMasteryTab() {
  const [mastery, setMastery] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeMastery(setMastery), []);
  if (!mastery) return null;

  if (selected) {
    return (
      <WeaponDetail
        weaponId={selected}
        masteryEntry={mastery.weapons[selected]}
        onBack={() => setSelected(null)}
        onSetActive={() => setActiveWeapon(selected)}
        isActive={mastery.activeWeaponId === selected}
      />
    );
  }

  return (
    <div className="p-8 overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
        {WEAPONS.map((w) => {
          const m = mastery.weapons[w.id];
          const pct = m.isMaxLevel
            ? 100
            : (m.killsIntoLevel / Math.max(1, m.killsForNextLevel)) * 100;
          const isActive = mastery.activeWeaponId === w.id;
          return (
            <button
              key={w.id}
              onClick={() => setSelected(w.id)}
              className="text-left p-4 rounded-lg border transition-all hover:border-yellow-500/30 hover:bg-white/[0.03]"
              style={{
                background: isActive ? 'rgba(255,216,107,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: isActive ? 'rgba(255,216,107,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{w.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{w.name}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-1">
                    Level {m.level} / {MASTERY_MAX_LEVEL}
                    {m.isMaxLevel && <span className="text-amber-300 ml-2">Mastered</span>}
                  </div>
                </div>
                {isActive && (
                  <span className="text-[10px] tracking-[0.25em] text-amber-300 uppercase">Active</span>
                )}
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    background: 'linear-gradient(90deg, #6ec3ff, #ffd86b)',
                  }}
                />
              </div>
              <div className="mt-1.5 text-[10px] text-white/50">
                {m.isMaxLevel ? 'Mastery complete' : `${m.killsIntoLevel} / ${m.killsForNextLevel} kills`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Per-weapon detail page — mirrors the reference MMO mastery screen ───────
function WeaponDetail({ weaponId, masteryEntry, onBack, onSetActive, isActive }) {
  const weapon = WEAPONS.find((w) => w.id === weaponId);
  const tree = getTreeForWeapon(weaponId);
  const scaling = getDamageScalingFor(weaponId);

  // Points logic — 1 unspent point per mastery level (matches reference).
  const totalPoints = masteryEntry.level;
  const pendingSpent = 0; // future allocation system; 0 until commit-points flow exists
  const pointsAvailable = totalPoints - pendingSpent;

  const xpPct = masteryEntry.isMaxLevel
    ? 100
    : (masteryEntry.killsIntoLevel / Math.max(1, masteryEntry.killsForNextLevel)) * 100;

  // First three abilities across both branches → Q / R / F ability slots.
  const allAbilities = tree.branches.flatMap((b) => b.abilities);
  const abilitySlots = [
    { key: 'Q', ability: allAbilities[0] },
    { key: 'R', ability: allAbilities[1] },
    { key: 'F', ability: allAbilities[2] },
  ];

  return (
    <div
      className="relative w-full h-full px-8 py-6 flex flex-col"
      style={{
        // Liquid-glass card — translucent so the world shows through.
        background: 'rgba(8, 14, 22, 0.42)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 60px rgba(0,0,0,0.35)',
      }}
    >
      {/* Top bar — Back + weapon name */}
      <div className="flex items-center gap-6 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs tracking-[0.2em] uppercase text-white/70 hover:text-white px-3 py-1.5 rounded-sm border border-white/15"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-2xl font-semibold tracking-[0.45em] uppercase text-white/95">
          {weapon?.name}
        </div>
      </div>

      {/* Body — left column + right trees */}
      <div className="flex-1 flex min-h-0 gap-10 mt-4">
        {/* LEFT column */}
        <div className="w-64 flex flex-col items-center">
          {/* Points-available disc */}
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(120,170,210,0.10) 0%, transparent 70%)',
              border: '1px solid rgba(180,210,240,0.25)',
            }}
          >
            <div className="absolute inset-2 rounded-full border border-white/10" />
            <div className="text-center">
              <div className="text-5xl font-light text-white tabular-nums">
                {pointsAvailable}
              </div>
              <div className="mt-1 text-[9px] tracking-[0.35em] uppercase text-white/65">
                Points<br/>Available
              </div>
            </div>
          </div>

          {/* Level + XP bar */}
          <div className="w-full mt-5">
            <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, xpPct)}%`,
                  background: 'linear-gradient(90deg, #6ec3ff, #a5d8ff)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-white/65 tracking-[0.05em]">
              <span>Level {masteryEntry.level} / {MASTERY_MAX_LEVEL}</span>
              <span>
                {masteryEntry.isMaxLevel
                  ? 'Mastered'
                  : `${masteryEntry.killsIntoLevel.toLocaleString()} to level ${masteryEntry.level + 1}`}
              </span>
            </div>
          </div>

          {/* Abilities Q / R / F */}
          <div className="w-full mt-8">
            <div className="text-center text-[10px] tracking-[0.4em] uppercase text-white/60 mb-3">
              Abilities
            </div>
            <div className="flex justify-center gap-2">
              {abilitySlots.map(({ key, ability }) => (
                <div key={key} className="flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
                      opacity: ability ? 1 : 0.35,
                    }}
                  >
                    {ability?.icon || ''}
                  </div>
                  <div className="mt-1.5 text-[10px] text-white/75 tracking-widest">{key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Damage scales with */}
          <div className="w-full mt-10 text-center">
            <div className="text-[10px] tracking-[0.35em] uppercase text-white/55">
              Damage Scales With
            </div>
            <div className="mt-2 text-xs text-white/80 italic capitalize">
              {scaling.length === 0
                ? '—'
                : scaling.map((s) => s.stat).join(' and ')}
            </div>
          </div>
        </div>

        {/* RIGHT — interactive Mastery Tree (passive nodes, point spending) */}
        <div className="flex-1 min-w-0 flex justify-center items-start overflow-y-auto pt-2">
          <WeaponMasteryTreePanel weaponType={resolveWeaponType(weaponId)} />
        </div>
      </div>

      {/* Bottom — Commit Points / Set Active button bar */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={onSetActive}
          disabled={isActive}
          className="px-10 py-3 text-[11px] tracking-[0.45em] uppercase font-semibold transition-all"
          style={{
            background: isActive
              ? 'rgba(59, 130, 246, 0.18)'
              : 'linear-gradient(180deg, rgba(59,130,246,0.35) 0%, rgba(29,78,216,0.30) 100%)',
            border: '1px solid rgba(96,165,250,0.55)',
            color: '#dbeafe',
            boxShadow: isActive
              ? 'inset 0 0 12px rgba(59,130,246,0.25)'
              : '0 0 18px rgba(59,130,246,0.25), inset 0 0 14px rgba(96,165,250,0.20)',
            minWidth: 320,
            cursor: isActive ? 'default' : 'pointer',
          }}
        >
          {isActive
            ? 'Active Weapon'
            : `Commit ${pointsAvailable} Point${pointsAvailable === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}