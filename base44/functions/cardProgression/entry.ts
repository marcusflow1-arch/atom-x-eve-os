import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;

const SKILL_TREE = [
  { id: 'core_calibration', name: 'Core Calibration', lane: 'Core', cost: 1, minLevel: 1, minStage: 1, prerequisite: null, perk: false, effect: '+3% base card power' },
  { id: 'precision_memory', name: 'Precision Memory', lane: 'Core', cost: 1, minLevel: 2, minStage: 1, prerequisite: 'core_calibration', perk: true, effect: '+5% critical precision when equipped' },
  { id: 'adaptive_tempo', name: 'Adaptive Tempo', lane: 'Core', cost: 2, minLevel: 4, minStage: 1, prerequisite: 'precision_memory', perk: true, effect: 'Cooldown recovery improves after repeated use' },
  { id: 'resonant_edge', name: 'Resonant Edge', lane: 'Forge', cost: 1, minLevel: 3, minStage: 2, prerequisite: 'core_calibration', perk: false, effect: 'Enhancements gain +1 bonus stat' },
  { id: 'enchanter_focus', name: 'Enchanter Focus', lane: 'Forge', cost: 2, minLevel: 6, minStage: 2, prerequisite: 'resonant_edge', perk: true, effect: '+8% over-enchant success chance' },
  { id: 'fusion_echo', name: 'Fusion Echo', lane: 'Forge', cost: 2, minLevel: 8, minStage: 3, prerequisite: 'enchanter_focus', perk: true, effect: 'Staged cards retain more resonance after combination' },
  { id: 'avatar_sync', name: 'Avatar Sync', lane: 'Avatar', cost: 1, minLevel: 5, minStage: 1, prerequisite: 'core_calibration', perk: false, effect: 'Strengthens the reward when mapped to the AI avatar' },
  { id: 'living_reflex', name: 'Living Reflex', lane: 'Avatar', cost: 2, minLevel: 7, minStage: 2, prerequisite: 'avatar_sync', perk: true, effect: 'AI avatar receives a reactive combat modifier' },
  { id: 'signature_expression', name: 'Signature Expression', lane: 'Avatar', cost: 3, minLevel: 10, minStage: 3, prerequisite: 'living_reflex', perk: true, effect: 'Unlocks this card’s signature expression on the avatar' }
];

const rarityRank: Record<string, number> = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5, Mythical: 5, Unique: 6, Limitless: 7 };

function xpToNext(level: number, ascension = 0) {
  return Math.floor(100 + Math.pow(Math.max(1, level), 1.55) * 38 + ascension * 75);
}

function normalizedBaseStats(userCard: AnyObj, achievement: AnyObj | null) {
  const source = achievement?.reward?.stats || {};
  const pick = (keys: string[], fallback: number) => {
    for (const key of keys) {
      const found = Object.entries(source).find(([k]) => k.toLowerCase() === key.toLowerCase());
      if (found && Number.isFinite(Number(found[1]))) return Number(found[1]);
    }
    return fallback;
  };
  const rarity = rarityRank[userCard.card_rarity] || 0;
  return {
    attack: pick(['attack', 'strength', 'damage'], 18 + rarity * 5),
    defense: pick(['defense', 'armor'], 14 + rarity * 4),
    magic: pick(['magic', 'spirit', 'focus'], 12 + rarity * 4),
    vitality: pick(['vitality', 'health', 'hp'], 16 + rarity * 4),
    speed: pick(['speed', 'dexterity'], 10 + rarity * 3)
  };
}

function calcPower(p: AnyObj) {
  const base = p.base_stats || {};
  const enhanced = p.enhanced_stats || {};
  const statTotal = ['attack', 'defense', 'magic', 'vitality', 'speed'].reduce((sum, key) => sum + Number(base[key] || 0) + Number(enhanced[key] || 0), 0);
  const enchantBonus = (p.enchantments || []).reduce((sum: number, e: AnyObj) => sum + Object.values(e.modifiers || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0), 0);
  const multiplier = 1 + (Math.max(1, p.level) - 1) * 0.055 + (Math.max(1, p.stage) - 1) * 0.12 + Number(p.ascension || 0) * 0.18 + Number(p.over_enchant_rank || 0) * 0.05;
  return Math.round((statTotal + enchantBonus) * multiplier);
}

function publicProgression(p: AnyObj) {
  return { ...p, power_score: calcPower(p) };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body?.action || 'getState';
    const payload = body?.payload || {};
    let userCardId = body?.userCardId || payload?.userCardId;
    const achievementId = body?.achievementId || payload?.achievementId;

    let achievement: AnyObj | null = null;
    if (achievementId) {
      achievement = await base44.asServiceRole.entities.Achievement.get(achievementId).catch(() => null);
    }

    let userCard: AnyObj | null = null;
    if (userCardId) {
      userCard = await base44.asServiceRole.entities.UserCard.get(userCardId).catch(() => null);
      if (!userCard || userCard.user_id !== user.id) return Response.json({ error: 'Card not found in your inventory' }, { status: 404 });
    }

    if (!userCard && achievement) {
      const unlocked = (user.unlocked_achievements || []).includes(achievement.id) || (await base44.asServiceRole.entities.UserAchievement.filter({ user_id: user.id, achievement_id: achievement.id }, null, 1)).length > 0;
      if (!unlocked) return Response.json({ error: 'Achievement must be unlocked before its card can progress' }, { status: 403 });
      const rewardName = achievement?.reward?.name || achievement.title;
      const existing = await base44.asServiceRole.entities.UserCard.filter({ user_id: user.id, card_name: rewardName }, '-created_date', 1);
      userCard = existing[0] || await base44.asServiceRole.entities.UserCard.create({
        user_id: user.id,
        card_type: achievement.category === 'equipment' ? 'Equipment' : achievement.category === 'companion' ? 'Companion' : achievement.category === 'ability' ? 'Ability' : 'Achievement',
        card_name: rewardName,
        card_rarity: achievement.rarity === 'Mythical' ? 'Mythic' : (achievement.rarity || 'Common'),
        card_image: payload?.cardImage || '',
        game_name: achievement.game,
        game_id: payload?.gameId || '',
        genre: payload?.genre || '',
        acquisition_method: 'unlocked',
        unlocked_date: new Date().toISOString(),
        is_equipped: false,
        trade_status: 'available'
      });
      userCardId = userCard.id;
    }

    if (!userCard) return Response.json({ error: 'A valid owned card or unlocked achievement is required' }, { status: 400 });

    if (!achievement && body?.achievementId) achievement = await base44.asServiceRole.entities.Achievement.get(body.achievementId).catch(() => null);

    let rows = await base44.asServiceRole.entities.CardProgression.filter({ user_id: user.id, user_card_id: userCard.id }, '-created_date', 1);
    let progression: AnyObj = rows[0];
    if (!progression) {
      const baseStats = normalizedBaseStats(userCard, achievement);
      progression = await base44.asServiceRole.entities.CardProgression.create({
        user_id: user.id,
        user_card_id: userCard.id,
        trading_card_id: userCard.trading_card_id || '',
        achievement_id: achievementId || '',
        card_name: userCard.card_name,
        game_id: userCard.game_id || payload?.gameId || '',
        game_name: userCard.game_name || achievement?.game || '',
        level: 1,
        xp: 0,
        xp_to_next: xpToNext(1, 0),
        stage: 1,
        stars: 1,
        ascension: 0,
        max_level: 10,
        skill_points: 1,
        unlocked_skill_nodes: [],
        active_perks: [],
        enchantments: [],
        over_enchant_rank: 0,
        over_enchant_stability: 100,
        enhanced_stats: {},
        base_stats: baseStats,
        power_score: Object.values(baseStats).reduce((s: number, v: any) => s + Number(v || 0), 0),
        last_action: 'created',
        last_action_at: new Date().toISOString(),
        revision: 1
      });
      await base44.asServiceRole.entities.CardProgressionEvent.create({ user_id: user.id, user_card_id: userCard.id, progression_id: progression.id, event_type: 'created', summary: 'Card progression initialized', before: {}, after: publicProgression(progression), metadata: {} });
    }

    const materialsForUser = async () => {
      const [stacks, defs] = await Promise.all([
        base44.asServiceRole.entities.UserMaterial.filter({ user_id: user.id }, '-updated_date', 500),
        base44.asServiceRole.entities.Material.list('name', 500)
      ]);
      const defMap = new Map(defs.map((d: AnyObj) => [d.id, d]));
      return stacks.map((stack: AnyObj) => ({ ...stack, definition: defMap.get(stack.material_id) || null }));
    };

    const spend = async (requirements: Record<string, number>) => {
      const stacks = await base44.asServiceRole.entities.UserMaterial.filter({ user_id: user.id }, '-updated_date', 500);
      const byType = new Map<string, AnyObj[]>();
      for (const stack of stacks) {
        const key = stack.material_type || '';
        byType.set(key, [...(byType.get(key) || []), stack]);
      }
      for (const [type, qty] of Object.entries(requirements)) {
        const available = (byType.get(type) || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0);
        if (available < qty) throw new Error(`Need ${qty} ${type.replaceAll('_', ' ')}; you have ${available}`);
      }
      for (const [type, qtyValue] of Object.entries(requirements)) {
        let remaining = Number(qtyValue);
        for (const row of (byType.get(type) || [])) {
          if (remaining <= 0) break;
          const use = Math.min(remaining, Number(row.quantity || 0));
          await base44.asServiceRole.entities.UserMaterial.update(row.id, { quantity: Math.max(0, Number(row.quantity || 0) - use) });
          remaining -= use;
        }
      }
    };

    const record = async (eventType: string, before: AnyObj, after: AnyObj, summary: string, metadata: AnyObj = {}) => {
      await base44.asServiceRole.entities.CardProgressionEvent.create({ user_id: user.id, user_card_id: userCard.id, progression_id: progression.id, event_type: eventType, summary, before, after, metadata });
    };

    const commit = async (patch: AnyObj, eventType: string, summary: string, metadata: AnyObj = {}) => {
      const before = publicProgression(progression);
      const next = { ...progression, ...patch, last_action: eventType, last_action_at: new Date().toISOString(), revision: Number(progression.revision || 0) + 1 };
      next.power_score = calcPower(next);
      progression = await base44.asServiceRole.entities.CardProgression.update(progression.id, next);
      await record(eventType, before, publicProgression(progression), summary, metadata);
      return progression;
    };

    if (action === 'train') {
      const sessions = Math.max(1, Math.min(10, Number(payload?.sessions || 1)));
      await spend({ skill_catalyst: sessions });
      const gain = sessions * (50 + Math.max(1, progression.stage) * 10);
      await commit({ xp: Number(progression.xp || 0) + gain }, 'trained', `Training added ${gain} card XP`, { sessions, gain });
    } else if (action === 'levelUp') {
      if (progression.level >= progression.max_level) throw new Error('Level cap reached. Ascend the card to raise its cap.');
      const need = Number(progression.xp_to_next || xpToNext(progression.level, progression.ascension));
      if (Number(progression.xp || 0) < need) throw new Error(`Need ${need - Number(progression.xp || 0)} more card XP`);
      const newLevel = Number(progression.level) + 1;
      await commit({ level: newLevel, xp: Number(progression.xp) - need, xp_to_next: xpToNext(newLevel, progression.ascension), skill_points: Number(progression.skill_points || 0) + 1 }, 'level_up', `Card reached level ${newLevel}`, { previous_level: progression.level });
    } else if (action === 'enhance') {
      const stat = String(payload?.stat || 'attack').toLowerCase();
      if (!['attack', 'defense', 'magic', 'vitality', 'speed'].includes(stat)) throw new Error('Invalid stat');
      const current = Number(progression.enhanced_stats?.[stat] || 0);
      const tier = Math.floor(current / 10) + 1;
      await spend({ precision_shard: tier, combat_core: Math.max(1, Math.ceil(tier / 2)) });
      const gain = 3 + Math.floor(Number(progression.stage || 1) / 2) + ((progression.unlocked_skill_nodes || []).includes('resonant_edge') ? 1 : 0);
      await commit({ enhanced_stats: { ...(progression.enhanced_stats || {}), [stat]: current + gain } }, 'enhance', `${stat} enhanced by +${gain}`, { stat, gain });
    } else if (action === 'combine') {
      if (Number(progression.stage || 1) >= 5) throw new Error('This card is already at the maximum combination stage');
      const sacrificeIds = Array.isArray(payload?.sacrificeUserCardIds) ? payload.sacrificeUserCardIds.filter(Boolean) : [];
      const needed = Math.min(3, Number(progression.stage || 1) + 1);
      if (sacrificeIds.length < needed && !payload?.useWildcard) throw new Error(`Stage ${Number(progression.stage || 1) + 1} requires ${needed} compatible cards or a Wildcard`);
      const consumed: string[] = [];
      if (payload?.useWildcard) {
        await spend({ wildcard: 1 });
      } else {
        const targetRarity = rarityRank[userCard.card_rarity] || 0;
        for (const id of sacrificeIds.slice(0, needed)) {
          if (id === userCard.id) throw new Error('The active card cannot consume itself');
          const sacrifice = await base44.asServiceRole.entities.UserCard.get(id).catch(() => null);
          if (!sacrifice || sacrifice.user_id !== user.id) throw new Error('One selected fusion card is not owned by you');
          if (sacrifice.is_equipped || sacrifice.trade_status === 'locked_in_trade') throw new Error(`${sacrifice.card_name} is equipped or locked in a trade`);
          const compatible = sacrifice.card_name === userCard.card_name || (sacrifice.game_name === userCard.game_name && (rarityRank[sacrifice.card_rarity] || 0) >= Math.max(0, targetRarity - 1));
          if (!compatible) throw new Error(`${sacrifice.card_name} is not compatible with this stage fusion`);
          consumed.push(sacrifice.card_name);
          await base44.asServiceRole.entities.UserCard.delete(id);
        }
      }
      const newStage = Number(progression.stage || 1) + 1;
      await commit({ stage: newStage, stars: Math.min(5, Number(progression.stars || 1) + 1), skill_points: Number(progression.skill_points || 0) + 1 }, 'combine', `Card advanced to Stage ${newStage}`, { consumed, wildcard: Boolean(payload?.useWildcard) });
    } else if (action === 'ascend') {
      if (Number(progression.level) < Number(progression.max_level)) throw new Error(`Reach level ${progression.max_level} before ascending`);
      const nextAscension = Number(progression.ascension || 0) + 1;
      if (nextAscension > 5) throw new Error('Maximum ascension reached');
      await spend({ ascension_core: nextAscension });
      const newMax = Number(progression.max_level || 10) + 10;
      await commit({ ascension: nextAscension, max_level: newMax, xp: 0, xp_to_next: xpToNext(progression.level, nextAscension), skill_points: Number(progression.skill_points || 0) + 2 }, 'ascend', `Ascension ${nextAscension} unlocked; level cap is now ${newMax}`, { ascension: nextAscension, max_level: newMax });
    } else if (action === 'enchant') {
      const enchantmentId = payload?.enchantmentId;
      if (!enchantmentId) throw new Error('Choose an enchantment');
      const enchantment = await base44.asServiceRole.entities.Enchantment.get(enchantmentId).catch(() => null);
      if (!enchantment) throw new Error('Enchantment not found');
      const slots = 1 + Math.floor(Number(progression.stage || 1) / 2) + Math.min(2, Number(progression.ascension || 0));
      if ((progression.enchantments || []).length >= slots) throw new Error(`All ${slots} enchantment slots are occupied. Stage or ascend the card for more slots.`);
      const costs = enchantment.material_cost && Object.keys(enchantment.material_cost).length ? enchantment.material_cost : { resonance_fragment: 1 };
      await spend(Object.fromEntries(Object.entries(costs).map(([k, v]) => [k, Math.max(1, Number(v) || 1)])));
      const enchants = [...(progression.enchantments || []), { id: enchantment.id, name: enchantment.name, element: enchantment.element, rarity: enchantment.rarity, modifiers: enchantment.modifiers || {}, overcharged: false }];
      await commit({ enchantments: enchants }, 'enchant', `${enchantment.name} applied`, { enchantment_id: enchantment.id, slots });
    } else if (action === 'overEnchant') {
      if (!(progression.enchantments || []).length) throw new Error('Apply a normal enchantment before over-enchanting');
      const nextRank = Number(progression.over_enchant_rank || 0) + 1;
      if (nextRank > 5) throw new Error('Maximum over-enchant rank reached');
      await spend({ adaptive_shard: nextRank });
      const focusBonus = (progression.unlocked_skill_nodes || []).includes('enchanter_focus') ? 8 : 0;
      const successChance = Math.max(35, Math.min(95, 82 - Number(progression.over_enchant_rank || 0) * 12 + Number(progression.stage || 1) * 2 + focusBonus));
      const roll = Math.random() * 100;
      const success = roll <= successChance;
      const stability = Math.max(0, Number(progression.over_enchant_stability ?? 100) - (success ? 5 : 15));
      if (success) {
        const enchants = [...progression.enchantments];
        enchants[enchants.length - 1] = { ...enchants[enchants.length - 1], overcharged: true };
        const enhanced = { ...(progression.enhanced_stats || {}) };
        for (const key of ['attack', 'defense', 'magic', 'vitality', 'speed']) enhanced[key] = Number(enhanced[key] || 0) + 2 * nextRank;
        await commit({ over_enchant_rank: nextRank, over_enchant_stability: stability, enchantments: enchants, enhanced_stats: enhanced }, 'over_enchant', `Over-enchant Rank ${nextRank} succeeded`, { success: true, success_chance: successChance, roll: Math.round(roll * 100) / 100 });
      } else {
        await commit({ over_enchant_stability: stability }, 'over_enchant', 'Over-enchant attempt failed; the card survived but lost stability', { success: false, success_chance: successChance, roll: Math.round(roll * 100) / 100 });
      }
    } else if (action === 'unlockSkill') {
      const nodeId = payload?.nodeId;
      const node = SKILL_TREE.find((item) => item.id === nodeId);
      if (!node) throw new Error('Skill node not found');
      if ((progression.unlocked_skill_nodes || []).includes(node.id)) throw new Error('Skill already unlocked');
      if (progression.level < node.minLevel) throw new Error(`Requires card level ${node.minLevel}`);
      if (progression.stage < node.minStage) throw new Error(`Requires Stage ${node.minStage}`);
      if (node.prerequisite && !(progression.unlocked_skill_nodes || []).includes(node.prerequisite)) throw new Error('Unlock the previous node first');
      if (Number(progression.skill_points || 0) < node.cost) throw new Error(`Need ${node.cost} skill point${node.cost === 1 ? '' : 's'}`);
      await commit({ skill_points: Number(progression.skill_points || 0) - node.cost, unlocked_skill_nodes: [...(progression.unlocked_skill_nodes || []), node.id] }, 'skill_unlock', `${node.name} unlocked`, { node_id: node.id });
    } else if (action === 'togglePerk') {
      const nodeId = payload?.nodeId;
      const node = SKILL_TREE.find((item) => item.id === nodeId && item.perk);
      if (!node || !(progression.unlocked_skill_nodes || []).includes(nodeId)) throw new Error('Unlock this perk before activating it');
      const active = [...(progression.active_perks || [])];
      const exists = active.includes(nodeId);
      if (!exists && active.length >= 3) throw new Error('Only 3 perks can be active at once');
      const next = exists ? active.filter((id) => id !== nodeId) : [...active, nodeId];
      await commit({ active_perks: next }, exists ? 'perk_deactivate' : 'perk_activate', `${node.name} ${exists ? 'deactivated' : 'activated'}`, { node_id: nodeId });
    } else if (action !== 'getState') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const [events, materials, enchantments, duplicates] = await Promise.all([
      base44.asServiceRole.entities.CardProgressionEvent.filter({ user_id: user.id, user_card_id: userCard.id }, '-created_date', 30),
      materialsForUser(),
      base44.asServiceRole.entities.Enchantment.list('name', 200),
      base44.asServiceRole.entities.UserCard.filter({ user_id: user.id, game_name: userCard.game_name }, '-created_date', 100)
    ]);

    return Response.json({
      success: true,
      userCard,
      progression: publicProgression(progression),
      events,
      materials,
      enchantments,
      compatibleCards: duplicates.filter((c: AnyObj) => c.id !== userCard.id && !c.is_equipped && c.trade_status !== 'locked_in_trade'),
      skillTree: SKILL_TREE
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});
