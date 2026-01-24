import React from 'react';
import { motion } from 'framer-motion';

// Simple MMORPG-like inventory grid with mocked items
// Props: rows=6, cols=8, items=[{id,label,icon,row,col,spanX,spanY}]
export default function ClanInventoryGrid({ rows = 6, cols = 8, items: incomingItems }) {
  const defaultItems = [
    { id: 'itm-1', label: 'Sword of Dawn', icon: '🗡️', row: 1, col: 1 },
    { id: 'itm-2', label: 'Aegis Shield', icon: '🛡️', row: 1, col: 3, spanX: 2 },
    { id: 'itm-3', label: 'Elixir x5', icon: '🧪', row: 2, col: 1 },
    { id: 'itm-4', label: 'Gold Pouch', icon: '💰', row: 3, col: 4 },
    { id: 'itm-5', label: 'Mana Tome', icon: '📜', row: 4, col: 2 },
    { id: 'itm-6', label: 'Gem Pack', icon: '💎', row: 5, col: 6 },
  ];
  const items = incomingItems && incomingItems.length ? incomingItems : defaultItems;

  const grid = [];
  for (let r = 1; r <= rows; r++) {
    const rowCells = [];
    for (let c = 1; c <= cols; c++) {
      rowCells.push({ r, c });
    }
    grid.push(rowCells);
  }

  const itemAt = (r, c) => items.find(it => it.row === r && it.col === c);

  return (
    <div className="p-4">
      <div className="mb-3">
        <h3 className="text-white font-bold text-lg">Inventory</h3>
        <p className="text-white/50 text-sm">Drag-and-drop coming later • Grid shows exact item slots</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, 64px)`
          }}
        >
          {grid.flat().map((cell) => {
            const item = itemAt(cell.r, cell.c);
            if (item) {
              const spanX = item.spanX || 1;
              const spanY = item.spanY || 1;
              return (
                <motion.div
                  key={`cell-${cell.r}-${cell.c}`}
                  className="relative rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/90 cursor-pointer overflow-hidden"
                  style={{ gridColumn: `span ${spanX} / span ${spanX}`, gridRow: `span ${spanY} / span ${spanY}` }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl" aria-hidden>{item.icon}</div>
                  <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white/70 truncate px-1">{item.label}</div>
                </motion.div>
              );
            }
            return (
              <div
                key={`cell-${cell.r}-${cell.c}`}
                className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md"/>
            );
          })}
        </div>
      </div>
    </div>
  );
}