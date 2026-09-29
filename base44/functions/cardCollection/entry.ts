import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { skillStats } from '../../shared/pvpSkills.ts';
import { effectiveCardStats, normalizedCardBaseStats } from '../../shared/cardStats.ts';
import { cardMasteryState, normalizeProgression } from '../../shared/cardSystem.ts';
import { loadCombatProfile } from '../../shared/combatProfile.ts';
import { abilityOutput } from '../../shared/combatStats.ts';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const lower = (value: any) => String(value || '').trim().toLowerCase();

function canonicalType(value: any) {
  const v = lower(value);
  if (v === 'achievement') return 'collectible';
  return v;
}

function progressionSummary(p: AnyObj | null, effective: AnyObj, combat: AnyObj | null = null) {
  const normalized = normalizeProgression(p);
  return {
    system_version: normalized.system_version,
    enhancement_percent: normalized.enhancement_percent,
    ascension: normalized.ascension,
    stack_level: normalized.stack_level,
    permanent_stats: normalized.permanent_stats || {},
    current_cycle_stats: normalized.current_cycle_stats || {},
    mastery_visual: normalized.mastery_visual,
    power_score: effective.power_score,
    effective_stats: effective.stats,
    growth_multiplier: effective.growth_multiplier,
    mastery: cardMasteryState(normalized),
    combat,
    // Compatibility aliases while old UI surfaces are retired.
    level: Number(p?.level || 1),
    xp: Number(p?.xp || 0),
    stage: normalized.stack_level,
    enhanced_stats: normalized.permanent_stats || {},
    over_enchant_rank: 0,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list');
    const data = body?.data || {};
    if (action !== 'list') return json({ error: 'Unknown card collection action' }, 400);
    const svc = base44.asServiceRole.entities;

    const filters: AnyObj = { status: 'live' };
    if (data.game_id) filters.game_id = String(data.game_id);
    if (data.card_type) filters.card_type = canonicalType(data.card_type);
    let catalog = await svc.TradingCard.filter(filters, 'name', 5000).catch(async () => {
      const rows = await svc.TradingCard.list('name', 5000);
      return rows.filter((row: AnyObj) => row.status === 'live');
    });
    if (data.game_id) catalog = catalog.filter((row: AnyObj) => String(row.game_id || '') === String(data.game_id));
    if (data.card_type) catalog = catalog.filter((row: AnyObj) => canonicalType(row.card_type) === canonicalType(data.card_type));

    const owned = user ? await svc.UserCard.filter({ user_id: user.id }, '-acquired_at', 5000) : [];
    const progression = user ? await svc.CardProgression.filter({ user_id: user.id }, '-updated_date', 5000) : [];
    const gameIds = [...new Set(catalog.map((card: AnyObj) => String(card.game_id || '')).filter(Boolean))];
    const games: AnyObj[] = [];
    for (const id of gameIds) {
      const game = await svc.Game.get(id).catch(() => null);
      if (game) games.push(game);
    }
    const gameById = new Map(games.map((game: AnyObj) => [String(game.id), game]));
    const ownedByTrading = new Map<string, AnyObj[]>();
    for (const row of owned) {
      const key = String(row.trading_card_id || '');
      if (!key) continue;
      if (!ownedByTrading.has(key)) ownedByTrading.set(key, []);
      ownedByTrading.get(key)!.push(row);
    }
    const progressByUserCard = new Map(progression.map((row: AnyObj) => [String(row.user_card_id || ''), row]));
    const avatarProfile = user ? await loadCombatProfile(svc, user.id) : null;

    const cards = catalog.map((card: AnyObj) => {
      const copies = ownedByTrading.get(String(card.id)) || [];
      const effect = card.animation_effect || {};
      const baseCombat = skillStats(String(effect.id || ''), card.rarity || 'Rare');
      const instances = copies.map((instance: AnyObj) => {
        const p = progressByUserCard.get(String(instance.id)) || null;
        const effective = effectiveCardStats(p, normalizedCardBaseStats(instance, {}, card));
        const output = avatarProfile && canonicalType(card.card_type) === 'ability'
          ? abilityOutput(avatarProfile.combat, {
              ...baseCombat,
              base_damage: Number(effect.base_damage || baseCombat.base_damage),
              cooldown_ms: Number(effect.cooldown_ms || baseCombat.cooldown_ms),
            }, effective)
          : null;
        const combat = output ? {
          ...output,
          effective_damage: output.base_damage,
          multiplier: effective.growth_multiplier,
          bonus_percent: Math.round((effective.growth_multiplier - 1) * 100),
        } : null;
        return {
          user_card_id: instance.id,
          passport_id: instance.passport_id || '',
          acquired_at: instance.acquired_at || instance.unlocked_date || '',
          acquisition_method: instance.acquisition_method || 'unlocked',
          equipped_to: instance.equipped_to || (instance.is_equipped ? 'skill_book' : 'none'),
          trade_status: instance.trade_status || 'available',
          quantity: Math.max(1, Number(instance.quantity || 1)),
          progression: progressionSummary(p, effective, combat),
        };
      });
      const primaryInstance = instances[0] || null;
      const primaryOwned = copies[0] || null;
      const totalCopies = instances.reduce((sum: number, row: AnyObj) => sum + Number(row.quantity || 1), 0);
      return {
        id: card.id,
        trading_card_id: card.id,
        name: card.name,
        description: card.description || '',
        image: card.image_url || '',
        image_url: card.image_url || '',
        rarity: card.rarity || 'Rare',
        playable_tier: card.playable_tier || card.rarity || 'Rare',
        card_class: card.card_class || 'playable',
        card_type: canonicalType(card.card_type || 'collectible'),
        game_id: card.game_id || '',
        game_title: gameById.get(String(card.game_id || ''))?.title || '',
        genre: lower(gameById.get(String(card.game_id || ''))?.title) === 'adam xe' ? 'Adam XE' : (gameById.get(String(card.game_id || ''))?.genre || ''),
        achievement_id: card.achievement_id || '',
        equip_slot: card.equip_slot || '',
        stats: card.stats || {},
        effective_stats: primaryInstance?.progression?.effective_stats || null,
        animation_effect: card.animation_effect || null,
        model_url: card.model_url || '',
        home_item_key: card.home_item_key || '',
        stackable: card.stackable !== false,
        tradable: card.tradable !== false,
        owned: Boolean(primaryOwned),
        quantity: totalCopies,
        owned_instance_count: instances.length,
        owned_instances: instances,
        user_card_id: primaryOwned?.id || null,
        passport_id: primaryOwned?.passport_id || '',
        equipped_to: primaryOwned?.equipped_to || 'none',
        trade_status: primaryOwned?.trade_status || 'available',
        progression: primaryInstance?.progression || null,
      };
    });

    // Transitional ownership rows created before the canonical TradingCard link
    // stay visible so no earned card disappears while legacy data is reconciled.
    const linkedIds = new Set(cards.flatMap((card: AnyObj) => (card.owned_instances || []).map((row: AnyObj) => String(row.user_card_id))));
    const legacyOwned = owned.filter((row: AnyObj) => !row.trading_card_id && !linkedIds.has(String(row.id))).map((row: AnyObj) => {
      const p = progressByUserCard.get(String(row.id)) || null;
      const effective = effectiveCardStats(p, normalizedCardBaseStats(row, {}, null));
      const summary = progressionSummary(p, effective, null);
      return {
        id: `legacy:${row.id}`,
        trading_card_id: '',
        name: row.card_name || 'Card',
        description: '',
        image: row.card_image || '',
        image_url: row.card_image || '',
        rarity: row.card_rarity || 'Rare',
        playable_tier: row.playable_tier || row.card_rarity || 'Rare',
        card_class: 'playable',
        card_type: canonicalType(row.card_type),
        game_id: row.game_id || '',
        game_title: row.game_name || '',
        genre: lower(row.game_name) === 'adam xe' ? 'Adam XE' : (row.genre || ''),
        achievement_id: row.achievement_id || '',
        equip_slot: '',
        stats: {},
        effective_stats: effective.stats,
        animation_effect: row.animation_effect || null,
        model_url: row.animation_effect?.model_url || '',
        home_item_key: '',
        stackable: false,
        tradable: row.trade_status !== 'locked_in_trade',
        owned: true,
        quantity: Math.max(1, Number(row.quantity || 1)),
        owned_instance_count: 1,
        owned_instances: [{
          user_card_id: row.id,
          passport_id: row.passport_id || '',
          acquired_at: row.acquired_at || row.unlocked_date || '',
          acquisition_method: row.acquisition_method || 'unlocked',
          equipped_to: row.equipped_to || (row.is_equipped ? 'skill_book' : 'none'),
          trade_status: row.trade_status || 'available',
          quantity: Math.max(1, Number(row.quantity || 1)),
          progression: summary,
        }],
        user_card_id: row.id,
        passport_id: row.passport_id || '',
        equipped_to: row.equipped_to || (row.is_equipped ? 'skill_book' : 'none'),
        trade_status: row.trade_status || 'available',
        progression: summary,
        legacy: true,
      };
    });

    return json({
      success: true,
      system_version: 2,
      cards: [...cards, ...legacyOwned],
      owned_count: owned.length,
      owned_instance_count: owned.length,
      authenticated: Boolean(user),
    });
  } catch (error) {
    console.error('cardCollection failed', error);
    return json({ error: error instanceof Error ? error.message : 'Card collection unavailable' }, 500);
  }
});
