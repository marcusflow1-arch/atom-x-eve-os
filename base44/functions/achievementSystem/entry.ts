import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { grantAchievement } from '../../shared/rewardEngine.ts';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'getUserAchievements');
    const svc = base44.asServiceRole.entities;

    if (action === 'submit_proof') {
      const achievementId = String(body.achievementId || body.achievement_id || '');
      const proofUrl = String(body.proof_media_url || body.proofMediaUrl || '').trim();
      if (!achievementId || !proofUrl) return json({ error: 'achievementId and proof_media_url are required' }, 400);
      const achievement = await svc.Achievement.get(achievementId).catch(() => null);
      if (!achievement) return json({ error: 'Achievement not found' }, 404);
      const rows = await svc.UserAchievement.filter({ user_id: user.id, achievement_id: achievementId }, '-created_date', 10);
      if (rows[0]?.status === 'unlocked') return json({ success: true, already_unlocked: true, achievement: rows[0] });
      let record: AnyObj;
      if (rows[0]) record = await svc.UserAchievement.update(rows[0].id, { status: 'pending_review', source: 'proof', proof_media_url: proofUrl, progress: { ...(rows[0].progress || {}), submitted_at: new Date().toISOString() } });
      else record = await svc.UserAchievement.create({ user_id: user.id, achievement_id: achievementId, status: 'pending_review', source: 'proof', proof_media_url: proofUrl, progress: { submitted_at: new Date().toISOString() } });
      return json({ success: true, status: 'pending_review', achievement: record });
    }

    if (action === 'review_proof') {
      if (user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
      const userAchievementId = String(body.user_achievement_id || '');
      if (typeof body.approve !== 'boolean') return json({ error: 'approve must be true or false' }, 400);
      const approve = body.approve;
      const record = await svc.UserAchievement.get(userAchievementId).catch(() => null);
      if (!record || record.status !== 'pending_review') return json({ error: 'Pending proof not found' }, 404);
      if (!approve) {
        const rejected = await svc.UserAchievement.update(record.id, { status: 'locked', progress: { ...(record.progress || {}), rejected_at: new Date().toISOString(), review_note: String(body.review_note || '') } });
        return json({ success: true, approved: false, achievement: rejected });
      }
      const result = await grantAchievement(svc, record.user_id, record.achievement_id, 'proof', { progress: { ...(record.progress || {}), approved_at: new Date().toISOString(), review_note: String(body.review_note || '') } });
      return json({ success: true, approved: true, ...result });
    }

    if (action === 'getUserAchievements') {
      const targetUserId = user.role === 'admin' && body.user_id ? String(body.user_id) : user.id;
      const [userAchievements, allAchievements] = await Promise.all([
        svc.UserAchievement.filter({ user_id: targetUserId }, '-unlocked_at', 5000),
        svc.Achievement.list('title', 5000),
      ]);
      const definitions = new Map(allAchievements.map((a: AnyObj) => [String(a.id), a]));
      const achievements = userAchievements.map((ua: AnyObj) => ({ ...ua, definition: definitions.get(String(ua.achievement_id)) || null }));
      return json({ success: true, achievements });
    }

    // Deliberately no public awardAchievement action. Verified game events,
    // quests, approved proof and admin tools call the shared reward engine.
    return json({ error: 'Invalid achievement action' }, 400);
  } catch (error) {
    console.error('achievementSystem failed', error);
    return json({ error: error instanceof Error ? error.message : 'Achievement request failed' }, 500);
  }
});
