export class WorldSystemManager {
  constructor() {
    this.systems = [];
    this.paused = false;
  }

  register(system, options = {}) {
    const entry = {
      system,
      priority: options.priority ?? 100,
      interval: options.interval ?? 0,
      accumulator: 0,
      enabled: true,
    };
    this.systems.push(entry);
    this.systems.sort((a, b) => a.priority - b.priority);
    return system;
  }

  unregister(system) {
    this.systems = this.systems.filter((entry) => entry.system !== system);
    system?.dispose?.();
  }

  setPaused(paused) {
    this.paused = !!paused;
  }

  update(delta) {
    if (this.paused) return;
    const safeDelta = Math.min(delta, 0.033);
    for (const entry of this.systems) {
      if (!entry.enabled || !entry.system?.update) continue;
      if (entry.interval > 0) {
        entry.accumulator += safeDelta;
        if (entry.accumulator < entry.interval) continue;
        const step = entry.accumulator;
        entry.accumulator = 0;
        entry.system.update(step);
      } else {
        entry.system.update(safeDelta);
      }
    }
  }

  dispose() {
    for (const entry of this.systems) entry.system?.dispose?.();
    this.systems.length = 0;
  }
}