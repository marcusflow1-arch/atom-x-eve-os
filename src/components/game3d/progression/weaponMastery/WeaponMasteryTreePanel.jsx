// ─── WeaponMasteryTreePanel ───────────────────────────────────────────────
// Interactive node-tree UI for a single weapon TYPE. Renders the tree
// from weaponMasteryTreeData, shows current rank/maxRank, locks vs.
// allocatable state, and dispatches allocations through the store.

import React, { useEffect, useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { getTreeForType } from './weaponMasteryTreeData';
import {
  subscribeMasteryTree,
  getNodeRank,
  getTotalPoints,
  getAvailablePoints,
  canAllocate,
  allocateNode,
  resetTree,
  arePrerequisitesMet,
} from './weaponMasteryTreeStore';

const CELL = 72;
const GAP = 26;
const COLS = 3;

// Friendly label for a mod key → shown in node tooltip.
const MOD_LABELS = {
  damageMultPct: '% Damage',
  critChancePct: '% Crit Chance',
  critDamagePct: '% Crit Damage',
  hitChancePct:  '% Hit Chance',
  attackSpeedPct: '% Attack Speed',
  armorPenPct:   '% Armor Pen',
  defenseBonusPct: '% Defense',
  reflectChancePct: '% Reflect Chance',
  reflectDmgPct: '% Reflect Damage',
  blockReductionPct: '% Block Reduction',
  maxHPBonusPct: '% Max HP',
  bossDmgTakenPct: '% Boss Damage Taken',
  rangedDmgPct: '% Ranged Damage',
  multiHitAmpPct: '% Multi-hit Damage',
  rangedCritFar: '% Crit at Range',
  comboBonusPct: '% Combo Bonus',
  singleTargetDmgPct: '% Single-target Damage',
  executeThresholdAddPct: '% Execute Threshold',
  critHealPct: '% HP on Crit',
  pierceTargets: 'Extra Pierce Target',
  reviveOnce: 'Revive Once Per Fight',
};

function describeMod(mod) {
  return Object.keys(mod).map((k) => {
    const v = mod[k];
    const label = MOD_LABELS[k] || k;
    if (typeof v === 'boolean') return label;
    return `+${v}${label.startsWith('%') ? label : ` ${label}`}`;
  });
}

export default function WeaponMasteryTreePanel({ weaponType }) {
  const [, force] = useState(0);
  useEffect(() => subscribeMasteryTree(() => force((x) => x + 1)), []);

  const tree = getTreeForType(weaponType);

  const rowCount = useMemo(
    () => (tree ? Math.max(...tree.nodes.map((n) => n.row)) + 1 : 0),
    [tree],
  );

  if (!tree) {
    return <div className="text-white/50 text-sm p-6">No tree for this weapon type.</div>;
  }

  const totalPoints = getTotalPoints(weaponType);
  const availPoints = getAvailablePoints(weaponType);
  const height = rowCount * (CELL + GAP);
  const width  = COLS * CELL + (COLS - 1) * GAP;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header bar — points / type / reset */}
      <div className="w-full flex items-center justify-between mb-5 px-2">
        <div className="text-[10px] tracking-[0.35em] uppercase text-white/55">
          {tree.name}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-white/80">
            <span className="text-amber-300 font-semibold tabular-nums">{availPoints}</span>
            <span className="text-white/40"> / {totalPoints} pts</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Refund all ${tree.name} points?`)) resetTree(weaponType);
            }}
            className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white px-2 py-1 rounded-sm border border-white/15"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Tree grid */}
      <div className="relative" style={{ width, height }}>
        {/* Connector lines */}
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
          {tree.nodes.map((n) =>
            (n.prereq || []).map((pid) => {
              const p = tree.nodes.find((m) => m.id === pid);
              if (!p) return null;
              const x1 = p.col * (CELL + GAP) + CELL / 2;
              const y1 = p.row * (CELL + GAP) + CELL - 4;
              const x2 = n.col * (CELL + GAP) + CELL / 2;
              const y2 = n.row * (CELL + GAP) + 4;
              const prereqMet = arePrerequisitesMet(weaponType, n.id);
              return (
                <line
                  key={`${pid}-${n.id}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={prereqMet ? tree.color : 'rgba(255,255,255,0.12)'}
                  strokeWidth={prereqMet ? 1.5 : 1}
                  strokeDasharray={prereqMet ? '0' : '4 3'}
                />
              );
            })
          )}
        </svg>

        {/* Nodes */}
        {tree.nodes.map((n) => {
          const rank = getNodeRank(weaponType, n.id);
          const check = canAllocate(weaponType, n.id);
          const unlocked = rank > 0;
          const maxed = rank >= n.maxRank;
          const allocatable = check.ok;
          const x = n.col * (CELL + GAP);
          const y = n.row * (CELL + GAP);

          return (
            <div
              key={n.id}
              className="absolute group"
              style={{ left: x, top: y, width: CELL, height: CELL }}
            >
              <button
                disabled={!allocatable}
                onClick={() => allocateNode(weaponType, n.id)}
                className="w-full h-full rounded-full flex items-center justify-center transition-all relative"
                style={{
                  background: unlocked
                    ? `radial-gradient(circle, ${tree.color}40 0%, rgba(0,0,0,0.55) 70%)`
                    : 'rgba(0,0,0,0.55)',
                  border: `1.5px solid ${maxed ? '#fbbf24' : unlocked ? tree.color : allocatable ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: maxed
                    ? '0 0 16px #fbbf2466, inset 0 0 10px #fbbf2433'
                    : unlocked
                      ? `0 0 12px ${tree.color}55, inset 0 0 8px ${tree.color}33`
                      : allocatable
                        ? '0 0 10px rgba(255,255,255,0.15)'
                        : 'inset 0 0 6px rgba(0,0,0,0.6)',
                  opacity: !unlocked && !allocatable ? 0.45 : 1,
                  cursor: allocatable ? 'pointer' : 'not-allowed',
                }}
              >
                <div className="text-center leading-tight">
                  <div className="text-[10px] tracking-wider text-white/90 font-semibold px-1">
                    {n.name}
                  </div>
                  <div className="text-[10px] mt-0.5 text-white/70 tabular-nums">
                    {rank}/{n.maxRank}
                  </div>
                </div>
                {allocatable && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-300 animate-pulse" />
                )}
              </button>

              {/* Tooltip */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-3 py-2 rounded-sm text-[10px]"
                style={{
                  background: 'rgba(8,12,18,0.95)',
                  border: `1px solid ${tree.color}55`,
                  color: '#fff',
                }}
              >
                <div className="font-semibold tracking-[0.15em] uppercase">{n.name}</div>
                <div className="text-white/60 text-[9px] mt-0.5">
                  Lv {n.unlockLevel} · Cost {n.cost} · Rank {rank}/{n.maxRank}
                </div>
                <div className="mt-1 space-y-0.5 text-emerald-300">
                  {describeMod(n.mod).map((d, i) => <div key={i}>{d}</div>)}
                </div>
                {!check.ok && (
                  <div className="mt-1 text-red-300/80 text-[9px] tracking-wide uppercase">
                    {check.reason === 'level_locked' && `Requires Lv ${n.unlockLevel}`}
                    {check.reason === 'prereq' && 'Prerequisite not maxed'}
                    {check.reason === 'no_points' && 'Not enough points'}
                    {check.reason === 'max_rank' && 'Maxed'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}