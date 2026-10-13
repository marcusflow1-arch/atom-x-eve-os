import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, mkdir, readdir, rm, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileQuestRepository } from '../../../src/game5/quests/fileQuestRepository.mjs';

const onLinux = { skip: process.platform !== 'linux' && 'requires Linux flock(2)' };
const keyFor = (id) => createHash('sha256').update(id).digest('hex');

async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), 'g5-lock-r1-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, repo: new FileQuestRepository({ directory, lockTimeoutMs: 150 }) };
}

async function waitForLocked(child) {
  let errorText = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (data) => { errorText += data; });
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for child lock: ' + errorText)), 3000);
    const done = (error) => {
      clearTimeout(timeout);
      child.stdout.off('data', data);
      child.off('exit', exit);
      if (error) reject(error);
      else resolve();
    };
    const data = (chunk) => {
      if (chunk.toString().includes('LOCKED')) done();
    };
    const exit = (code, signal) => done(new Error(`Child exited before lock: code=${code} signal=${signal} ${errorText}`));
    child.stdout.on('data', data);
    child.on('exit', exit);
  });
}

// Uses the REAL repository in a separate Node process, not a mocked lease.
async function crashHoldingProcess(t, directory) {
  const moduleUrl = new URL('../../../src/game5/quests/fileQuestRepository.mjs', import.meta.url).href;
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { FileQuestRepository } from ${JSON.stringify(moduleUrl)};
    const repo = new FileQuestRepository({ directory: process.argv[1] });
    await repo.transact('player-one', async (player) => {
      player.wallet.game5_quest_token = 9999; // uncommitted pending mutation
      process.stdout.write('LOCKED\\n');
      setInterval(() => {}, 1000);
      await new Promise(() => {});
    });
  `, directory], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null && !child.killed) child.kill('SIGKILL'); });
  await waitForLocked(child);
  return child;
}

test('orphaned modern .flock inode can be reused after prior owner exited', onLinux, async (t) => {
  const { directory, repo } = await setup(t);
  await repo.transact('player-one', (record) => { record.wallet.game5_quest_token = 1; });
  const lock = join(directory, `${keyFor('player-one')}.flock`);
  assert.ok((await stat(lock)).isFile());
  const old = new Date('2001-01-01T00:00:00Z');
  await utimes(lock, old, old); // ancient age must not be used as a lease
  const result = await repo.transact('player-one', (record) => ++record.wallet.game5_quest_token);
  assert.equal(result, 2);
  assert.equal((await repo.read('player-one')).wallet.game5_quest_token, 2);
});

test('unknown legacy mkdir lock fails closed — never deleted or stolen', onLinux, async (t) => {
  const { directory, repo } = await setup(t);
  const legacy = join(directory, `${keyFor('player-one')}.lock`);
  await mkdir(legacy);
  await assert.rejects(() => repo.transact('player-one', () => { throw new Error('MUST NOT RUN'); }), /Legacy Game 5 quest \.lock artifact/);
  assert.ok((await stat(legacy)).isDirectory());
  // Offline operator cleanup simulated ONLY after confirming no older workers.
  await rm(legacy, { recursive: true });
  assert.equal(await repo.transact('player-one', () => 'RECOVERED'), 'RECOVERED');
});

test('an active transaction is never stolen, even beyond contender timeout', onLinux, async (t) => {
  const { directory } = await setup(t);
  const holder = new FileQuestRepository({ directory, lockTimeoutMs: 3000 });
  const contender = new FileQuestRepository({ directory, lockTimeoutMs: 85 });
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let started;
  const entered = new Promise((resolve) => { started = resolve; });
  const running = holder.transact('player-one', async (player) => {
    player.wallet.game5_quest_token = 41;
    started();
    await gate;
  });
  try {
    await entered;
    await assert.rejects(() => contender.transact('player-one', () => {
      throw new Error('This callback must never run while holder owns the lock');
    }), /lock timed out/);
    assert.equal((await contender.read('player-one')).wallet.game5_quest_token, undefined);
  } finally {
    release();
    await running;
  }
  assert.equal(await contender.transact('player-one', (player) => ++player.wallet.game5_quest_token), 42);
});

test('SIGKILL crash releases OS lock without retaining uncommitted mutation', onLinux, async (t) => {
  const { directory, repo } = await setup(t);
  const child = await crashHoldingProcess(t, directory);
  await assert.rejects(() => repo.transact('player-one', () => 'MUST NOT RUN'), /lock timed out/);
  child.kill('SIGKILL');
  await once(child, 'exit');
  assert.equal((await repo.read('player-one')).wallet.game5_quest_token, undefined);
  const value = await repo.transact('player-one', (player) => {
    player.wallet.game5_quest_token = 1;
    return player.wallet.game5_quest_token;
  });
  assert.equal(value, 1);
  assert.equal((await repo.read('player-one')).wallet.game5_quest_token, 1);
  assert.ok((await readdir(directory)).some((name) => name.endsWith('.flock')));
});

test('concurrent requests after process-crash recovery serialize correctly', onLinux, async (t) => {
  const { directory } = await setup(t);
  const child = await crashHoldingProcess(t, directory);
  child.kill('SIGKILL');
  await once(child, 'exit');
  const repos = Array.from({ length: 6 }, () => new FileQuestRepository({ directory, lockTimeoutMs: 5000 }));
  const results = await Promise.all(repos.map((repo) => repo.transact('player-one', async (player) => {
    await new Promise((resolve) => setTimeout(resolve, 12));
    player.wallet.game5_quest_token = (player.wallet.game5_quest_token ?? 0) + 1;
    return player.wallet.game5_quest_token;
  })));
  assert.deepEqual([...results].sort((a,b) => a-b), [1,2,3,4,5,6]);
  assert.equal((await repos[0].read('player-one')).wallet.game5_quest_token, 6);
});
