import React from 'react';

// ─── Weapon Skill Tree ────────────────────────────────────────────────────
// Renders one branch (Berserker / Throwing style) as a vertical grid of
// circular skill nodes with downward arrow connectors — mirroring the
// classic MMO weapon-mastery aesthetic from the reference image.
//
// Layout: 3-column grid, top → bottom. Each `node` in `branch.abilities`
// can specify { col: 0|1|2, row: number } to place it precisely. If not
// specified, we auto-place based on order.
//
// The arrow connectors are drawn as a separate SVG overlay so they sit
// behind the nodes and follow the column/row positions cleanly.

const COLS = 3;
const CELL = 64;   // px — width/height of each grid cell
const GAP = 18;    // px — vertical gap between rows

// Place nodes deterministically. Caller can override per-ability via
// `col`/`row`, otherwise we lay them out in a serpent down the grid.
function placeNodes(abilities) {
  return abilities.map((a, i) => {
    const col = a.col ?? (i % COLS);
    const row = a.row ?? Math.floor(i / COLS);
    return { ...a, col, row };
  });
}

export default function WeaponSkillTree({ branch, weaponLevel }) {
  const nodes = placeNodes(branch.abilities);
  const rowCount = Math.max(...nodes.map((n) => n.row)) + 1;
  const height = rowCount * (CELL + GAP);
  const width = COLS * CELL + (COLS - 1) * (GAP - 4);

  return (
    <div className="flex flex-col items-center">
      {/* Branch title with subtle engraved feel */}
      <div
        className="text-[11px] tracking-[0.45em] uppercase font-semibold mb-5"
        style={{ color: branch.color, textShadow: `0 0 8px ${branch.color}55` }}
      >
        {branch.name}
      </div>

      {/* Tree body */}
      <div className="relative" style={{ width, height }}>
        {/* Arrow connectors layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
        >
          <defs>
            <marker
              id={`arr-${branch.id}`}
              viewBox="0 0 10 10"
              refX="5" refY="9"
              markerWidth="6" markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,0 L5,9 z" fill="rgba(255,255,255,0.35)" />
            </marker>
          </defs>
          {nodes.map((n) => {
            // Draw a downward arrow from this node to the node directly below
            // in the same column (if present).
            const below = nodes.find((m) => m.col === n.col && m.row === n.row + 1);
            if (!below) return null;
            const x1 = n.col * (CELL + GAP - 4) + CELL / 2;
            const y1 = n.row * (CELL + GAP) + CELL - 4;
            const x2 = x1;
            const y2 = below.row * (CELL + GAP) + 6;
            return (
              <line
                key={n.id + '-arrow'}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
                markerEnd={`url(#arr-${branch.id})`}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((n) => {
          const unlocked = weaponLevel >= n.unlockLevel;
          const x = n.col * (CELL + GAP - 4);
          const y = n.row * (CELL + GAP);
          return (
            <div
              key={n.id}
              className="absolute group"
              style={{ left: x, top: y, width: CELL, height: CELL }}
            >
              {/* Outer ring */}
              <div
                className="w-full h-full rounded-full flex items-center justify-center transition-all"
                style={{
                  background: unlocked
                    ? `radial-gradient(circle, ${branch.color}30 0%, rgba(0,0,0,0.55) 70%)`
                    : 'rgba(0,0,0,0.55)',
                  border: `1.5px solid ${unlocked ? branch.color + 'cc' : 'rgba(255,255,255,0.18)'}`,
                  boxShadow: unlocked
                    ? `0 0 14px ${branch.color}55, inset 0 0 8px ${branch.color}33`
                    : 'inset 0 0 6px rgba(0,0,0,0.6)',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <span className="text-2xl">{n.icon}</span>
              </div>

              {/* Tooltip on hover */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-2.5 py-1.5 rounded-sm text-[10px] tracking-[0.15em] uppercase"
                style={{
                  background: 'rgba(8,12,18,0.95)',
                  border: `1px solid ${branch.color}55`,
                  color: '#fff',
                }}
              >
                <div className="font-semibold">{n.name}</div>
                <div className="text-white/50 normal-case tracking-wide">
                  {unlocked ? 'Unlocked' : `Lv ${n.unlockLevel}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}