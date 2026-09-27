import { bounded, finite } from './combatStats.ts';
type Row = Record<string, any>;
const ranks: Row = { Common:0, Uncommon:1, Rare:2, Epic:3, Legendary:4, Mythic:5, Mythical:5, Unique:6, Limitless:7 };
const aliases: Record<string, string[]> = {
  attack:['attack','strength','damage'], defense:['defense','armor'], magic:['magic','spirit','focus'],
  vitality:['vitality','health','hp'], speed:['speed','dexterity'],
};
export const CARD_STAT_KEYS = ['attack','defense','magic','vitality','speed'];
const extraKeys = ['dodge','accuracy','crit_chance','crit_damage','armor_penetration','damage_percent','defense_percent','ability_damage_percent','cooldown_reduction','tenacity'];
export function normalizedCardBaseStats(card: Row = {}, achievement: Row = {}, definition: Row | null = null) {
  const rank = ranks[card.card_rarity || definition?.rarity || achievement?.rarity || 'Common'] || 0;
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
  const p = progression || {};
  const source = p.base_stats && Object.keys(p.base_stats).length ? p.base_stats : base;
  const multiplier = Math.min(6, 1 + (bounded(p.level ?? 1,1,60)-1)*0.055 + (bounded(p.stage ?? 1,1,5)-1)*0.12 + bounded(p.ascension,0,5)*0.18 + bounded(p.over_enchant_rank,0,5)*0.05 + ((p.unlocked_skill_nodes || []).includes('core_calibration') ? 0.03 : 0) + ((p.unlocked_skill_nodes || []).includes('avatar_sync') ? 0.05 : 0));
  const stats: Row = {};
  for (const key of [...CARD_STAT_KEYS, ...extraKeys]) {
    const names = aliases[key] || [key];
    const baseKey = names.find(name => source[name] !== undefined);
    const enhancement = names.reduce((sum,name) => sum + finite(p.enhanced_stats?.[name]),0);
    const enchantment = (p.enchantments || []).reduce((sum:number,e:Row) => sum + names.reduce((s,name) => s + finite(e.modifiers?.[name]),0),0);
    const raw = Math.max(0, finite(baseKey ? source[baseKey] : 0) + enhancement + enchantment);
    stats[key] = Math.round(bounded(raw * (CARD_STAT_KEYS.includes(key) ? multiplier : 1),0,100000) * 100) / 100;
  }
  const power = Math.round(CARD_STAT_KEYS.reduce((sum,key) => sum + stats[key],0));
  return { stats, growth_multiplier: Math.round(multiplier*10000)/10000, power_score: power };
}
