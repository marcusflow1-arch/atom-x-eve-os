type AnyObj = Record<string, any>;
const now = () => new Date().toISOString();

export function questPeriodKey(quest:AnyObj, date = new Date()) {
  if (quest.scope === 'daily') return date.toISOString().slice(0,10);
  if (quest.scope === 'weekly') {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const week = Math.ceil((((d.getTime()-yearStart.getTime())/86400000)+1)/7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
  }
  if (quest.scope === 'season') return String(quest.key || 'season').replace(/^season[:_-]?/i,'') || String(quest.id);
  return quest.repeatable ? date.toISOString().slice(0,10) : 'once';
}

function scopeMatches(quest:AnyObj, meta:AnyObj) {
  if (quest.game_id && String(quest.game_id) !== String(meta.game_id || '')) return false;
  if (quest.genre_id && String(quest.genre_id) !== String(meta.genre_id || '')) return false;
  if (quest.clan_id && String(quest.clan_id) !== String(meta.clan_id || '')) return false;
  const current = Date.now();
  if (quest.starts_at && Date.parse(quest.starts_at) > current) return false;
  if (quest.ends_at && Date.parse(quest.ends_at) < current) return false;
  return true;
}

export async function ensureUserQuest(svc:any,userId:string,quest:AnyObj) {
  const periodKey = questPeriodKey(quest);
  const rows = await svc.UserQuest.filter({ user_id:userId, quest_id:quest.id, period_key:periodKey }, '-created_date', 1);
  if (rows[0]) return rows[0];
  const progress = Object.fromEntries((quest.objectives || []).map((objective:AnyObj) => [String(objective.id),0]));
  return svc.UserQuest.create({ user_id:userId, quest_id:quest.id, period_key:periodKey, progress, status:'active' });
}

export async function recordProgress(svc:any,userId:string,eventKey:string,amount=1,meta:AnyObj={}) {
  const delta = Math.max(0, Number(amount || 0));
  if (!userId || !eventKey || !delta) return [];
  const quests = (await svc.Quest.filter({ status:'live' }, 'title', 5000)).filter((quest:AnyObj) => scopeMatches(quest,meta) && (quest.objectives || []).some((objective:AnyObj) => String(objective.event_key) === String(eventKey)));
  const changed:any[] = [];
  for (const quest of quests) {
    let record = await ensureUserQuest(svc,userId,quest);
    if (record.status === 'claimed') continue;
    const progress = { ...(record.progress || {}) };
    for (const objective of quest.objectives || []) {
      if (String(objective.event_key) !== String(eventKey)) continue;
      const id = String(objective.id);
      progress[id] = Math.min(Number(objective.target || 1), Number(progress[id] || 0) + delta);
    }
    const complete = (quest.objectives || []).every((objective:AnyObj) => Number(progress[String(objective.id)] || 0) >= Number(objective.target || 1));
    const wasComplete = record.status === 'completed';
    record = await svc.UserQuest.update(record.id, { progress, status:complete?'completed':'active', ...(complete&&!record.completed_at?{completed_at:now()}:{}) });
    if (complete && !wasComplete) {
      await svc.SocialNotification.create({ recipient_id:userId, actor_id:userId, actor_name:'Atom X Eve', type:'message', title:`Quest complete: ${quest.title}`, body:'Your reward is ready to claim.', related_entity_id:record.id, status:'unread', action_kind:'none' }).catch(() => null);
    }
    changed.push({ quest, userQuest:record });
  }
  return changed;
}
