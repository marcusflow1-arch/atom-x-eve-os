import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ChevronRight, Zap, Shield, Target, Star, Sword } from 'lucide-react';
import { TALENT_TREES, setSelected } from './equipmentStore';
import { WEAPON_PATHS } from './weaponSkillData';

// Skill tree nodes for each weapon path
const PATH_SKILL_TREES = {
  ranged: {
    tiers: [
      {
        level: 1,
        label: 'Apprentice',
        nodes: [
          { id: 'r_quick_draw', name: 'Quick Draw', type: 'Passive', icon: '⚡', desc: 'Reduces bow draw time by 20%.' },
          { id: 'r_eagle_eye', name: 'Eagle Eye', type: 'Passive', icon: '👁️', desc: 'Increases critical hit chance by 10%.' },
        ],
        weaponUnlock: null,
        abilityUnlock: null,
      },
      {
        level: 5,
        label: 'Marksman',
        nodes: [
          { id: 'r_piercing', name: 'Piercing Arrow', type: 'Active', icon: '🎯', desc: 'Arrow penetrates through enemies in a line.' },
          { id: 'r_multishot', name: 'Multi-Shot', type: 'Active', icon: '🌪️', desc: 'Fire 3 arrows simultaneously in a spread.' },
        ],
        weaponUnlock: { name: 'Recurve Bow', icon: '🏹', bonus: '+15% Range Damage' },
        abilityUnlock: null,
      },
      {
        level: 10,
        label: 'Hunter',
        nodes: [
          { id: 'r_snipe', name: 'Snipe', type: 'Active', icon: '🔭', desc: 'Deal 200% damage to a distant single target.' },
          { id: 'r_evasive', name: 'Evasive Maneuvers', type: 'Passive', icon: '💨', desc: 'Dodge chance +25% while moving.' },
        ],
        weaponUnlock: { name: 'Longbow', icon: '🏹', bonus: '+30% Range Damage, +15% Speed' },
        abilityUnlock: { name: 'Barrage Volley', icon: '🌪️', desc: '5 rapid ranged hits' },
      },
      {
        level: 20,
        label: 'Deadshot',
        nodes: [
          { id: 'r_lethal', name: 'Lethal Precision', type: 'Passive', icon: '💀', desc: 'Critical hits deal 3x damage.' },
          { id: 'r_storm', name: 'Arrow Storm', type: 'Ultimate', icon: '⛈️', desc: 'Unleash a storm of arrows covering a wide area.' },
        ],
        weaponUnlock: { name: 'Mythic Longbow', icon: '✨', bonus: '+60% Range, +40% Crit Chance' },
        abilityUnlock: { name: 'Swift Marksman', icon: '💨', desc: 'Permanent passive: +35% speed, -20% hit chance' },
      },
    ],
  },
  defense: {
    tiers: [
      {
        level: 1,
        label: 'Sentinel',
        nodes: [
          { id: 'd_toughness', name: 'Toughness', type: 'Passive', icon: '🏰', desc: 'Increases max HP by 15%.' },
          { id: 'd_parry', name: 'Parry', type: 'Active', icon: '🛡️', desc: 'Block an incoming attack and reduce damage by 50%.' },
        ],
        weaponUnlock: null,
        abilityUnlock: null,
      },
      {
        level: 5,
        label: 'Guardian',
        nodes: [
          { id: 'd_counter', name: 'Counter Strike', type: 'Active', icon: '↩️', desc: 'After parrying, deal 120% weapon damage.' },
          { id: 'd_iron_skin', name: 'Iron Skin', type: 'Passive', icon: '⚙️', desc: 'Reduce all incoming damage by 10%.' },
        ],
        weaponUnlock: { name: 'Dual Blades', icon: '🗡️', bonus: '+20% Defense, +Counter Damage' },
        abilityUnlock: null,
      },
      {
        level: 10,
        label: 'Bulwark',
        nodes: [
          { id: 'd_reflect', name: 'Damage Reflect', type: 'Passive', icon: '🔄', desc: 'Reflect 20% of incoming damage back.' },
          { id: 'd_fortress', name: 'Fortress Stance', type: 'Active', icon: '🏯', desc: 'Enter a stance: take 70% less damage for 5s.' },
        ],
        weaponUnlock: { name: 'War Blades', icon: '⚔️', bonus: '+40% Defense, Reflect Passive' },
        abilityUnlock: { name: 'Twin Fang Combo', icon: '⚡', desc: '3-hit simultaneous counter combo' },
      },
      {
        level: 20,
        label: 'Warden',
        nodes: [
          { id: 'd_immortal', name: 'Immortal Guard', type: 'Passive', icon: '✨', desc: 'Once per fight: survive a killing blow with 1 HP.' },
          { id: 'd_shockwave', name: 'Shockwave Slash', type: 'Ultimate', icon: '💥', desc: 'Release shockwave dealing 180% damage to all nearby enemies.' },
        ],
        weaponUnlock: { name: 'Mythic War Blades', icon: '✨', bonus: '+80% Defense, Immortal Passive' },
        abilityUnlock: { name: 'Iron Stance', icon: '🏰', desc: 'Permanent passive: +50% defense' },
      },
    ],
  },
  damage: {
    tiers: [
      {
        level: 1,
        label: 'Brawler',
        nodes: [
          { id: 'o_power', name: 'Raw Power', type: 'Passive', icon: '💪', desc: 'Increases attack damage by 15%.' },
          { id: 'o_cleave', name: 'Cleave', type: 'Active', icon: '⚔️', desc: 'Hit all enemies in front of you.' },
        ],
        weaponUnlock: null,
        abilityUnlock: null,
      },
      {
        level: 5,
        label: 'Warrior',
        nodes: [
          { id: 'o_heavy', name: 'Heavy Strike', type: 'Active', icon: '🪨', desc: 'Deal 130% damage and stagger the target.' },
          { id: 'o_fury', name: 'Battle Fury', type: 'Passive', icon: '🔥', desc: 'Each kill increases damage by 5% (stacks up to 5x).' },
        ],
        weaponUnlock: { name: 'Greatsword', icon: '⚔️', bonus: '+25% Offense Damage' },
        abilityUnlock: null,
      },
      {
        level: 10,
        label: 'Berserker',
        nodes: [
          { id: 'o_triple', name: 'Triple Cleave', type: 'Active', icon: '🌀', desc: '3 rapid heavy strikes, each dealing 80% damage.' },
          { id: 'o_bloodlust', name: 'Bloodlust', type: 'Passive', icon: '🩸', desc: 'Lifesteal 15% of all damage dealt.' },
        ],
        weaponUnlock: { name: 'Heavy Greatsword', icon: '🗡️', bonus: '+50% Damage, +Lifesteal' },
        abilityUnlock: { name: 'Heavy Impact', icon: '🪨', desc: 'Single devastating 130% burst strike' },
      },
      {
        level: 20,
        label: 'Destroyer',
        nodes: [
          { id: 'o_brutal', name: 'Brutal Force', type: 'Passive', icon: '📈', desc: '+25% total damage across all attacks.' },
          { id: 'o_devastate', name: 'Devastate', type: 'Ultimate', icon: '💥', desc: 'Unleash a catastrophic strike dealing 300% weapon damage.' },
        ],
        weaponUnlock: { name: 'Mythic Greatsword', icon: '✨', bonus: '+100% Damage, Ultimate Ability' },
        abilityUnlock: { name: 'Brutal Force', icon: '📈', desc: 'Permanent passive: +25% all damage' },
      },
    ],
  },
};

// Current player level (mock — would come from progression store in full impl)
const MOCK_PLAYER_LEVEL = 8;

function TierRow({ tier, isUnlocked, isCurrentTier }) {
  const [expanded, setExpanded] = useState(isCurrentTier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-all ${
        isUnlocked
          ? isCurrentTier
            ? 'border-amber-400/50 bg-amber-500/10'
            : 'border-white/10 bg-white/[0.03]'
          : 'border-white/5 bg-white/[0.02] opacity-50'
      }`}
    >
      {/* Tier Header */}
      <button
        onClick={() => isUnlocked && setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        disabled={!isUnlocked}
      >
        <div className="flex items-center gap-3">
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-amber-400" />
          ) : (
            <Lock className="w-4 h-4 text-white/30" />
          )}
          <div>
            <span className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
              {tier.label}
            </span>
            <span className="text-white/30 text-[10px] ml-2">Lvl {tier.level}+</span>
          </div>
          {isCurrentTier && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-wider uppercase">
              Current
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Tier Content */}
      <AnimatePresence>
        {expanded && isUnlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Skill Nodes */}
              <div className="grid grid-cols-2 gap-2">
                {tier.nodes.map(node => (
                  <div key={node.id} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{node.icon}</span>
                      <span className="text-white text-xs font-semibold">{node.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 ml-auto">{node.type}</span>
                    </div>
                    <p className="text-white/50 text-[10px] leading-relaxed">{node.desc}</p>
                  </div>
                ))}
              </div>

              {/* Weapon Unlock */}
              {tier.weaponUnlock && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                  <span className="text-xl">{tier.weaponUnlock.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Sword className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-300 text-xs font-bold">Weapon Unlock: {tier.weaponUnlock.name}</span>
                    </div>
                    <p className="text-amber-200/60 text-[10px] mt-0.5">{tier.weaponUnlock.bonus}</p>
                  </div>
                </div>
              )}

              {/* Ability Unlock */}
              {tier.abilityUnlock && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                  <span className="text-xl">{tier.abilityUnlock.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-300 text-xs font-bold">Ability Unlock: {tier.abilityUnlock.name}</span>
                    </div>
                    <p className="text-cyan-200/60 text-[10px] mt-0.5">{tier.abilityUnlock.desc}</p>
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

export default function TalentsTab({ state }) {
  const activeTreeId = state.selectedTalentTree;
  const activeTree = TALENT_TREES.find(t => t.id === activeTreeId);
  const weaponPath = activeTree ? WEAPON_PATHS.find(p => p.id === activeTree.weaponPath) : null;
  const skillTree = activeTree ? PATH_SKILL_TREES[activeTree.weaponPath] : null;
  const playerLevel = MOCK_PLAYER_LEVEL;

  return (
    <>
      {/* Left: Tree Picker */}
      <div className="absolute left-6 top-24 w-[200px] pointer-events-auto space-y-2">
        <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-3">Weapon Class</div>
        {TALENT_TREES.map((t) => {
          const active = activeTreeId === t.id;
          const path = WEAPON_PATHS.find(p => p.id === t.weaponPath);
          return (
            <button
              key={t.id}
              onClick={() => setSelected('selectedTalentTree', t.id)}
              className="w-full text-left px-3 py-3 rounded-xl border transition-all"
              style={active ? {
                background: `${t.color}18`,
                borderColor: `${t.color}55`,
                boxShadow: `0 0 16px ${t.color}22`,
              } : {
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.10)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className={`font-bold text-sm ${active ? 'text-white' : 'text-white/70'}`}>{t.label}</span>
              </div>
              {path && (
                <p className="text-white/35 text-[10px] leading-snug pl-7">{path.subtitle}</p>
              )}
            </button>
          );
        })}

        {/* Weapon Mastery Link */}
        <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1.5">Tied to</div>
          <div className="flex items-center gap-2 text-white/60 text-[10px]">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Weapon Mastery (C key)</span>
          </div>
          <p className="text-white/30 text-[9px] mt-1.5 leading-relaxed">
            Enchanting your weapon and leveling weapon mastery both contribute to unlocking tiers here.
          </p>
        </div>
      </div>

      {/* Right: Skill Tree */}
      <div className="absolute left-[240px] right-6 top-24 bottom-20 pointer-events-auto overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
        {weaponPath && skillTree && (
          <>
            {/* Path Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{weaponPath.icon}</span>
              <div>
                <h2 className="text-white font-bold text-lg">{weaponPath.name}</h2>
                <p className="text-white/45 text-xs">{weaponPath.focus}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-white/40 text-[10px] uppercase tracking-wider">Player Level</div>
                <div className="text-amber-400 font-bold text-lg">{playerLevel}</div>
              </div>
            </div>

            {/* Passive Bonus */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg border mb-4"
              style={{ background: `${weaponPath.color}12`, borderColor: `${weaponPath.color}40` }}
            >
              <span className="text-xl">{weaponPath.passive.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{weaponPath.passive.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{ color: weaponPath.color, borderColor: `${weaponPath.color}44`, background: `${weaponPath.color}11` }}>
                    Path Passive
                  </span>
                </div>
                <p className="text-white/55 text-xs mt-0.5">{weaponPath.passive.description}</p>
              </div>
            </div>

            {/* Tier Skill Trees */}
            <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-3">Skill Tree — Progression Tiers</div>
            <div className="space-y-3">
              {skillTree.tiers.map((tier, i) => {
                const isUnlocked = playerLevel >= tier.level;
                const nextTier = skillTree.tiers[i + 1];
                const isCurrentTier = isUnlocked && (!nextTier || playerLevel < nextTier.level);
                return (
                  <TierRow
                    key={tier.level}
                    tier={tier}
                    isUnlocked={isUnlocked}
                    isCurrentTier={isCurrentTier}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}