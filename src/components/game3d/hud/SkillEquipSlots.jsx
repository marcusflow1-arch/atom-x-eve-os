import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X } from 'lucide-react';

/**
 * SkillEquipSlots — 8 slots (2 rows × 4 cols) displayed as a vertical strip
 * on the outside-left of the Skill Book. Skills can be dropped into any slot
 * by clicking a slot while a skill is selected, or via drag-and-drop.
 *
 * Props:
 *   draggedSkill  — skill object currently being dragged/selected for equip
 *   onClearDrag   — clears the drag source after placing
 */

const SLOT_COUNT = 8; // 2 rows × 4 columns → rendered as 4 rows × 2 columns (vertical strip)
const MAX_SKILL_LEVEL = 10;

function adaptationXP(level) {
  // XP progress to next level: 0→1 = 100xp, grows 20% per level
  return { current: Math.floor(30 + level * 22), max: Math.floor(100 + level * 20) };
}

function getRarityColor(rarity) {
  const map = {
    common: '#9ca3af', rare: '#60a5fa', epic: '#a78bfa',
    legendary: '#f59e0b', mythic: '#f43f5e', divine: '#e879f9',
  };
  return map[rarity] || '#9ca3af';
}

export default function SkillEquipSlots({ draggedSkill, onClearDrag }) {
  // Each slot: null | { skill, level, xp }
  const [slots, setSlots] = useState(() => Array(SLOT_COUNT).fill(null));
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const dragSourceSlot = useRef(null);

  const placeSkill = (slotIdx) => {
    if (!draggedSkill) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { skill: draggedSkill, level: 1, xp: adaptationXP(1) };
      return next;
    });
    onClearDrag?.();
  };

  const removeSkill = (slotIdx, e) => {
    e.stopPropagation();
    setSlots((prev) => { const n = [...prev]; n[slotIdx] = null; return n; });
  };

  const changeLevel = (slotIdx, delta, e) => {
    e.stopPropagation();
    setSlots((prev) => {
      const n = [...prev];
      const s = n[slotIdx];
      if (!s) return prev;
      const newLvl = Math.max(1, Math.min(MAX_SKILL_LEVEL, s.level + delta));
      n[slotIdx] = { ...s, level: newLvl, xp: adaptationXP(newLvl) };
      return n;
    });
  };

  // Drag-and-drop between slots (internal reorder)
  const handleDragStart = (slotIdx) => { dragSourceSlot.current = slotIdx; };
  const handleDropOnSlot = (targetIdx) => {
    const src = dragSourceSlot.current;
    if (src === null || src === undefined || src === targetIdx) return;
    setSlots((prev) => {
      const n = [...prev];
      const tmp = n[src];
      n[src] = n[targetIdx];
      n[targetIdx] = tmp;
      return n;
    });
    dragSourceSlot.current = null;
  };

  return (
    <div className="flex flex-col gap-1.5 pr-2" style={{ width: 88 }}>
      {/* Label */}
      <div className="text-center mb-1">
        <span className="text-[7px] font-black uppercase tracking-widest text-white/50">Skill Slots</span>
      </div>

      {/* 4 rows × 2 cols = 8 slots */}
      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((entry, idx) => {
          const isHovered = hoveredSlot === idx;
          const canDrop = !!draggedSkill && !entry;
          const color = entry ? getRarityColor(entry.skill?.rarity) : '#6b7280';

          return (
            <motion.div
              key={idx}
              className="relative flex flex-col cursor-pointer select-none"
              style={{
                width: 38,
                borderRadius: 8,
                background: entry
                  ? `${color}18`
                  : canDrop
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px ${canDrop && isHovered ? 'solid' : 'dashed'} ${
                  entry ? color + '70' : canDrop ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'
                }`,
                boxShadow: entry ? `0 0 10px ${color}25` : canDrop && isHovered ? '0 0 14px rgba(255,255,255,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              draggable={!!entry}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => { e.preventDefault(); setHoveredSlot(idx); }}
              onDragLeave={() => setHoveredSlot(null)}
              onDrop={() => { handleDropOnSlot(idx); setHoveredSlot(null); }}
              onMouseEnter={() => setHoveredSlot(idx)}
              onMouseLeave={() => setHoveredSlot(null)}
              onClick={() => placeSkill(idx)}
            >
              {entry ? (
                <SlotFilled
                  entry={entry}
                  color={color}
                  onRemove={(e) => removeSkill(idx, e)}
                  onLevelUp={(e) => changeLevel(idx, 1, e)}
                  onLevelDown={(e) => changeLevel(idx, -1, e)}
                />
              ) : (
                <SlotEmpty idx={idx} canDrop={canDrop} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Hint when a skill is selected */}
      <AnimatePresence>
        {draggedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="text-center mt-1"
          >
            <span className="text-[7px] text-yellow-300/80 font-bold">Click slot to equip</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty slot ──────────────────────────────────────────────────────────────
function SlotEmpty({ idx, canDrop }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: 38 }}>
      <span className="text-[8px] text-white/20 font-black">
        {canDrop ? '↓' : idx + 1}
      </span>
    </div>
  );
}

// ── Filled slot ─────────────────────────────────────────────────────────────
function SlotFilled({ entry, color, onRemove, onLevelUp, onLevelDown }) {
  const { skill, level, xp } = entry;
  const xpPct = Math.min(100, (xp.current / xp.max) * 100);

  return (
    <div className="flex flex-col" style={{ padding: '3px 3px 4px 3px', gap: 2 }}>
      {/* Remove × */}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center z-10"
        style={{ background: 'rgba(0,0,0,0.65)', border: `1px solid ${color}60` }}
      >
        <X className="w-2 h-2" style={{ color }} />
      </button>

      {/* Icon */}
      <div
        className="w-full flex items-center justify-center rounded-md text-base"
        style={{ height: 26, background: `${color}22` }}
      >
        {skill.icon}
      </div>

      {/* +/− level controls + level display */}
      <div className="flex items-center justify-between" style={{ gap: 1 }}>
        <button
          onClick={onLevelDown}
          className="flex items-center justify-center rounded"
          style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.1)', border: `1px solid ${color}40` }}
        >
          <Minus className="w-1.5 h-1.5" style={{ color }} />
        </button>
        <span className="text-[7px] font-black text-white/80 tabular-nums">
          {level}<span className="text-white/30">/{MAX_SKILL_LEVEL}</span>
        </span>
        <button
          onClick={onLevelUp}
          className="flex items-center justify-center rounded"
          style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.1)', border: `1px solid ${color}40` }}
        >
          <Plus className="w-1.5 h-1.5" style={{ color }} />
        </button>
      </div>

      {/* Skill Adaptation XP bar */}
      <div className="flex flex-col" style={{ gap: 1 }}>
        <span className="text-[5.5px] font-black uppercase tracking-wider" style={{ color: color, opacity: 0.85 }}>
          Skill Adapt.
        </span>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${color}aa, ${color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[5px] text-white/30 tabular-nums text-right">
          {xp.current}/{xp.max}
        </span>
      </div>
    </div>
  );
}