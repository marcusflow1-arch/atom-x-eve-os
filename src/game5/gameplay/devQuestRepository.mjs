/**
 * DEVELOPMENT ONLY. Single-process serialized JSON persistence for Game 5 test identities.
 * Not an authenticated database, cross-process lock, ACID storage, or production economy.
 * Deliberately NOT the production-inappropriate Linux flock adapter.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
const blank = () => ({ schema_version: 'game5.quest.player.v1', quests: {}, wallet: {}, rewardLedger: {}, outbox: {}, devClaims: {} });
export class DevQuestRepository {
  constructor({ file } = {}) {
    if (typeof file !== 'string' || !file) throw new Error('Dev data file required');
    this.file = file;
    this.queue = Promise.resolve();
  }
  async read(playerId) {
    if (playerId !== 'game5-dev-player') throw new Error('Development-only player ID required');
    try {
      const parsed = JSON.parse(await readFile(this.file, 'utf8'));
      if (parsed?.schema_version !== 'game5.quest.player.v1' || !parsed.quests || !parsed.wallet || !parsed.rewardLedger || !parsed.outbox || !parsed.devClaims) throw new Error('Invalid development quest data');
      return structuredClone(parsed);
    } catch (e) {
      if (e.code === 'ENOENT') return blank();
      throw e;
    }
  }
  async transact(playerId, mutate) {
    const run = async () => {
      const record = await this.read(playerId);
      const result = await mutate(record);
      await mkdir(dirname(this.file), { recursive: true });
      const temp = `${this.file}.${randomUUID()}.tmp`;
      try { await writeFile(temp, JSON.stringify(record), { flag: 'wx', mode: 0o600 }); await rename(temp, this.file); }
      catch (e) { const { rm } = await import('node:fs/promises'); await rm(temp, { force: true }); throw e; }
      return result;
    };
    const next = this.queue.then(run);
    this.queue = next.catch(() => {});
    return next;
  }
}
