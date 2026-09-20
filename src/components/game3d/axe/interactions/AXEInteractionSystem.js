// AXE Prompt 008 — reusable world interaction layer.

export const AXE_INTERACTION_TYPES = Object.freeze([
  'Talk',
  'Open',
  'Close',
  'Enter',
  'Exit',
  'Use',
  'Activate',
  'Gather',
  'Inspect',
  'Teleport',
  'Trade',
  'Craft',
  'Store',
  'Quest',
  'Housing',
  'Special',
]);

const distanceXZ = (a, b) => Math.hypot(
  Number(a?.x || 0) - Number(b?.x || 0),
  Number(a?.z || 0) - Number(b?.z || 0),
);

export function createAXEInteractable({
  id,
  name,
  type = 'Use',
  position = { x: 0, y: 0, z: 0 },
  range = 3.5,
  enabled = true,
  priority = 0,
  prompt = null,
  authorityCheck = null,
  canInteract = null,
  onInteract = null,
  metadata = {},
}) {
  if (!AXE_INTERACTION_TYPES.includes(type)) throw new Error(`Unknown AXE interaction type: ${type}`);
  return {
    id,
    name: name || id,
    type,
    position: { ...position },
    range,
    enabled,
    priority,
    prompt: prompt || `${type} ${name || id}`,
    authorityCheck,
    canInteract,
    onInteract,
    metadata: { ...metadata },
    state: 'idle',
  };
}

export class AXEInteractionSystem {
  constructor({ authorityContext = () => ({ isAuthority: true }) } = {}) {
    this.interactables = new Map();
    this.target = null;
    this.authorityContext = authorityContext;
    this.listeners = new Set();
  }

  register(interactable) {
    this.interactables.set(interactable.id, interactable);
    return interactable;
  }

  unregister(id) {
    if (this.target?.id === id) this.setTarget(null);
    return this.interactables.delete(id);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snap = this.snapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  setTarget(target) {
    if (this.target?.id === target?.id) return;
    this.target = target || null;
    this.emit();
  }

  updateTarget(playerPosition) {
    const candidates = [];
    for (const item of this.interactables.values()) {
      if (!item.enabled || item.state === 'disabled') continue;
      const distance = distanceXZ(playerPosition, item.position);
      if (distance > item.range) continue;
      if (item.canInteract && !item.canInteract({ playerPosition, item })) continue;
      candidates.push({ item, distance });
    }

    candidates.sort((a, b) => {
      if (a.item.priority !== b.item.priority) return b.item.priority - a.item.priority;
      return a.distance - b.distance;
    });

    this.setTarget(candidates[0]?.item || null);
    return this.target;
  }

  async interact(context = {}) {
    const item = this.target;
    if (!item) return { ok: false, reason: 'no-target' };
    if (!item.enabled || item.state === 'disabled') return { ok: false, reason: 'disabled' };

    const authority = this.authorityContext?.() || { isAuthority: true };
    if (item.authorityCheck && !item.authorityCheck({ item, context, authority })) {
      return { ok: false, reason: 'authority' };
    }

    if (item.canInteract && !item.canInteract({ item, context, authority })) {
      return { ok: false, reason: 'blocked' };
    }

    item.state = 'busy';
    this.emit();
    try {
      const result = await item.onInteract?.({ item, context, authority });
      item.state = result?.state || 'idle';
      this.emit();
      return { ok: true, result };
    } catch (error) {
      item.state = 'idle';
      this.emit();
      return { ok: false, reason: 'error', error };
    }
  }

  snapshot() {
    return {
      target: this.target ? {
        id: this.target.id,
        name: this.target.name,
        type: this.target.type,
        prompt: this.target.prompt,
        state: this.target.state,
        metadata: this.target.metadata,
      } : null,
      count: this.interactables.size,
    };
  }
}
