import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Zap, Plus, Star, Shield, Target, Crosshair } from 'lucide-react';
import { RARITIES, SKILLS_DATABASE } from './skillData';
import {
  getSkillUpgradeState,
  subscribeSkillUpgrades,
  getSkillData,
  upgradeSkillLevel,
  assignSkillToSlot,
  unassignSkillSlot,
  upgradeCost,
  MAX_SKILL_LEVEL,
  MAX_ADAPT_RANK,
  ADAPT_XP_PER_RANK,
  SKILL_PATH_BONUSES,
  computeEffectiveStats,
} from './skillUpgradeStore';

const SLOT_COUNT = 8;

function getRarityStyle(rarityId) {
  const r = RARITIES.find(r => r.id === rarityId);
  return { color: r?.color || '#9ca3af', label: r?.label || rarityId, glow: r?.glow || 'transparent' };
}

function StatRow({ icon, label, base, bonus, color }) {
  return (
    <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
      <div className="flex items-center gap-1.5 text-white/50">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white/30">{typeof base === 'number' ? (base * 100).toFixed(0) + '%' : base}</span>
        {bonus > 0 && (
          <span className="font-bold" style={{ color }}>
            +{typeof bonus === 'number' && bonus < 5 ? (bonus * 100).toFixed(0) + '%' : bonus.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

function AdaptBar({ rank, xp, maxRank, needed }) {
  const pct = rank >= maxRank ? 100 : Math.min(100, (xp / needed) * 100);
  const color = ['#9ca3af', '#60a5fa', '#a78bfa', '#f59e0b', '#f43f5e', '#e879f9'][rank] || '#9ca3af';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-white/40 uppercase tracking-widest">Adaptation</span>
        <span className="text-[9px] font-bold" style={{ color }}>Rank {rank}/{maxRank}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {rank < maxRank && (
        <div className="text-[8px] text-white/30 mt-0.5 text-right">{xp}/{needed} XP to next rank</div>
      )}
      {rank >= maxRank && (
        <div className="text-[8px] text-emerald-400 mt-0.5 text-right">✓ Max Adaptation</div>
      )}
    </div>
  );
}

export default function SkillUpgradePanel({ skill, onClose }) {
  const [state, setState] = useState(getSkillUpgradeState());
  useEffect(() => subscribeSkillUpgrades(setState), []);

  const skillEntry = getSkillData(skill.id);
  const { level, adaptXP, adaptRank, slotIndex } = state.skillData[skill.id] || { level: 1, adaptXP: 0, adaptRank: 0, slotIndex: null };
  const { upgradePoints } = state;

  const cost = upgradeCost(level);
  const canUpgrade = level < MAX_SKILL_LEVEL && upgradePoints >= cost;
  const { color, label } = getRarityStyle(skill.rarity);
  const path = skill.path || 'damage';
  const bonuses = SKILL_PATH_BONUSES[path] || SKILL_PATH_BONUSES.damage;
  const effectiveStats = computeEffectiveStats(skill, level, adaptRank);
  const needed = ADAPT_XP_PER_RANK[adaptRank] || 9999;

  // All learned skills for slot assignment context
  const [slotMap, setSlotMap] = useState({});
  useEffect(() => {
    const map = {};
    for (const [id, d] of Object.entries(state.skillData)) {
      if (d.slotIndex != null) map[d.slotIndex] = id;
    }
    setSlotMap(map);
  }, [state.skillData]);

  const handleAssignSlot = (idx) => {
    if (slotIndex === idx) {
      unassignSkillSlot(skill.id);
    } else {
      assignSkillToSlot(skill.id, idx);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="fixed z-[80] flex flex-col"
      style={{
        right: 30,
        top: 90,
        width: 340,
        maxHeight: 'calc(100vh - 140px)',
        background: 'rgba(10,13,18,0.97)',
        backdropFilter: 'blur(28px) saturate(150%)',
        WebkitBackdropFilter: 'blur(28px) saturate(150%)',
        border: `1px solid ${color}40`,
        borderRadius: 18,
        boxShadow: `0 0 40px ${color}20, 0 20px 60px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}18, transparent)`, borderBottom: `1px solid ${color}20` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border flex-shrink-0"
          style={{ background: `${color}20`, borderColor: `${color}50`, boxShadow: `0 0 18px ${color}30` }}
        >
          {skill.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">{skill.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest border" style={{ color, borderColor: `${color}50`, background: `${color}15` }}>
              {label?.toUpperCase()}
            </span>
            <span className="text-[9px] text-white/30 capitalize">{path} path</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 flex-shrink-0"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {/* ── Level & Upgrade ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Skill Level
            </span>
            <span className="text-white/30 text-[9px]">{upgradePoints} pts available</span>
          </div>

          {/* Level bar */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: MAX_SKILL_LEVEL }).map((_, i) => (
              <div
                key={i}
                className="h-3 flex-1 rounded-sm transition-all"
                style={{
                  background: i < level
                    ? `linear-gradient(90deg, ${color}cc, ${color})`
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: i < level ? `0 0 6px ${color}60` : 'none',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-black text-xl" style={{ color }}>Lv.{level}</span>
              <span className="text-white/30 text-xs ml-1">/ {MAX_SKILL_LEVEL}</span>
            </div>
            <button
              onClick={() => upgradeSkillLevel(skill.id)}
              disabled={!canUpgrade}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: canUpgrade ? `linear-gradient(135deg, ${color}cc, ${color}80)` : 'rgba(255,255,255,0.06)',
                color: canUpgrade ? '#0a0f1e' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${color}40`,
              }}
            >
              <Plus className="w-3 h-3" />
              Level Up ({cost} pt{cost > 1 ? 's' : ''})
            </button>
          </div>
        </div>

        {/* ── Effective Stats ───────────────────────────────────────────────── */}
        <div>
          <div className="text-[9px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Star className="w-3 h-3" /> Stats at Lv.{level} · Rank {adaptRank}
          </div>
          <div className="rounded-lg border p-3 space-y-0.5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            {bonuses.per_level.map((b) => {
              const baseVal = (skill[b.stat] || 0);
              const bonus = b.value * (level - 1);
              return (
                <StatRow key={b.stat} icon={b.icon} label={b.label} base={baseVal} bonus={bonus} color={color} />
              );
            })}
            {bonuses.per_adapt.map((b) => {
              const bonus = b.value * adaptRank;
              return bonus > 0 ? (
                <StatRow key={b.stat + '_adapt'} icon={b.icon} label={b.label + ' (Adapt)'} base={0} bonus={bonus} color='#a78bfa' />
              ) : null;
            })}
            {/* Shield on hit note for defense */}
            {path === 'defense' && level > 1 && (
              <div className="text-[9px] text-blue-300/70 pt-1 leading-relaxed">
                🛡️ Each skill hit generates <span className="font-bold text-blue-300">{(2 + (level - 1) * 2).toFixed(0)}% max HP</span> as temporary shield.
              </div>
            )}
            {/* Crit note for ranged */}
            {path === 'ranged' && level > 1 && (
              <div className="text-[9px] text-yellow-300/70 pt-1 leading-relaxed">
                💫 Crit strike chance boosted by <span className="font-bold text-yellow-300">+{((level - 1) * 4).toFixed(0)}%</span> per enemy hit.
              </div>
            )}
          </div>
        </div>

        {/* ── Adaptation ───────────────────────────────────────────────────── */}
        <div>
          <div className="text-[9px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Adaptation (earned by using the skill)
          </div>
          <div className="rounded-lg border p-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <AdaptBar rank={adaptRank} xp={adaptXP} maxRank={MAX_ADAPT_RANK} needed={needed} />
            <div className="mt-3 space-y-1">
              {bonuses.per_adapt.map(b => (
                <div key={b.stat} className="flex items-center justify-between text-[9px]">
                  <span className="text-white/40">{b.icon} {b.label} per rank</span>
                  <span className="text-purple-300 font-bold">+{(b.value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Slot Assignment ───────────────────────────────────────────────── */}
        <div>
          <div className="text-[9px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> Assign to Skill Slot
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: SLOT_COUNT }).map((_, idx) => {
              const isAssigned = slotIndex === idx;
              const occupiedBy = slotMap[idx];
              const isOccupied = occupiedBy && occupiedBy !== skill.id;
              const occupiedSkill = isOccupied ? SKILLS_DATABASE.find(s => s.id === occupiedBy) : null;
              return (
                <button
                  key={idx}
                  onClick={() => handleAssignSlot(idx)}
                  title={isOccupied ? `Occupied by ${occupiedSkill?.name || occupiedBy}` : `Slot ${idx + 1}`}
                  className="relative aspect-square rounded-md flex flex-col items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: isAssigned
                      ? `${color}30`
                      : isOccupied
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.04)',
                    border: isAssigned
                      ? `2px solid ${color}80`
                      : isOccupied
                      ? '1px solid rgba(255,255,255,0.15)'
                      : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isAssigned ? `0 0 10px ${color}40` : 'none',
                  }}
                >
                  <span className="text-[8px] text-white/30">{idx + 1}</span>
                  {isAssigned && <span className="text-sm leading-none">{skill.icon}</span>}
                  {isOccupied && <span className="text-sm leading-none">{occupiedSkill?.icon || '?'}</span>}
                </button>
              );
            })}
          </div>
          {slotIndex != null && (
            <div className="mt-2 text-[9px] text-emerald-400 text-center">
              ✓ Assigned to slot {slotIndex + 1}
            </div>
          )}
          <div className="mt-1.5 text-[9px] text-white/20 text-center">
            Tap a slot to assign or remove this skill
          </div>
        </div>

        {/* ── Description ──────────────────────────────────────────────────── */}
        {skill.description && (
          <div className="rounded-lg border p-3" style={{ background: `${color}08`, borderColor: `${color}20` }}>
            <p className="text-white/40 text-[10px] leading-relaxed italic">"{skill.description}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}