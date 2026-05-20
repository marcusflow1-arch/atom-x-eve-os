import * as THREE from 'three';

export class GameLoop {
  constructor(renderer, scene, camera, { maxDelta = 0.033, render = null } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();
    this.systems = [];
    this.running = false;
    this.frame = null;
    this.maxDelta = maxDelta;
    this.render = render;
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

  start() {
    if (this.running) return;
    this.running = true;

    const tick = () => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(tick);
      const delta = Math.min(this.clock.getDelta(), this.maxDelta);

      for (const entry of this.systems) {
        if (!entry.enabled || !entry.system?.update) continue;
        if (entry.interval > 0) {
          entry.accumulator += delta;
          if (entry.accumulator < entry.interval) continue;
          const step = entry.accumulator;
          entry.accumulator = 0;
          entry.system.update(step);
        } else {
          entry.system.update(delta);
        }
      }

      if (this.render) this.render(delta);
      else this.renderer?.render?.(this.scene, this.camera);
    };

    tick();
  }

  stop() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
    for (const entry of this.systems) entry.system?.dispose?.();
    this.systems.length = 0;
  }
}