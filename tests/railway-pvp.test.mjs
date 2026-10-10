import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { signPvPClaims, combatReceipt } from '../base44/shared/railwayPvP.ts';
import { verifyPvPTicket } from '../railway/pvp/verifyTicket.js';
import { createPvPGateway } from '../railway/pvp/gateway.js';
import { combatAnimations } from '../src/components/battle/pvpDiagnosticSocket.js';

const secret = 'test-only-signing-secret-not-for-deployment-123456';
const at = Math.floor(Date.now() / 1000);
const claims = (sub = 'a', matchId = 'm', extra = {}) => ({ sub, matchId, playerIds: ['a', 'b'],
  aud: 'atomxe-railway-pvp', iat: at, exp: at + 90, nonce: crypto.randomUUID(), ...extra });
const ticket = (sub, matchId, extra) => signPvPClaims(claims(sub, matchId, extra), secret);
function harness(config = {}) {
  let clock = Date.now(), serial = 0;
  const timers = new Map();
  const gateway = createPvPGateway({ secret, now: () => clock,
    setTimer: (fn, ms) => { const id = ++serial; timers.set(id, { fn, at: clock + ms }); return id; },
    clearTimer: id => timers.delete(id), ...config });
  const socket = () => {
    const ws = { messages: [], closed: null, send(raw) { this.messages.push(JSON.parse(raw)); }, close(code) { this.closed = code; gateway.close(this); } };
    gateway.open(ws); return ws;
  };
  const send = (ws, data) => gateway.message(ws, JSON.stringify(data));
  const auth = async (ws, sub = 'a', matchId = 'm') => send(ws, { t: 'auth', ticket: await ticket(sub, matchId) });
  return { gateway, socket, send, auth, advance(ms) { clock += ms; for (const [id, job] of [...timers]) if (job.at <= clock) { timers.delete(id); job.fn(); } } };
}
const match = (extra = {}) => ({ id: 'm', mode: 'pvp', status: 'fighting', player_ids: ['a', 'b'],
  players: [{ id: 'a', hp: 1000 }, { id: 'b', hp: 950 }], attack_revision: 1,
  hit_log: [{ cast_id: 'cast1', attacker_id: 'a', target_id: 'b', slot: -1, damage: 50, hp_after: 950, resolved_at: new Date().toISOString() }], ...extra });
const events = ws => ws.messages.filter(m => m.t === 'combat.sync');

test('ticket verifies only match-scoped membership, signature, audience and bounded expiry', async () => {
  assert.equal((await verifyPvPTicket(await ticket('a'), secret)).matchId, 'm');
  for (const extra of [{ playerIds: ['b', 'c'] }, { playerIds: ['a', 'a'] }, { matchId: '' },
    { aud: 'other' }, { exp: at - 1 }, { exp: at + 1000 }, { iat: at + 60 }, { iat: at + 1, exp: at + 1 }]) {
    await assert.rejects(verifyPvPTicket(await ticket('a', 'm', extra), secret));
  }
  await assert.rejects(verifyPvPTicket(await ticket('a'), 'different-test-secret-12345678901234567890'));
  await assert.rejects(verifyPvPTicket(await ticket('a'), ''));
});

test('two authenticated players receive signed damage observations; another match receives nothing', async () => {
  const h = harness(), a = h.socket(), b = h.socket(), other = h.socket();
  await h.auth(a); await h.auth(b, 'b'); await h.auth(other, 'a', 'other');
  const receipt = await combatReceipt(match(), 'a', secret);
  await h.send(a, { t: 'combat.receipt', receipt });
  assert.equal(events(a).length, 1); assert.equal(events(b)[0].state.hp[1].hp, 950);
  assert.equal(events(b)[0].seq, 1); assert.equal(events(other).length, 0);
});

test('unsigned damage, forged signatures, cross-player and cross-match receipts cannot relay', async () => {
  const h = harness(), a = h.socket(), b = h.socket(), unauth = h.socket();
  await h.auth(a); await h.auth(b, 'b');
  await h.send(unauth, { t: 'pvp_action', damage: 999999 });
  assert.equal(unauth.messages.at(-1).code, 'AUTH_REQUIRED');
  await h.send(a, { t: 'pvp_action', damage: 999999 });
  assert.equal(a.messages.at(-1).code, 'UNSUPPORTED_MESSAGE');
  const receipt = await combatReceipt(match(), 'a', secret);
  await h.send(a, { t: 'combat.receipt', receipt: receipt.slice(0, -8) + 'AAAAAAAA' });
  await h.send(b, { t: 'combat.receipt', receipt });
  await h.send(a, { t: 'combat.receipt', receipt: await combatReceipt(match({ id: 'other' }), 'a', secret) });
  assert.equal(events(b).length, 0); assert.equal(a.messages.at(-1).code, 'RECEIPT_INVALID');
});

test('duplicate signed states do not echo; older damage revisions cannot rewind a room', async () => {
  const h = harness(), a = h.socket(), b = h.socket(); await h.auth(a); await h.auth(b, 'b');
  const m = match();
  await h.send(a, { t: 'combat.receipt', receipt: await combatReceipt(m, 'a', secret) });
  await h.send(b, { t: 'combat.receipt', receipt: await combatReceipt(m, 'b', secret) });
  await h.send(a, { t: 'combat.receipt', receipt: await combatReceipt(match({ attack_revision: 0 }), 'a', secret) });
  assert.equal(events(b).length, 1);
});

test('ticket replay and identity switching are refused, expiry disconnects the player', async () => {
  const h = harness(), a = h.socket(), clone = h.socket();
  const t = await ticket('a'); await h.send(a, { t: 'auth', ticket: t }); await h.send(clone, { t: 'auth', ticket: t });
  assert.equal(clone.closed, 4003);
  await h.auth(a, 'b'); assert.equal(a.closed, 4003);
  const b = h.socket(); await h.auth(b, 'b'); h.advance(91000); assert.equal(b.closed, 4001);
});

test('reconnect replaces only that player, replays state for reconciliation and preserves room sequence', async () => {
  const h = harness(), a = h.socket(), b = h.socket(); await h.auth(a); await h.auth(b, 'b');
  await h.send(a, { t: 'combat.receipt', receipt: await combatReceipt(match(), 'a', secret) });
  const next = h.socket(); await h.auth(next, 'b');
  assert.equal(b.closed, 4002); assert.equal(events(next)[0].replay, true);
  await h.send(a, { t: 'combat.receipt', receipt: await combatReceipt(match({ attack_revision: 2 }), 'a', secret) });
  assert.equal(events(next).at(-1).seq, 2);
});

test('unconfigured gateway preserves ping diagnostics and refuses gameplay', async () => {
  const h = harness({ secret: '' }), a = h.socket();
  await h.send(a, { t: 'ping', id: 'probe' }); assert.equal(a.messages.at(-1).t, 'pong');
  await h.auth(a); assert.equal(a.messages.at(-1).code, 'AUTH_NOT_CONFIGURED');
  assert.equal(h.gateway.health().gameplayRelay, false);
});

test('oversized frames and flooding are bounded', async () => {
  const h = harness(), a = h.socket(), b = h.socket();
  await h.gateway.message(a, 'x'.repeat(65537)); assert.equal(a.closed, 1009);
  for (let i = 0; i < 21; i++) await h.send(b, { t: 'ping', id: String(i) });
  assert.equal(b.closed, 1008);
});

test('animation reconciliation deduplicates casts and skips stale history', () => {
  const now = Date.now(), seen = new Set();
  const cast = { cast_id: 'skill', attacker_id: 'a', slot: 2, cast_at: new Date(now).toISOString() };
  const state = { last_cast: cast, hit_log: [{ ...cast, resolved_at: new Date(now).toISOString() },
    { cast_id: 'old', attacker_id: 'b', slot: -1, resolved_at: new Date(now - 60000).toISOString() }] };
  assert.equal(combatAnimations(state, seen, now).length, 1);
  assert.equal(combatAnimations(state, seen, now).length, 0);
});

const issuerSource = buildSync({ entryPoints: ['base44/functions/railwayPvPTicket/entry.ts'], bundle: true,
  platform: 'node', format: 'cjs', external: ['npm:*'], write: false }).outputFiles[0].text;
function issuer(user, storedMatch, configuredSecret = secret) {
  let handler;
  vm.runInNewContext(issuerSource, { Response, TextEncoder, btoa, crypto,
    Deno: { serve(fn) { handler = fn; }, env: { get: () => configuredSecret } },
    require: () => ({ createClientFromRequest: () => ({ auth: { me: async () => user },
      asServiceRole: { entities: { AIBattleMatch: { get: async () => storedMatch } } } }) }),
  });
  return (body = { matchId: 'm' }) => handler(new Request('https://test.local', { method: 'POST', body: JSON.stringify(body) }));
}
test('Base44 issuer checks the stored match, not client-supplied members or player ID', async () => {
  assert.equal((await issuer(null, match())()).status, 401);
  assert.equal((await issuer({ id: 'outsider' }, match())({ matchId: 'm', playerIds: ['outsider', 'a'] })).status, 403);
  assert.equal((await issuer({ id: 'a' }, match({ status: 'ended' }))()).status, 409);
  assert.equal((await issuer({ id: 'a' }, match({ mode: 'pve' }))()).status, 403);
  assert.equal((await issuer({ id: 'a' }, match(), '')()).status, 503);
  for (const id of ['a', 'b']) {
    const response = await issuer({ id }, match())();
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const result = await verifyPvPTicket((await response.json()).ticket, secret);
    assert.equal(result.userId, id); assert.equal(result.matchId, 'm');
  }
});

test('an emptied room gets a new stream epoch so reconnects accept sequence one again', async () => {
  const h = harness(), a = h.socket(); await h.auth(a);
  const epoch = a.messages.find(m => m.t === 'auth.ok').epoch;
  h.gateway.close(a);
  const next = h.socket(); await h.auth(next);
  assert.notEqual(next.messages.find(m => m.t === 'auth.ok').epoch, epoch);
  await h.send(next, { t: 'combat.receipt', receipt: await combatReceipt(match(), 'a', secret) });
  assert.equal(events(next)[0].seq, 1);
});
