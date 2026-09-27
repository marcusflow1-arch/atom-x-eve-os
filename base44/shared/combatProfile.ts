import { allocationState, avatarLevel, deriveCombatStats } from './combatStats.ts';
import { effectiveCardStats, normalizedCardBaseStats } from './cardStats.ts';
import { isEquipmentSlot, itemFitsSlot } from './equipmentSlots.ts';
type Row = Record<string, any>;
const error = (message:string,status=409) => Object.assign(new Error(message),{status});
export async function optionalRecord(entity:any,id:string) {
  if (!id) return null;
  try { return await entity.get(id); }
  catch(e:any) { if (Number(e?.status || e?.response?.status) === 404) return null; throw e; }
}
export async function readAvatarProgression(svc:any,userId:string) {
  const rows = await svc.AvatarProgression.filter({user_id:userId},'-updated_date',2);
  if (rows.length > 1) throw error('Multiple avatar progression records need reconciliation');
  return rows[0] || null;
}
export async function ownedCardStats(svc:any,userId:string,owned:Row,progression?:Row|null) {
  if (!owned || String(owned.user_id) !== String(userId) || Number(owned.quantity ?? 1) < 1 || owned.trade_status === 'locked_in_trade') throw error('This card is not available to your avatar');
  const definition = owned.trading_card_id ? await optionalRecord(svc.TradingCard,String(owned.trading_card_id)) : null;
  if (owned.trading_card_id && !definition) throw error('Card definition is unavailable');
  let p = progression;
  if (p === undefined) {
    const rows = await svc.CardProgression.filter({user_id:userId,user_card_id:String(owned.id)},'-updated_date',2);
    if (rows.length > 1) throw error('Multiple card progression records need reconciliation');
    p = rows[0] || null;
  }
  if (p && (String(p.user_id) !== String(userId) || String(p.user_card_id) !== String(owned.id))) throw error('Card progression owner mismatch');
  const achievementId = !definition ? String(owned.achievement_id || '') : '';
  const achievement = achievementId ? await optionalRecord(svc.Achievement,achievementId) : null;
  return { definition, progression:p, ...effectiveCardStats(p, normalizedCardBaseStats(owned,achievement || {},definition)) };
}
export async function loadCombatProfile(svc:any,userId:string,record?:Row|null) {
  const progression = record === undefined ? await readAvatarProgression(svc,userId) : record;
  const loadouts = await svc.Loadout.filter({user_id:userId,loadout_type:'equipment'},'-updated_date',50);
  const active = loadouts.find((row:Row)=>row.is_active === true) || loadouts[0];
  const totals:Row = {}, items:Row[] = [], seen = new Set<string>();
  for (const [slot,value] of Object.entries(active?.equipped_items || {})) {
    const id = String((value as Row)?.user_card_id || '');
    if (!id || seen.has(id) || !isEquipmentSlot(slot)) continue;
    const owned = await optionalRecord(svc.UserCard,id);
    if (!owned || String(owned.user_id) !== userId || Number(owned.quantity ?? 1) < 1 || owned.trade_status === 'locked_in_trade') continue;
    const card = await ownedCardStats(svc,userId,owned);
    if (String(card.definition?.card_type || '').toLowerCase() !== 'equipment' || !itemFitsSlot(card.definition,slot)) continue;
    seen.add(id);
    // Extra weapon slots are swap choices, not three simultaneously attacking hands.
    // Only weapon-1 contributes; all other armor/accessory slots contribute once.
    const contributes = !slot.startsWith('weapon-') || slot === 'weapon-1';
    if (contributes) for (const [key,n] of Object.entries(card.stats)) totals[key] = Number(totals[key] || 0) + Number(n || 0);
    items.push({slot,user_card_id:id,name:card.definition.name,contributes,stats:card.stats,power_score:card.power_score});
  }
  const points = allocationState(progression || {});
  return {
    progression: {...(progression || {}),global_level:avatarLevel(progression || {}),available_stat_points:points.available},
    ...points, equipment:items, equipment_stats:totals, combat:deriveCombatStats(progression || {},totals),
    revision:Number(progression?.stat_revision || 0),
  };
}
