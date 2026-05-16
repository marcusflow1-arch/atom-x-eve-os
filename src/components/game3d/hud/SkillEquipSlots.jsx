import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { subscribeAbilities, equipAbility, unequipAbility, resolveSlotData } from '../abilityStore';

/**
 * SkillEquipSlots — 8 slots displayed as a vertical strip on the outside-left
 * of the Skill Book. Click a slot while a skill is selected in the book to
 * equip it; the same slots feed the in-game HUD (1–8 keys).
 *
 * Each slot shows its slot number (1–8) OUTSIDE the box on the left, so the
 * player can clearly map slots to keybinds.
 *
 * Props:
 *   draggedSkill  — skill object currently selected for equip from the book
 *   onClearDrag   — clears the selection after placing
 */

const SLOT_COUNT = 8;

function getRarityColor(rarity) {
  const map = {
    common: '#9ca3af', uncommon: '#22c55e', rare: '#60a5fa', epic: '#a78bfa',
    legendary: '#f59e0b', mythic: '#f43f5e', divine: '#e879f9',
  };
  return map[rarity] || '#9ca3af';
}

// Convert a Skills-Book skill → a serializable slot entry for abilityStore
function skillToSlotEntry(skill) {
  return {
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    color: getRarityColor(skill.rarity),
    cooldown: skill.cooldown || 4.0,
    rarity: skill.rarity,
  };
}

export default function SkillEquipSlots({ draggedSkill, onClearDrag }) {
  const [equipped, setEquipped] = useState(Array(SLOT_COUNT).fill(null));
  const [hoveredSlot, setHoveredSlot] = useState(null);

  useEffect(() => subscribeAbilities((s) => setEquipped(s.equipped)), []);

  const placeSkill = (slotIdx) => {
    if (!draggedSkill) return;
    equipAbility(slotIdx, skillToSlotEntry(draggedSkill));
    onClearDrag?.();
  };

  const removeSkill = (slotIdx, e) => {
    e.stopPropagation();
    unequipAbility(slotIdx);
  };

  return (
    <div className="flex flex-col gap-1.5 pr-2" style={{ width: 110 }}>
      {/* Label */}
      <div className="text-center mb-1">
        <span className="text-[7px] font-black uppercase tracking-widest text-white/50">Skill Slots</span>
      </div>

      {/* 4 rows × 2 cols = 8 slots, each with slot number on the LEFT outside */}
      <div className="grid grid-cols-2 gap-1.5">
        {equipped.map((entry, idx) => {
          const resolved = resolveSlotData(entry);
          const isHovered = hoveredSlot === idx;
          const canDrop = !!draggedSkill && !resolved;
          const color = resolved?.color || '#6b7280';

          return (
            <div key={idx} className="flex items-center gap-1">
              {/* Slot number OUTSIDE on the left */}
              <span
                className="text-[9px] font-black tabular-nums text-white/70"
                style={{ width: 10, textAlign: 'right' }}
              >
                {idx + 1}
              </span>

              <motion.div
                className="relative flex flex-col cursor-pointer select-none"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: resolved
                    ? `${color}22`
                    : canDrop
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px ${canDrop && isHovered ? 'solid' : 'dashed'} ${
                    resolved ? color + '80' : canDrop ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'
                  }`,
                  boxShadow: resolved
                    ? `0 0 10px ${color}30`
                    : canDrop && isHovered
                    ? '0 0 14px rgba(255,255,255,0.2)'
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={() => setHoveredSlot(idx)}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={() => placeSkill(idx)}
                title={resolved ? `${resolved.name} — click × to unequip` : `Slot ${idx + 1} — click to equip selected skill`}
              >
                {resolved ? (
                  <>
                    {/* Remove × */}
                    <button
                      onClick={(e) => removeSkill(idx, e)}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center z-10"
                      style={{ background: 'rgba(0,0,0,0.75)', border: `1px solid ${color}80` }}
                    >
                      <X className="w-2 h-2" style={{ color }} />
                    </button>
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      {resolved.icon}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] text-white/25 font-black">{canDrop ? '↓' : '—'}</span>
                  </div>
                )}
              </motion.div>
            </div>
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
            <span className="text-[7px] text-yellow-300/90 font-bold">Click slot to equip</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}