import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { grantAchievement } from '../../shared/rewardEngine.ts';

type AnyObj = Record<string, any>;
const enc = new TextEncoder();
const json = (body: unknown, status = 200) => Response.json(body, { status });

async function expectedSignature(secret: string, raw: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(raw)));
  return [...signature].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  const aa = enc.encode(a.toLowerCase().replace(/^sha256=/, ''));
  const bb = enc.encode(b.toLowerCase().replace(/^sha256=/, ''));
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i += 1) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const gameId = String(req.headers.get('X-Game-Id') || '').trim();
    const provided = String(req.headers.get('X-Signature') || '').trim();
    if (!gameId || !provided) return json({ error: 'Missing game signature headers' }, 401);
    const secret = Deno.env.get(`GAME_SECRET_${gameId}`);
    if (!secret) return json({ error: 'Game integration is not configured' }, 401);
    const raw = await req.text();
    const expected = await expectedSignature(secret, raw);
    if (!safeEqual(provided, expected)) return json({ error: 'Invalid signature' }, 401);

    const body = JSON.parse(raw || '{}');
    const userId = String(body.user_id || '').trim();
    const eventKey = String(body.event_key || '').trim();
    const value = Number(body.value ?? 1);
    const occurredAt = Date.parse(String(body.occurred_at || ''));
    if (!userId || !eventKey || !Number.isFinite(value) || value <= 0 || !Number.isFinite(occurredAt)) return json({ error: 'Invalid event body' }, 400);
    const age = Math.abs(Date.now() - occurredAt);
    if (age > 24 * 60 * 60 * 1000) return json({ error: 'Event is older than 24 hours' }, 400);

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const game = await svc.Game.get(gameId).catch(() => null);
    if (!game) return json({ error: 'Game not found' }, 404);
    const definitions = await svc.Achievement.list('title', 5000);
    const matches = definitions.filter((achievement: AnyObj) => String(achievement.game_id || '') === gameId && String(achievement.event_rule?.event_key || '') === eventKey);
    const results: AnyObj[] = [];
    for (const achievement of matches) {
      const rows = await svc.UserAchievement.filter({ user_id: userId, achievement_id: achievement.id }, '-created_date', 1);
      const existing = rows[0] || null;
      if (existing?.status === 'unlocked') { results.push({ achievement_id: achievement.id, unlocked: true, already_unlocked: true }); continue; }
      const previous = Number(existing?.progress?.event_value || 0);
      const current = previous + value;
      const threshold = Math.max(1, Number(achievement.event_rule?.threshold || 1));
      const progress = { ...(existing?.progress || {}), event_key: eventKey, event_value: current, threshold, occurred_at: new Date(occurredAt).toISOString() };
      if (current >= threshold) {
        const granted = await grantAchievement(svc, userId, achievement.id, 'game_event', { progress, current, total: threshold });
        results.push({ achievement_id: achievement.id, unlocked: true, user_card_id: granted.userCard?.id || null });
      } else if (existing) {
        await svc.UserAchievement.update(existing.id, { status: 'in_progress', source: 'game_event', progress });
        results.push({ achievement_id: achievement.id, unlocked: false, current, threshold });
      } else {
        await svc.UserAchievement.create({ user_id: userId, achievement_id: achievement.id, status: 'in_progress', source: 'game_event', progress });
        results.push({ achievement_id: achievement.id, unlocked: false, current, threshold });
      }
    }
    return json({ success: true, game_id: gameId, event_key: eventKey, matched: results.length, results });
  } catch (error) {
    console.error('gameEvent failed', error);
    return json({ error: error instanceof Error ? error.message : 'Game event failed' }, 500);
  }
});
