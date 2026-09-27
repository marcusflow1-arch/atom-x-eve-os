import { allocationState, avatarLevel, COMBAT_RULES } from './combatStats.ts';
import { conditionalUpdate, ensureKeyedRecord, rewardError } from './rewardJournal.ts';
export async function ensureAvatarProgression(svc:any,userId:string) {
  let record = await ensureKeyedRecord(svc.AvatarProgression,{user_id:userId});
  if (record.stat_schema_version !== COMBAT_RULES.version) {
    const points = allocationState(record);
    await conditionalUpdate(svc.AvatarProgression,{id:record.id,user_id:userId,stat_schema_version:{$ne:COMBAT_RULES.version}}, {
      $set:{stat_schema_version:COMBAT_RULES.version,stat_allocations:points.allocations,stat_point_credit:points.credit,stat_revision:0,stat_requests:[]},
      // Legacy screens stored within-level XP. Preserve their attained avatar level.
      $max:{global_xp:(avatarLevel(record)-1)*COMBAT_RULES.xp_per_level,global_level:avatarLevel(record)},
    });
    record = await svc.AvatarProgression.get(record.id);
  }
  return record;
}
export async function commitStatChange(svc:any,userId:string,record:any,patch:any,request:any) {
  const ok = await conditionalUpdate(svc.AvatarProgression,{id:record.id,user_id:userId,stat_revision:Number(record.stat_revision || 0)},{
    $set:{...patch,stat_requests:[...(record.stat_requests || []).slice(-31),request]},
    $inc:{stat_revision:1},
  });
  if (!ok) throw rewardError('Your avatar changed in another window. Refresh and try again.',409);
  return svc.AvatarProgression.get(record.id);
}
