// ─── WeaponMasteryTreePanel ───────────────────────────────────────────────
// New World "Sword and Shield" mastery tree — faithful UI recreation.
// Two branches side-by-side. Each branch is a 3-column grid of nodes.
// Center column = main spine (square ability tiles), outer columns = passive
// orbs. Thin cream connector lines run vertically between linked nodes.
// Pure UI — data still flows through weaponMasteryTreeData / TreeStore.

import React, { useEffect, useState, useMemo } from 'react';
import { Lock } from 'lucide-react';
import { getTreeForType } from './weaponMasteryTreeData';
import {
  subscribeMasteryTree,
  getNodeRank,
  getAvailablePoints,
  canAllocate,
  allocateNode,
  arePrerequisitesMet,
} from './weaponMasteryTreeStore';
import { WEAPON_TYPES } from './weaponMasteryConfig';

// Branch labels per weapon type
const BRANCHES = {
  [WEAPON_TYPES.SWORD]:    { left: 'Swordmaster', right: 'Defender' },
  [WEAPON_TYPES.GUARDIAN]: { left: 'Sentinel',    right: 'Bulwark'  },
  [WEAPON_TYPES.RANGED]:   { left: 'Marksman',    right: 'Hunter'   },
  [WEAPON_TYPES.FISTS]:    { left: 'Striker',     right: 'Brawler'  },
};

// Layout constants — tuned to the reference image
const NODE = 48;          // node diameter / square side
const COL_GAP = 22;       // horizontal gap between the 3 cols
const ROW_GAP = 22;       // vertical gap between rows
const COLS = 3;

// Connector color — cream/parchment like reference
const LINE = 'rgba(220, 200, 150, 0.55)';
const LINE_FAINT = 'rgba(220, 200, 150, 0.18)';

// Split tree nodes: col 0/1 → left branch, col 2/3 → right.
function splitBranches(nodes) {
  const left = nodes.filter((n) => n.col <= 1);
  const right = nodes.filter((n) => n.col >= 2);
  const norm = (list) => {
    if (!list.length) return [];
    const minCol = Math.min(...list.map((n) => n.col));
    return list.map((n) => ({ ...n, col: n.col - minCol }));
  };
  return { left: norm(left), right: norm(right) };
}

// ─── Node — square ability tile OR circular passive orb ───────────────────
function NodeButton({ node, weaponType, ability }) {
  const rank = getNodeRank(weaponType, node.id);
  const check = canAllocate(weaponType, node.id);
  const unlocked = rank > 0;
  const maxed = rank >= node.maxRank;
  const allocatable = check.ok;

  // Center column nodes (col === 1) are abilities = square framed tiles.
  const isSquare = ability;
  const glyph = (node.name || '?').trim().charAt(0);

  // Painted red filling for ability tiles when unlocked (like reference).
  const tileBg = isSquare
    ? unlocked
      ? 'radial-gradient(ellipse at 50% 35%, rgba(180,40,40,0.95) 0%, rgba(80,15,15,0.85) 60%, rgba(20,8,10,0.95) 100%)'
      : 'linear-gradient(180deg, rgba(35,28,28,0.85) 0%, rgba(18,14,14,0.95) 100%)'
    : unlocked
      ? 'radial-gradient(circle at 50% 35%, rgba(70,50,50,0.85) 0%, rgba(12,10,12,0.95) 75%)'
      : 'radial-gradient(circle at 50% 35%, rgba(40,35,38,0.7) 0%, rgba(10,8,10,0.95) 80%)';

  const tileBorder = isSquare
    ? unlocked
      ? '1.5px solid rgba(220,180,120,0.85)'
      : '1px solid rgba(170,150,120,0.30)'
    : unlocked
      ? '1px solid rgba(180,160,130,0.55)'
      : '1px solid rgba(150,140,120,0.18)';

  const tileShadow = isSquare && unlocked
    ? 'inset 0 0 14px rgba(0,0,0,0.55), 0 0 10px rgba(180,60,60,0.25), inset 0 1px 0 rgba(255,220,180,0.15)'
    : 'inset 0 0 8px rgba(0,0,0,0.7)';

  return (
    <div className="relative group" style={{ width: NODE, height: NODE }}>
      <button
        disabled={!allocatable}
        onClick={() => allocateNode(weaponType, node.id)}
        className="w-full h-full flex items-center justify-center transition-all"
        style={{
          background: tileBg,
          border: tileBorder,
          borderRadius: isSquare ? 2 : '50%',
          boxShadow: tileShadow,
          cursor: allocatable ? 'pointer' : 'default',
          opacity: !unlocked && !allocatable ? 0.7 : 1,
        }}
      >
        <span
          className="font-light"
          style={{
            fontSize: isSquare ? 18 : 14,
            color: unlocked ? (isSquare ? '#fff5e0' : 'rgba(240,225,200,0.85)') : 'rgba(190,180,165,0.45)',
            textShadow: isSquare && unlocked ? '0 0 6px rgba(255,180,140,0.6), 0 1px 1px rgba(0,0,0,0.7)' : 'none',
            letterSpacing: '0.05em',
          }}
        >
          {glyph}
        </span>

        {/* Square tile inner highlight to simulate painted-icon frame */}
        {isSquare && unlocked && (
          <span className="pointer-events-none absolute inset-[2px]" style={{
            border: '1px solid rgba(255,220,170,0.20)',
            borderRadius: 1,
          }} />
        )}
      </button>

      {/* Rank dot */}
      {node.maxRank > 1 && unlocked && (
        <div
          className="absolute -bottom-1 -right-1 px-1 rounded-sm text-[8px] tabular-nums font-semibold"
          style={{
            background: 'rgba(8,6,6,0.95)',
            border: '1px solid rgba(220,180,120,0.6)',
            color: maxed ? '#f5d27a' : '#f0e0c0',
            letterSpacing: '0.05em',
          }}
        >
          {rank}/{node.maxRank}
        </div>
      )}

      {/* Allocatable pulse */}
      {allocatable && !unlocked && (
        <div
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: '#f5d27a', boxShadow: '0 0 6px #f5d27a' }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-3 py-2 text-[10px]"
        style={{
          background: 'rgba(8,6,6,0.96)',
          border: '1px solid rgba(220,180,120,0.4)',
          color: '#f5e6c8',
          borderRadius: 1,
        }}
      >
        <div className="font-semibold tracking-[0.2em] uppercase">{node.name}</div>
        <div className="text-white/50 text-[9px] mt-0.5 tracking-wider">
          Lv {node.unlockLevel} · {rank}/{node.maxRank}
        </div>
      </div>
    </div>
  );
}

// ─── Single branch column ────────────────────────────────────────────────
function BranchColumn({ title, nodes, weaponType }) {
  const rowCount = useMemo(
    () => (nodes.length ? Math.max(...nodes.map((n) => n.row)) + 1 : 0),
    [nodes],
  );

  const width = COLS * NODE + (COLS - 1) * COL_GAP;
  const height = rowCount * NODE + (rowCount - 1) * ROW_GAP;

  return (
    <div className="flex flex-col items-center">
      {/* Branch title */}
      <div
        className="text-[11px] mb-6 select-none"
        style={{
          color: 'rgba(230,215,185,0.85)',
          letterSpacing: '0.55em',
          textTransform: 'uppercase',
          fontWeight: 300,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {title}
      </div>

      {/* Tree grid */}
      <div className="relative" style={{ width, height }}>
        {/* Connector lines (vertical, between prereq → node, center-to-center) */}
        <svg className="absolute inset-0 pointer-events-none overflow-visible" width={width} height={height}>
          <defs>
            <marker id={`arrow-${title}`} viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={LINE} />
            </marker>
          </defs>
          {nodes.map((n) =>
            (n.prereq || []).map((pid) => {
              const p = nodes.find((m) => m.id === pid);
              if (!p) return null;
              const x1 = p.col * (NODE + COL_GAP) + NODE / 2;
              const y1 = p.row * (NODE + ROW_GAP) + NODE;
              const x2 = n.col * (NODE + COL_GAP) + NODE / 2;
              const y2 = n.row * (NODE + ROW_GAP);
              const met = arePrerequisitesMet(weaponType, n.id);
              const stroke = met ? LINE : LINE_FAINT;
              const isStraight = x1 === x2;
              if (isStraight) {
                return (
                  <line
                    key={`${pid}-${n.id}`}
                    x1={x1} y1={y1} x2={x2} y2={y2 - 4}
                    stroke={stroke}
                    strokeWidth={1}
                    markerEnd={met ? `url(#arrow-${title})` : undefined}
                  />
                );
              }
              // Stepped path for diagonal connections (horizontal then vertical)
              const midY = (y1 + y2) / 2;
              return (
                <polyline
                  key={`${pid}-${n.id}`}
                  points={`${x1},${y1} ${x1},${midY} ${x2},${midY} ${x2},${y2 - 4}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={1}
                  markerEnd={met ? `url(#arrow-${title})` : undefined}
                />
              );
            })
          )}
        </svg>

        {/* Nodes — center column is ability (square), others are passive (orb) */}
        {nodes.map((n) => (
          <div
            key={n.id}
            className="absolute"
            style={{
              left: n.col * (NODE + COL_GAP),
              top: n.row * (NODE + ROW_GAP),
            }}
          >
            <NodeButton
              node={n}
              weaponType={weaponType}
              ability={n.col === 1}
            />
          </div>
        ))}
      </div>

      {/* Locked tier gate at bottom (decorative — like reference) */}
      <div className="mt-8 flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center relative"
          style={{
            background: 'radial-gradient(circle, rgba(35,28,25,0.85) 0%, rgba(8,6,6,0.95) 80%)',
            border: '1px dashed rgba(180,160,130,0.35)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.7)',
          }}
        >
          <Lock className="w-4 h-4" style={{ color: 'rgba(200,185,155,0.6)' }} />
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
  const availPoints = getAvailablePoints(weaponType);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Parchment / misty backdrop card */}
      <div
        className="relative px-12 py-8"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(28,32,42,0.65) 0%, rgba(10,12,18,0.85) 70%), ' +
            'linear-gradient(180deg, rgba(20,22,30,0.4) 0%, rgba(6,8,12,0.6) 100%)',
          border: '1px solid rgba(180,170,150,0.10)',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,240,210,0.04)',
          minWidth: 640,
        }}
      >
        {/* Inner ornate frame — thin double border for parchment feel */}
        <div
          className="absolute inset-2 pointer-events-none"
          style={{ border: '1px solid rgba(180,160,130,0.06)' }}
        />

        {/* Two branches */}
        <div className="flex items-start gap-16 relative">
          {/* Faint vertical divider between branches */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: 1,
              background: 'linear-gradient(180deg, transparent 0%, rgba(180,160,130,0.15) 30%, rgba(180,160,130,0.15) 70%, transparent 100%)',
            }}
          />

          <BranchColumn title={labels.left} nodes={branches.left} weaponType={weaponType} />
          <BranchColumn title={labels.right} nodes={branches.right} weaponType={weaponType} />
        </div>
      </div>

      {/* ASSIGN bar — etched/hatched look like reference */}
      <div
        className="mt-6 relative select-none cursor-default"
        style={{
          width: 560,
          padding: '14px 0',
          textAlign: 'center',
          background:
            'repeating-linear-gradient(135deg, rgba(60,55,45,0.5) 0px, rgba(60,55,45,0.5) 2px, rgba(30,28,24,0.5) 2px, rgba(30,28,24,0.5) 4px)',
          border: '1px solid rgba(180,160,130,0.35)',
          boxShadow: 'inset 0 0 18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(220,200,160,0.10)',
        }}
      >
        <span
          style={{
            color: availPoints > 0 ? 'rgba(245,225,185,0.95)' : 'rgba(200,185,155,0.45)',
            fontSize: 11,
            letterSpacing: '0.7em',
            textTransform: 'uppercase',
            fontWeight: 300,
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          }}
        >
          Assign
        </span>
      </div>
    </div>
  );
}