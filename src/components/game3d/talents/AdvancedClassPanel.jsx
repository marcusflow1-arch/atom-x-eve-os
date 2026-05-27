import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Info } from 'lucide-react';
import { subscribeAdvancedClass } from './advancedClassStore';
import { subscribeMastery } from '../progression/weaponMasteryStore';
import { resolveAdvancedWeaponType, WEAPON_TYPES, getClassById } from './advancedClassRegistry';
import { getPassiveSummary } from './advancedClassPassives';
import { getSkillModSummary } from './advancedClassSkills';
import AdvancedClassSelector from './AdvancedClassSelector';

const WEAPON_TABS = [
  { type: WEAPON_TYPES.SWORD,    label: 'Sword',    icon: '⚔️' },
  { type: WEAPON_TYPES.RANGED,   label: 'Archery',  icon: '🏹' },
  { type: WEAPON_TYPES.GUARDIAN, label: 'Guardian', icon: '🛡️' },
];

export default function AdvancedClassPanel() {
  const [advancedState, setAdvancedState] = useState(null);
  const [masteryState,  setMasteryState]  = useState(null);
  const [activeTab,     setActiveTab]     = useState(WEAPON_TYPES.SWORD);
  const [showDetail,    setShowDetail]    = useState(false);

  useEffect(() => subscribeAdvancedClass(setAdvancedState), []);
  useEffect(() => subscribeMastery(setMasteryState),        []);

  if (!advancedState) return null;

  // Derive the active weapon type from mastery store
  const activeAdvancedType = masteryState?.activeWeaponId
    ? resolveAdvancedWeaponType(masteryState.activeWeaponId)
    : null;

  const selectedClassId = advancedState.selectedClasses[activeTab];
  const selectedClassDef = selectedClassId ? getClassById(selectedClassId) : null;

  // Passive + skill summaries for the selected class in the active tab
  const passiveSummary = selectedClassDef
    ? Object.entries(selectedClassDef.passive_bonuses || {}).slice(0, 8).map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        display: `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`,
        isPositive: value > 0,
      }))
    : [];

  const skillSummary = selectedClassDef
    ? Object.entries(selectedClassDef.skill_modifiers || {})
        .filter(([, v]) => v !== false && v !== null && v !== undefined)
        .slice(0, 6)
    : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Panel Header ── */}
      <div
        className="flex-shrink-0 px-6 pt-5 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-white/90">
            Advanced Weapon Classes
          </h2>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed">
          Specialize your weapon into an advanced combat path. Switch freely outside of combat.
          {activeAdvancedType && (
            <span className="text-amber-400/70 ml-1">
              Active weapon: {WEAPON_TABS.find(t => t.type === activeAdvancedType)?.label || activeAdvancedType}
            </span>
          )}
        </p>
      </div>

      {/* ── Weapon Type Tabs ── */}
      <div
        className="flex-shrink-0 flex gap-0 px-4 pt-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {WEAPON_TABS.map((tab) => {
          const isActive = activeTab === tab.type;
          const hasClass = !!advancedState.selectedClasses[tab.type];
          const isCurrentWeapon = activeAdvancedType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className="relative flex items-center gap-1.5 px-4 pb-2.5 text-xs transition-all"
              style={{
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.40)',
                borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span>{tab.icon}</span>
              <span className="tracking-[0.1em]">{tab.label}</span>
              {hasClass && (
                <span
                  className="w-1.5 h-1.5 rounded-full ml-0.5"
                  style={{ background: isCurrentWeapon ? '#f59e0b' : '#6ee7b7' }}
                />
              )}
              {isCurrentWeapon && (
                <span
                  className="text-[8px] tracking-[0.2em] uppercase px-1 py-px rounded ml-0.5"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  Equipped
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="flex gap-0 h-full"
          >
            {/* LEFT: class selector */}
            <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4">
              <AdvancedClassSelector
                weaponType={activeTab}
                selectedClassId={advancedState.selectedClasses[activeTab]}
                unlockedClasses={advancedState.unlockedClasses}
              />
            </div>

            {/* RIGHT: active class detail */}
            {selectedClassDef && (
              <div
                className="w-60 flex-shrink-0 overflow-y-auto px-4 py-4 flex flex-col gap-4"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Active class badge */}
                <div>
                  <div className="text-[8px] tracking-[0.35em] uppercase text-white/35 mb-2">Active Class</div>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      background: `${selectedClassDef.color}18`,
                      border: `1px solid ${selectedClassDef.color}44`,
                    }}
                  >
                    <span className="text-xl">{selectedClassDef.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{selectedClassDef.display_name}</div>
                      <div
                        className="text-[9px] font-medium tracking-[0.15em]"
                        style={{ color: `${selectedClassDef.color}cc` }}
                      >
                        {selectedClassDef.tagline}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passive Bonuses */}
                {passiveSummary.length > 0 && (
                  <div>
                    <div className="text-[8px] tracking-[0.35em] uppercase text-white/35 mb-2">Passive Bonuses</div>
                    <div className="flex flex-col gap-1">
                      {passiveSummary.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[9px] text-white/50 truncate pr-2">{p.label}</span>
                          <span
                            className="text-[9px] font-semibold flex-shrink-0"
                            style={{ color: p.isPositive ? '#86efac' : '#fca5a5' }}
                          >
                            {p.display}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Modifiers */}
                {skillSummary.length > 0 && (
                  <div>
                    <div className="text-[8px] tracking-[0.35em] uppercase text-white/35 mb-2">Abilities Unlocked</div>
                    <div className="flex flex-col gap-1.5">
                      {skillSummary.map(([key, val], i) => (
                        <div
                          key={i}
                          className="px-2 py-1.5 rounded text-[9px]"
                          style={{
                            background: `${selectedClassDef.color}12`,
                            border: `1px solid ${selectedClassDef.color}28`,
                            color: `${selectedClassDef.color}dd`,
                          }}
                        >
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {typeof val === 'number' && val !== 1 && val !== true && (
                            <span className="text-white/40 ml-1 text-[8px]">×{val}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flavor */}
                {selectedClassDef.flavor_text && (
                  <div
                    className="px-3 py-2 rounded-lg text-[9px] text-white/30 italic"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {selectedClassDef.flavor_text}
                  </div>
                )}

                {/* VFX indicator */}
                {selectedClassDef.unlock_effects?.aura && (
                  <div>
                    <div className="text-[8px] tracking-[0.35em] uppercase text-white/35 mb-1.5">Visual Effect</div>
                    <div
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[9px]"
                      style={{ background: `${selectedClassDef.color}12`, border: `1px solid ${selectedClassDef.color}28` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                        style={{ background: selectedClassDef.color }}
                      />
                      <span className="text-white/60">
                        {selectedClassDef.unlock_effects.aura.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} active
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-[9px] text-white/25 text-center leading-relaxed">
          Advanced classes are free to switch outside of combat.
          Weapon Mastery progression continues regardless of class.
        </p>
      </div>
    </div>
  );
}