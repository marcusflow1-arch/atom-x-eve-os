import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const key = (value: any) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const rarity = (value: any) => {
  const text = String(value || 'Common').trim();
  const normalized:Record<string,string> = { common:'Common', uncommon:'Uncommon', rare:'Rare', epic:'Epic', legendary:'Legendary', mythic:'Legendary', mythical:'Legendary', unique:'Unique', limitless:'Unique', ascendant:'Unique' };
  return normalized[text.toLowerCase()] || 'Common';
};
const cardType = (value: any) => {
  const text = key(value);
  if (/abilit|skill|spell|mobility/.test(text)) return 'ability';
  if (/equip|weapon|armor|armour|sword|blade|greatsword|artifact|gear/.test(text)) return 'equipment';
  if (/companion|pet/.test(text)) return text.includes('pet') ? 'pet' : 'companion';
  if (/mount/.test(text)) return 'mount';
  if (/teacher|mentor/.test(text)) return 'teacher';
  if (/environment|world|scene/.test(text)) return 'environment';
  if (/home|furniture|structure/.test(text)) return 'home_item';
  if (/material|resource|essence/.test(text)) return 'material';
  return 'collectible';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
    const body = await req.json().catch(() => ({}));
    const apply = Boolean(body.apply);
    const svc = base44.asServiceRole.entities;
    const [games, achievements, existingCards, userCards] = await Promise.all([
      svc.Game.list('title', 5000), svc.Achievement.list('title', 5000), svc.TradingCard.list('name', 5000), svc.UserCard.list('-created_date', 5000),
    ]);
    const gameByTitle = new Map(games.map((game:AnyObj) => [key(game.title), game]));
    const cardsByAchievement = new Map(existingCards.filter((card:AnyObj) => card.achievement_id).map((card:AnyObj) => [String(card.achievement_id), card]));
    const cardsByNameGame = new Map(existingCards.map((card:AnyObj) => [`${key(card.series)}|${key(card.name)}`, card]));
    const plan:any[] = [];

    for (const achievement of achievements) {
      const reward = achievement.reward || null;
      const linked = achievement.card_id ? existingCards.find((card:AnyObj) => String(card.id) === String(achievement.card_id)) : cardsByAchievement.get(String(achievement.id));
      if (linked) {
        plan.push({ kind:'link-achievement', achievement_id:achievement.id, card_id:linked.id, existing:true });
        continue;
      }
      if (!reward?.name && !reward?.image_url && !achievement.showcase) continue;
      const game = gameByTitle.get(key(achievement.game));
      plan.push({ kind:'create-achievement-card', achievement_id:achievement.id, game_id:game?.id || '', name:reward?.name || achievement.title, description:reward?.description || achievement.description || '', image_url:reward?.image_url || game?.cover_image || '', rarity:rarity(achievement.rarity), card_type:cardType(reward?.type || achievement.category), stats:reward?.stats || {}, showcase:achievement.showcase || null, series:achievement.game || game?.title || '', tradable:true });
    }

    for (const owned of userCards) {
      if (owned.trading_card_id) continue;
      const lookup = `${key(owned.game_name)}|${key(owned.card_name)}`;
      const existing = cardsByNameGame.get(lookup);
      plan.push({ kind:'link-user-card', user_card_id:owned.id, existing_card_id:existing?.id || '', create:!existing, game_id:owned.game_id || gameByTitle.get(key(owned.game_name))?.id || '', series:owned.game_name || '', name:owned.card_name || 'Legacy Card', image_url:owned.card_image || '', rarity:rarity(owned.card_rarity), card_type:cardType(owned.card_type), animation_effect:owned.animation_effect || null, achievement_id:owned.achievement_id || '', source:owned.source || 'migration' });
    }

    if (!apply) return json({ success:true, dry_run:true, counts:{ achievements:achievements.length, existing_cards:existingCards.length, user_cards:userCards.length, planned:plan.length }, preview:plan.slice(0,150) });

    let cardsCreated = 0, achievementsLinked = 0, userCardsLinked = 0;
    for (const item of plan) {
      if (item.kind === 'link-achievement') {
        const achievement = achievements.find((row:AnyObj) => String(row.id) === String(item.achievement_id));
        if (achievement && String(achievement.card_id || '') !== String(item.card_id)) { await svc.Achievement.update(achievement.id, { card_id:item.card_id }); achievementsLinked += 1; }
        continue;
      }
      if (item.kind === 'create-achievement-card') {
        const card = await svc.TradingCard.create({ name:item.name, description:item.description, image_url:item.image_url || 'https://placehold.co/600x840?text=Card', rarity:item.rarity, achievement_id:item.achievement_id, series:item.series, showcase:item.showcase, card_type:item.card_type, game_id:item.game_id, stats:item.stats, stackable:item.card_type === 'material', tradable:item.tradable, max_level:50, status:'live' });
        await svc.Achievement.update(item.achievement_id, { card_id:card.id, game_id:item.game_id || undefined });
        cardsCreated += 1; achievementsLinked += 1;
        cardsByNameGame.set(`${key(item.series)}|${key(item.name)}`, card);
        continue;
      }
      if (item.kind === 'link-user-card') {
        let card = item.existing_card_id ? await svc.TradingCard.get(item.existing_card_id).catch(() => null) : cardsByNameGame.get(`${key(item.series)}|${key(item.name)}`) || null;
        if (!card) {
          card = await svc.TradingCard.create({ name:item.name, description:'Migrated player-owned card', image_url:item.image_url || 'https://placehold.co/600x840?text=Card', rarity:item.rarity, achievement_id:item.achievement_id, series:item.series, card_type:item.card_type, game_id:item.game_id, animation_effect:item.animation_effect, stackable:item.card_type === 'material', tradable:true, max_level:50, status:'live' });
          cardsCreated += 1;
          cardsByNameGame.set(`${key(item.series)}|${key(item.name)}`, card);
        }
        await svc.UserCard.update(item.user_card_id, { trading_card_id:card.id, card_type:item.card_type, achievement_id:item.achievement_id || card.achievement_id || '', source:item.source, acquired_at:new Date().toISOString(), quantity:1, equipped_to:'none' });
        userCardsLinked += 1;
      }
    }
    return json({ success:true, dry_run:false, cards_created:cardsCreated, achievements_linked:achievementsLinked, user_cards_linked:userCardsLinked });
  } catch (error) {
    console.error('migrateCardCatalog failed', error);
    return json({ error:error instanceof Error ? error.message : 'Card migration failed' }, 500);
  }
});
