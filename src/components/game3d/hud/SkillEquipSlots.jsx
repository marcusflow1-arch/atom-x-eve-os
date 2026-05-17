import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { subscribeLoadout, equipActive, unequipActive } from '../skills/loadoutStore';
import { getSkillById } from '../skills/skillRegistry';
import { SKILL_TYPE } from '../skills/skillTypes';

/**
 * SkillEquipSlots — 8 vertical equip slots to the left of the Skills Book.
 * Player can place ANY active skill in ANY slot. Passives are blocked
 * (they belong in the passive panel, not on the active bar).
 *
 * Props:
 *   draggedSkill  — a skill object selected for equip (from registry)
 *   onClearDrag   — clears the selection after placing
 */

const SLOT_COUNT = 8;

const TYPE_COLORS = {
  [SKILL_TYPE.ACTIVE_ATTACK]: '#f59e0b',
  [SKILL_TYPE.ACTIVE_BUFF]:   '#60a5fa',
  [SKILL_TYPE.PASSIVE]:       '#a78bfa',
};

export default function SkillEquipSlots({ draggedSkill, onClearDrag }) {
  const [activeSlots, setActiveSlots] = useState(Array(SLOT_COUNT).fill(null));
  const [hoveredSlot, setHoveredSlot] = useState(null);

  useEffect(() => subscribeLoadout((s) => setActiveSlots(s.activeSlots)), []);

  const placeSkill = (slotIdx) => {
    if (!draggedSkill) return;
    const result = equipActive(slotIdx, draggedSkill.skill_id);
    if (!result.ok) {
      // The one hard rule: passives cannot go in active slots.
      window.dispatchEvent(new CustomEvent('skillActivatedToast', {
        detail: { text: '⛔ Passive skills cannot be placed in active slots' },
      }));
      return;
    }
    onClearDrag?.();
  };

  const removeSkill = (slotIdx, e) => {
    e.stopPropagation();
    unequipActive(slotIdx);
  };

  const isPassive = draggedSkill?.skill_type === SKILL_TYPE.PASSIVE;

  return (
    <div className="flex flex-col gap-1.5 pr-2" style={{ width: 110 }}>
      <div className="text-center mb-1">
        <span className="text-[7px] font-black uppercase tracking-widest text-white/50">Skill Slots</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {activeSlots.map((id, idx) => {
          const skill = id ? getSkillById(id) : null;
          const isHovered = hoveredSlot === idx;
          const canDrop = !!draggedSkill && !skill && !isPassive;
          const color = skill ? (TYPE_COLORS[skill.skill_type] || '#6b7280') : '#6b7280';

          return (
            <div key={idx} className="flex items-center gap-1">
              <span
                className="text-[9px] font-black tabular-nums text-white/70"
                style={{ width: 10, textAlign: 'right' }}
              >
                {idx + 1}
              </span>

              <motion.div
                className="relative flex flex-col cursor-pointer select-none"
                style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: skill
                    ? `${color}22`
                    : canDrop
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px ${canDrop && isHovered ? 'solid' : 'dashed'} ${
                    skill ? color + '80' : canDrop ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'
                  }`,
                  boxShadow: skill
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
                title={skill ? `${skill.skill_name} — click × to unequip` : `Slot ${idx + 1}`}
              >
                {skill ? (
                  <>
                    <button
                      onClick={(e) => removeSkill(idx, e)}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center z-10"
                      style={{ background: 'rgba(0,0,0,0.75)', border: `1px solid ${color}80` }}
                    >
                      <X className="w-2 h-2" style={{ color }} />
                    </button>
                    <div className="w-full h-full flex items-center justify-center text-lg">{skill.icon}</div>
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

      <AnimatePresence>
        {draggedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="text-center mt-1"
          >
            {isPassive ? (
              <span className="text-[7px] text-red-300/90 font-bold">Passives can't be equipped here</span>
            ) : (
              <span className="text-[7px] text-yellow-300/90 font-bold">Click slot to equip</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}