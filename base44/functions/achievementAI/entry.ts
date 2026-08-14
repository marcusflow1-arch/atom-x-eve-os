import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const rarityMultiplier = { Common: 1, Uncommon: 1.15, Rare: 1.35, Epic: 1.7, Legendary: 2.2, Mythical: 3, Unique: 4, Limitless: 6 };

function normalizeReward(achievement) {
  const reward = achievement?.reward || {};
  const category = achievement?.category || 'standard';
  const rarity = achievement?.rarity || 'Common';
  const baseXp = Number(achievement?.points) || 10;
  const xp = Math.max(10, Math.round(baseXp * (rarityMultiplier[rarity] || 1)));
  const name = reward.name || achievement.title;
  const payload = { type: reward.type || category, name, description: reward.description || achievement.description, stats: reward.stats || {}, abilities: reward.abilities || [], game: achievement.game, achievement_id: achievement.id, rarity };
  return { xp, payload, category };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { action, achievement, game } = await req.json();
    if (!action || !achievement) return Response.json({ error: 'Missing required parameters' }, { status: 400 });

    if (action === 'unlock') {
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const achievementId = achievement.id;
      if (!achievementId) return Response.json({ error: 'achievement.id is required for unlock' }, { status: 400 });

      const canonical = await base44.entities.Achievement.get(achievementId);
      if (!canonical) return Response.json({ error: 'Achievement not found' }, { status: 404 });
      const { xp, payload, category } = normalizeReward(canonical);

      const existing = await base44.entities.UserAchievement.filter({ user_id: user.id, achievement_id: achievementId });
      if (existing?.[0]?.status === 'unlocked') return Response.json({ status: 'already_unlocked', reward: existing[0].progress?.reward || payload, xp: existing[0].progress?.xp_awarded || 0 });

      const progressionRows = await base44.entities.AvatarProgression.filter({ user_id: user.id });
      const progression = progressionRows?.[0];
      const currentStats = progression?.stats || { hp: 100, strength: 10, intelligence: 10, will: 10, tenacity: 10 };
      const nextXp = (Number(progression?.global_xp) || 0) + xp;
      const statPoints = (Number(progression?.available_stat_points) || 0) + (category === 'standard' ? 1 : 2);
      const level = Math.max(1, Math.floor(nextXp / 1000) + 1);

      const rewardRecord = { ...payload, granted_at: new Date().toISOString(), xp };
      const userAchievements = user.unlocked_achievements || [];
      const nextAchievements = userAchievements.includes(achievementId) ? userAchievements : [...userAchievements, achievementId];
      const nextUser = {
        unlocked_achievements: nextAchievements,
        achievement_rewards: [...(user.achievement_rewards || []).filter(r => r.achievement_id !== achievementId), rewardRecord]
      };
      if (category === 'equipment' || payload.type?.toLowerCase().includes('sword') || payload.type?.toLowerCase().includes('equipment')) nextUser.unlocked_gear = [...(user.unlocked_gear || []).filter(r => r.achievement_id !== achievementId), rewardRecord];
      if (category === 'ability' || payload.abilities?.length) nextUser.unlocked_abilities = [...(user.unlocked_abilities || []).filter(r => r.achievement_id !== achievementId), rewardRecord];
      if (category === 'companion') nextUser.companions = [...(user.companions || []).filter(r => r.achievement_id !== achievementId), rewardRecord];
      if (payload.type?.toLowerCase().includes('teacher') || category === 'environment') nextUser.teachers = [...(user.teachers || []).filter(r => r.achievement_id !== achievementId), rewardRecord];
      await base44.auth.updateMe(nextUser);

      const progressPayload = { current: 1, total: 1, reward: rewardRecord, xp_awarded: xp };
      if (existing?.[0]) await base44.entities.UserAchievement.update(existing[0].id, { status: 'unlocked', progress: progressPayload });
      else await base44.entities.UserAchievement.create({ user_id: user.id, achievement_id: achievementId, status: 'unlocked', progress: progressPayload });

      if (progression) await base44.entities.AvatarProgression.update(progression.id, { global_xp: nextXp, global_level: level, available_stat_points: statPoints, stats: currentStats });
      else await base44.entities.AvatarProgression.create({ user_id: user.id, global_xp: nextXp, global_level: level, available_stat_points: statPoints, stats: currentStats });

      return Response.json({ status: 'unlocked', achievement_id: achievementId, reward: rewardRecord, xp_awarded: xp, avatar_level: level });
    }

    if (action === 'get_tips') {
      const prompt = `You are an expert gaming assistant. Provide personalized tips and strategies for unlocking this achievement. Achievement: ${achievement.title}. Description: ${achievement.description}. Game: ${game || achievement.game}. Also suggest dynamic difficulty adjustments if the player is struggling. Return JSON with strategy, difficulty_adjustment, and quick_tips.`;
      return Response.json(await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: 'object', properties: { strategy: { type: 'string' }, difficulty_adjustment: { type: 'string' }, quick_tips: { type: 'array', items: { type: 'string' } } }, required: ['strategy', 'difficulty_adjustment', 'quick_tips'] } }));
    }

    if (action === 'get_voice_guide') {
      if (!ELEVENLABS_API_KEY) return Response.json({ error: 'ElevenLabs API key not set' }, { status: 500 });
      const scriptResponse = await base44.integrations.Core.InvokeLLM({ prompt: `Write a short, engaging, 3-sentence voice script guiding a player on how to unlock this achievement: "${achievement.title}: ${achievement.description}" in the game "${game || achievement.game}". Keep it encouraging and tactical.` });
      const text = typeof scriptResponse === 'string' ? scriptResponse : JSON.stringify(scriptResponse);
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY, 'Accept': 'audio/mpeg' }, body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }) });
      if (!elevenLabsResponse.ok) throw new Error(`ElevenLabs error: ${await elevenLabsResponse.text()}`);
      return new Response(await elevenLabsResponse.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg' } });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('achievementAI error:', error);
    return Response.json({ error: error?.message || 'Achievement AI failed' }, { status: 500 });
  }
});
