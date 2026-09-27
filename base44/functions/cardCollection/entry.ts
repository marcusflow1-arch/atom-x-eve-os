import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const lower = (value: any) => String(value || '').trim().toLowerCase();

function canonicalType(value: any) {
  const v = lower(value);
  if (v === 'achievement') return 'collectible';
  return v;
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
      return rows.filter((row: AnyObj) => row.status !== 'retired');
    });
    if (data.game_id) catalog = catalog.filter((row: AnyObj) => String(row.game_id || '') === String(data.game_id));
    if (data.card_type) catalog = catalog.filter((row: AnyObj) => canonicalType(row.card_type) === canonicalType(data.card_type));

    const owned = user ? await svc.UserCard.filter({ user_id: user.id }, '-acquired_at', 5000) : [];
    const progression = user ? await svc.CardProgression.filter({ user_id: user.id }, '-updated_date', 5000).catch(() => []) : [];
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

    const cards = catalog.map((card: AnyObj) => {
      const copies = ownedByTrading.get(String(card.id)) || [];
      const primary = copies[0] || null;
      const quantity = copies.reduce((sum, row) => sum + Math.max(1, Number(row.quantity || 1)), 0);
      const p = primary ? progressByUserCard.get(String(primary.id)) || null : null;
      return {
        id: card.id,
        trading_card_id: card.id,
        name: card.name,
        description: card.description || '',
        image: card.image_url || '',
        image_url: card.image_url || '',
        rarity: card.rarity || 'Common',
        card_type: canonicalType(card.card_type || 'collectible'),
        game_id: card.game_id || '',
        game_title: gameById.get(String(card.game_id || ''))?.title || '',
        genre: lower(gameById.get(String(card.game_id || ''))?.title) === 'adam xe' ? 'Adam XE' : (gameById.get(String(card.game_id || ''))?.genre || ''),
        achievement_id: card.achievement_id || '',
        equip_slot: card.equip_slot || '',
        stats: card.stats || {},
        animation_effect: card.animation_effect || null,
        model_url: card.model_url || '',
        home_item_key: card.home_item_key || '',
        stackable: Boolean(card.stackable),
        tradable: card.tradable !== false,
        max_level: Number(card.max_level || 50),
        owned: Boolean(primary),
        quantity,
        user_card_id: primary?.id || null,
        equipped_to: primary?.equipped_to || 'none',
        trade_status: primary?.trade_status || 'available',
        progression: p ? { level: Number(p.level || 1), xp: Number(p.xp || 0), stage: Number(p.stage || 1), ascension: Number(p.ascension || 0), power_score: Number(p.power_score || 0), enhanced_stats: p.enhanced_stats || {} } : null,
      };
    });

    // Transitional ownership rows created before the canonical TradingCard link
    // are still returned so players never temporarily lose earned content while
    // the migration runs. They disappear from this fallback once linked.
    const linkedIds = new Set(cards.filter((c: AnyObj) => c.user_card_id).map((c: AnyObj) => String(c.user_card_id)));
    const legacyOwned = owned.filter((row: AnyObj) => !row.trading_card_id && !linkedIds.has(String(row.id))).map((row: AnyObj) => ({
      id: `legacy:${row.id}`, trading_card_id: '', name: row.card_name || 'Card', description: '', image: row.card_image || '', image_url: row.card_image || '', rarity: row.card_rarity || 'Common', card_type: canonicalType(row.card_type), game_id: row.game_id || '', game_title: row.game_name || '', genre: lower(row.game_name) === 'adam xe' ? 'Adam XE' : (row.genre || ''), achievement_id: row.achievement_id || '', equip_slot: '', stats: {}, animation_effect: row.animation_effect || null, model_url: row.animation_effect?.model_url || '', home_item_key: '', stackable: false, tradable: row.trade_status !== 'locked_in_trade', max_level: 50, owned: true, quantity: Math.max(1, Number(row.quantity || 1)), user_card_id: row.id, equipped_to: row.equipped_to || (row.is_equipped ? 'skill_book' : 'none'), trade_status: row.trade_status || 'available', progression: progressByUserCard.get(String(row.id)) || null, legacy: true,
    }));

    return json({ success: true, cards: [...cards, ...legacyOwned], owned_count: owned.length, authenticated: Boolean(user) });
  } catch (error) {
    console.error('cardCollection failed', error);
    return json({ error: error instanceof Error ? error.message : 'Card collection unavailable' }, 500);
  }
});
