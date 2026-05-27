import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ChevronRight, Zap, Shield, Target, Star, Sparkles, Swords, ChevronDown } from 'lucide-react';
import { TALENT_TREES, setSelected } from './equipmentStore';
import { WEAPON_PATHS } from './weaponSkillData';
import { subscribeAdvancedClass } from '../talents/advancedClassStore';
import { resolveAdvancedWeaponType, getClassesForWeapon, getClassById, WEAPON_TYPES } from '../talents/advancedClassRegistry';
import { selectAdvancedClass, deselectAdvancedClass, canSwitchAdvancedClass } from '../talents/advancedClassStore';
import AdvancedClassCard from '../talents/AdvancedClassCard';

// ── Skill tree data ───────────────────────────────────────────────────────────
const PATH_SKILL_TREES = {
  ranged: {
    tiers: [
      { level: 1,  label: 'Apprentice', nodes: [{ id: 'r_quick_draw', name: 'Quick Draw',       type: 'Passive', icon: '⚡', desc: 'Reduces bow draw time by 20%.' }, { id: 'r_eagle_eye',  name: 'Eagle Eye',        type: 'Passive', icon: '👁️', desc: 'Increases critical hit chance by 10%.' }], weaponUnlock: null, abilityUnlock: null },
      { level: 5,  label: 'Marksman',   nodes: [{ id: 'r_piercing',   name: 'Piercing Arrow',   type: 'Active',  icon: '🎯', desc: 'Arrow penetrates through enemies in a line.' }, { id: 'r_multishot', name: 'Multi-Shot',        type: 'Active',  icon: '🌪️', desc: 'Fire 3 arrows simultaneously in a spread.' }], weaponUnlock: { name: 'Recurve Bow', icon: '🏹', bonus: '+15% Range Damage' }, abilityUnlock: null },
      { level: 10, label: 'Hunter',     nodes: [{ id: 'r_snipe',      name: 'Snipe',            type: 'Active',  icon: '🔭', desc: 'Deal 200% damage to a distant single target.' }, { id: 'r_evasive',   name: 'Evasive Maneuvers', type: 'Passive', icon: '💨', desc: 'Dodge chance +25% while moving.' }], weaponUnlock: { name: 'Longbow', icon: '🏹', bonus: '+30% Range Damage, +15% Speed' }, abilityUnlock: { name: 'Barrage Volley', icon: '🌪️', desc: '5 rapid ranged hits' } },
      { level: 20, label: 'Deadshot',   nodes: [{ id: 'r_lethal',     name: 'Lethal Precision', type: 'Passive', icon: '💀', desc: 'Critical hits deal 3x damage.' }, { id: 'r_storm',     name: 'Arrow Storm',       type: 'Ultimate', icon: '⛈️', desc: 'Unleash a storm of arrows covering a wide area.' }], weaponUnlock: { name: 'Mythic Longbow', icon: '✨', bonus: '+60% Range, +40% Crit Chance' }, abilityUnlock: { name: 'Swift Marksman', icon: '💨', desc: 'Permanent passive: +35% speed, -20% hit chance' } },
    ],
  },
  defense: {
    tiers: [
      { level: 1,  label: 'Sentinel', nodes: [{ id: 'd_toughness', name: 'Toughness',     type: 'Passive', icon: '🏰', desc: 'Increases max HP by 15%.' }, { id: 'd_parry',    name: 'Parry',        type: 'Active',  icon: '🛡️', desc: 'Block an incoming attack and reduce damage by 50%.' }], weaponUnlock: null, abilityUnlock: null },
      { level: 5,  label: 'Guardian', nodes: [{ id: 'd_counter',   name: 'Counter Strike', type: 'Active',  icon: '↩️', desc: 'After parrying, deal 120% weapon damage.' }, { id: 'd_iron_skin', name: 'Iron Skin',  type: 'Passive', icon: '⚙️', desc: 'Reduce all incoming damage by 10%.' }], weaponUnlock: { name: 'Dual Blades', icon: '🗡️', bonus: '+20% Defense, +Counter Damage' }, abilityUnlock: null },
      { level: 10, label: 'Bulwark',  nodes: [{ id: 'd_reflect',   name: 'Damage Reflect', type: 'Passive', icon: '🔄', desc: 'Reflect 20% of incoming damage back.' }, { id: 'd_fortress',  name: 'Fortress Stance', type: 'Active', icon: '🏯', desc: 'Enter a stance: take 70% less damage for 5s.' }], weaponUnlock: { name: 'War Blades', icon: '⚔️', bonus: '+40% Defense, Reflect Passive' }, abilityUnlock: { name: 'Twin Fang Combo', icon: '⚡', desc: '3-hit simultaneous counter combo' } },
      { level: 20, label: 'Warden',   nodes: [{ id: 'd_immortal',  name: 'Immortal Guard',  type: 'Passive', icon: '✨', desc: 'Once per fight: survive a killing blow with 1 HP.' }, { id: 'd_shockwave', name: 'Shockwave Slash', type: 'Ultimate', icon: '💥', desc: 'Release shockwave dealing 180% damage to all nearby enemies.' }], weaponUnlock: { name: 'Mythic War Blades', icon: '✨', bonus: '+80% Defense, Immortal Passive' }, abilityUnlock: { name: 'Iron Stance', icon: '🏰', desc: 'Permanent passive: +50% defense' } },
    ],
  },
  damage: {
    tiers: [
      { level: 1,  label: 'Brawler',   nodes: [{ id: 'o_power',  name: 'Raw Power',    type: 'Passive', icon: '💪', desc: 'Increases attack damage by 15%.' }, { id: 'o_cleave',    name: 'Cleave',        type: 'Active',  icon: '⚔️', desc: 'Hit all enemies in front of you.' }], weaponUnlock: null, abilityUnlock: null },
      { level: 5,  label: 'Warrior',   nodes: [{ id: 'o_heavy',  name: 'Heavy Strike', type: 'Active',  icon: '🪨', desc: 'Deal 130% damage and stagger the target.' }, { id: 'o_fury',      name: 'Battle Fury',   type: 'Passive', icon: '🔥', desc: 'Each kill increases damage by 5% (stacks up to 5x).' }], weaponUnlock: { name: 'Greatsword', icon: '⚔️', bonus: '+25% Offense Damage' }, abilityUnlock: null },
      { level: 10, label: 'Berserker', nodes: [{ id: 'o_triple', name: 'Triple Cleave', type: 'Active',  icon: '🌀', desc: '3 rapid heavy strikes, each dealing 80% damage.' }, { id: 'o_bloodlust', name: 'Bloodlust',     type: 'Passive', icon: '🩸', desc: 'Lifesteal 15% of all damage dealt.' }], weaponUnlock: { name: 'Heavy Greatsword', icon: '🗡️', bonus: '+50% Damage, +Lifesteal' }, abilityUnlock: { name: 'Heavy Impact', icon: '🪨', desc: 'Single devastating 130% burst strike' } },
      { level: 20, label: 'Destroyer', nodes: [{ id: 'o_brutal', name: 'Brutal Force',  type: 'Passive', icon: '📈', desc: '+25% total damage across all attacks.' }, { id: 'o_devastate', name: 'Devastate',     type: 'Ultimate', icon: '💥', desc: 'Unleash a catastrophic strike dealing 300% weapon damage.' }], weaponUnlock: { name: 'Mythic Greatsword', icon: '✨', bonus: '+100% Damage, Ultimate Ability' }, abilityUnlock: { name: 'Brutal Force', icon: '📈', desc: 'Permanent passive: +25% all damage' } },
    ],
  },
};

const MOCK_PLAYER_LEVEL = 8;

// ── Section tabs inside the Talents pane ─────────────────────────────────────
const SECTION_TABS = [
  { id: 'advanced', label: 'Advanced Classes', icon: '✦' },
  { id: 'tree',     label: 'Skill Trees',      icon: '🌿' },
];

// ── Node type colour ──────────────────────────────────────────────────────────
const NODE_TYPE_STYLE = {
  Passive: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', color: '#a5b4fc' },
  Active:  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', color: '#6ee7b7' },
  Ultimate:{ bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#fcd34d' },
};

// ── Weapon type → advanced weapon type map (left sidebar) ─────────────────────
const TREE_TO_ADVANCED_TYPE = {
  ranged:  WEAPON_TYPES.RANGED,
  defense: WEAPON_TYPES.GUARDIAN,
  damage:  WEAPON_TYPES.SWORD,
};

// ─────────────────────────────────────────────────────────────────────────────
function TierRow({ tier, isUnlocked, isCurrentTier, accentColor }) {
  const [expanded, setExpanded] = useState(isCurrentTier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border overflow-hidden transition-all"
      style={{
        background: isUnlocked
          ? isCurrentTier ? `${accentColor}12` : 'rgba(255,255,255,0.025)'
          : 'rgba(255,255,255,0.01)',
        borderColor: isUnlocked
          ? isCurrentTier ? `${accentColor}55` : 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.04)',
        opacity: isUnlocked ? 1 : 0.45,
      }}
    >
      <button
        onClick={() => isUnlocked && setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        disabled={!isUnlocked}
      >
        <div className="flex items-center gap-3">
          {isUnlocked
            ? <Unlock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            : <Lock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
          }
          <span className={`font-semibold text-sm ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
            {tier.label}
          </span>
          <span className="text-white/30 text-[10px]">Lv {tier.level}+</span>
          {isCurrentTier && (
            <span
              className="text-[8px] px-2 py-0.5 rounded-sm font-bold tracking-[0.2em] uppercase"
              style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}
            >
              Current
            </span>
          )}
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && isUnlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                {tier.nodes.map(node => {
                  const style = NODE_TYPE_STYLE[node.type] || NODE_TYPE_STYLE.Passive;
                  return (
                    <div key={node.id} className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{node.icon}</span>
                        <span className="text-white text-[11px] font-semibold flex-1 min-w-0 truncate">{node.name}</span>
                        <span className="text-[8px] px-1.5 py-px rounded-sm flex-shrink-0" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{node.type}</span>
                      </div>
                      <p className="text-white/45 text-[10px] leading-relaxed">{node.desc}</p>
                    </div>
                  );
                })}
              </div>
              {tier.weaponUnlock && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <span className="text-lg">{tier.weaponUnlock.icon}</span>
                  <div>
                    <div className="text-amber-300 text-[11px] font-bold">Weapon: {tier.weaponUnlock.name}</div>
                    <div className="text-amber-200/55 text-[9px] mt-0.5">{tier.weaponUnlock.bonus}</div>
                  </div>
                </div>
              )}
              {tier.abilityUnlock && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.22)' }}>
                  <span className="text-lg">{tier.abilityUnlock.icon}</span>
                  <div>
                    <div className="text-cyan-300 text-[11px] font-bold">Ability: {tier.abilityUnlock.name}</div>
                    <div className="text-cyan-200/55 text-[9px] mt-0.5">{tier.abilityUnlock.desc}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced Classes sub-panel (embedded in Talents)
// ─────────────────────────────────────────────────────────────────────────────
function AdvancedClassesSection({ weaponPath, accentColor }) {
  const advancedType = TREE_TO_ADVANCED_TYPE[weaponPath] || WEAPON_TYPES.SWORD;
  const [advancedState, setAdvancedState] = useState(null);
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => subscribeAdvancedClass(setAdvancedState), []);
  if (!advancedState) return null;

  const classes = getClassesForWeapon(advancedType);
  const selectedClassId = advancedState.selectedClasses[advancedType];
  const selectedDef = selectedClassId ? getClassById(selectedClassId) : null;

  const handleSelect = (classId) => {
    const isUnlocked = advancedState.unlockedClasses.includes(classId);
    if (!isUnlocked) { setFeedback({ type: 'error', msg: 'Class not yet unlocked.' }); setTimeout(() => setFeedback(null), 2000); return; }
    setPending(classId);
  };

  const confirmSwitch = () => {
    if (!pending) return;
    const check = canSwitchAdvancedClass();
    if (!check.allowed) { setFeedback({ type: 'error', msg: check.reason }); setTimeout(() => setFeedback(null), 3000); setPending(null); return; }
    if (pending === selectedClassId) {
      deselectAdvancedClass(advancedType);
      setFeedback({ type: 'success', msg: 'Class deactivated.' });
    } else {
      const r = selectAdvancedClass(pending);
      if (r.success) setFeedback({ type: 'success', msg: `${getClassById(pending)?.display_name} activated!` });
      else setFeedback({ type: 'error', msg: r.reason });
    }
    setTimeout(() => setFeedback(null), 2500);
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section intro */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
        style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}25` }}
      >
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
        <div>
          <div className="text-[10px] font-semibold text-white/80">Advanced Specialization</div>
          <div className="text-[9px] text-white/40 mt-0.5">Choose a specialization for this weapon path. Switch freely outside of combat.</div>
        </div>
      </div>

      {/* Active class badge */}
      {selectedDef && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: `${selectedDef.color}18`, border: `1px solid ${selectedDef.color}44` }}
        >
          <span className="text-lg">{selectedDef.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white">{selectedDef.display_name}</div>
            <div className="text-[9px]" style={{ color: `${selectedDef.color}cc` }}>{selectedDef.tagline}</div>
          </div>
          <span
            className="text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm font-semibold"
            style={{ background: `${selectedDef.color}25`, color: selectedDef.color, border: `1px solid ${selectedDef.color}44` }}
          >
            Active
          </span>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-3 py-2 rounded-lg text-[10px]"
            style={{
              background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
            }}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="p-3 rounded-lg"
            style={{ background: 'rgba(15,20,28,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-white/80 font-semibold">
                {pending === selectedClassId ? 'Deactivate' : 'Switch to'} {getClassById(pending)?.display_name}?
              </span>
            </div>
            <p className="text-[9px] text-white/40 mb-2.5">
              Class passives and abilities will update immediately.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmSwitch}
                className="flex-1 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold rounded transition-all"
                style={{ background: 'rgba(59,130,246,0.22)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd' }}
              >Confirm</button>
              <button
                onClick={() => setPending(null)}
                className="flex-1 py-1.5 text-[10px] tracking-[0.15em] uppercase rounded transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.4)' }}
              >Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class cards grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {classes.map((cls) => (
          <AdvancedClassCard
            key={cls.class_id}
            classDef={cls}
            isSelected={selectedClassId === cls.class_id}
            isUnlocked={advancedState.unlockedClasses.includes(cls.class_id)}
            onClick={() => handleSelect(cls.class_id)}
            compact
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function TalentsTab({ state }) {
  const activeTreeId = state.selectedTalentTree;
  const activeTree   = TALENT_TREES.find(t => t.id === activeTreeId);
  const weaponPath   = activeTree ? WEAPON_PATHS.find(p => p.id === activeTree.weaponPath) : null;
  const skillTree    = activeTree ? PATH_SKILL_TREES[activeTree.weaponPath] : null;
  const playerLevel  = MOCK_PLAYER_LEVEL;
  const [section, setSection] = useState('advanced');

  const accentColor = weaponPath?.color || '#f59e0b';

  return (
    <div className="absolute inset-0 flex" style={{ top: 52 }}>

      {/* ── LEFT SIDEBAR: Weapon Path Picker ── */}
      <div
        className="w-[200px] flex-shrink-0 flex flex-col overflow-y-auto py-5 px-3 gap-2"
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="text-[9px] tracking-[0.35em] uppercase text-white/35 mb-1 px-1">Weapon Path</div>

        {TALENT_TREES.map((t) => {
          const active = activeTreeId === t.id;
          const path   = WEAPON_PATHS.find(p => p.id === t.weaponPath);
          return (
            <button
              key={t.id}
              onClick={() => setSelected('selectedTalentTree', t.id)}
              className="text-left px-3 py-3 rounded-lg border transition-all"
              style={active ? {
                background: `${t.color}18`,
                borderColor: `${t.color}55`,
                boxShadow: `0 0 16px ${t.color}22`,
              } : {
                background: 'rgba(255,255,255,0.025)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{t.icon}</span>
                <span className={`font-bold text-sm ${active ? 'text-white' : 'text-white/60'}`}>{t.label}</span>
              </div>
              {path && (
                <p className="text-white/30 text-[9px] mt-1 leading-snug pl-8">{path.subtitle}</p>
              )}
            </button>
          );
        })}

        {/* Info block */}
        <div
          className="mt-2 p-2.5 rounded-lg text-[9px] text-white/30 leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5 text-white/45 mb-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="font-semibold">Tied to Weapon Mastery</span>
          </div>
          Enchanting and mastery leveling unlock higher tiers. Advanced classes apply on top.
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Path header */}
        {weaponPath && (
          <div
            className="flex-shrink-0 flex items-center gap-4 px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-3xl">{weaponPath.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-bold text-base">{weaponPath.name}</h2>
                <span
                  className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm font-semibold"
                  style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}44` }}
                >
                  {weaponPath.focus}
                </span>
              </div>
              {/* Path Passive inline */}
              {weaponPath.passive && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm">{weaponPath.passive.icon}</span>
                  <span className="text-[10px] text-white/50">{weaponPath.passive.name}</span>
                  <span className="text-white/25 text-[9px]">— {weaponPath.passive.description}</span>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[9px] text-white/35 uppercase tracking-wider">Player Level</div>
              <div className="text-xl font-bold" style={{ color: accentColor }}>{playerLevel}</div>
            </div>
          </div>
        )}

        {/* Section Toggle: Advanced Classes / Skill Tree */}
        <div
          className="flex-shrink-0 flex gap-0 px-5 pt-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {SECTION_TABS.map((tab) => {
            const on = section === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSection(tab.id)}
                className="flex items-center gap-1.5 px-4 pb-2.5 text-xs transition-all"
                style={{
                  color: on ? '#ffffff' : 'rgba(255,255,255,0.38)',
                  borderBottom: on ? `2px solid ${accentColor}` : '2px solid transparent',
                  fontWeight: on ? 600 : 400,
                }}
              >
                <span>{tab.icon}</span>
                <span className="tracking-[0.1em] uppercase text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">
            {section === 'advanced' && activeTree && (
              <motion.div
                key={`adv-${activeTree.weaponPath}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <AdvancedClassesSection
                  weaponPath={activeTree.weaponPath}
                  accentColor={accentColor}
                />
              </motion.div>
            )}

            {section === 'tree' && skillTree && (
              <motion.div
                key={`tree-${activeTree?.weaponPath}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-2.5"
              >
                <div className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">Progression Tiers</div>
                {skillTree.tiers.map((tier, i) => {
                  const isUnlocked    = playerLevel >= tier.level;
                  const nextTier      = skillTree.tiers[i + 1];
                  const isCurrentTier = isUnlocked && (!nextTier || playerLevel < nextTier.level);
                  return (
                    <TierRow
                      key={tier.level}
                      tier={tier}
                      isUnlocked={isUnlocked}
                      isCurrentTier={isCurrentTier}
                      accentColor={accentColor}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}