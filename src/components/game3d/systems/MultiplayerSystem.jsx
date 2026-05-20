export class MultiplayerSystem {
  constructor({ getSnapshot, eventBus, sendInterval = 0.08 }) {
    this.getSnapshot = getSnapshot;
    this.eventBus = eventBus;
    this.sendInterval = sendInterval;
    this.sendTimer = 0;
    this.lastSent = null;
  }

  hasMeaningfulChange(next) {
    if (!this.lastSent) return true;
    return Math.abs(next.x - this.lastSent.x) > 0.025 ||
      Math.abs(next.y - this.lastSent.y) > 0.025 ||
      Math.abs(next.z - this.lastSent.z) > 0.025 ||
      Math.abs(next.yaw - this.lastSent.yaw) > 0.015 ||
      next.anim !== this.lastSent.anim ||
      next.mounted !== this.lastSent.mounted ||
      next.combat !== this.lastSent.combat;
  }

  update(delta) {
    this.sendTimer += delta;
    if (this.sendTimer < this.sendInterval) return;
    this.sendTimer = 0;
    const snapshot = this.getSnapshot?.();
    if (!snapshot || !this.hasMeaningfulChange(snapshot)) return;
    this.lastSent = { ...snapshot };
    this.eventBus?.emit('multiplayer:localSnapshot', snapshot);
    window.dispatchEvent(new CustomEvent('multiplayerLocalUpdate', { detail: snapshot }));
  }
}