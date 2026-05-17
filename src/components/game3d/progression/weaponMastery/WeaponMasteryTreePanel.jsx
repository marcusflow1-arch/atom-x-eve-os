// ─── WeaponMasteryTreePanel ───────────────────────────────────────────────
// New World–style mastery tree UI. Two named branch columns rendered side
// by side, with mixed square (ability) and circular (passive) nodes, faint
// vertical connectors, locked tier-gate at the bottom, and an "Assign"
// footer button.
//
// Pure UI — all data flows through weaponMasteryTreeData / TreeStore.

import React, { useEffect, useState, useMemo } from 'react';
import { Lock, RotateCcw } from 'lucide-react';
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
import { WEAPON_TYPES } from './weaponMasteryConfig';

// ─── Branch split — left/right column names per weapon type ───────────────
const BRANCHES = {
  [WEAPON_TYPES.SWORD]:    { left: 'Swordmaster', right: 'Defender' },
  [WEAPON_TYPES.GUARDIAN]: { left: 'Sentinel',    right: 'Bulwark'  },
  [WEAPON_TYPES.RANGED]:  { left: 'Marksman',    right: 'Hunter'   },
  [WEAPON_TYPES.FISTS]:   { left: 'Striker',     right: 'Brawler'  },
};

// Split tree nodes into two visual columns based on grid col.
// col 0/1 → left branch, col 2/3 → right branch.
function splitBranches(nodes) {
  const left = nodes.filter((n) => n.col <= 1);
  const right = nodes.filter((n) => n.col >= 2);
  // Normalize cols inside each branch to 0..2 for layout.
  const reCol = (list) => {
    const minCol = Math.min(...list.map((n) => n.col));
    return list.map((n) => ({ ...n, col: n.col - minCol }));
  };
  return { left: reCol(left), right: reCol(right) };
}

// ─── Layout constants ─────────────────────────────────────────────────────
const NODE_SIZE = 52;
const COL_GAP = 16;
const ROW_GAP = 18;
const BRANCH_COLS = 3;

// ─── Single Node — square (ability) or circular (passive) ─────────────────
function NodeButton({ node, weaponType, accent }) {
  const rank = getNodeRank(weaponType, node.id);
  const check = canAllocate(weaponType, node.id);
  const unlocked = rank > 0;
  const maxed = rank >= node.maxRank;
  const allocatable = check.ok;

  // First node of a branch (row 0) rendered as a square "ability" tile.
  const isSquare = node.row === 0 || node.row === 3;

  const baseStyle = {
    width: NODE_SIZE,
    height: NODE_SIZE,
    background: unlocked
      ? `radial-gradient(circle at 50% 40%, ${accent}55 0%, rgba(8,12,20,0.9) 75%)`
      : 'radial-gradient(circle at 50% 40%, rgba(40,52,70,0.55) 0%, rgba(6,10,16,0.95) 80%)',
    border: maxed
      ? `1.5px solid ${accent}`
      : unlocked
        ? `1px solid ${accent}aa`
        : allocatable
          ? '1px solid rgba(220,235,255,0.35)'
          : '1px solid rgba(255,255,255,0.10)',
    boxShadow: maxed
      ? `0 0 14px ${accent}66, inset 0 0 10px ${accent}33`
      : unlocked
        ? `0 0 10px ${accent}44, inset 0 0 8px rgba(0,0,0,0.55)`
        : 'inset 0 0 8px rgba(0,0,0,0.7)',
    borderRadius: isSquare ? 4 : '50%',
    cursor: allocatable ? 'pointer' : 'not-allowed',
    opacity: !unlocked && !allocatable ? 0.55 : 1,
  };

  // Tiny glyph derived from the first letter of node name.
  const glyph = (node.name || '?').trim().charAt(0);

  return (
    <div className="relative group" style={{ width: NODE_SIZE, height: NODE_SIZE }}>
      <button
        disabled={!allocatable}
        onClick={() => allocateNode(weaponType, node.id)}
        className="flex items-center justify-center transition-all"
        style={baseStyle}
      >
        <span
          className="text-[15px] font-light tracking-wider"
          style={{
            color: unlocked ? '#fff' : 'rgba(220,230,245,0.55)',
            textShadow: unlocked ? `0 0 6px ${accent}` : 'none',
          }}
        >
          {glyph}
        </span>
      </button>

      {/* Rank dot indicator (bottom-right) */}
      {node.maxRank > 1 && unlocked && (
        <div
          className="absolute -bottom-1 -right-1 px-1.5 rounded-full text-[9px] tabular-nums font-semibold"
          style={{
            background: 'rgba(6,10,16,0.95)',
            border: `1px solid ${accent}`,
            color: maxed ? '#fbbf24' : '#fff',
          }}
        >
          {rank}/{node.maxRank}
        </div>
      )}

      {/* Allocate pulse */}
      {allocatable && !unlocked && (
        <div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-3 py-2 text-[10px]"
        style={{
          background: 'rgba(6,10,16,0.96)',
          border: `1px solid ${accent}66`,
          color: '#fff',
          borderRadius: 2,
        }}
      >
        <div className="font-semibold tracking-[0.2em] uppercase">{node.name}</div>
        <div className="text-white/55 text-[9px] mt-0.5 tracking-wider">
          Lv {node.unlockLevel} · Cost {node.cost} · {rank}/{node.maxRank}
        </div>
        {!check.ok && rank < node.maxRank && (
          <div className="mt-1 text-red-300/80 text-[9px] tracking-wider uppercase">
            {check.reason === 'level_locked' && `Requires Lv ${node.unlockLevel}`}
            {check.reason === 'prereq' && 'Prerequisite not maxed'}
            {check.reason === 'no_points' && 'Not enough points'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── One branch column (left or right) ────────────────────────────────────
function BranchColumn({ title, nodes, weaponType, accent, locked }) {
  const rowCount = useMemo(
    () => (nodes.length ? Math.max(...nodes.map((n) => n.row)) + 1 : 0),
    [nodes],
  );

  const width = BRANCH_COLS * NODE_SIZE + (BRANCH_COLS - 1) * COL_GAP;
  const height = rowCount * NODE_SIZE + (rowCount - 1) * ROW_GAP;

  // Center each row’s nodes within the column.
  const nodesByRow = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      if (!map[n.row]) map[n.row] = [];
      map[n.row].push(n);
    });
    return map;
  }, [nodes]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="text-[10px] tracking-[0.5em] uppercase mb-5"
        style={{ color: 'rgba(220,230,245,0.65)' }}
      >
        {title}
      </div>

      <div
        className="relative"
        style={{
          width,
          height,
          background: 'radial-gradient(ellipse at center, rgba(20,28,42,0.55) 0%, rgba(6,10,16,0.25) 75%)',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: 0,
        }}
      >
        {/* Connector lines between prereqs */}
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
          {nodes.map((n) =>
            (n.prereq || []).map((pid) => {
              const p = nodes.find((m) => m.id === pid);
              if (!p) return null;
              const x1 = p.col * (NODE_SIZE + COL_GAP) + NODE_SIZE / 2;
              const y1 = p.row * (NODE_SIZE + ROW_GAP) + NODE_SIZE - 2;
              const x2 = n.col * (NODE_SIZE + COL_GAP) + NODE_SIZE / 2;
              const y2 = n.row * (NODE_SIZE + ROW_GAP) + 2;
              const met = arePrerequisitesMet(weaponType, n.id);
              return (
                <line
                  key={`${pid}-${n.id}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={met ? `${accent}66` : 'rgba(255,255,255,0.10)'}
                  strokeWidth={met ? 1.5 : 1}
                />
              );
            })
          )}
        </svg>

        {/* Nodes positioned by row/col */}
        {Object.keys(nodesByRow).map((rowKey) => {
          const row = Number(rowKey);
          const rowNodes = nodesByRow[row];
          return rowNodes.map((n) => (
            <div
              key={n.id}
              className="absolute"
              style={{
                left: n.col * (NODE_SIZE + COL_GAP),
                top: row * (NODE_SIZE + ROW_GAP),
              }}
            >
              <NodeButton node={n} weaponType={weaponType} accent={accent} />
            </div>
          ));
        })}
      </div>

      {/* Locked tier gate at bottom of column (decorative — matches reference) */}
      <div className="mt-6 flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(40,52,70,0.6) 0%, rgba(6,10,16,0.9) 80%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.7)',
          }}
        >
          <Lock className="w-4 h-4" style={{ color: 'rgba(220,230,245,0.5)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────
export default function WeaponMasteryTreePanel({ weaponType }) {
  const [, force] = useState(0);
  useEffect(() => subscribeMasteryTree(() => force((x) => x + 1)), []);

  const tree = getTreeForType(weaponType);
  const branches = useMemo(
    () => (tree ? splitBranches(tree.nodes) : { left: [], right: [] }),
    [tree],
  );

  if (!tree) {
    return <div className="text-white/50 text-sm p-6">No tree for this weapon type.</div>;
  }

  const labels = BRANCHES[weaponType] || { left: 'Path A', right: 'Path B' };
  const accent = tree.color || '#c98a8a';
  const availPoints = getAvailablePoints(weaponType);
  const totalPoints = getTotalPoints(weaponType);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header strip — points / reset */}
      <div className="w-full max-w-[640px] flex items-center justify-between mb-6 px-2">
        <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: 'rgba(220,230,245,0.55)' }}>
          Mastery Tree
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs tabular-nums">
            <span className="text-amber-300 font-semibold">{availPoints}</span>
            <span className="text-white/40"> / {totalPoints}</span>
            <span className="text-white/40 ml-1 text-[10px] tracking-widest uppercase">pts</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Refund all ${tree.name} points?`)) resetTree(weaponType);
            }}
            className="flex items-center gap-1.5 text-[9px] tracking-[0.25em] uppercase text-white/55 hover:text-white px-2.5 py-1"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <RotateCcw className="w-3 h-3" /> Respec
          </button>
        </div>
      </div>

      {/* Two-branch grid */}
      <div className="flex items-start gap-14">
        <BranchColumn
          title={labels.left}
          nodes={branches.left}
          weaponType={weaponType}
          accent={accent}
        />
        <BranchColumn
          title={labels.right}
          nodes={branches.right}
          weaponType={weaponType}
          accent={'#8a9bc9'}
        />
      </div>

      {/* Assign footer bar — matches reference */}
      <div
        className="mt-8 w-full max-w-[560px] py-3 text-center text-[11px] tracking-[0.6em] uppercase select-none"
        style={{
          background: 'linear-gradient(180deg, rgba(20,28,42,0.85) 0%, rgba(8,12,20,0.85) 100%)',
          border: '1px solid rgba(180,200,230,0.20)',
          color: availPoints > 0 ? '#dbeafe' : 'rgba(220,230,245,0.35)',
          boxShadow: availPoints > 0
            ? 'inset 0 0 14px rgba(120,160,210,0.20), 0 0 12px rgba(120,160,210,0.15)'
            : 'inset 0 0 10px rgba(0,0,0,0.5)',
        }}
      >
        {availPoints > 0 ? `Assign · ${availPoints} Point${availPoints === 1 ? '' : 's'}` : 'Assign'}
      </div>
    </div>
  );
}