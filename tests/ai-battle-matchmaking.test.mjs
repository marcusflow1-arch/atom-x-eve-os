import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { buildSync } from 'esbuild';

// In-memory Base44 entities. `failure(name, op)` can make any read fail the way
// a rate limit or timeout would, to prove failed reads never cancel live state.
const tables = new Map();
let writes = [], failure = null, serial = 0, readHook = null, reads = [];
const clone = (value) => structuredClone(value);
const rows = (name) => { if (!tables.has(name)) tables.set(name, []); return tables.get(name); };
const users = { a: { id: 'a', full_name: 'Player A' }, b: { id: 'b', full_name: 'Player B' } };
const transient = () => Object.assign(new Error('Rate limit exceeded'), { status: 429 });
function matches(row, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (expected && typeof expected === 'object' && '$in' in expected) {
      return (Array.isArray(row[key]) ? row[key] : [row[key]]).some((value) => expected.$in.includes(value));
    }
    return row[key] === expected;
  });
}
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (query = {}, sort = '', limit = 1000) => {
    reads.push({ name, op: 'filter', query });
    await readHook?.(name, 'filter', query);
    if (failure?.(name, 'filter', query)) throw transient();
    const found = rows(name).filter((row) => matches(row, query));
    const key = sort.replace(/^-/, '');
    if (key) found.sort((a, b) => String(a[key] || '').localeCompare(String(b[key] || '')) * (sort.startsWith('-') ? -1 : 1));
    return clone(found.slice(0, limit));
  },
  list: async () => clone(rows(name)),
  get: async (id) => {
    if (failure?.(name, 'get')) throw transient();
    const row = rows(name).find((item) => item.id === id);
    if (!row) throw Object.assign(new Error('Not found'), { status: 404 });
    return clone(row);
  },
  create: async (data) => {
    const row = { ...clone(data), id: name + '-' + (++serial), created_date: new Date().toISOString() };
    rows(name).push(row); writes.push({ name, id: row.id, data: clone(data) }); return clone(row);
  },
  update: async (id, data) => {
    const row = rows(name).find((item) => item.id === id);
    assert.ok(row, name + ' ' + id + ' must exist');
    Object.assign(row, clone(data));
    writes.push({ name, id, data: clone(data) }); return clone(row);
  },
}) });

let handler;
{
  const { outputFiles } = buildSync({
    entryPoints: ['base44/functions/aiBattleMatchmaker/entry.ts'],
    bundle: true, write: false, platform: 'node', format: 'cjs', external: ['npm:*'],
  });
  vm.runInNewContext(outputFiles[0].text, {
    Response, Date, crypto: webcrypto, console: { error() {}, warn() {} },
    Deno: { serve: (fn) => { handler = fn; } },
    require: (id) => {
      assert.match(id, /^npm:@base44\/sdk/);
      return { createClientFromRequest: (req) => ({
        auth: { me: async () => users[req.headers.get('test-user')] || null },
        asServiceRole: { entities },
      }) };
    },
  });
}

async function battle(action, data = {}, user = 'a', status = 200) {
  const response = await handler(new Request('https://test.local', {
    method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }),
  }));
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  return body;
}

const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
const queueRow = (user, patch = {}) => ({
  id: 'queue-' + user, user_id: user, mode: 'pvp', status: 'matched', match_id: 'm1',
  queued_at: iso(-30000), last_seen_at: iso(), created_date: iso(-30000),
  client_session_id: 'session-' + user, connected_session_id: 'session-' + user, connected_at: iso(-5000), ready_at: '',
  ...patch,
});
function prefightMatch(status, patch = {}) {
  tables.set('AIBattleMatch', [{
    id: 'm1', mode: 'pvp', status, host_id: 'a', player_ids: ['a', 'b'], dashboard_channel: 'dashboard_a', pair_key: 'k',
    players: [{ id: 'a', gender: 'male', hp: 1000, max_hp: 1000, skills: [] }, { id: 'b', gender: 'male', hp: 1000, max_hp: 1000, skills: [] }],
    created_date: iso(-20000), connected_at: status === 'connecting' ? iso(-10000) : '', ...patch,
  }]);
  tables.set('PlayerState', ['a', 'b'].map((id) => ({ id: 'state-' + id, player_id: id, active_match_id: 'm1' })));
}
const queueOf = (user) => rows('AIBattleQueueEntry').find((row) => row.user_id === user);

beforeEach(() => {
  tables.clear(); writes = []; failure = null; serial = 0; readHook = null; reads = [];
  tables.set('Loadout', []);
  tables.set('Avatar', ['a', 'b'].map((id) => ({ id: 'avatar-' + id, user_id: id, gender: 'male', updated_date: iso() })));
});

test('a failed match read keeps the reservation instead of kicking the player out', async () => {
  prefightMatch('connecting');
  tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b')]);
  failure = (name, op) => name === 'AIBattleMatch' && op === 'get';
  await battle('status', { client_session_id: 'session-a' }, 'a', 429);
  assert.equal(queueOf('a').status, 'matched');
  assert.equal(queueOf('a').match_id, 'm1');
  assert.equal(writes.filter((w) => w.name === 'AIBattleQueueEntry').length, 0);

  failure = null;
  const recovered = await battle('status', { client_session_id: 'session-a' }, 'a');
  assert.equal(recovered.match.id, 'm1');
  assert.equal(recovered.match.status, 'connecting');
});

test('a failed queue read never looks like "no queue"', async () => {
  tables.set('AIBattleQueueEntry', [queueRow('a', { status: 'waiting', match_id: '' })]);
  failure = (name, op) => name === 'AIBattleQueueEntry' && op === 'filter';
  await battle('status', { client_session_id: 'session-a' }, 'a', 429);
  assert.equal(queueOf('a').status, 'waiting');
  assert.equal(writes.length, 0);
});

test('when the opponent disappears before the fight, the remaining player goes back to the queue', async () => {
  prefightMatch('connecting');
  const originalQueuedAt = iso(-45000);
  tables.set('AIBattleQueueEntry', [
    queueRow('a', { queued_at: originalQueuedAt, ready_at: iso(-3000) }),
    queueRow('b', { last_seen_at: iso(-60000) }),
  ]);
  const body = await battle('status', { client_session_id: 'session-a' }, 'a');
  assert.equal(body.match, null);
  assert.equal(body.queue.status, 'waiting');
  assert.match(body.notice, /back in the queue/);
  assert.equal(queueOf('a').queued_at, originalQueuedAt, 'the player keeps their original place in line');
  assert.equal(queueOf('a').match_id, '');
  assert.equal(queueOf('b').status, 'cancelled');
  assert.equal(rows('AIBattleMatch')[0].status, 'ended');
  assert.ok(rows('PlayerState').every((state) => state.active_match_id === ''));
});

test('a reserved pair that never finishes loading is cancelled; only the player who loaded is re-queued', async () => {
  prefightMatch('connecting', { connected_at: iso(-200000) });
  tables.set('AIBattleQueueEntry', [queueRow('a', { ready_at: iso(-190000) }), queueRow('b', { ready_at: '' })]);
  const body = await battle('status', { client_session_id: 'session-b' }, 'b');
  assert.equal(body.queue, null);
  assert.equal(body.match, null);
  assert.match(body.notice, /could not finish loading/);
  assert.equal(queueOf('a').status, 'waiting');
  assert.equal(queueOf('b').status, 'cancelled');
});

test('pressing Queue with a stale pointer to a dead match puts the player in the queue, not a dead arena', async () => {
  prefightMatch('connecting');
  tables.set('AIBattleQueueEntry', [queueRow('a', { status: 'cancelled' }), queueRow('b', { last_seen_at: iso(-60000) })]);
  const body = await battle('join', { mode: 'pvp', client_session_id: 'session-a' }, 'a');
  assert.equal(body.match, null);
  assert.equal(body.queue.status, 'waiting');
  assert.equal(body.reconnected, false);
  assert.equal(rows('AIBattleMatch')[0].status, 'ended');
});

test('a healthy pair is never abandoned and the full handshake reaches the fight', async () => {
  for (const id of ['a', 'b']) {
    rows('UserCard').push({ id: 'custom-' + id, user_id: id, card_type: 'Ability', card_name: 'Custom Move', card_rarity: 'Rare',
      trade_status: 'available', animation_effect: { id: 'custom_anim', clip_name: 'Custom' } });
    rows('Loadout').push({ id: id + '-skills', user_id: id, loadout_type: 'skills', is_active: true, skill_set_order: 0, skill_slots: { '0': 'custom-' + id } });
  }

  await battle('join', { mode: 'pvp', client_session_id: 'session-b' }, 'b');
  const joined = await battle('join', { mode: 'pvp', client_session_id: 'session-a' }, 'a');
  assert.equal(joined.match.status, 'matched');
  await battle('status', { client_session_id: 'session-b' }, 'b');
  const connecting = await battle('status', { client_session_id: 'session-a' }, 'a');
  assert.equal(connecting.match.status, 'connecting');
  const matchId = connecting.match.id;
  await battle('ready', { match_id: matchId }, 'a');
  const countdown = await battle('ready', { match_id: matchId }, 'b');
  assert.equal(countdown.match.status, 'countdown');
  for (const id of ['a', 'b']) {
    assert.equal(countdown.match.players.find((p) => p.id === id).skills[0].user_card_id, 'custom-' + id);
  }

  rows('AIBattleMatch')[0].fight_starts_at = iso(-100);
  const fighting = await battle('status', { client_session_id: 'session-a' }, 'a');
  assert.equal(fighting.match.status, 'fighting');

  // Fighters spawn 10 m apart on opposite sides of the net. A card ability is a
  // lock-on command, so it must not be rejected as out of range from there.
  const caster = fighting.match.turn_player_id;
  const opponent = caster === 'a' ? 'b' : 'a';
  const cast = await battle('use_skill', { match_id: matchId, slot: 0, cast_id: 'cast-1', attacker_pos: { x: 0, z: 5 }, target_pos: { x: 0, z: -5 } }, caster);
  assert.equal(cast.cast.target_id, opponent);
  assert.equal(cast.match.last_cast.cast_id, 'cast-1');
  assert.equal(cast.match.last_cast.attacker_id, caster);
  const seenByOpponent = await battle('status', { client_session_id: 'session-' + opponent }, opponent);
  assert.equal(seenByOpponent.match.last_cast.cast_id, 'cast-1');
});

test('fight polls only write positions when the fighter actually moved', async () => {
  prefightMatch('fighting', {
    fight_starts_at: iso(-5000), fight_ends_at: iso(170000), positions: { a: { x: 0, z: 5 }, b: { x: 0, z: -5 } },
    atb: {}, cooldowns: {}, pending_hits: [], hit_log: [], disconnects: {},
  });
  tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b')]);
  writes = [];
  await battle('status', { client_session_id: 'session-a', position: { x: 0, z: 5 } }, 'a');
  assert.equal(writes.filter((w) => w.name === 'AIBattleMatch').length, 0);
  // Shuffling in place is not worth a write under Base44's rate limit.
  await battle('status', { client_session_id: 'session-a', position: { x: 0.3, z: 4.8 } }, 'a');
  assert.equal(writes.filter((w) => w.name === 'AIBattleMatch').length, 0);
  await battle('status', { client_session_id: 'session-a', position: { x: 1.2, z: 4 } }, 'a');
  assert.deepEqual(rows('AIBattleMatch')[0].positions.a, { x: 1.2, z: 4 });
});

test('a Chidori hit stuns the target: they lose the turn and cannot act until the stun ends', async () => {
  const chidori = { slot: 0, user_card_id: 'card', name: 'Sasuke Uchiha - Chidori', effect_id: 'chidori', clip_name: 'Chidori_Ultimate',
    atb_cost: 80, range_m: 18, hit_ms: 2000, cooldown_ms: 11000, base_damage: 220, stun_ms: 2800, animation_effect: { id: 'chidori', clip_name: 'Chidori_Ultimate' } };
  prefightMatch('fighting', {
    fight_starts_at: iso(-5000), fight_ends_at: iso(170000), positions: { a: { x: 0, z: 5 }, b: { x: 0, z: -5 } },
    atb: { a: { value: 100, at: iso(), turn: true }, b: { value: 0, at: iso(), turn: false } },
    cooldowns: {}, dodges: {}, pending_hits: [], hit_log: [], disconnects: {},
    players: [{ id: 'a', gender: 'female', hp: 1000, max_hp: 1000, skills: [chidori] }, { id: 'b', gender: 'male', hp: 1000, max_hp: 1000, skills: [chidori] }],
  });
  tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b')]);

  const cast = await battle('use_skill', { match_id: 'm1', slot: 0, cast_id: 'chidori-1', attacker_pos: { x: 0, z: 5 }, target_pos: { x: 0, z: -5 } }, 'a');
  assert.equal(cast.cast.stun_ms, 2800);
  assert.equal(cast.match.last_cast.clip_name, 'Chidori_Ultimate');
  assert.equal(cast.match.last_cast.stun_ms, 2800);
  assert.equal(cast.match.turn_player_id, 'b', 'the target may still react (e.g. dodge) before the strike lands');

  // The strike lands.
  const match = rows('AIBattleMatch')[0];
  match.pending_hits[0].resolves_at = iso(-10);
  const landed = await battle('status', { client_session_id: 'session-b' }, 'b');
  const hit = landed.match.hit_log.at(-1);
  assert.equal(hit.result, 'hit');
  assert.equal(hit.stun_ms, 2800);
  assert.ok(Date.parse(landed.match.stuns.b.until) > Date.now());
  assert.equal(landed.match.turn_player_id, 'a', 'the stunned player loses their turn');

  const blocked = await battle('basic_attack', { match_id: 'm1', cast_id: 'b-1' }, 'b', 409);
  assert.match(blocked.error, /stunned/i);
  await battle('dodge', { match_id: 'm1' }, 'b', 409);

  // The attacker acts again; the turn passes back but the target is still down.
  match.cooldowns.a._last_cast_at = Date.now() - 1000;
  await battle('basic_attack', { match_id: 'm1', cast_id: 'a-2' }, 'a');
  assert.equal(rows('AIBattleMatch')[0].atb.b.turn, true);
  assert.match((await battle('basic_attack', { match_id: 'm1', cast_id: 'b-2' }, 'b', 409)).error, /stunned/i);

  // Once the stun wears off the target can act on their turn.
  rows('AIBattleMatch')[0].stuns.b.until = iso(-1);
  await battle('basic_attack', { match_id: 'm1', cast_id: 'b-3' }, 'b');
});

test('a dodged Chidori does not stun', async () => {
  const chidori = { slot: 0, effect_id: 'chidori', clip_name: 'Chidori_Ultimate', atb_cost: 80, range_m: 18, hit_ms: 2000, cooldown_ms: 11000, base_damage: 220, stun_ms: 2800, animation_effect: { id: 'chidori' } };
  prefightMatch('fighting', {
    fight_starts_at: iso(-5000), fight_ends_at: iso(170000), positions: { a: { x: 0, z: 5 }, b: { x: 0, z: -5 } },
    atb: { a: { value: 100, at: iso(), turn: true }, b: { value: 0, at: iso(), turn: false } },
    cooldowns: {}, dodges: {}, pending_hits: [], hit_log: [], disconnects: {},
    players: [{ id: 'a', gender: 'male', hp: 1000, max_hp: 1000, skills: [chidori] }, { id: 'b', gender: 'male', hp: 1000, max_hp: 1000, skills: [] }],
  });
  tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b')]);
  await battle('use_skill', { match_id: 'm1', slot: 0, cast_id: 'chidori-1', attacker_pos: { x: 0, z: 5 }, target_pos: { x: 0, z: -5 } }, 'a');
  const match = rows('AIBattleMatch')[0];
  const resolvesAt = Date.now() - 10;
  match.pending_hits[0].resolves_at = new Date(resolvesAt).toISOString();
  match.dodges = { b: { from: new Date(resolvesAt - 100).toISOString(), until: new Date(resolvesAt + 250).toISOString() } };
  const settled = await battle('status', { client_session_id: 'session-b' }, 'b');
  assert.equal(settled.match.hit_log.at(-1).result, 'miss');
  assert.equal(settled.match.stuns.b, undefined);
});

for (const action of ['cancel', 'forfeit']) {
  test(action + ' during a reservation returns the other player to the queue instead of kicking them out', async () => {
    prefightMatch('matched');
    const originalQueuedAt = iso(-50000);
    tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b', { queued_at: originalQueuedAt })]);
    await battle(action, { match_id: 'm1' }, 'a');
    assert.equal(rows('AIBattleMatch')[0].status, 'ended');
    assert.equal(queueOf('a').status, 'cancelled');
    assert.equal(queueOf('b').status, 'waiting');
    assert.equal(queueOf('b').queued_at, originalQueuedAt);
    const opponentView = await battle('status', { client_session_id: 'session-b' }, 'b');
    assert.equal(opponentView.queue.status, 'waiting');
    assert.equal(opponentView.match, null);
  });
}

// The arena re-sends a skill or melee that got "Rate limit exceeded". The same
// cast_id must return the first result, never act twice or fail as out of turn.
test('a combat action retried with the same cast_id is applied once', async () => {
  const bolt = { slot: 0, effect_id: 'bolt', clip_name: 'Bolt', atb_cost: 40, range_m: 18, hit_ms: 400, cooldown_ms: 3000, base_damage: 60, animation_effect: { id: 'bolt' } };
  prefightMatch('fighting', {
    fight_starts_at: iso(-5000), fight_ends_at: iso(170000), positions: { a: { x: 0, z: 5 }, b: { x: 0, z: -5 } },
    atb: { a: { value: 100, at: iso(), turn: true }, b: { value: 0, at: iso(), turn: false } },
    cooldowns: {}, dodges: {}, pending_hits: [], hit_log: [], disconnects: {},
    players: [{ id: 'a', gender: 'male', hp: 1000, max_hp: 1000, skills: [bolt] }, { id: 'b', gender: 'male', hp: 1000, max_hp: 1000, skills: [] }],
  });
  tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b')]);
  const request = { match_id: 'm1', slot: 0, cast_id: 'bolt-1', attacker_pos: { x: 0, z: 5 }, target_pos: { x: 0, z: -5 } };

  const first = await battle('use_skill', request, 'a');
  assert.equal(first.match.last_cast.damage, first.cast.damage);
  writes = [];
  const again = await battle('use_skill', request, 'a');
  assert.equal(again.cast.repeat, true);
  assert.equal(again.cast.cast_id, 'bolt-1');
  assert.equal(again.cast.damage, first.cast.damage);
  assert.equal(again.cast.resolves_at, first.cast.resolves_at);
  assert.deepEqual(again.cast.animation_effect, { id: 'bolt' });
  assert.equal(rows('AIBattleMatch')[0].pending_hits.length, 1, 'cast once');
  assert.equal(writes.filter((w) => w.name === 'AIBattleMatch').length, 0);

  // Now it is b's turn: a melee strike, retried.
  const melee = await battle('basic_attack', { match_id: 'm1', cast_id: 'melee-1' }, 'b');
  const hpAfter = rows('AIBattleMatch')[0].players.find((p) => p.id === 'a').hp;
  const meleeAgain = await battle('basic_attack', { match_id: 'm1', cast_id: 'melee-1' }, 'b');
  assert.equal(meleeAgain.cast.repeat, true);
  assert.equal(meleeAgain.cast.damage, melee.cast.damage);
  assert.equal(rows('AIBattleMatch')[0].players.find((p) => p.id === 'a').hp, hpAfter, 'damage applied once');
  assert.equal(rows('AIBattleMatch')[0].hit_log.filter((h) => h.cast_id === 'melee-1').length, 1);

  // A new cast_id is a new action and still follows the turn rules.
  await battle('basic_attack', { match_id: 'm1', cast_id: 'melee-2' }, 'b', 409);
});

// Base44 rate-limits the whole app (HTTP 429). Queue polls must stay cheap.
test('a waiting queue poll costs at most two database reads', async () => {
  tables.set('AIBattleQueueEntry', [queueRow('a', { status: 'waiting', match_id: '', connected_at: '', connected_session_id: '' })]);
  let reads = 0;
  failure = () => { reads += 1; return false; };
  const body = await battle('status', { client_session_id: 'session-a' }, 'a');
  assert.equal(body.queue.status, 'waiting');
  assert.ok(reads <= 2, `waiting poll used ${reads} reads`);
});

test('a fight poll reads each queue row once', async () => {
  prefightMatch('fighting', {
    fight_starts_at: iso(-5000), fight_ends_at: iso(170000), positions: { a: { x: 0, z: 5 }, b: { x: 0, z: -5 } },
    atb: {}, cooldowns: {}, pending_hits: [], hit_log: [], disconnects: {},
  });
  tables.set('AIBattleQueueEntry', [queueRow('a'), queueRow('b')]);
  let reads = 0;
  failure = () => { reads += 1; return false; };
  const body = await battle('status', { client_session_id: 'session-a', position: { x: 0, z: 5 } }, 'a');
  assert.equal(body.match.status, 'fighting');
  assert.ok(reads <= 3, `fight poll used ${reads} reads`);
});

test('empty queue is scanned only once per join', async () => {
  const body = await battle('join', { mode:'pvp', client_session_id:'session-a' });
  assert.equal(body.queue.status,'waiting');
  assert.equal(reads.filter((read) => read.name === 'AIBattleQueueEntry' && read.query?.status === 'waiting').length,1);
});

test('waiting-pool rate limit is surfaced without losing queue position', async () => {
  tables.set('AIBattleQueueEntry',[queueRow('a',{status:'waiting',match_id:''})]);
  failure=(name,op,query)=>name==='AIBattleQueueEntry' && op==='filter' && query?.status==='waiting';
  await battle('status',{client_session_id:'session-a'},'a',429);
  assert.equal(queueOf('a').status,'waiting');
  assert.equal(rows('AIBattleMatch').length,0);
});

test('both player profiles load concurrently before a single match is reserved', async () => {
  await battle('join',{mode:'pvp',client_session_id:'session-a'},'a');
  const started=new Set();let release;
  const gate=new Promise((resolve)=>{release=resolve;});
  let timedOut=false;
  const watchdog=setTimeout(()=>{timedOut=true;release();},1500);
  readHook=async(name,op,query)=>{
    if(name!=='AvatarProgression'||op!=='filter')return;
    started.add(query.user_id);
    if(started.size===2)release();
    await gate;
  };
  try {
    const body=await battle('join',{mode:'pvp',client_session_id:'session-b'},'b');
    assert.equal(timedOut,false,'both profiles must begin before either finishes');
    assert.deepEqual([...started].sort(),['a','b']);
    assert.equal(body.match.player_ids.length,2);
    assert.equal(rows('AIBattleMatch').length,1);
    assert.equal(queueOf('a').match_id,queueOf('b').match_id);
  } finally {clearTimeout(watchdog);}
});

test('status exposes impact deadlines and timestamps both ends of request processing', async () => {
  const impact=iso(250);
  prefightMatch('fighting',{
    fight_starts_at:iso(-1000),fight_ends_at:iso(60000),
    pending_hits:[{cast_id:'c',resolves_at:impact,attacker_id:'a',target_id:'b',damage:37}],
  });
  tables.set('AIBattleQueueEntry',[queueRow('a'),queueRow('b')]);
  const body=await battle('status',{client_session_id:'session-a'});
  assert.deepEqual(body.match.pending_hits,[{cast_id:'c',resolves_at:impact}]);
  assert.ok(body.server_time>=body.server_received_at);
  assert.equal(body.match.players.find((player)=>player.id==='b').hp,1000);
});
