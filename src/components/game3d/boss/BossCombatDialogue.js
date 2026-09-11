// BossCombatDialogue — lightweight, non-blocking battle banter for world-boss fights.
// This channel is intentionally isolated from quest NPC identity. Any legacy
// speaker name is normalized to the currently living world boss.

function getLiveWorldBoss() {
  if (typeof window === 'undefined' || !Array.isArray(window.__gw3dBosses)) return null;
  return window.__gw3dBosses.find((boss) =>
    boss?.group &&
    boss.alive !== false &&
    !boss.dying &&
    !boss.defeated &&
    Number(boss.hp) > 0 &&
    boss.group.visible !== false
  ) || null;
}

export function createBossCombatDialogue({ setActiveDialogue } = {}) {
  const state = {
    current: null,
    queue: [],
    timer: 0,
    cooldowns: new Map(),
    firedFlags: new Set(),
  };

  const now = () => performance.now() / 1000;

  const clear = () => {
    state.current = null;
    state.timer = 0;
    setActiveDialogue?.(null);
  };

  const clearAll = () => {
    clear();
    state.queue.length = 0;
  };

  const normalizeEntry = (entry) => {
    const boss = getLiveWorldBoss();
    if (!boss) return null;
    return {
      ...entry,
      name: boss.name || boss.title || 'World Boss',
      bossId: boss.id,
    };
  };

  const show = (entry) => {
    const normalized = normalizeEntry(entry);
    if (!normalized) {
      clearAll();
      return false;
    }
    state.current = normalized;
    state.timer = normalized.duration || 3;
    setActiveDialogue?.({
      name: normalized.name,
      text: normalized.text,
      source: 'world_boss',
      bossId: normalized.bossId,
    });
    return true;
  };

  const queueLine = ({ id, name, text, duration = 3, cooldown = 0, once = false }) => {
    const boss = getLiveWorldBoss();
    if (!boss || !text) return false;
    if (once && id && state.firedFlags.has(id)) return false;
    if (id && cooldown > 0) {
      const nextAllowedAt = state.cooldowns.get(id) || 0;
      if (now() < nextAllowedAt) return false;
      state.cooldowns.set(id, now() + cooldown);
    }
    if (once && id) state.firedFlags.add(id);
    state.queue.push({
      id: id || null,
      name: boss.name || boss.title || name || 'World Boss',
      text,
      duration,
      bossId: boss.id,
    });
    return true;
  };

  const triggerThreshold = ({ id, hpRatio, name, text, duration = 3 }) => {
    const boss = getLiveWorldBoss();
    if (!boss || !text || state.firedFlags.has(id) || hpRatio <= 0) return false;
    state.queue.push({
      id,
      name: boss.name || boss.title || name || 'World Boss',
      text,
      duration,
      bossId: boss.id,
      _threshold: true,
    });
    state.firedFlags.add(id);
    return true;
  };

  const update = (delta) => {
    // A dead/vanished boss cannot keep talking. This also clears any legacy
    // Kali/quest-giver lines that were queued before the fight was cleaned up.
    if (!getLiveWorldBoss()) {
      clearAll();
      return;
    }
    if (state.current) {
      state.timer -= delta;
      if (state.timer <= 0) clear();
    }
    if (!state.current && state.queue.length > 0) {
      const next = state.queue.shift();
      show(next);
    }
  };

  const reset = () => {
    clearAll();
    state.cooldowns.clear();
    state.firedFlags.clear();
  };

  const hasShown = (id) => state.firedFlags.has(id);
  const getState = () => ({
    current: state.current ? { ...state.current } : null,
    queued: state.queue.length,
  });

  return { queueLine, triggerThreshold, update, clear, reset, hasShown, getState };
}