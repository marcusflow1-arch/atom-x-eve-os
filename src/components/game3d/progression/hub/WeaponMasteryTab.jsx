import React, { useEffect, useState } from 'react';
import { ChevronLeft, Zap, CheckCircle2, Circle, Sparkles, Lock, Unlock, Star, RotateCcw } from 'lucide-react';
import { subscribeEnchantment, getEnchantment, MAX_LEVEL as ENCHANT_MAX_LEVEL } from '../weaponMastery/enchantmentStore';
import { WEAPONS, MASTERY_MAX_LEVEL, getTreeForWeapon, getDamageScalingFor } from '../weaponSynergyData';
import { subscribeMastery, setActiveWeapon } from '../weaponMasteryStore';
import WeaponSkillTree from './WeaponSkillTree';
import WeaponMasteryTreePanel from '../weaponMastery/WeaponMasteryTreePanel';
import WeaponEnchantmentPanel from '../weaponMastery/WeaponEnchantmentPanel';
import MasteryArtPanel from '../weaponMastery/MasteryArtPanel';
import { resolveWeaponType, MILESTONE_LEVELS, MILESTONE_PASSIVES } from '../weaponMastery/weaponMasteryConfig';
import AdvancedClassPanel from '../../../game3d/talents/AdvancedClassPanel';
import PerkTreePanel from '../perkTree/PerkTreePanel';
import WeaponRunePanel from '../weaponMastery/WeaponRunePanel';
import WeaponUpgradePanel from '../weaponMastery/WeaponUpgradePanel';
import { subscribeRune, getRuneData, getTotalRuneBonus, RUNE_TIERS, RUNE_SLOT_UNLOCK_LEVELS, MAX_RUNE_SLOTS, getRuneTier } from '../weaponMastery/weaponRuneStore';
import { subscribeUpgrade, getUpgrade, getDamageAtLevel, getUpgradeRarity, MAX_UPGRADE_LEVEL, UPGRADE_RARITY_TIERS } from '../weaponMastery/weaponUpgradeStore';

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
  const [view, setView] = useState('enchant'); // 'enchant' | 'tree' | 'perks' | 'rune' | 'upgrade'

  // Live enchantment level
  const [enchantLevel, setEnchantLevel] = useState(() => getEnchantment(weaponId)?.level ?? 0);
  useEffect(() => {
    return subscribeEnchantment(() => {
      setEnchantLevel(getEnchantment(weaponId)?.level ?? 0);
    });
  }, [weaponId]);

  // Live rune data
  const [, forceRune] = useState(0);
  useEffect(() => subscribeRune(() => forceRune((x) => x + 1)), []);

  // Live upgrade data
  const [, forceUpgrade] = useState(0);
  useEffect(() => subscribeUpgrade(() => forceUpgrade((x) => x + 1)), []);

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

        {/* ── LEFT COLUMN — content changes based on active view ── */}
        <div className="w-64 flex flex-col items-center overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

          {view === 'enchant' ? (
            /* ── ENCHANTMENT left ── */
            <>
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
                  <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-1">Enchant Lv</div>
                  <div className="text-5xl font-light text-white tabular-nums leading-none">{enchantLevel}</div>
                  <div className="mt-1.5 text-[9px] tracking-[0.25em] uppercase text-white/40">/ {ENCHANT_MAX_LEVEL}</div>
                </div>
                {enchantLevel >= ENCHANT_MAX_LEVEL && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] tracking-[0.35em] uppercase font-semibold rounded-sm"
                    style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.50)', color: '#fbbf24' }}>
                    Max Enchant
                  </div>
                )}
              </div>
              <div className="w-full mt-6 px-1">
                <div className="flex justify-between text-[9px] text-white/45 mb-1.5">
                  <span>Proficiency XP</span>
                  <span>{masteryEntry.isMaxLevel ? 'Complete' : `${masteryEntry.killsIntoLevel} / ${masteryEntry.killsForNextLevel}`}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, xpPct)}%`, background: 'linear-gradient(90deg, #6ec3ff, #a5d8ff)', boxShadow: '0 0 6px rgba(110,195,255,0.4)' }} />
                </div>
                <div className="text-[9px] text-white/35 mt-1.5 text-center">
                  {masteryEntry.isMaxLevel ? 'All proficiency earned' : `${masteryEntry.killsForNextLevel - masteryEntry.killsIntoLevel} more to Level ${masteryEntry.level + 1}`}
                </div>
              </div>
              <div className="w-full mt-5 px-1">
                <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Weapon Perks</div>
                {milestonePassives.length === 0 ? (
                  <div className="text-[10px] text-white/30 text-center py-3 px-2 rounded-sm border border-white/[0.06]">
                    {nextMilestone ? `Reach Level ${nextMilestone} to unlock` : 'No perks available'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {milestonePassives.map(({ lvl, perk }) => {
                      const on = !!activePerks[perk.id];
                      return (
                        <button key={perk.id} onClick={() => togglePerk(perk.id)}
                          className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-sm transition-all"
                          style={{ background: on ? 'rgba(110,195,255,0.07)' : 'rgba(255,255,255,0.02)', border: on ? '1px solid rgba(110,195,255,0.30)' : '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="mt-0.5 flex-shrink-0">
                            {on ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> : <Circle className="w-3.5 h-3.5 text-white/25" />}
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
                {nextMilestone && (
                  <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
                    <Zap className="w-3 h-3 text-white/25 flex-shrink-0" />
                    <span className="text-[9px] text-white/30">
                      Next perk at Level {nextMilestone}
                      {MILESTONE_PASSIVES[weaponType]?.[nextMilestone]?.name ? ` — ${MILESTONE_PASSIVES[weaponType][nextMilestone].name}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </>

          ) : view === 'rune' ? (
            /* ── RUNE left: total ATK bonus disc + per-slot summary ── */
            (() => {
              const runeData = getRuneData(weaponId);
              const totalBonus = getTotalRuneBonus(runeData.slots);
              const filledSlots = runeData.slots.filter(Boolean).length;
              return (
                <>
                  {/* Total Rune ATK ring */}
                  <div
                    className="relative w-44 h-44 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'radial-gradient(circle, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.03) 50%, transparent 75%)',
                      border: `1.5px solid ${totalBonus > 0 ? 'rgba(52,211,153,0.45)' : 'rgba(255,255,255,0.12)'}`,
                      boxShadow: totalBonus > 0 ? '0 0 24px rgba(52,211,153,0.15)' : 'none',
                    }}
                  >
                    <div className="absolute inset-2 rounded-full border border-white/[0.07]" />
                    <div className="text-center">
                      <div className="text-[10px] tracking-[0.35em] uppercase text-emerald-300/60 mb-1">Rune ATK</div>
                      <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: totalBonus > 0 ? '#34d399' : 'rgba(255,255,255,0.25)' }}>
                        +{totalBonus}
                      </div>
                      <div className="mt-1.5 text-[9px] tracking-[0.2em] uppercase text-white/35">{filledSlots} / {MAX_RUNE_SLOTS} socketed</div>
                    </div>
                  </div>

                  {/* Per-slot status */}
                  <div className="w-full mt-5 px-1">
                    <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Slot Overview</div>
                    <div className="flex flex-col gap-1.5">
                      {runeData.slots.map((slot, i) => {
                        const unlockLevel = RUNE_SLOT_UNLOCK_LEVELS[i];
                        const unlocked = masteryEntry.level >= unlockLevel;
                        const rt = slot ? getRuneTier(slot.tier) : null;
                        return (
                          <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-sm"
                            style={{
                              background: rt ? `${rt.color}0d` : 'rgba(255,255,255,0.02)',
                              border: rt ? `1px solid ${rt.color}44` : '1px solid rgba(255,255,255,0.07)',
                            }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/35">Slot {i + 1}</span>
                              {!unlocked && <span className="text-[9px] text-white/20">Lv {unlockLevel} req.</span>}
                            </div>
                            {rt ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold" style={{ color: rt.color }}>{rt.name}</span>
                                <span className="text-[9px] text-white/40">+{rt.atkBonus}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-white/25">{unlocked ? 'Empty' : 'Locked'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rune tier legend */}
                  <div className="w-full mt-4 px-1">
                    <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Tier Legend</div>
                    <div className="flex flex-col gap-1">
                      {RUNE_TIERS.map((rt) => (
                        <div key={rt.tier} className="flex items-center justify-between text-[9px]">
                          <span style={{ color: rt.color }}>{rt.name}</span>
                          <span className="text-white/40">+{rt.atkBonus} ATK</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()

          ) : view === 'upgrade' ? (
            /* ── UPGRADE left: current level disc + damage stats + tier status ── */
            (() => {
              const upEntry = getUpgrade(weaponId);
              const upLevel = upEntry.level;
              const isMax = upLevel >= MAX_UPGRADE_LEVEL;
              const rarity = getUpgradeRarity(upLevel);
              const currentDmg = getDamageAtLevel(upLevel);
              const nextDmg = !isMax ? getDamageAtLevel(upLevel + 1) : null;
              const pct = ((upLevel - 1) / (MAX_UPGRADE_LEVEL - 1)) * 100;
              return (
                <>
                  {/* Level ring */}
                  <div
                    className="relative w-44 h-44 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${rarity.color}18 0%, ${rarity.color}06 50%, transparent 75%)`,
                      border: `1.5px solid ${rarity.color}55`,
                      boxShadow: upLevel > 1 ? `0 0 24px ${rarity.color}22` : 'none',
                    }}
                  >
                    <div className="absolute inset-2 rounded-full border border-white/[0.07]" />
                    <div className="text-center">
                      <div className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: `${rarity.color}99` }}>
                        {rarity.name}
                      </div>
                      <div className="text-5xl font-bold tabular-nums leading-none" style={{ color: rarity.color }}>
                        {upLevel}
                      </div>
                      <div className="mt-1.5 text-[9px] tracking-[0.25em] uppercase text-white/40">/ {MAX_UPGRADE_LEVEL}</div>
                    </div>
                    {isMax && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] tracking-[0.35em] uppercase font-semibold rounded-sm"
                        style={{ background: `${rarity.color}22`, border: `1px solid ${rarity.color}66`, color: rarity.color }}>
                        Max Level
                      </div>
                    )}
                  </div>

                  {/* Level progress bar */}
                  <div className="w-full mt-6 px-1">
                    <div className="flex justify-between text-[9px] text-white/45 mb-1.5">
                      <span>Level Progress</span>
                      <span className="tabular-nums">{upLevel} / {MAX_UPGRADE_LEVEL}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg, ${rarity.color}88, ${rarity.color})`, boxShadow: `0 0 6px ${rarity.color}55` }} />
                    </div>
                    {!isMax && (
                      <div className="text-[9px] text-white/35 mt-1.5 text-center">
                        {MAX_UPGRADE_LEVEL - upLevel} levels to max
                      </div>
                    )}
                  </div>

                  {/* Base damage stat */}
                  <div className="w-full mt-4 px-1">
                    <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Base Damage</div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between px-2.5 py-2 rounded-sm"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-[10px] text-white/45">Current</span>
                        <span className="text-lg font-bold tabular-nums text-white/90">{currentDmg}</span>
                      </div>
                      {!isMax && (
                        <div className="flex items-center justify-between px-2.5 py-2 rounded-sm"
                          style={{ background: `${rarity.color}0a`, border: `1px solid ${rarity.color}33` }}>
                          <span className="text-[10px] text-white/45">After Upgrade</span>
                          <div className="text-right">
                            <span className="text-lg font-bold tabular-nums" style={{ color: rarity.color }}>{nextDmg}</span>
                            <span className="text-[9px] text-emerald-300/80 ml-1.5">+{nextDmg - currentDmg}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tier milestones */}
                  <div className="w-full mt-4 px-1">
                    <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Tier Milestones</div>
                    <div className="flex flex-col gap-1">
                      {UPGRADE_RARITY_TIERS.map((t) => {
                        const reached = upLevel >= t.upTo;
                        return (
                          <div key={t.upTo} className="flex items-center justify-between text-[9px]">
                            <span style={{ color: reached ? t.color : 'rgba(255,255,255,0.25)' }}>{t.name}</span>
                            <span className="text-white/30">Lv {t.upTo} · +{(t.upTo - 1) * 18} ATK</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()

          ) : view === 'tree' ? (
            /* ── MASTERY ART left ── */
            <>
              <div className="relative w-44 h-44 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'radial-gradient(circle, rgba(251,191,36,0.10) 0%, rgba(245,158,11,0.04) 50%, transparent 75%)',
                  border: '1.5px solid rgba(251,191,36,0.35)',
                  boxShadow: masteryEntry.level >= 10 ? '0 0 24px rgba(251,191,36,0.14)' : 'none',
                }}>
                <div className="absolute inset-2 rounded-full border border-white/[0.07]" />
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.35em] uppercase text-amber-300/60 mb-1">Mastery Art</div>
                  <div className="text-5xl font-light text-white tabular-nums leading-none">{masteryEntry.level}</div>
                  <div className="mt-1.5 text-[9px] tracking-[0.25em] uppercase text-white/40">/ 20</div>
                </div>
                {masteryEntry.level >= 20 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] tracking-[0.35em] uppercase font-semibold rounded-sm"
                    style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.50)', color: '#fbbf24' }}>
                    Grand Mastery
                  </div>
                )}
              </div>
              <div className="w-full mt-6 px-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{
                    background: masteryEntry.level >= 10 ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)',
                    border: masteryEntry.level >= 10 ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  {masteryEntry.level >= 10
                    ? <Unlock className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                    : <Lock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                  }
                  <div>
                    <div className="text-[10px] font-semibold" style={{ color: masteryEntry.level >= 10 ? '#6ee7b7' : 'rgba(255,255,255,0.30)' }}>
                      Weapon Efficiency
                    </div>
                    <div className="text-[9px] text-white/35">
                      {masteryEntry.level >= 10 ? 'Advanced Class Available' : `Reach Level 10 to unlock`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full mt-4 px-1">
                <div className="flex justify-between text-[9px] text-white/45 mb-1.5">
                  <span>Mastery XP</span>
                  <span>{masteryEntry.isMaxLevel ? 'Complete' : `${masteryEntry.killsIntoLevel} / ${masteryEntry.killsForNextLevel}`}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, xpPct)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', boxShadow: '0 0 6px rgba(251,191,36,0.4)' }} />
                </div>
                <div className="text-[9px] text-white/35 mt-1.5 text-center">
                  {masteryEntry.isMaxLevel ? 'Grand Mastery achieved' : `${masteryEntry.killsForNextLevel - masteryEntry.killsIntoLevel} kills to Level ${masteryEntry.level + 1}`}
                </div>
              </div>
              <div className="w-full mt-4 px-1">
                <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Mastery Perks</div>
                {milestonePassives.length === 0 ? (
                  <div className="text-[10px] text-white/30 text-center py-3 px-2 rounded-sm border border-white/[0.06]">
                    {nextMilestone ? `Reach Level ${nextMilestone} to unlock` : 'No perks available'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {milestonePassives.map(({ lvl, perk }) => {
                      const on = !!activePerks[perk.id];
                      return (
                        <button key={perk.id} onClick={() => togglePerk(perk.id)}
                          className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-sm transition-all"
                          style={{ background: on ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.02)', border: on ? '1px solid rgba(251,191,36,0.30)' : '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="mt-0.5 flex-shrink-0">
                            {on ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> : <Circle className="w-3.5 h-3.5 text-white/25" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-white/85">{perk.name}</span>
                              <span className="text-[9px] tracking-[0.15em] text-amber-400/50">Lv{lvl}</span>
                            </div>
                            <div className="text-[9px] text-white/45 mt-0.5 leading-relaxed">{perk.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>

          ) : (
            /* ── PERKS left — show mastery level as context ── */
            <>
              <div className="relative w-44 h-44 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0.03) 50%, transparent 75%)',
                  border: '1.5px solid rgba(167,139,250,0.35)',
                  boxShadow: masteryEntry.level > 1 ? '0 0 24px rgba(167,139,250,0.14)' : 'none',
                }}>
                <div className="absolute inset-2 rounded-full border border-white/[0.07]" />
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.35em] uppercase text-violet-300/60 mb-1">Perk Tree</div>
                  <div className="text-5xl font-light text-white tabular-nums leading-none">{masteryEntry.level}</div>
                  <div className="mt-1.5 text-[9px] tracking-[0.25em] uppercase text-white/40">Mastery Lv</div>
                </div>
              </div>
              <div className="w-full mt-6 px-1">
                <div className="flex justify-between text-[9px] text-white/45 mb-1.5">
                  <span>Mastery Progress</span>
                  <span>{masteryEntry.isMaxLevel ? 'Complete' : `${masteryEntry.killsIntoLevel} / ${masteryEntry.killsForNextLevel}`}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, xpPct)}%`, background: 'linear-gradient(90deg, #a78bfa, #c4b5fd)', boxShadow: '0 0 6px rgba(167,139,250,0.4)' }} />
                </div>
              </div>
              <div className="w-full mt-4 px-1">
                <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 mb-2">Perk Points</div>
                <div className="flex items-center justify-between px-2.5 py-2 rounded-sm"
                  style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)' }}>
                  <span className="text-[10px] text-white/45">Available</span>
                  <span className="text-xl font-bold text-violet-300 tabular-nums">{Math.floor(masteryEntry.level / 5)}</span>
                </div>
                <div className="text-[9px] text-white/30 mt-1.5 text-center">+1 point every 5 mastery levels</div>
              </div>
            </>
          )}
        </div>

        {/* VERTICAL DIVIDER */}
        <div
          className="w-px flex-shrink-0 self-stretch"
          style={{
            background: view === 'enchant'
              ? 'linear-gradient(180deg, transparent 0%, rgba(110,195,255,0.35) 12%, rgba(110,195,255,0.35) 88%, transparent 100%)'
              : view === 'rune'
                ? 'linear-gradient(180deg, transparent 0%, rgba(52,211,153,0.35) 12%, rgba(52,211,153,0.35) 88%, transparent 100%)'
                : view === 'upgrade'
                  ? 'linear-gradient(180deg, transparent 0%, rgba(251,146,60,0.35) 12%, rgba(251,146,60,0.35) 88%, transparent 100%)'
                  : view === 'perks'
                    ? 'linear-gradient(180deg, transparent 0%, rgba(167,139,250,0.35) 12%, rgba(167,139,250,0.35) 88%, transparent 100%)'
                    : 'linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.35) 12%, rgba(251,191,36,0.35) 88%, transparent 100%)',
          }}
        />

        {/* RIGHT PANEL — view-specific content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-2" style={{ scrollbarWidth: 'none' }}>
          {/* View toggle */}
          <div className="flex justify-center mb-4 flex-shrink-0">
            <div className="inline-flex rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              {[
                { id: 'enchant', label: 'Enchantment', color: '#6ec3ff' },
                { id: 'tree',    label: 'Mastery Art',  color: '#fbbf24' },
                { id: 'perks',   label: 'Perk Tree',    color: '#a78bfa' },
                { id: 'rune',    label: 'Rune',         color: '#34d399' },
                { id: 'upgrade', label: 'Upgrade',      color: '#fb923c' },
              ].map((opt, i, arr) => {
                const on = view === opt.id;
                return (
                  <button key={opt.id} onClick={() => setView(opt.id)}
                    className="px-4 py-1.5 text-[10px] tracking-[0.25em] uppercase transition-all"
                    style={{
                      background: on ? `${opt.color}18` : 'rgba(20,20,24,0.55)',
                      color: on ? opt.color : 'rgba(255,255,255,0.45)',
                      borderBottom: on ? `2px solid ${opt.color}` : '2px solid transparent',
                      borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.10)' : 'none',
                      fontWeight: on ? 600 : 400,
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {view === 'enchant' ? (
            <WeaponEnchantmentPanel weaponId={weaponId} weaponName={weapon?.name} weaponIcon={weapon?.icon} />
          ) : view === 'perks' ? (
            <PerkTreePanel weaponId={weaponId} weaponName={weapon?.name} weaponIcon={weapon?.icon} />
          ) : view === 'rune' ? (
            <WeaponRunePanel weaponId={weaponId} weaponName={weapon?.name} weaponIcon={weapon?.icon} masteryLevel={masteryEntry?.level ?? 1} />
          ) : view === 'upgrade' ? (
            <WeaponUpgradePanel weaponId={weaponId} weaponName={weapon?.name} weaponIcon={weapon?.icon} />
          ) : (
            <MasteryArtPanel
              masteryEntry={masteryEntry}
              weaponId={weaponId}
              weaponType={weaponType}
              weaponName={weapon?.name}
            />
          )}
        </div>

      </div>


    </div>
  );
}