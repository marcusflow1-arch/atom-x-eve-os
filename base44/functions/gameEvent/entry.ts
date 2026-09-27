import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { grantAchievement } from '../../shared/rewardEngine.ts';
import { conditionalUpdate, ensureKeyedRecord, rewardError, rewardKey } from '../../shared/rewardJournal.ts';

type Row = Record<string, any>;
const enc = new TextEncoder();
const json = (body: unknown, status = 200) => Response.json(body, { status });
const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('');

async function expectedSignature(secret: string, raw: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(raw)));
}
function safeEqual(a: string, b: string) {
  const aa = enc.encode(a.toLowerCase().replace(/^sha256=/, '')), bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i += 1) diff |= aa[i] ^ bb[i];
  return diff === 0;
}
async function matchingRules(svc: any, gameId: string, eventKey: string) {
  const rules: Row[] = [];
  for (let skip = 0; ; skip += 200) {
    const page = await svc.Achievement.filter({ game_id: gameId, 'event_rule.event_key': eventKey }, 'id', 200, skip);
    for (const definition of page) {
      const threshold = Number(definition.event_rule?.threshold ?? 1);
      if (!Number.isSafeInteger(threshold) || threshold < 1) throw rewardError('Achievement event threshold is invalid');
      rules.push({ id: definition.id, threshold });
    }
    if (page.length < 200) return rules;
  }
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
    if (enc.encode(raw).length > 65536) return json({ error: 'Event body is too large' }, 413);
    if (!safeEqual(provided, await expectedSignature(secret, raw))) return json({ error: 'Invalid signature' }, 401);
    let body: Row;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON body' }, 400); }
    if (!body || Array.isArray(body) || typeof body !== 'object') return json({ error: 'Invalid event body' }, 400);
    const { user_id: userId, event_id: eventId, event_key: eventKey } = body;
    const value = body.value ?? 1;
    const occurredAt = typeof body.occurred_at === 'string' ? Date.parse(body.occurred_at) : NaN;
    const validId = (id: unknown) => typeof id === 'string' && id.trim() === id && id.length > 0 && id.length <= 128;
    if (!validId(userId) || !validId(eventKey) || !validId(eventId) || !Number.isSafeInteger(value) || value < 1 || !Number.isFinite(occurredAt)) {
      return json({ error: 'event_id, user_id, event_key, occurred_at and a positive whole-number value are required' }, 400);
    }
    if (Date.now() - occurredAt > 86400000) return json({ error: 'Event is older than 24 hours' }, 400);
    if (occurredAt - Date.now() > 300000) return json({ error: 'Event timestamp is too far in the future' }, 400);

    const svc = createClientFromRequest(req).asServiceRole.entities;
    const game = await svc.Game.get(gameId);
    if (!game) return json({ error: 'Game not found' }, 404);
    const recipient = await svc.User.get(userId);
    if (!recipient) return json({ error: 'Player not found' }, 404);
    const payload = { user_id: userId, event_key: eventKey, value, occurred_at: new Date(occurredAt).toISOString() };
    const hash = hex(await crypto.subtle.digest('SHA-256', enc.encode(JSON.stringify([gameId, eventId, payload]))));
    let receipt = await ensureKeyedRecord(svc.GameEventReceipt, { game_id: gameId, event_id: eventId });
    if (!receipt.payload_hash) {
      const rules = await matchingRules(svc, gameId, eventKey);
      await conditionalUpdate(svc.GameEventReceipt, { id: receipt.id, payload_hash: { $exists: false } }, {
        $set: { user_id: userId, payload_hash: hash, payload, achievement_rules: rules, status: 'pending' },
      });
      receipt = await svc.GameEventReceipt.get(receipt.id);
    }
    if (receipt.payload_hash !== hash) return json({ error: 'event_id has already been used for a different event' }, 409);
    if (receipt.status === 'completed') return json({
      success: true, duplicate: true, game_id: gameId, event_id: eventId, event_key: eventKey,
      matched: receipt.results?.length || 0, results: receipt.results || [],
    });

    const eventReceiptKey = rewardKey('game-event', gameId, eventId);
    const results: Row[] = [];
    for (const rule of receipt.achievement_rules || []) {
      let record = await ensureKeyedRecord(svc.UserAchievement, { user_id: userId, achievement_id: rule.id });
      if (record.status !== 'unlocked') {
        const previous = Number(record.verified_event_value ?? 0);
        if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(previous + value)) throw rewardError('Verified event progress requires reconciliation');
        // Progress and its receipt marker are written in the same server update.
        // Proof metadata and the legacy progress.event_value are not authority.
        await conditionalUpdate(svc.UserAchievement, {
          id: record.id, user_id: userId, status: { $ne: 'unlocked' }, verified_event_ids: { $nin: [eventReceiptKey] },
        }, { $inc: { verified_event_value: value }, $addToSet: { verified_event_ids: eventReceiptKey } });
        record = await svc.UserAchievement.get(record.id);
      }
      const current = Number(record.verified_event_value ?? 0);
      const progress = { event_key: eventKey, event_value: current, threshold: rule.threshold, occurred_at: payload.occurred_at };
      if (record.status === 'unlocked' || current >= rule.threshold) {
        const granted = await grantAchievement(svc, userId, rule.id, 'game_event', { progress, current, total: rule.threshold });
        results.push({ achievement_id: rule.id, unlocked: true, already_unlocked: Boolean(granted.alreadyUnlocked), user_card_id: granted.userCard?.id || null });
      } else {
        await conditionalUpdate(svc.UserAchievement, { id: record.id, status: { $ne: 'unlocked' }, verified_event_value: current }, {
          $set: { status: 'in_progress', source: 'game_event', progress },
        });
        results.push({ achievement_id: rule.id, unlocked: false, current, threshold: rule.threshold });
      }
    }
    await svc.GameEventReceipt.update(receipt.id, { status: 'completed', results, completed_at: new Date().toISOString() });
    return json({ success: true, duplicate: false, game_id: gameId, event_id: eventId, event_key: eventKey, matched: results.length, results });
  } catch (error: any) {
    console.error('gameEvent failed', error);
    return json({ error: error instanceof Error ? error.message : 'Game event failed' }, Number(error?.status || error?.response?.status || 500));
  }
});
