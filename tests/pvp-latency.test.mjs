import test from 'node:test';
import assert from 'node:assert/strict';
import {
  battleClockOffset, battleDeadline, createBattleRefresh, createBattleTransport,
  matchSignal, mergeBattleSnapshot, queueSignal, RETRYABLE_BATTLE_ACTIONS, scheduleBattleDeadline,
} from '../src/components/battle/battleSync.js';

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const flush = () => new Promise((resolve) => setImmediate(resolve));
function harness() {
  let clock = 10000;
  const cache = new Map(), calls = [];
  const transport = createBattleTransport({
    now: () => clock,
    read: (id) => cache.get(id), write: (id, value) => cache.set(id, value),
    invoke: (action, data) => { const call = { action, data, ...deferred() }; calls.push(call); return call.promise; },
  });
  return { ...transport, calls, cache, time: (value) => { clock = value; } };
}
function timers() {
  let time = 10000, serial = 0;
  const jobs = new Map();
  return {
    now: () => time, jobs,
    setTimer: (fn, wait) => { const id = ++serial; jobs.set(id, { fn, at: time + wait }); return id; },
    clearTimer: (id) => jobs.delete(id),
    async advance(ms) {
      const end = time + ms;
      for (;;) {
        const [id, job] = [...jobs].sort((a,b) => a[1].at - b[1].at)[0] || [];
        if (!job || job.at > end) break;
        time = job.at; jobs.delete(id); await job.fn(); await flush();
      }
      time = end;
    },
  };
}
test('clock sample excludes backend processing and stays fixed between responses', async () => {
  // Clock is 5 seconds ahead; request/response legs each take 100 ms, DB 800 ms.
  assert.equal(battleClockOffset({ server_received_at:15100, server_time:15900 }, 10000, 11000), 5000);
  const h = harness();
  const p = h.request('a','status');
  h.time(11000); h.calls[0].resolve({server_received_at:15100,server_time:15900,match:{id:'m'}});
  await p; h.time(18000);
  assert.equal(h.cache.get('a')._server_offset_ms,5000);
  assert.equal(battleClockOffset({server_time:10000},9000,9500),500,'older server fallback');
});
test('popup, arena and heartbeat share one status request', async () => {
  const h=harness(), one=h.request('a','status'), two=h.request('a','status'), three=h.request('a','status');
  assert.equal(h.calls.length,1);
  h.calls[0].resolve({queue:{status:'waiting'},server_time:10000});
  assert.deepEqual(await one,await two); assert.deepEqual(await two,await three);
});
test('late status cannot rewind accepted hit, turn or queue', async () => {
  const h=harness(), poll=h.request('a','status');
  const hit=h.request('a','basic_attack');
  h.calls[1].resolve({match:{id:'m',hp:900,turn:'b'},queue:{status:'matched'},server_time:10000,cast:{cast_id:'c'}});
  await hit;
  h.calls[0].resolve({match:{id:'m',hp:1000,turn:'a'},queue:{status:'waiting'},server_time:9999});
  assert.equal((await poll).match.hp,900);
  assert.equal(h.cache.get('a').queue.status,'matched');
});
test('status finishing during an action waits for its authoritative response', async () => {
  const h=harness(), poll=h.request('a','status'), action=h.request('a','use_skill');
  h.calls[0].resolve({match:null,server_time:10000});
  await flush(); assert.equal(h.cache.size,0);
  h.calls[1].resolve({match:{id:'m',status:'fighting'},server_time:10000});
  await action; assert.equal((await poll).match.id,'m');
});
test('status requests arriving during a write wait and coalesce after it', async () => {
  const h=harness(), action=h.request('a','ready');
  const one=h.request('a','status'), two=h.request('a','status');
  assert.equal(h.calls.length,1);
  h.calls[0].resolve({match:{id:'m',status:'countdown'},server_time:10000});
  await action; await flush(); assert.equal(h.calls.length,2);
  h.calls[1].resolve({match:{id:'m',status:'countdown'},server_time:10000});
  await Promise.all([one,two]);
});
test('failed refresh preserves current match and recovers on next request', async () => {
  const h=harness(); h.cache.set('a',{match:{id:'m',hp:900}});
  const one=h.request('a','status'); h.calls[0].reject(new Error('network'));
  await assert.rejects(one,/network/); assert.equal(h.cache.get('a').match.hp,900);
  const two=h.request('a','status'); h.calls[1].resolve({match:{id:'m',hp:850},server_time:10000});
  assert.equal((await two).match.hp,850);
});
test('snapshots are isolated by player and sequence survives a hot reload', async () => {
  const h=harness(); h.cache.set('a',{_battle_sequence:80,match:{id:'old'}});
  const a=h.request('a','status'), b=h.request('b','status');
  h.calls[0].resolve({match:{id:'new'},server_time:10000});
  h.calls[1].resolve({queue:{status:'waiting'},server_time:10000});
  assert.equal((await a)._battle_sequence,81); assert.equal((await b).match,undefined);
});
test('React Query cannot replace a newer action with an older completed query', () => {
  const accepted={_battle_sequence:8,match:{hp:800}};
  assert.equal(mergeBattleSnapshot(accepted,{_battle_sequence:7,match:{hp:1000}}),accepted);
});
test('only convergent queue actions permit automatic retries', () => {
  for (const name of ['basic_attack','use_skill','dodge','forfeit']) assert.equal(RETRYABLE_BATTLE_ACTIONS.has(name),false);
  for (const name of ['join','cancel','reconnect']) assert.equal(RETRYABLE_BATTLE_ACTIONS.has(name),true);
});
test('hit resolution is requested at its deadline, not the next one-second poll', async () => {
  const t=timers(); let calls=0;
  const match={id:'m',status:'fighting',pending_hits:[{cast_id:'c',resolves_at:new Date(15350).toISOString()}]};
  scheduleBattleDeadline({...t,match,offset:5000,refresh:async()=>{calls++;return {match:{...match,pending_hits:[]}};}});
  await t.advance(349); assert.equal(calls,0);
  await t.advance(21); assert.equal(calls,1); assert.equal(t.jobs.size,0);
});
test('paused matches never settle early; countdown has its own wake-up', () => {
  const match={status:'fighting',disconnects:{a:{}},pending_hits:[{resolves_at:new Date(10350).toISOString()}]};
  assert.equal(battleDeadline(match),null);
  assert.equal(battleDeadline({status:'countdown',fight_starts_at:'start'}),'start');
  assert.equal(battleDeadline({...match,status:'ended',disconnects:{}}),null);
});
test('a changed match or unmount cancels the previous deadline', async () => {
  const t=timers();let calls=0;
  const cancel=scheduleBattleDeadline({...t,match:{status:'countdown',fight_starts_at:new Date(10350).toISOString()},refresh:async()=>{calls++;}});
  cancel();await t.advance(1000);assert.equal(calls,0);
});
test('deadline jitter retries are bounded and rate limits do not spin', async () => {
  const t=timers(), match={status:'fighting',pending_hits:[{cast_id:'c',resolves_at:new Date(10001).toISOString()}]};
  let calls=0;
  scheduleBattleDeadline({...t,match,refresh:async()=>{calls++;return {match};}});
  await t.advance(3000);assert.equal(calls,3);assert.equal(t.jobs.size,0);
  scheduleBattleDeadline({...t,match,refresh:async()=>{calls++;throw new Error('429');}});
  await t.advance(3000);assert.equal(calls,4);assert.equal(t.jobs.size,0);
});
test('an event burst coalesces; a change during refresh gets one trailing refresh', async () => {
  const t=timers(), first=deferred();let calls=0;
  const signal=createBattleRefresh({...t,refresh:()=>{calls++;return calls===1?first.promise:Promise.resolve();}});
  for(let i=0;i<20;i++)signal.schedule();
  await t.advance(60);assert.equal(calls,1);
  for(let i=0;i<20;i++)signal.schedule();
  first.resolve();await flush();await t.advance(60);assert.equal(calls,2);
  signal.schedule();signal.stop();await t.advance(500);assert.equal(calls,2);
});
test('heartbeat and position writes do not trigger a status loop; casts and damage do', () => {
  const queue={id:'q',status:'waiting'};
  assert.equal(queueSignal(queue),queueSignal({...queue,last_seen_at:'new',client_session_id:'x'}));
  const match={id:'m',host_id:'a',status:'fighting',attack_revision:2};
  assert.equal(matchSignal(match),matchSignal({...match,positions:{a:{x:5}},updated_date:'new'}));
  assert.notEqual(matchSignal(match),matchSignal({...match,attack_revision:3}));
  assert.notEqual(matchSignal(match),matchSignal({...match,last_cast:{cast_id:'new'}}));
});

test('realtime reads are limited to the queue owner and both match participants; clients cannot write', async () => {
  const {makeRewardFixture}=await import('./helpers/reward-fixture.mjs');
  const f=makeRewardFixture(), service=f.entities();
  const queue=await service.AIBattleQueueEntry.create({user_id:'a',mode:'pvp',status:'waiting',queued_at:new Date().toISOString(),last_seen_at:new Date().toISOString()});
  const match=await service.AIBattleMatch.create({mode:'pvp',status:'matched',host_id:'a',dashboard_channel:'dashboard_a',pair_key:'a:b',player_ids:['a','b']});
  const a=f.entities({id:'a',role:'user'}),b=f.entities({id:'b',role:'user'}),outsider=f.entities({id:'c',role:'user'});
  assert.equal((await a.AIBattleQueueEntry.get(queue.id)).id,queue.id);
  await assert.rejects(b.AIBattleQueueEntry.get(queue.id),/Forbidden/);
  assert.equal((await a.AIBattleMatch.get(match.id)).id,match.id);
  assert.equal((await b.AIBattleMatch.get(match.id)).id,match.id);
  await assert.rejects(outsider.AIBattleMatch.get(match.id),/Forbidden/);
  await assert.rejects(a.AIBattleQueueEntry.update(queue.id,{status:'matched'}),/Forbidden/);
  await assert.rejects(b.AIBattleMatch.update(match.id,{players:[]}),/Forbidden/);
  assert.equal((await service.AIBattleMatch.get(match.id)).id,match.id);
});
