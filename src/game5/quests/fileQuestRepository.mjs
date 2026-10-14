/**
 * Isolated Game 5 test repository — local POSIX/Linux filesystem only.
 *
 * Per-player transactions use an OS advisory flock held by this Node process's
 * file descriptor, not a PID/age lease or removable lock directory.  A tiny
 * util-linux `flock` helper applies the lock to an inherited copy of the SAME
 * open file description; the parent retains its FD until transaction completion.
 * On process crash the kernel closes the FD and automatically releases the lock.
 * There is never a stale-lock deletion or lock stealing heuristic.
 *
 * Requires `flock` (util-linux), an OS/filesystem with Linux flock semantics,
 * and an isolated trusted directory. NOT a distributed/production database.
 */

import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, lstat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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

async function rejectLegacyDirectory(path) {
  try {
    await lstat(path);
    // The old mkdir-based lock has NO recorded owner or incarnation. We cannot
    // distinguish an abandoned lock from an active transaction safely.
    // Never auto-delete, rename or expire one: fail closed pending offline
    // migration after every old worker is stopped.
    throw new Error('Legacy Game 5 quest .lock artifact present; stop ALL old workers and clear it offline before retrying');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function flockExclusive(fd, lockTimeoutMs) {
  // Passing an already-open FD as child FD 3 causes flock(2) to operate on the
  // SAME open file description retained in the parent.  The lock survives
  // helper exit, but is released automatically if the parent crashes.
  const timeoutSeconds = String(lockTimeoutMs / 1000);
  await new Promise((resolve, reject) => {
    const child = spawn('flock', ['-x', '-w', timeoutSeconds, '-E', '75', '3'], {
      stdio: ['ignore', 'ignore', 'pipe', fd],
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-2048); });
    child.once('error', (error) => reject(new Error(`Game 5 lock helper unavailable: ${error.message}`, { cause: error })));
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else if (code === 75) reject(new Error('Game 5 quest transaction lock timed out'));
      else reject(new Error(`Game 5 lock helper failed (exit=${code}, signal=${signal}): ${stderr}`));
    });
  });
}

async function verifyLockFileIsStillLinked(path, fd) {
  // Safeguard against accidental lock-file replacement, which would create a
  // different inode and bypass serialization. Never unlink *.flock files.
  const [held, atPath] = await Promise.all([fd.stat(), lstat(path)]);
  if (!atPath.isFile() || held.dev !== atPath.dev || held.ino !== atPath.ino) {
    throw new Error('Game 5 quest lock file was replaced while held');
  }
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
    const legacy = join(this.directory, `${key}.lock`);
    const lock = join(this.directory, `${key}.flock`);

    // Legacy locks cannot be proven stale from their metadata; fail closed.
    await rejectLegacyDirectory(legacy);
    // O_NOFOLLOW avoids silently locking a symlink, which could change inode.
    const fd = await open(lock, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
    let temporary;
    try {
      await flockExclusive(fd.fd, this.lockTimeoutMs);
      await rejectLegacyDirectory(legacy);
      await verifyLockFileIsStillLinked(lock, fd);
      const state = await this.read(playerId);
      const result = await mutate(state);
      // The same FD MUST remain open through the rename. Both quest state and
      // reward ledger are written as one atomic JSON replacement.
      await rejectLegacyDirectory(legacy);
      await verifyLockFileIsStillLinked(lock, fd);
      temporary = join(this.directory, `${key}.${randomUUID()}.tmp`);
      await writeFile(temporary, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
      await rename(temporary, join(this.directory, `${key}.json`));
      temporary = null;
      return result;
    } finally {
      try {
        if (temporary) await rm(temporary, { force: true });
      } finally {
        // Always release the kernel lock, even if temp-file cleanup fails.
        await fd.close();
      }
    }
  }
}
