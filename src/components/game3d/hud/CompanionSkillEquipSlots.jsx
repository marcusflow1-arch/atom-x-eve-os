import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  subscribeCompanionLoadout,
  equipCompanionSkill,
  unequipCompanionSkill,
  COMPANION_SLOT_KEYS,
} from '../skills/companionLoadoutStore';
import { getCompanionSkillById } from '../skills/companionSkillRegistry';

/**
 * CompanionSkillEquipSlots — 4 vertical equip slots (Z/X/V/B) shown to the
 * left of the Skills Book when the user has flipped to Companion tab.
 * Mirrors SkillEquipSlots but for the companion's 4-button loadout.
 */
export default function CompanionSkillEquipSlots({ draggedSkill, onClearDrag }) {
  const [activeSlots, setActiveSlots] = useState([null, null, null, null]);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  useEffect(() => subscribeCompanionLoadout((s) => setActiveSlots(s.activeSlots)), []);

  const placeSkill = (slotIdx) => {
    if (!draggedSkill) return;
    const result = equipCompanionSkill(slotIdx, draggedSkill.skill_id);
    if (result.ok) onClearDrag?.();
  };

  const removeSkill = (slotIdx, e) => {
    e.stopPropagation();
    unequipCompanionSkill(slotIdx);
  };

  return (
    <div className="flex flex-col gap-1.5 pr-2" style={{ width: 110 }}>
      <div className="text-center mb-1">
        <span className="text-[7px] font-black uppercase tracking-widest text-white/50">Companion Slots</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {activeSlots.map((id, idx) => {
          const skill = id ? getCompanionSkillById(id) : null;
          const isHovered = hoveredSlot === idx;
          const canDrop = !!draggedSkill && !skill;
          const color = skill?.color || '#6b7280';
          const slotKey = COMPANION_SLOT_KEYS[idx];

          return (
            <div key={idx} className="flex items-center gap-1">
              <span
                className="text-[9px] font-black text-white/70"
                style={{ width: 10, textAlign: 'right' }}
              >
                {slotKey}
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
                title={skill ? `${skill.skill_name} — click × to unequip` : `Slot ${slotKey}`}
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
            <span className="text-[7px] text-yellow-300/90 font-bold">Click slot to equip</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}