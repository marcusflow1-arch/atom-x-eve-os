// duelSystem: Game 3D duels resolved by the server (docs/game3d/BACKEND_AUDIT.md).
// The function runs against an in-memory Base44 stand-in; its dice are scripted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import vm from 'node:vm';

const tables = {};
const reset = () => {
  for (const k of Object.keys(tables)) delete tables[k];
  Object.assign(tables, {
    DuelSession: [],
    SocialNotification: [],
    SocialFriendship: [{ id: 'f1', user_a_id: 'alice', user_b_id: 'carol' }],
    PlayerState: [{ id: 'p1', player_id: 'bob', status: 'online', last_update: Date.now() }],
  });
};
const matches = (row, filter) => Object.entries(filter).every(([k, v]) => row[k] === v);
let seq = 0;
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (filter = {}) => (tables[name] || []).filter((r) => matches(r, filter)).map((r) => ({ ...r })),
  get: async (id) => { const r = (tables[name] || []).find((x) => x.id === id); return r ? { ...r } : null; },
  create: async (data) => { const row = { id: `${name}-${++seq}`, ...data }; (tables[name] ||= []).push(row); return { ...row }; },
  update: async (id, patch) => { const r = (tables[name] || []).find((x) => x.id === id); Object.assign(r, patch); return { ...r }; },
  delete: async (id) => { tables[name] = (tables[name] || []).filter((x) => x.id !== id); },
}) });
const users = { alice: { id: 'alice', full_name: 'Alice' }, bob: { id: 'bob', full_name: 'Bob' }, carol: { id: 'carol', full_name: 'Carol' }, dave: { id: 'dave', full_name: 'Dave' } };

// the function's dice
const rolls = [];
const scriptedMath = Object.create(Math);
scriptedMath.random = () => (rolls.length ? rolls.shift() : 0.5);

let handler;
const source = buildSync({ entryPoints: ['base44/functions/duelSystem/entry.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
vm.runInNewContext(source, {
  module: { exports: {} }, exports: {}, Response, Request, Date, JSON, Number, String, Object, Array, Promise, Math: scriptedMath,
  console: { warn() {}, error() {}, log() {} },
  Deno: { serve: (fn) => { handler = fn; } },
  require: () => ({ createClientFromRequest: (req) => ({ auth: { me: async () => users[req.headers.get('test-user')] || null }, asServiceRole: { entities } }) }),
});
// the same rules, as the game bundles them
const shared = await import('data:text/javascript,' + encodeURIComponent(buildSync({ entryPoints: ['base44/shared/axePowerBudget.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral' }).outputFiles[0].text));

async function call(user, action, data = {}, status = 200) {
  const res = await handler(new Request('https://test.local', { method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }) }));
  const body = await res.json();
  assert.equal(res.status, status, `${action}: ${JSON.stringify(body)}`);
  return body;
}
const HERO = { level: 40, damage: 800, maxHP: 3800, defense: 360, attackSuccess: 180, attackBlock: 230, critChance: 24, attributionAttack: 130, attributionDefense: 120, criticalDamage: 0.2, criticalDefense: 0.1 };
const stored = (id) => tables.DuelSession.find((d) => d.id === id);
const startDuel = async (a = HERO, b = HERO) => {
  const { duel } = await call('alice', 'challenge', { opponentId: 'bob', opponentName: 'Bob', stats: a });
  await call('bob', 'respond', { duelId: duel.id, decision: 'accept', stats: b });
  return stored(duel.id);
};

test('only signed-in players, never yourself, and only someone in the world or a friend', async () => {
  reset();
  await call('nobody', 'state', {}, 401);
  assert.equal((await call('alice', 'challenge', { opponentId: 'alice' }, 400)).code, 'self');
  assert.equal((await call('alice', 'challenge', { opponentId: 'dave' }, 403)).code, 'offline', 'Dave is not online and not a friend');
  assert.ok((await call('alice', 'challenge', { opponentId: 'carol', stats: HERO })).duel, 'Carol is a friend');
  const { duel } = await call('alice', 'challenge', { opponentId: 'bob', opponentName: 'Bob', stats: HERO });
  assert.equal(duel.status, 'pending');
  assert.ok((await call('alice', 'challenge', { opponentId: 'bob', stats: HERO })).already_pending, 'a second click returns the same challenge');
  assert.ok(tables.SocialNotification.some((n) => n.recipient_id === 'bob' && n.type === 'duel_challenge' && n.related_entity_id === duel.id), 'Bob is notified');
});

test('a tampered client cannot bring absurd stats', async () => {
  reset();
  const { duel } = await call('alice', 'challenge', { opponentId: 'bob', stats: { level: 999, damage: 1e9, maxHP: 1e9, critChance: 100, defense: -5 } });
  const s = stored(duel.id).challenger_stats;
  assert.equal(s.level, 100);
  assert.equal(s.damage, shared.AXE_DUEL_STAT_LIMITS.damage);
  assert.equal(s.maxHP, Math.round(shared.AXE_DUEL_STAT_LIMITS.maxHP));
  assert.equal(s.critChance, 50);
  assert.equal(s.defense, 0);
});

test('only the challenged player answers; accepting starts the duel at each side\'s own max HP', async () => {
  reset();
  const { duel } = await call('alice', 'challenge', { opponentId: 'bob', stats: { ...HERO, maxHP: 3000 } });
  await call('alice', 'respond', { duelId: duel.id, decision: 'accept' }, 404);
  await call('carol', 'respond', { duelId: duel.id, decision: 'accept' }, 404);
  const { duel: active } = await call('bob', 'respond', { duelId: duel.id, decision: 'accept', stats: { ...HERO, maxHP: 4200 } });
  assert.equal(active.status, 'active');
  assert.deepEqual([active.challenger_hp, active.challenger_max_hp, active.opponent_hp, active.opponent_max_hp], [3000, 3000, 4200, 4200]);
  assert.equal((await call('bob', 'respond', { duelId: duel.id, decision: 'accept' }, 409)).code, 'not_pending');
  const second = (await call('alice', 'challenge', { opponentId: 'carol', stats: HERO }, 409));
  assert.equal(second.code, 'already_dueling');
});

test('declined and expired challenges cannot be accepted', async () => {
  reset();
  const { duel } = await call('alice', 'challenge', { opponentId: 'bob', stats: HERO });
  assert.equal((await call('bob', 'respond', { duelId: duel.id, decision: 'decline' })).duel.status, 'declined');
  const { duel: late } = await call('alice', 'challenge', { opponentId: 'bob', stats: HERO });
  stored(late.id).expires_at = new Date(Date.now() - 1000).toISOString();
  assert.equal((await call('bob', 'respond', { duelId: late.id, decision: 'accept', stats: HERO }, 409)).duel.status, 'expired');
});

test('the server rolls each hit and resolves it with the game\'s combat rules', async () => {
  reset();
  const duel = await startDuel();
  // hit roll 0 (lands), crit roll 0.99 (no crit)
  rolls.push(0, 0.99);
  const plain = await call('alice', 'hit', { duelId: duel.id, distance: 2, weaponPath: 'damage', skillMultiplier: 1 });
  const expected = shared.computeAXESwing(shared.clampAXEDuelStats(HERO), shared.clampAXEDuelStats(HERO), { critical: false, skillMultiplier: 1 });
  assert.deepEqual(plain.hit, { missed: false, critical: false, damage: expected });
  assert.equal(stored(duel.id).opponent_hp, HERO.maxHP - expected);
  // a miss: the hit roll fails, nothing changes but the clock
  stored(duel.id).last_hit_at = {};
  rolls.push(0.999);
  assert.deepEqual((await call('alice', 'hit', { duelId: duel.id, distance: 2, weaponPath: 'damage' })).hit, { missed: true, critical: false, damage: 0 });
  assert.equal(stored(duel.id).opponent_hp, HERO.maxHP - expected);
  // a crit with a skill: x2 + crit damage, crit defense applied, skill multiplier capped at 3
  stored(duel.id).last_hit_at = {};
  rolls.push(0, 0);
  const crit = await call('alice', 'hit', { duelId: duel.id, distance: 2, weaponPath: 'damage', skillMultiplier: 99 });
  assert.equal(crit.hit.critical, true);
  assert.equal(crit.hit.damage, shared.computeAXESwing(shared.clampAXEDuelStats(HERO), shared.clampAXEDuelStats(HERO), { critical: true, skillMultiplier: 3 }));
});

test('hits must be in range and no faster than the server allows', async () => {
  reset();
  const duel = await startDuel();
  assert.equal((await call('alice', 'hit', { duelId: duel.id, distance: 9, weaponPath: 'damage' }, 422)).code, 'out_of_range');
  assert.ok((await call('alice', 'hit', { duelId: duel.id, distance: 6.5, weaponPath: 'ranged' })).hit, 'ranged reaches 7 m');
  assert.equal((await call('alice', 'hit', { duelId: duel.id, distance: 6.5, weaponPath: 'ranged' }, 429)).code, 'too_fast');
  await call('carol', 'hit', { duelId: duel.id, distance: 1 }, 404);
});

test('a knockout, a forfeit or two idle minutes end the duel', async () => {
  reset();
  let duel = await startDuel();
  stored(duel.id).opponent_hp = 1;
  rolls.push(0, 0.99);
  const ko = await call('alice', 'hit', { duelId: duel.id, distance: 1 });
  assert.deepEqual([ko.duel.status, ko.duel.finish_reason, ko.duel.winner_id, ko.duel.loser_id, ko.duel.opponent_hp], ['finished', 'knockout', 'alice', 'bob', 0]);
  assert.equal((await call('bob', 'hit', { duelId: duel.id, distance: 1 }, 409)).code, 'not_active');

  duel = await startDuel();
  const ff = await call('alice', 'forfeit', { duelId: duel.id });
  assert.deepEqual([ff.duel.status, ff.duel.finish_reason, ff.duel.winner_id], ['finished', 'forfeit', 'bob']);

  duel = await startDuel();
  stored(duel.id).last_action_at = new Date(Date.now() - 121_000).toISOString();
  const idle = await call('alice', 'hit', { duelId: duel.id, distance: 1 }, 409);
  assert.deepEqual([idle.duel.status, idle.duel.finish_reason, idle.duel.winner_id], ['finished', 'timeout', undefined]);
});

test('state lists my incoming and outgoing challenges and my active duel', async () => {
  reset();
  const { duel } = await call('alice', 'challenge', { opponentId: 'bob', stats: HERO });
  assert.deepEqual((await call('bob', 'state')).incoming.map((d) => d.id), [duel.id]);
  assert.deepEqual((await call('alice', 'state')).outgoing.map((d) => d.id), [duel.id]);
  await call('bob', 'respond', { duelId: duel.id, decision: 'accept', stats: HERO });
  assert.equal((await call('alice', 'state')).active.id, duel.id);
});
