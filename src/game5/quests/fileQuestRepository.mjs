/**
 * Isolated Game 5 file-backed quest repository for local integration tests.
 * No cross-game integration or production database assumptions.
 *
 * Transactions serialize by player on a SHARED filesystem using an exclusive
 * lock directory. Write-and-rename commits the quest, wallet and reward ledger
 * together; an exception aborts the transaction without writing state.
 * A production multi-host deployment must provide a shared ACID database
 * adapter with the same read/transact API, rather than per-host local files.
 */

import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

function blankPlayer() {
  return {
    schema_version: 'game5.quest.player.v1',
    quests: {},
    wallet: {},
    rewardLedger: {},
    outbox: {},
  };
}

function keyForPlayer(playerId) {
  if (typeof playerId !== 'string' || !playerId.trim()) {
    throw new TypeError('A nonempty player ID is required');
  }
  return createHash('sha256').update(playerId).digest('hex');
}

export class FileQuestRepository {
  constructor({ directory, lockTimeoutMs = 5000 } = {}) {
    if (typeof directory !== 'string' || !directory.trim()) {
      throw new TypeError('An isolated Game 5 data directory is required');
    }
    if (!Number.isFinite(lockTimeoutMs) || lockTimeoutMs <= 0) {
      throw new TypeError('lockTimeoutMs must be a positive number');
    }
    this.directory = directory;
    this.lockTimeoutMs = lockTimeoutMs;
  }

  async read(playerId) {
    const key = keyForPlayer(playerId);
    const path = join(this.directory, `${key}.json`);
    let raw;
    try {
      raw = await readFile(path, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return blankPlayer();
      throw error;
    }
    const value = JSON.parse(raw);
    if (value?.schema_version !== 'game5.quest.player.v1' ||
        !value.quests || !value.wallet || !value.rewardLedger || !value.outbox ||
        [value.quests, value.wallet, value.rewardLedger, value.outbox].some(
          (part) => typeof part !== 'object' || Array.isArray(part) || part === null
        )) {
      throw new Error('Game 5 quest state is invalid');
    }
    return value;
  }

  async transact(playerId, mutate) {
    if (typeof mutate !== 'function') throw new TypeError('Transaction callback required');
    const key = keyForPlayer(playerId);
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, `${key}.lock`);
    const deadline = Date.now() + this.lockTimeoutMs;

    // mkdir is exclusive across processes on a shared local filesystem.
    while (true) {
      try {
        await mkdir(lock);
        break;
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        if (Date.now() >= deadline) {
          throw new Error('Game 5 quest transaction lock timed out');
        }
        await sleep(10);
      }
    }

    let temporary;
    try {
      const state = await this.read(playerId);
      const result = await mutate(state);
      temporary = join(this.directory, `${key}.${randomUUID()}.tmp`);
      await writeFile(temporary, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
      await rename(temporary, join(this.directory, `${key}.json`));
      temporary = null;
      return result;
    } finally {
      if (temporary) await rm(temporary, { force: true });
      await rm(lock, { recursive: true, force: true });
    }
  }
}
