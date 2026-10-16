// Runtime equipment-stat resolver.
// Bridges real owned/equipped item instances into the live player combat model.
// Every equipment service (reinforcement, enchant, over-enchant, combine, stage,
// refine, ultimate, sockets/gems, aura and sets) feeds this one calculation.

import { getEquippedAXEItems } from './AXEEquipmentInventoryStore';
import { getItemEnchantments, getItemOverEnchant, getItemReinforcement } from '../../equipment/enchantmentStore';
import { getAXEEnhancementStatMultiplier } from './AXEItemEnhancementSystem';
import { getAXEAdvancementState } from './AXEItemAdvancementStore';
import { getAXESocketState } from './AXESocketGemStore';
import { collectAXEGemStats } from './AXESocketGemSystem';
import { getAXEItemAura } from './AXEEquipmentAuraStore';
import { collectAXEAuraStats } from './AXEEquipmentAuraSystem';
import { evaluateAXESetBonuses } from './AXESetBonusSystem';
import { evaluateAXEAuxiliaryBonuses } from './AXEAuxiliaryGearSystem';

// Provisional balance only. The important backend contract is that each
// advancement path has a deterministic, centralized contribution to real stats.
export const AXE_ADVANCEMENT_STAT_CONFIG = Object.freeze({
  combinePerSuccess: 0.02,
  stagePerRank: 0.08,
  refinePerLevel: 0.025,
  ultimatePerLevel: 0.04,
});

function advancementMultiplier(record = {}) {
  return 1
    + Math.max(0, Number(record.combine?.count || 0)) * AXE_ADVANCEMENT_STAT_CONFIG.combinePerSuccess
    + Math.max(0, Number(record.stage?.rank || 0)) * AXE_ADVANCEMENT_STAT_CONFIG.stagePerRank
    + Math.max(0, Number(record.refine?.level || 0)) * AXE_ADVANCEMENT_STAT_CONFIG.refinePerLevel
    + Math.max(0, Number(record.ultimate?.level || 0)) * AXE_ADVANCEMENT_STAT_CONFIG.ultimatePerLevel;
}

const makeOutput = () => ({
  attr: {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    focus: 0,
    spirit: 0,
  },
  flat: {
    hp: 0,
    chi: 0,
    damage: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    criticalDefense: 0,
    attributionAttack: 0,
    attributionDefense: 0,
    attackSuccess: 0,
    attackBlock: 0,
  },
  multipliers: {
    damagePct: 0,
    defensePct: 0,
    hpPct: 0,
    chiPct: 0,
  },
  items: [],
  activeSets: [],
  activeAuxSets: [],
});

function addStat(out, key, rawValue, scale = 1) {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value === 0) return;
  const scaled = value * scale;

  switch (key) {
    case 'strength':
      out.attr.strength += scaled; break;
    case 'dexterity':
    case 'agility':
      out.attr.dexterity += scaled; break;
    case 'constitution':
    case 'vitality':
      out.attr.constitution += scaled; break;
    case 'focus':
    case 'spirit':
      out.attr.focus += scaled;
      out.attr.spirit += scaled;
      break;

    case 'attack':
    case 'damage':
    case 'attackPower':
    case 'physicalAttack':
      out.flat.damage += scaled; break;
    case 'defense':
    case 'defensePower':
      out.flat.defense += scaled; break;
    case 'hp':
    case 'maxHP':
      out.flat.hp += scaled; break;
    case 'chi':
    case 'maxChi':
    case 'mana':
      out.flat.chi += scaled; break;
    case 'critChance':
    case 'criticalChance':
      out.flat.critChance += scaled; break;
    // Equipment data (items, sets, auxiliary gear, item auras) writes crit damage and crit
    // defense in percentage points; the stat sheet uses ratios (0.10 = +10%). Values below 1
    // were read as ratios before, so a 0.5% item gave 50% crit defense.
    case 'critDamage':
    case 'criticalDamage':
      out.flat.critDamage += scaled / 100; break;
    case 'critDefense':
    case 'criticalDefense':
      out.flat.criticalDefense += scaled / 100;
      break;
    case 'attributeAttack':
    case 'attributionAttack':
      out.flat.attributionAttack += scaled; break;
    case 'attributeDefense':
    case 'attributionDefense':
      out.flat.attributionDefense += scaled; break;
    case 'accuracy':
    case 'attackSuccess':
      out.flat.attackSuccess += scaled; break;
    case 'evasion':
    case 'attackBlock':
      out.flat.attackBlock += scaled; break;

    case 'attackPct':
    case 'damagePct':
      out.multipliers.damagePct += scaled; break;
    case 'defensePct':
      out.multipliers.defensePct += scaled; break;
    case 'maxHPPct':
    case 'hpPct':
      out.multipliers.hpPct += scaled; break;
    case 'maxChiPct':
    case 'chiPct':
      out.multipliers.chiPct += scaled; break;
    default:
      break;
  }
}

// Percentage stats (crit chance, crit damage, crit defense, +x% stats) are rates: item level,
// rarity rolls and upgrades scale flat stats, never these. A ring's 0.5% crit used to grow
// with every upgrade until one ring gave about half a hero's crit chance.
export const AXE_RATE_STATS = Object.freeze(new Set([
  'critChance', 'criticalChance', 'critDamage', 'criticalDamage', 'critDefense', 'criticalDefense',
  'attackPct', 'damagePct', 'defensePct', 'hpPct', 'maxHPPct', 'chiPct', 'maxChiPct',
]));
export const isAXERateStat = (key) => AXE_RATE_STATS.has(key);

function addStats(out, stats = {}, scale = 1) {
  for (const [key, value] of Object.entries(stats || {})) addStat(out, key, value, isAXERateStat(key) ? 1 : scale);
}

export function getAXEEquipmentRuntimeBonuses() {
  const out = makeOutput();
  const equipped = getEquippedAXEItems();

  const liveItems = equipped.map((item) => {
    const itemId = item.instanceId;
    const reinforcement = getItemReinforcement(itemId);
    const enchantments = getItemEnchantments(itemId);
    const overEnchant = getItemOverEnchant(itemId);
    const advancement = getAXEAdvancementState(itemId);
    const enhancementMult = getAXEEnhancementStatMultiplier({
      reinforcement,
      enchantments,
      overEnchant,
    });
    const advancementMult = advancementMultiplier(advancement);
    const coreScale = enhancementMult * advancementMult;
    const socketState = getAXESocketState(itemId);
    const aura = getAXEItemAura(itemId);

    addStats(out, item.baseStats, coreScale);
    addStats(out, item.rolledStats, coreScale);
    addStats(out, collectAXEGemStats({ ...item, ...socketState }), 1);
    addStats(out, collectAXEAuraStats(aura), 1);

    const liveItem = {
      ...item,
      sockets: socketState.sockets,
      maxSockets: socketState.maxSockets,
      aura,
      reinforcement,
      enchantments,
      overEnchant,
      advancement,
    };

    out.items.push({
      itemId,
      name: item.name,
      slot: item.slot,
      enhancementMultiplier: enhancementMult,
      advancementMultiplier: advancementMult,
      finalCoreMultiplier: coreScale,
    });
    return liveItem;
  });

  // Set and auxiliary threshold bonuses are applied after per-piece scaling.
  const sets = evaluateAXESetBonuses(liveItems);
  addStats(out, sets.stats, 1);
  out.activeSets = sets.activeSets || [];

  const auxiliary = evaluateAXEAuxiliaryBonuses(liveItems);
  addStats(out, auxiliary.setStats, 1);
  out.activeAuxSets = auxiliary.activeSets || [];

  return out;
}

export function applyAXEEquipmentFinalMultipliers(derived, multipliers = {}) {
  if (!derived) return derived;
  const damageMult = 1 + Math.max(-0.95, Number(multipliers.damagePct || 0) / 100);
  const defenseMult = 1 + Math.max(-0.95, Number(multipliers.defensePct || 0) / 100);
  const hpMult = 1 + Math.max(-0.95, Number(multipliers.hpPct || 0) / 100);
  const chiMult = 1 + Math.max(-0.95, Number(multipliers.chiPct || 0) / 100);

  const damage = Math.max(1, Math.round(Number(derived.damage || derived.totalDamage || 1) * damageMult));
  return {
    ...derived,
    damage,
    totalDamage: damage,
    physicalDamage: Math.max(1, Math.round(Number(derived.physicalDamage || damage) * damageMult)),
    defense: Math.max(0, Number(derived.defense || 0) * defenseMult),
    maxHP: Math.max(1, Math.round(Number(derived.maxHP || 1) * hpMult)),
    chi: Math.max(0, Math.round(Number(derived.chi || 0) * chiMult)),
    equipmentMultipliers: {
      damagePct: Number(multipliers.damagePct || 0),
      defensePct: Number(multipliers.defensePct || 0),
      hpPct: Number(multipliers.hpPct || 0),
      chiPct: Number(multipliers.chiPct || 0),
    },
  };
}
