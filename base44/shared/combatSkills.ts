import { skillStats, SKILL_SLOT_COUNT } from './pvpSkills.ts';
import { skillEquipStatus } from './skillEligibility.ts';
import { abilityOutput } from './combatStats.ts';
import { optionalRecord, ownedCardStats } from './combatProfile.ts';
type Row=Record<string,any>;
export async function loadCombatSkills(svc:any,userId:string,gender:string,combat:Row) {
  const loadouts=await svc.Loadout.filter({user_id:userId,loadout_type:'skills'},'-updated_date',50);
  const active=loadouts.find((r:Row)=>r.is_active===true)||[...loadouts].sort((a:Row,b:Row)=>Number(a.skill_set_order||0)-Number(b.skill_set_order||0))[0];
  const out:Row[]=[];
  for(let slot=0;slot<SKILL_SLOT_COUNT;slot++){
    const id=active?.skill_slots?.[String(slot)];
    if(!id)continue;
    const owned=await optionalRecord(svc.UserCard,String(id));
    if(!owned||String(owned.user_id)!==userId||!skillEquipStatus(owned,gender).can_equip)continue;
    const card=await ownedCardStats(svc,userId,owned);
    const effect=owned.animation_effect||{}, effectId=String(effect.id||'');
    const defaults=skillStats(effectId,owned.card_rarity||'Common');
    const base={...defaults,...Object.fromEntries(['base_damage','cooldown_ms','atb_cost','range_m','hit_ms'].filter(key=>Number.isFinite(Number(effect[key])) && Number(effect[key])>0).map(key=>[key,Number(effect[key])]))};
    const output=abilityOutput(combat,base,card);
    out.push({
      slot,user_card_id:String(owned.id),name:owned.card_name||'Ability',image:owned.card_image||'',rarity:owned.card_rarity||'Common',
      effect_id:effectId,clip_name:effect.clip_name||'',duration_ms:Number(effect.duration_ms||base.hit_ms||400),
      atb_cost:Number(base.atb_cost),range_m:Number(base.range_m),kind:base.kind,hit_ms:Number(base.hit_ms),stun_ms:Number(base.stun_ms||0),
      level:Number(card.progression?.level||1),animation_effect:effect,card_stats:card.stats,stage:Number(card.progression?.stage||1),ascension:Number(card.progression?.ascension||0),over_enchant_rank:Number(card.progression?.over_enchant_rank||0),...output,effective_base_damage:output.base_damage,damage_multiplier:card.growth_multiplier,progression_bonus_percent:Math.round((card.growth_multiplier-1)*100),
    });
  }
  return out;
}
