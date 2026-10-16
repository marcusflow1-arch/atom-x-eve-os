import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import {
  clampAXEDuelStats,
  computeAXESwing,
  getAXEHitChancePct,
  AXE_COMBAT_RULES,
} from '../../shared/axePowerBudget.ts';

// Game 3D duels, resolved by the server (docs/game3d/BACKEND_AUDIT.md).
// Browsers can no longer write DuelSession: the challenge, the accept, every hit and the
// result all go through here. Each hit is rolled and resolved with the same combat rules
// the game uses (base44/shared/axePowerBudget.ts), against each duelist's stats.
//
// Duelist stats still come from the player's browser, because progression is not
// server-owned yet; they are clamped to what a fully built hero can have.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const nameOf = (user: any) => user?.full_name || user?.username || user?.email?.split?.('@')?.[0] || 'Player';

export const DUEL_RULES = Object.freeze({
  challengeLifeMs: 60_000, // a challenge nobody answers expires
  idleTimeoutMs: 120_000, // an active duel with no hit for two minutes ends with no winner
  minHitIntervalMs: 450, // the fastest a duelist can land hits
  maxSkillMultiplier: 3,
  rangeByWeaponPath: Object.freeze({ ranged: 7, damage: 3, defense: 3 }) as Record<string, number>,
  rangeToleranceM: 0.75, // positions are reported by the clients
  onlineWindowMs: 30_000,
});

const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();
const isPast = (iso?: string) => !!iso && Date.parse(iso) <= Date.now();
const sideOf = (duel: any, userId: string) => (duel.challenger_id === userId ? 'challenger' : duel.opponent_id === userId ? 'opponent' : null);
const other = (side: string) => (side === 'challenger' ? 'opponent' : 'challenger');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || '');
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities;
    const me = String(user.id);

    const duelsFor = async (userId: string, status: string) => {
      const [a, b] = await Promise.all([
        svc.DuelSession.filter({ challenger_id: userId, status }),
        svc.DuelSession.filter({ opponent_id: userId, status }),
      ]);
      return [...(a || []), ...(b || [])];
    };
    // every write returns the duel as it now stands
    const save = async (duel: any, patch: Record<string, unknown>) => ({ ...duel, ...patch, ...((await svc.DuelSession.update(duel.id, patch)) || {}) });
    // Expire stale challenges and idle duels before deciding anything.
    const settle = async (duel: any) => {
      if (duel.status === 'pending' && isPast(duel.expires_at)) return await save(duel, { status: 'expired' });
      if (duel.status === 'active' && duel.last_action_at && Date.parse(duel.last_action_at) + DUEL_RULES.idleTimeoutMs <= Date.now()) {
        return await save(duel, { status: 'finished', finish_reason: 'timeout' });
      }
      return duel;
    };
    const liveDuelsFor = async (userId: string) => {
      const out = [];
      for (const duel of [...await duelsFor(userId, 'active'), ...await duelsFor(userId, 'pending')]) {
        const settled = await settle(duel);
        if (settled.status === 'active' || settled.status === 'pending') out.push(settled);
      }
      return out;
    };
    const notify = async (recipientId: string, duel: any) => {
      await svc.SocialNotification.create({
        recipient_id: recipientId, actor_id: me, actor_name: nameOf(user), actor_avatar: user?.avatar_url || '',
        type: 'duel_challenge', title: 'Duel challenge', body: `${nameOf(user)} challenged you to a duel.`,
        related_entity_id: duel.id, status: 'unread', action_kind: 'duel_challenge',
      }).catch(() => null);
    };

    if (action === 'state') {
      const live = await liveDuelsFor(me);
      return json({
        active: live.find((d: any) => d.status === 'active') || null,
        incoming: live.filter((d: any) => d.status === 'pending' && d.opponent_id === me),
        outgoing: live.filter((d: any) => d.status === 'pending' && d.challenger_id === me),
      });
    }

    if (action === 'challenge') {
      const opponentId = String(data.opponentId || '').trim();
      if (!opponentId) return json({ error: 'Opponent is required', code: 'invalid' }, 400);
      if (opponentId === me) return json({ error: "That's you!", code: 'self' }, 400);
      // only players who are in the world right now (or friends) can be challenged
      const [presence, friendA, friendB] = await Promise.all([
        svc.PlayerState.filter({ player_id: opponentId }, '-last_update', 5).catch(() => []),
        svc.SocialFriendship.filter({ user_a_id: me, user_b_id: opponentId }).catch(() => []),
        svc.SocialFriendship.filter({ user_a_id: opponentId, user_b_id: me }).catch(() => []),
      ]);
      const online = (presence || []).some((p: any) => p?.status !== 'offline' && Number(p?.last_update || 0) > Date.now() - DUEL_RULES.onlineWindowMs);
      if (!online && !(friendA?.length || friendB?.length)) return json({ error: 'That player is not in the world', code: 'offline' }, 403);

      const mine = await liveDuelsFor(me);
      const already = mine.find((d: any) => d.status === 'pending' && d.challenger_id === me && d.opponent_id === opponentId);
      if (already) return json({ success: true, duel: already, already_pending: true });
      if (mine.some((d: any) => d.status === 'active')) return json({ error: "You're already in a duel", code: 'already_dueling' }, 409);
      if ((await liveDuelsFor(opponentId)).some((d: any) => d.status === 'active')) {
        return json({ error: `${String(data.opponentName || 'They')} is already in a duel`, code: 'already_dueling' }, 409);
      }
      const duel = await svc.DuelSession.create({
        challenger_id: me, challenger_name: nameOf(user),
        opponent_id: opponentId, opponent_name: String(data.opponentName || 'Player').slice(0, 80),
        status: 'pending', challenger_stats: clampAXEDuelStats(data.stats), expires_at: isoIn(DUEL_RULES.challengeLifeMs),
      });
      await notify(opponentId, duel);
      return json({ success: true, duel });
    }

    if (action === 'respond') {
      const duel = await svc.DuelSession.get(String(data.duelId || '')).catch(() => null);
      if (!duel || duel.opponent_id !== me) return json({ error: 'Duel not found' }, 404);
      const settled = await settle(duel);
      if (settled.status !== 'pending') return json({ error: 'That challenge is no longer open', code: 'not_pending', duel: settled }, 409);
      if (data.decision !== 'accept') {
        return json({ success: true, duel: await save(duel, { status: 'declined' }) });
      }
      if ((await liveDuelsFor(me)).some((d: any) => d.status === 'active' && d.id !== duel.id)) {
        return json({ error: "You're already in a duel", code: 'already_dueling' }, 409);
      }
      const challenger = clampAXEDuelStats(duel.challenger_stats);
      const opponent = clampAXEDuelStats(data.stats);
      const updated = await save(duel, {
        status: 'active', opponent_stats: opponent, opponent_name: nameOf(user),
        challenger_hp: challenger.maxHP, challenger_max_hp: challenger.maxHP,
        opponent_hp: opponent.maxHP, opponent_max_hp: opponent.maxHP,
        max_hp: Math.max(challenger.maxHP, opponent.maxHP),
        last_hit_at: {}, last_action_at: new Date().toISOString(),
      });
      return json({ success: true, duel: updated });
    }

    if (action === 'hit') {
      const duel = await svc.DuelSession.get(String(data.duelId || '')).catch(() => null);
      const side = duel && sideOf(duel, me);
      if (!duel || !side) return json({ error: 'Duel not found' }, 404);
      const settled = await settle(duel);
      if (settled.status !== 'active') return json({ error: 'The duel is over', code: 'not_active', duel: settled }, 409);

      const range = DUEL_RULES.rangeByWeaponPath[String(data.weaponPath || 'damage')] ?? DUEL_RULES.rangeByWeaponPath.damage;
      const distance = Number(data.distance);
      if (!Number.isFinite(distance) || distance > range + DUEL_RULES.rangeToleranceM) return json({ error: 'Out of range', code: 'out_of_range' }, 422);
      const now = Date.now();
      const last = Number(duel.last_hit_at?.[me] || 0);
      if (now - last < DUEL_RULES.minHitIntervalMs) return json({ error: 'Too fast', code: 'too_fast', retryAfterMs: DUEL_RULES.minHitIntervalMs - (now - last) }, 429);

      const attacker = clampAXEDuelStats(duel[`${side}_stats`]);
      const defender = clampAXEDuelStats(duel[`${other(side)}_stats`]);
      const skillMultiplier = Math.max(0.1, Math.min(DUEL_RULES.maxSkillMultiplier, Number(data.skillMultiplier) || 1));
      // the server rolls the dice: Accuracy against Block, then the capped crit chance
      const landed = Math.random() * 100 < getAXEHitChancePct(attacker.attackSuccess, defender.attackBlock);
      const critical = landed && Math.random() * 100 < Math.min(AXE_COMBAT_RULES.critChanceCapPct, attacker.critChance);
      const damage = landed ? computeAXESwing(attacker, defender, { critical, skillMultiplier }) : 0;

      const hpKey = `${other(side)}_hp`;
      const hp = Math.max(0, Number(duel[hpKey] ?? defender.maxHP) - damage);
      const patch: Record<string, unknown> = {
        [hpKey]: hp,
        last_hit_at: { ...(duel.last_hit_at || {}), [me]: now },
        last_action_at: new Date(now).toISOString(),
      };
      if (hp <= 0) Object.assign(patch, { status: 'finished', finish_reason: 'knockout', winner_id: me, loser_id: duel[`${other(side)}_id`] });
      const updated = await save(duel, patch);
      return json({ success: true, hit: { missed: !landed, critical, damage }, duel: updated });
    }

    if (action === 'forfeit') {
      const duel = await svc.DuelSession.get(String(data.duelId || '')).catch(() => null);
      const side = duel && sideOf(duel, me);
      if (!duel || !side) return json({ error: 'Duel not found' }, 404);
      if (duel.status === 'pending') return json({ success: true, duel: await save(duel, { status: 'declined' }) });
      if (duel.status !== 'active') return json({ success: true, duel });
      return json({
        success: true,
        duel: await save(duel, {
          status: 'finished', finish_reason: 'forfeit', winner_id: duel[`${other(side)}_id`], loser_id: me,
        }),
      });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('[duelSystem]', error);
    return json({ error: (error as Error)?.message || 'Duel failed' }, 500);
  }
});
