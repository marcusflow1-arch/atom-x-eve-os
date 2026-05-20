export class FloatingCombatTextSystem {
  constructor({ setFloats, mergeWindowMs = 350, ttlMs = 1100 }) {
    this.setFloats = setFloats;
    this.mergeWindowMs = mergeWindowMs;
    this.ttlMs = ttlMs;
    this.entries = [];
    this.pool = [];
    this.nextId = 1;
  }

  spawn({ enemyId = 'player', value, type = 'damage' }) {
    const now = performance.now();
    const existing = this.entries.find((f) => f.enemyId === enemyId && f.type === type && now - f.born < this.mergeWindowMs);
    if (existing) {
      existing.value = value;
      existing.born = now;
      return existing.id;
    }

    const entry = this.pool.pop() || {};
    entry.id = this.nextId++;
    entry.enemyId = enemyId;
    entry.value = value;
    entry.type = type;
    entry.born = now;
    this.entries.push(entry);
    return entry.id;
  }

  getLiveEntries() {
    return this.entries;
  }

  update() {
    const now = performance.now();
    let write = 0;
    for (let read = 0; read < this.entries.length; read++) {
      const entry = this.entries[read];
      if (now - entry.born < this.ttlMs) {
        this.entries[write++] = entry;
      } else {
        this.pool.push(entry);
      }
    }
    this.entries.length = write;
  }

  dispose() {
    this.entries.length = 0;
    this.pool.length = 0;
    this.setFloats([]);
  }
}