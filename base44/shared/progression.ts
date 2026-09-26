import { genreIdFor } from './genres.ts';

type AnyObj = Record<string, any>;

async function progressionRecord(svc:any,userId:string) {
  const rows = await svc.AvatarProgression.filter({ user_id:userId }, '-updated_date', 1);
  return rows[0] || null;
}

export async function addAvatarXp(svc:any,userId:string,amount:number,source:string) {
  const delta = Math.max(0, Math.floor(Number(amount || 0)));
  if (!delta) return progressionRecord(svc,userId);
  const record = await progressionRecord(svc,userId);
  const xp = Number(record?.global_xp || 0) + delta;
  const level = Math.min(50, Math.max(1, Math.floor(xp / 1000) + 1));
  if (record) return svc.AvatarProgression.update(record.id, { global_xp:xp, global_level:level });
  return svc.AvatarProgression.create({ user_id:userId, global_xp:xp, global_level:level, available_stat_points:0, stats:{hp:100,strength:10,intelligence:10,will:10,tenacity:10}, genres:[], skill_allocations:{}, claimed_stat_rewards:[], claimed_knowledge_rewards:[] });
}

export async function addGenreXp(svc:any,userId:string,genreValue:any,amount:number,source:string) {
  const genreId = genreIdFor(genreValue);
  if (!genreId) throw new Error('Unknown genre');
  const delta = Math.max(0, Math.floor(Number(amount || 0)));
  if (!delta) return progressionRecord(svc,userId);
  let record = await progressionRecord(svc,userId);
  const genres = Array.isArray(record?.genres) ? record.genres.map((row:AnyObj) => ({...row})) : [];
  const index = genres.findIndex((row:AnyObj) => genreIdFor(row.id || row.name) === genreId);
  const current = index >= 0 ? genres[index] : { id:genreId, xp:0, level:1 };
  const xp = Number(current.xp || 0) + delta;
  const level = Math.min(50, Math.max(1, Math.floor(xp / 1000) + 1));
  const next = { id:genreId, xp, level };
  if (index >= 0) genres[index] = next; else genres.push(next);
  record = record
    ? await svc.AvatarProgression.update(record.id, { genres })
    : await svc.AvatarProgression.create({ user_id:userId, global_level:1, global_xp:0, available_stat_points:0, stats:{hp:100,strength:10,intelligence:10,will:10,tenacity:10}, genres, skill_allocations:{}, claimed_stat_rewards:[], claimed_knowledge_rewards:[] });
  await svc.GenreSkillAudit.create({ user_id:userId, genre_id:genreId, action:'sync_points', point_delta:0, metadata:{ xp_delta:delta, xp_after:xp, level_after:level, source:String(source || '') } });
  return record;
}
