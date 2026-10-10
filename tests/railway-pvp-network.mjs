// Run with Bun: bun tests/railway-pvp-network.mjs
import assert from 'node:assert/strict';
import { signPvPClaims, combatReceipt } from '../base44/shared/railwayPvP.ts';
const secret = crypto.randomUUID() + crypto.randomUUID();
process.env.RAILWAY_PVP_TICKET_SECRET = secret;
process.env.PVP_ALLOWED_ORIGINS = 'https://approved.test';
process.env.PORT = '0';
const { server } = await import('../railway/pvp/server.js');
const sockets = [];
function client() {
  const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
  sockets.push(ws);
  const messages = [], waiters = [];
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data), i = waiters.findIndex(w => w.type === msg.t);
    if (i >= 0) { const w = waiters.splice(i, 1)[0]; clearTimeout(w.timer); w.resolve(msg); }
    else messages.push(msg);
  });
  return {
    open: new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); }),
    send: data => ws.send(JSON.stringify(data)),
    next(type) {
      const i = messages.findIndex(m => m.t === type);
      if (i >= 0) return Promise.resolve(messages.splice(i, 1)[0]);
      return new Promise((resolve, reject) => {
        const w = { type, resolve, timer: setTimeout(() => reject(new Error(`Timed out: ${type}`)), 3000) };
        waiters.push(w);
      });
    },
  };
}
try {
  assert.equal((await (await fetch(`http://127.0.0.1:${server.port}/health`)).json()).gameplayRelay, true);
  const denied = await fetch(`http://127.0.0.1:${server.port}/ws`, { headers: { Upgrade: 'websocket', Origin: 'https://untrusted.test' } });
  assert.equal(denied.status, 403);
  const a = client(), b = client(); await Promise.all([a.open, b.open]);
  a.send({ t: 'pvp_action', damage: 999999 }); assert.equal((await a.next('error')).code, 'AUTH_REQUIRED');
  const iat = Math.floor(Date.now() / 1000);
  for (const [c, sub] of [[a, 'a'], [b, 'b']]) {
    const ticket = await signPvPClaims({ aud: 'atomxe-railway-pvp', sub, matchId: 'm', playerIds: ['a', 'b'], iat, exp: iat + 90, nonce: crypto.randomUUID() }, secret);
    c.send({ t: 'auth', ticket }); assert.equal((await c.next('auth.ok')).playerId, sub);
  }
  const state = { id: 'm', mode: 'pvp', status: 'fighting', player_ids: ['a', 'b'],
    players: [{ id: 'a', hp: 1000 }, { id: 'b', hp: 925 }], attack_revision: 1,
    last_cast: { cast_id: 'network-cast', attacker_id: 'a', target_id: 'b', cast_at: new Date().toISOString() },
    hit_log: [{ cast_id: 'network-cast', damage: 75, hp_after: 925 }] };
  a.send({ t: 'combat.receipt', receipt: await combatReceipt(state, 'a', secret) });
  const event = await b.next('combat.sync');
  assert.equal(event.state.hp[1].hp, 925); assert.equal(event.state.last_cast.cast_id, 'network-cast');
  a.send({ t: 'ping', id: 'network-probe' }); assert.equal((await a.next('pong')).id, 'network-probe');
  console.log('PASS: real Bun WebSocket handshake, origin rejection, two-player authentication, signed combat sync and ping');
} finally { for (const ws of sockets) ws.close(); server.stop(true); }
