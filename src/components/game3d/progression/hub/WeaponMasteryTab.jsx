import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { WEAPONS, MASTERY_MAX_LEVEL, getTreeForWeapon, getDamageScalingFor } from '../weaponSynergyData';
import { subscribeMastery, setActiveWeapon } from '../weaponMasteryStore';

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

// ── Per-weapon detail page with two branch trees ───────────────────────────
function WeaponDetail({ weaponId, masteryEntry, onBack, onSetActive, isActive }) {
  const weapon = WEAPONS.find((w) => w.id === weaponId);
  const tree = getTreeForWeapon(weaponId);
  const scaling = getDamageScalingFor(weaponId);

  return (
    <div className="flex h-full">
      {/* LEFT — weapon overview */}
      <div className="w-72 border-r border-white/5 px-6 pt-6 flex flex-col">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-white/60 hover:text-white mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-5xl text-center mb-3">{weapon?.icon}</div>
        <div className="text-center text-lg font-semibold text-white tracking-wide uppercase">
          {weapon?.name}
        </div>

        <div className="mt-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/50">Mastery</div>
          <div className="text-2xl font-light text-amber-200 mt-1">
            Level {masteryEntry.level} / {MASTERY_MAX_LEVEL}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${masteryEntry.isMaxLevel ? 100 : (masteryEntry.killsIntoLevel / Math.max(1, masteryEntry.killsForNextLevel)) * 100}%`,
                background: 'linear-gradient(90deg, #6ec3ff, #ffd86b)',
              }}
            />
          </div>
          <div className="text-[10px] text-white/50 mt-1">
            {masteryEntry.isMaxLevel ? 'Weapon Mastered' : `${masteryEntry.killsIntoLevel} / ${masteryEntry.killsForNextLevel} kills`}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/50 mb-2">Damage Scales With</div>
          {scaling.length === 0 && <div className="text-xs text-white/40">—</div>}
          {scaling.map((s) => (
            <div key={s.stat} className="text-xs text-white/80 capitalize">
              {s.stat} <span className="text-amber-400/70 ml-1">{s.tier}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onSetActive}
          disabled={isActive}
          className="mt-auto mb-6 py-2 rounded-sm text-[11px] tracking-[0.3em] uppercase font-semibold transition-all"
          style={{
            background: isActive ? 'rgba(255,216,107,0.15)' : 'rgba(255,216,107,0.08)',
            border: '1px solid rgba(255,216,107,0.35)',
            color: isActive ? '#ffd86b' : 'rgba(255,216,107,0.85)',
            cursor: isActive ? 'default' : 'pointer',
          }}
        >
          {isActive ? 'Active Weapon' : 'Set Active'}
        </button>
      </div>

      {/* RIGHT — two branch trees */}
      <div className="flex-1 min-w-0 px-10 pt-8 overflow-y-auto">
        <div className="grid grid-cols-2 gap-12">
          {tree.branches.map((branch) => (
            <BranchTree key={branch.id} branch={branch} weaponLevel={masteryEntry.level} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BranchTree({ branch, weaponLevel }) {
  return (
    <div>
      <div
        className="text-center text-sm tracking-[0.4em] uppercase pb-4 mb-6"
        style={{
          color: branch.color,
          borderBottom: `1px solid ${branch.color}40`,
        }}
      >
        {branch.name}
      </div>
      <div className="space-y-4">
        {branch.abilities.map((ab) => {
          const unlocked = weaponLevel >= ab.unlockLevel;
          return (
            <div
              key={ab.id}
              className="flex items-center gap-3 p-3 rounded-md border transition-all"
              style={{
                background: unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.15)',
                borderColor: unlocked ? `${branch.color}55` : 'rgba(255,255,255,0.05)',
                opacity: unlocked ? 1 : 0.35,
              }}
            >
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center text-xl"
                style={{
                  background: unlocked ? `${branch.color}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${unlocked ? branch.color : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {ab.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{ab.name}</div>
                <div className="text-[10px] tracking-[0.25em] uppercase mt-0.5"
                     style={{ color: unlocked ? branch.color : 'rgba(255,255,255,0.4)' }}>
                  {unlocked ? 'Unlocked' : `Unlocks at Lv ${ab.unlockLevel}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}