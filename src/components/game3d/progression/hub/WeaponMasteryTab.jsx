import React, { useEffect, useState } from 'react';
import { ChevronLeft, Zap, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { WEAPONS, MASTERY_MAX_LEVEL, getTreeForWeapon, getDamageScalingFor } from '../weaponSynergyData';
import { subscribeMastery, setActiveWeapon } from '../weaponMasteryStore';
import WeaponSkillTree from './WeaponSkillTree';
import WeaponMasteryTreePanel from '../weaponMastery/WeaponMasteryTreePanel';
import WeaponEnchantmentPanel from '../weaponMastery/WeaponEnchantmentPanel';
import { resolveWeaponType, MILESTONE_LEVELS, MILESTONE_PASSIVES } from '../weaponMastery/weaponMasteryConfig';
import AdvancedClassPanel from '../../../game3d/talents/AdvancedClassPanel';

// Weapon Mastery — picker grid → per-weapon two-branch skill tree page.
export default function WeaponMasteryTab() {
  const [mastery, setMastery] = useState(null);
  const [selected, setSelected] = useState(null);
  const [topView, setTopView] = useState('mastery'); // 'mastery' | 'advanced'

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top-level tab toggle: Weapon Mastery vs Advanced Classes */}
      <div
        className="flex-shrink-0 flex gap-0 px-6 pt-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { id: 'mastery',   label: 'Weapon Mastery', icon: '⚔️' },
          { id: 'advanced',  label: 'Advanced Classes', icon: '✦' },
        ].map((tab) => {
          const on = topView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTopView(tab.id)}
              className="flex items-center gap-1.5 px-5 pb-2.5 text-xs transition-all"
              style={{
                color: on ? '#ffffff' : 'rgba(255,255,255,0.40)',
                borderBottom: on ? '2px solid #f59e0b' : '2px solid transparent',
                fontWeight: on ? 600 : 400,
              }}
            >
              <span>{tab.icon}</span>
              <span className="tracking-[0.15em] uppercase">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Advanced Classes view */}
      {topView === 'advanced' && (
        <div className="flex-1 overflow-hidden">
          <AdvancedClassPanel />
        </div>
      )}

      {/* Mastery weapon grid */}
      {topView === 'mastery' && (
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
      )}
    </div>
  );
}

// ── Per-weapon detail page — mirrors the reference MMO mastery screen ───────
function WeaponDetail({ weaponId, masteryEntry, onBack, onSetActive, isActive }) {
  const weapon = WEAPONS.find((w) => w.id === weaponId);
  const weaponType = resolveWeaponType(weaponId);
  // 'enchant' (Annulus-style ring) or 'tree' (passive skill nodes)
  const [view, setView] = useState('enchant');

  // Mastery perks that have been toggled active by the player (persist per weapon)
  const storageKey = `mastery_active_perks_${weaponId}`;
  const [activePerks, setActivePerks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  });

  const togglePerk = (perkId) => {
    setActivePerks((prev) => {
      const next = { ...prev, [perkId]: !prev[perkId] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const xpPct = masteryEntry.isMaxLevel
    ? 100
    : (masteryEntry.killsIntoLevel / Math.max(1, masteryEntry.killsForNextLevel)) * 100;

  // Milestone passives for this weapon type, filtered to those the player has reached
  const milestonePassives = MILESTONE_LEVELS
    .filter((lvl) => masteryEntry.level >= lvl)
    .map((lvl) => ({ lvl, perk: MILESTONE_PASSIVES[weaponType]?.[lvl] }))
    .filter(({ perk }) => !!perk);

  // Next locked milestone for context
  const nextMilestone = MILESTONE_LEVELS.find((lvl) => masteryEntry.level < lvl);

  return (
    <div
      className="relative w-full h-full px-8 py-6 flex flex-col"
      style={{
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

      {/* Body — left column + vertical divider + right panel */}
      <div className="flex-1 flex min-h-0 gap-6 mt-4">

        {/* ── LEFT COLUMN: weapon proficiency + togglable perks ── */}
        <div className="w-64 flex flex-col items-center overflow-y-auto">

          {/* Mastery Level disc */}
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'radial-gradient(circle, rgba(110,195,255,0.10) 0%, rgba(165,216,255,0.04) 50%, transparent 75%)',
              border: '1.5px solid rgba(110,195,255,0.30)',
              boxShadow: masteryEntry.level > 1 ? '0 0 24px rgba(110,195,255,0.12)' : 'none',
            }}
          >
            <div className="absolute inset-2 rounded-full border border-white/[0.07]" />
            <div className="text-center">
              <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-1">
                Mastery Level
              </div>
              <div className="text-5xl font-light text-white tabular-nums leading-none">
                {masteryEntry.level}
              </div>
              <div className="mt-1.5 text-[9px] tracking-[0.25em] uppercase text-white/40">
                / {MASTERY_MAX_LEVEL}
              </div>
            </div>
            {masteryEntry.isMaxLevel && (
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] tracking-[0.35em] uppercase font-semibold rounded-sm"
                style={{
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.50)',
                  color: '#fbbf24',
                }}
              >
                Mastered
              </div>
            )}
          </div>

          {/* XP progress bar */}
          <div className="w-full mt-6 px-1">
            <div className="flex justify-between text-[9px] text-white/45 mb-1.5 tracking-[0.05em]">
              <span>Proficiency XP</span>
              <span>
                {masteryEntry.isMaxLevel
                  ? 'Complete'
                  : `${masteryEntry.killsIntoLevel} / ${masteryEntry.killsForNextLevel}`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, xpPct)}%`,
                  background: 'linear-gradient(90deg, #6ec3ff, #a5d8ff)',
                  boxShadow: '0 0 6px rgba(110,195,255,0.4)',
                }}
              />
            </div>
            <div className="text-[9px] text-white/35 mt-1.5 text-center">
              {masteryEntry.isMaxLevel
                ? 'All proficiency earned'
                : `${masteryEntry.killsForNextLevel - masteryEntry.killsIntoLevel} more to Level ${masteryEntry.level + 1}`}
            </div>
          </div>

          {/* Unlocked Perks — togglable on/off */}
          <div className="w-full mt-5 px-1">
            <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">
              Weapon Perks
            </div>

            {milestonePassives.length === 0 ? (
              <div className="text-[10px] text-white/30 text-center py-3 px-2 rounded-sm border border-white/[0.06]">
                {nextMilestone
                  ? `Reach Level ${nextMilestone} to unlock your first perk`
                  : 'No perks available'}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {milestonePassives.map(({ lvl, perk }) => {
                  const on = !!activePerks[perk.id];
                  return (
                    <button
                      key={perk.id}
                      onClick={() => togglePerk(perk.id)}
                      className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-sm transition-all"
                      style={{
                        background: on ? 'rgba(110,195,255,0.07)' : 'rgba(255,255,255,0.02)',
                        border: on ? '1px solid rgba(110,195,255,0.30)' : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {on
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                          : <Circle className="w-3.5 h-3.5 text-white/25" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-white/85">{perk.name}</span>
                          <span className="text-[9px] tracking-[0.15em] text-white/35">Lv{lvl}</span>
                        </div>
                        <div className="text-[9px] text-white/45 mt-0.5 leading-relaxed">{perk.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Next locked milestone hint */}
            {nextMilestone && (
              <div
                className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.10)',
                }}
              >
                <Zap className="w-3 h-3 text-white/25 flex-shrink-0" />
                <span className="text-[9px] text-white/30">
                  Next perk at Level {nextMilestone}
                  {MILESTONE_PASSIVES[weaponType]?.[nextMilestone]?.name
                    ? ` — ${MILESTONE_PASSIVES[weaponType][nextMilestone].name}`
                    : ''}
                </span>
              </div>
            )}
          </div>

          {/* Skill Tree hint */}
          <div className="w-full mt-4 px-1">
            <div
              className="px-3 py-2 rounded-sm text-[9px] text-white/40 leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-white/55 font-semibold">Skill Tree</span> — use your mastery level to allocate points and unlock additional combat bonuses for this weapon.
            </div>
          </div>
        </div>

        {/* VERTICAL DIVIDER */}
        <div
          className="w-px flex-shrink-0 self-stretch"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(180,160,130,0.45) 12%, rgba(180,160,130,0.45) 88%, transparent 100%)',
          }}
        />

        {/* RIGHT — Enchantment ring (Annulus-style) OR skill tree nodes */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-2">
          {/* View toggle */}
          <div className="flex justify-center mb-3">
            <div
              className="inline-flex rounded-sm overflow-hidden"
              style={{ border: '1px solid rgba(180,160,130,0.30)' }}
            >
              {[
                { id: 'enchant', label: 'Enchantment' },
                { id: 'tree',    label: 'Mastery Art' },
              ].map((opt) => {
                const on = view === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setView(opt.id)}
                    className="px-5 py-1.5 text-[10px] tracking-[0.35em] uppercase transition-all"
                    style={{
                      background: on
                        ? 'linear-gradient(180deg, rgba(45,212,191,0.20), rgba(13,148,136,0.20))'
                        : 'rgba(20,20,24,0.55)',
                      color: on ? '#a7f3d0' : 'rgba(255,255,255,0.55)',
                      borderRight: opt.id === 'enchant' ? '1px solid rgba(180,160,130,0.30)' : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {view === 'enchant' ? (
            <WeaponEnchantmentPanel
              weaponId={weaponId}
              weaponName={weapon?.name}
              weaponIcon={weapon?.icon}
            />
          ) : (
            <div className="flex justify-center items-start">
              <WeaponMasteryTreePanel weaponType={weaponType} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom — Set Active button */}
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
          {isActive ? 'Active Weapon' : 'Set as Active Weapon'}
        </button>
      </div>
    </div>
  );
}