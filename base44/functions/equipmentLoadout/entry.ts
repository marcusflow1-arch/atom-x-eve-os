import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { isEquipmentSlot, itemFitsSlot } from '../../shared/equipmentSlots.ts';
import { hasLivePvpMatch } from '../../shared/matchLock.ts';
import { effectiveCardStats, normalizedCardBaseStats } from '../../shared/cardStats.ts';

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const lower = (value:any) => String(value || '').trim().toLowerCase();

async function ensureLoadout(svc: any, userId: string) {
  const rows = await svc.Loadout.filter({ user_id: userId, loadout_type: 'equipment' }, '-updated_date', 20);
  let active = rows.find((row: Row) => row.is_active) || rows[0] || null;
  if (!active) active = await svc.Loadout.create({ user_id:userId, name:'Dashboard Equipment', description:'Canonical Luna dashboard equipment used by AI Battle and the 3D avatar.', loadout_type:'equipment', prefab_kind:'dashboard_row', equipped_items:{}, skill_slots:{}, is_active:true, tags:['Luna','Dashboard','Combat'] });
  else if (!active.is_active) active = await svc.Loadout.update(active.id, { is_active:true });
  return active;
}

async function releaseOwnedCard(svc:any, userId:string, userCardId:string) {
  if (!userCardId) return;
  const card = await svc.UserCard.get(String(userCardId)).catch(() => null);
  // A saved loadout can still reference a card that has since been transferred.
  if (card && String(card.user_id) === String(userId)) {
    await svc.UserCard.update(card.id, { equipped_to:'none', is_equipped:false });
  }
}

async function snapshotOwnedEquipment(svc:any, userId:string, userCardId:string) {
  const owned = await svc.UserCard.get(String(userCardId || '')).catch(() => null);
  if (!owned || String(owned.user_id || '') !== String(userId)) throw Object.assign(new Error('Equipment card is not owned by this user'), { status:404 });
  if (!Number.isSafeInteger(Number(owned.quantity ?? 1)) || Number(owned.quantity ?? 1) < 1) throw Object.assign(new Error('Equipment is no longer in your inventory'),{status:409});
  if (!owned.trading_card_id) throw Object.assign(new Error('This legacy item has not been migrated to the card catalog yet'), { status:409 });
  if (owned.trade_status === 'locked_in_trade') throw Object.assign(new Error('That equipment card is locked in a trade'), { status:409 });
  const card = await svc.TradingCard.get(String(owned.trading_card_id)).catch(() => null);
  if (!card || lower(card.card_type) !== 'equipment') throw Object.assign(new Error('Only equipment cards can be equipped'), { status:400 });
  const progressionRows = await svc.CardProgression.filter({ user_id:userId, user_card_id:owned.id }, '-updated_date', 1).catch(() => []);
  const progression = progressionRows[0] || null;
  const stats = effectiveCardStats(progression,normalizedCardBaseStats(owned,{},card)).stats;
  return {
    owned, card, progression,
    item: {
      user_card_id: owned.id,
      trading_card_id: card.id,
      name: card.name || owned.card_name || 'Equipment',
      image: card.image_url || owned.card_image || '',
      icon_url: card.image_url || owned.card_image || '',
      rarity: card.rarity || owned.card_rarity || 'Common',
      equip_slot: card.equip_slot || '',
      stats,
      level: Number(progression?.level || 1),
      model_url: card.model_url || '',
      card_type: 'equipment',
      game_id: card.game_id || owned.game_id || '',
    },
  };
}

async function cleanState(svc:any, userId:string, loadout:Row) {
  const current = loadout.equipped_items || {};
  const next:Row = {};
  const retainedCardIds = new Set<string>();
  let changed = false;
  for (const [slot, item] of Object.entries(current)) {
    const userCardId = String((item as Row)?.user_card_id || '');
    if (!userCardId || retainedCardIds.has(userCardId) || !isEquipmentSlot(slot)) { changed = true; continue; }
    try {
      const canonical = await snapshotOwnedEquipment(svc, userId, userCardId);
      if (!itemFitsSlot(canonical.card, slot)) { changed = true; continue; }
      next[slot] = canonical.item;
      retainedCardIds.add(userCardId);
      if (JSON.stringify(canonical.item) !== JSON.stringify(item)) changed = true;
    } catch { changed = true; }
  }
  if (changed) loadout = await svc.Loadout.update(loadout.id, { equipped_items:next, is_active:true });
  const ownedEquipped = await svc.UserCard.filter({ user_id:userId, equipped_to:'loadout' }, '-updated_date', 500).catch(() => []);
  for (const row of ownedEquipped) if (!retainedCardIds.has(String(row.id))) await svc.UserCard.update(row.id, { equipped_to:'none', is_equipped:false }).catch(() => null);
  return loadout;
}

const serialize = (loadout:Row|null) => ({ id:loadout?.id || '', name:loadout?.name || 'Dashboard Equipment', equipped_items:loadout?.equipped_items || {}, is_active:Boolean(loadout?.is_active) });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error:'Unauthorized' }, 401);
    const { action='getState', data={} } = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole.entities;
    if (!['getState','equip','unequip','clear'].includes(action)) return json({ error:'Unknown equipment action' }, 400);
    if (['equip','unequip','clear'].includes(action)) {
      try {
        if (await hasLivePvpMatch(svc, user.id)) return json({ error:'Finish your match first' }, 409);
      } catch (error) {
        console.error('Could not verify equipment match lock', error);
        return json({ error:'Unable to verify your match status. Please try again.' }, 503);
      }
    }
    let loadout = await ensureLoadout(svc, user.id);

    if (action === 'getState') {
      loadout = await cleanState(svc, user.id, loadout);
      return json({ success:true, loadout:serialize(loadout) });
    }

    if (action === 'equip') {
      const slot = String(data.slot || '');
      const userCardId = String(data.user_card_id || '');
      if (!isEquipmentSlot(slot)) return json({ error:'Unknown equipment slot' }, 400);
      if (!userCardId) return json({ error:'user_card_id is required' }, 400);
      const canonical = await snapshotOwnedEquipment(svc, user.id, userCardId);
      if (!itemFitsSlot(canonical.card, slot)) return json({ error:`${canonical.item.name} does not fit ${slot}` }, 400);
      const current = { ...(loadout.equipped_items || {}) };
      for (const [existingSlot, item] of Object.entries(current)) if (String((item as Row)?.user_card_id || '') === userCardId) delete current[existingSlot];
      const oldItem = current[slot] as Row | undefined;
      current[slot] = canonical.item;
      loadout = await svc.Loadout.update(loadout.id, { equipped_items:current, is_active:true });
      await svc.UserCard.update(canonical.owned.id, { equipped_to:'loadout', is_equipped:true });
      if (oldItem?.user_card_id && oldItem.user_card_id !== userCardId) await releaseOwnedCard(svc, user.id, String(oldItem.user_card_id));
      return json({ success:true, loadout:serialize(loadout) });
    }

    if (action === 'unequip') {
      const slot = String(data.slot || '');
      if (!isEquipmentSlot(slot)) return json({ error:'Unknown equipment slot' }, 400);
      const current = { ...(loadout.equipped_items || {}) };
      const old = current[slot] as Row | undefined;
      delete current[slot];
      loadout = await svc.Loadout.update(loadout.id, { equipped_items:current, is_active:true });
      if (old?.user_card_id) await releaseOwnedCard(svc, user.id, String(old.user_card_id));
      return json({ success:true, loadout:serialize(loadout) });
    }

    if (action === 'clear') {
      const olds = Object.values(loadout.equipped_items || {}) as Row[];
      loadout = await svc.Loadout.update(loadout.id, { equipped_items:{}, is_active:true });
      await Promise.all(olds.map(item => releaseOwnedCard(svc, user.id, String(item?.user_card_id || ''))));
      return json({ success:true, loadout:serialize(loadout) });
    }

    return json({ error:'Unknown equipment action' }, 400);
  } catch (error:any) {
    console.error('equipmentLoadout failed', error);
    return json({ error:error instanceof Error ? error.message : 'Equipment request failed' }, Number(error?.status || 500));
  }
});
