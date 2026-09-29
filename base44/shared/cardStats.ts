import { bounded, finite } from './combatStats.ts';
import { addStats, cardGrowthMultiplier, cardStatMultiplier, normalizeProgression } from './cardSystem.ts';
type Row = Record<string, any>;

const ranks: Row = {
  Common:0, Uncommon:1, Rare:2, Epic:3, Legendary:4, Demigod:5,
  Mythic:5, Mythical:6, Deity:7, Unique:6, Chosen:8, Limitless:8,
};
const aliases: Record<string, string[]> = {
  attack:['attack','strength','damage'], defense:['defense','armor'], magic:['magic','spirit','focus'],
  vitality:['vitality','health','hp'], speed:['speed','dexterity'],
};
export const CARD_STAT_KEYS = ['attack','defense','magic','vitality','speed'];
const extraKeys = ['dodge','accuracy','crit_chance','crit_damage','armor_penetration','damage_percent','defense_percent','ability_damage_percent','cooldown_reduction','tenacity'];

export function normalizedCardBaseStats(card: Row = {}, achievement: Row = {}, definition: Row | null = null) {
  const rank = ranks[card.playable_tier || definition?.playable_tier || card.card_rarity || definition?.rarity || achievement?.rarity || 'Rare'] ?? 2;
  const source = definition?.stats || achievement?.reward?.stats || {};
  const defaults: Row = { attack:18+rank*5, defense:14+rank*4, magic:12+rank*4, vitality:16+rank*4, speed:10+rank*3 };
  const out: Row = {};
  for (const [key, names] of Object.entries(aliases)) {
    const name = names.find(name => source[name] !== undefined && Number.isFinite(Number(source[name])));
    out[key] = bounded(name ? source[name] : defaults[key], 0, 100000);
  }
  for (const key of extraKeys) if (source[key] !== undefined) out[key] = bounded(source[key], 0, 100000);
  return out;
}

export function effectiveCardStats(progression: Row | null = null, base: Row = {}) {
  const p = normalizeProgression(progression);
  const source = p.base_stats && Object.keys(p.base_stats).length ? p.base_stats : base;
  const earned = addStats(p.permanent_stats || {}, p.current_cycle_stats || {});
  const statMultiplier = cardStatMultiplier(p);
  const stats: Row = {};
  for (const key of [...CARD_STAT_KEYS, ...extraKeys]) {
    const names = aliases[key] || [key];
    const baseKey = names.find(name => source[name] !== undefined);
    const earnedValue = names.reduce((sum,name) => sum + finite(earned?.[name]),0);
    const raw = Math.max(0, finite(baseKey ? source[baseKey] : 0) + earnedValue);
    stats[key] = Math.round(bounded(raw * (CARD_STAT_KEYS.includes(key) ? statMultiplier : 1),0,100000) * 100) / 100;
  }
  const power = Math.round(CARD_STAT_KEYS.reduce((sum,key) => sum + stats[key],0));
  return {
    stats,
    growth_multiplier: cardGrowthMultiplier(p),
    stat_multiplier: statMultiplier,
    power_score: power,
    enhancement_percent: p.enhancement_percent,
    ascension: p.ascension,
    stack_level: p.stack_level,
    permanent_stats: p.permanent_stats,
    current_cycle_stats: p.current_cycle_stats,
    mastery_visual: p.mastery_visual,
    system_version: p.system_version,
  };
}
