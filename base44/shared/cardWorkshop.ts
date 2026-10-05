import { effectiveCardStats, CARD_STAT_KEYS } from './cardStats.ts';
type Row = Record<string, any>;

// Quotes and mutations share these terms. The server still validates ownership,
// match/trade locks, materials and prerequisites on every action.
export function cardWorkshop(p: Row, card: Row, recipes: Row[] = []) {
  const level = Number(p.level || 1), stage = Number(p.stage || 1);
  const ascension = Number(p.ascension || 0), rank = Number(p.over_enchant_rank || 0);
  const nodes = p.unlocked_skill_nodes || [];
  const power = (patch: Row) => effectiveCardStats({ ...p, ...patch }).power_score;
  const enhance: Row = {};
  for (const stat of CARD_STAT_KEYS) {
    const current = Number(p.enhanced_stats?.[stat] || 0);
    const tier = Math.floor(current / 10) + 1;
    const gain = 3 + Math.floor(stage / 2) + (nodes.includes('resonant_edge') ? 1 : 0);
    enhance[stat] = { costs: { precision_shard: tier, combat_core: Math.max(1, Math.ceil(tier / 2)) }, gain,
      power_after: power({ enhanced_stats: { ...p.enhanced_stats, [stat]: current + gain } }) };
  }
  const slots = 1 + Math.floor(stage / 2) + Math.min(2, ascension);
  const used = (p.enchantments || []).reduce((sum: number, item: Row) => sum + Math.max(1, Number(item.slot_cost || 1)), 0);
  const nextAscension = ascension + 1;
  return {
    training: { costs: { skill_catalyst: 1 }, xp_gain: 50 + Math.max(1, stage) * 10 },
    level: { power_after: power({ level: level + 1 }), stat_points: 1, skill_points: 1 },
    enhance,
    divine: { needed: Math.min(3, stage + 1), next_stage: stage + 1, max: 5, wildcard_costs: { wildcard: 1 }, power_after: power({ stage: stage + 1 }) },
    ascension: { next_rank: nextAscension, max: 5, costs: { ascension_core: nextAscension }, next_cap: Number(p.max_level || 10) + 10, power_after: power({ ascension: nextAscension }) },
    sockets: { total: slots, used },
    over_enchant: { next_rank: rank + 1, max: 5, costs: { adaptive_shard: rank + 1 },
      success_chance: Math.max(35, Math.min(95, 82 - rank * 12 + stage * 2 + (nodes.includes('enchanter_focus') ? 8 : 0))),
      gain: 2 * (rank + 1), stability_loss_success: 5, stability_loss_failure: 15 },
    recipes: recipes.filter((recipe) => {
      const types = Array.isArray(recipe.allowed_item_types) ? recipe.allowed_item_types : [];
      return ['core','gem','rune'].includes(recipe.socket_type || 'gem') && (!types.length || types.some((type: string) => ['all','any',String(card.card_type || '').toLowerCase()].includes(type.toLowerCase())));
    }).map(recipe => ({ ...recipe, socket_type: recipe.socket_type || 'gem', slot_cost: Number(recipe.slot_cost ?? 1),
      costs: Object.fromEntries(Object.entries(recipe.material_cost && Object.keys(recipe.material_cost).length ? recipe.material_cost : { resonance_fragment: 1 }).map(([key, value]) => [key, Math.max(1, Number(value) || 1)])) }))
  };
}

export function compatibleFusionCard(target: Row, candidate: Row) {
  const ranks: Row = { Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4,Mythic:5,Mythical:5,Unique:6,Limitless:7 };
  return candidate.id !== target.id && !candidate.starter_grant_user_id && !candidate.is_equipped &&
    candidate.trade_status !== 'locked_in_trade' && Number(candidate.quantity ?? 1) > 0 &&
    (candidate.card_name === target.card_name || (candidate.game_name === target.game_name &&
      (ranks[candidate.card_rarity] || 0) >= Math.max(0, (ranks[target.card_rarity] || 0) - 1)));
}
