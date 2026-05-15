import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { ABILITY_DEFINITIONS, subscribeAbilities, equipAbility, unequipAbility } from './abilityStore';

const SLOT_KEYS = ['Q', 'E', 'R', 'F'];

const ELEMENT_COLORS = {
  lightning: { bg: '#ffe06622', border: '#ffe066', text: '#ffe066', icon: '⚡' },
  fire:      { bg: '#ff6b3522', border: '#ff6b35', text: '#ff6b35', icon: '🔥' },
  ice:       { bg: '#7dd3fc22', border: '#7dd3fc', text: '#7dd3fc', icon: '❄️' },
  shadow:    { bg: '#a855f722', border: '#a855f7', text: '#a855f7', icon: '🌑' },
};

export default function SkillTreeMenu({ open, onClose }) {
  const [abilities, setAbilities] = useState({ equipped: [null, null, null, null] });
  const [dragFrom, setDragFrom] = useState(null); // { type: 'ability'|'slot', id/index }
  const [hoveredSlot, setHoveredSlot] = useState(null);

  useEffect(() => subscribeAbilities(setAbilities), []);

  const equipped = abilities.equipped || [null, null, null, null];

  const handleSlotClick = (slotIndex) => {
    if (equipped[slotIndex]) {
      unequipAbility(slotIndex);
    }
  };

  const handleAbilityEquip = (abilityId, slotIndex) => {
    // Remove from any existing slot
    equipped.forEach((eq, i) => { if (eq === abilityId) unequipAbility(i); });
    equipAbility(slotIndex, abilityId);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 250 }}
            className="fixed inset-0 flex items-center justify-center z-[81] pointer-events-none"
          >
            <div
              className="pointer-events-auto w-[680px] max-w-[96vw] rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(10,16,26,0.98) 0%, rgba(8,12,20,0.98) 100%)',
                border: '1px solid rgba(180,140,80,0.35)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="text-white font-bold text-lg tracking-wider">Skill Tree</span>
                  <span className="text-white/40 text-sm">· Equip abilities to your slots</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex gap-6">
                {/* Left: Ability Library */}
                <div className="flex-1">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3">
                    Available Abilities
                  </div>
                  <div className="space-y-2">
                    {ABILITY_DEFINITIONS.map((ab) => {
                      const el = ELEMENT_COLORS[ab.element] || ELEMENT_COLORS.lightning;
                      const equippedInSlot = equipped.indexOf(ab.id);
                      const isEquipped = equippedInSlot !== -1;

                      return (
                        <div
                          key={ab.id}
                          className="rounded-lg p-3 transition-all"
                          style={{
                            background: isEquipped ? `${el.bg}` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isEquipped ? el.border + '55' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ background: el.bg, border: `1.5px solid ${el.border}55` }}
                            >
                              {el.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white font-bold text-sm">{ab.name}</span>
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                  style={{ color: el.text, background: el.bg, border: `1px solid ${el.border}44` }}
                                >
                                  {ab.element}
                                </span>
                              </div>
                              <p className="text-white/50 text-[11px] leading-snug mb-2">{ab.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-white/40">
                                {ab.damage > 0 && <span>⚔️ {ab.damage} dmg</span>}
                                <span>⏱ {ab.cooldown}s CD</span>
                              </div>
                            </div>

                            {/* Equip buttons */}
                            <div className="flex flex-col gap-1">
                              {isEquipped ? (
                                <div className="flex items-center gap-1 text-[10px] text-white/60">
                                  <span>Slot</span>
                                  <span
                                    className="px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: el.bg, color: el.text, border: `1px solid ${el.border}55` }}
                                  >
                                    {SLOT_KEYS[equippedInSlot]}
                                  </span>
                                </div>
                              ) : null}
                              <div className="flex gap-1">
                                {SLOT_KEYS.map((key, i) => {
                                  const slotHasDiff = equipped[i] && equipped[i] !== ab.id;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => handleAbilityEquip(ab.id, i)}
                                      className="w-7 h-7 rounded text-[10px] font-bold transition-all hover:scale-110"
                                      style={{
                                        background: equipped[i] === ab.id
                                          ? el.border
                                          : slotHasDiff
                                          ? 'rgba(255,255,255,0.06)'
                                          : 'rgba(255,255,255,0.08)',
                                        border: `1px solid ${equipped[i] === ab.id ? el.border : 'rgba(255,255,255,0.15)'}`,
                                        color: equipped[i] === ab.id ? '#000' : 'rgba(255,255,255,0.6)',
                                      }}
                                      title={`Equip to slot ${key}`}
                                    >
                                      {key}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Equipped Slots */}
                <div className="w-[160px] flex-shrink-0">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3">
                    Equipped Slots
                  </div>
                  <div className="space-y-2">
                    {SLOT_KEYS.map((key, i) => {
                      const abId = equipped[i];
                      const ab = ABILITY_DEFINITIONS.find((a) => a.id === abId);
                      const el = ab ? (ELEMENT_COLORS[ab.element] || ELEMENT_COLORS.lightning) : null;

                      return (
                        <div
                          key={key}
                          className="rounded-lg p-3 flex items-center gap-3"
                          style={{
                            background: ab ? el.bg : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${ab ? el.border + '44' : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          {/* Key badge */}
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-black flex-shrink-0"
                            style={{
                              background: ab ? el.border : 'rgba(255,255,255,0.08)',
                              color: ab ? '#000' : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {key}
                          </div>

                          {ab ? (
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-white truncate">{ab.name}</div>
                              <div className="text-[9px] text-white/40">{ab.cooldown}s CD</div>
                            </div>
                          ) : (
                            <span className="text-white/20 text-[11px]">Empty</span>
                          )}

                          {ab && (
                            <button
                              onClick={() => unequipAbility(i)}
                              className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] text-white/30 leading-relaxed">
                      <p className="mb-1">• Target enemy with <span className="text-white/60 font-bold">scroll click</span></p>
                      <p className="mb-1">• Use ability with <span className="text-white/60 font-bold">Q/E/R/F</span></p>
                      <p>• Press <span className="text-white/60 font-bold">K</span> to toggle this menu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}