// BossCombatDialogue — lightweight, non-blocking battle banter for boss fights.
//
// This is NOT quest dialogue. Lines appear while combat continues: one at a
// time, auto-hide after a few seconds, queue cleanly, and never pause the game
// or freeze the player. The boss feels alive without interrupting gameplay.
//
// Capabilities:
//   • queueLine(...)        — FIFO banter with optional once/cooldown guards
//   • triggerThreshold(...) — HP-gated one-shot lines (75%, 40%, etc.)
//   • update(delta)         — ticks the current line and pops the next when idle
//   • reset()               — clears everything (call on encounter end, then
//                             queue the outro line)
//
// Cooldowns prevent the same callout from spamming; `once` flags stop repeats.

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

  const show = (entry) => {
    state.current = entry;
    state.timer = entry.duration || 3;
    setActiveDialogue?.({ name: entry.name, text: entry.text });
  };

  const queueLine = ({
    id,
    name,
    text,
    duration = 3,
    cooldown = 0,
    once = false,
  }) => {
    if (!name || !text) return false;
    if (once && id && state.firedFlags.has(id)) return false;
    if (id && cooldown > 0) {
      const nextAllowedAt = state.cooldowns.get(id) || 0;
      if (now() < nextAllowedAt) return false;
      state.cooldowns.set(id, now() + cooldown);
    }
    if (once && id) {
      state.firedFlags.add(id);
    }
    state.queue.push({
      id: id || null,
      name,
      text,
      duration,
    });
    return true;
  };

  const triggerThreshold = ({
    id,
    hpRatio,
    name,
    text,
    duration = 3,
  }) => {
    if (state.firedFlags.has(id)) return false;
    if (hpRatio <= 0) return false;
    state.queue.push({
      id,
      name,
      text,
      duration,
      _threshold: true,
    });
    state.firedFlags.add(id);
    return true;
  };

  const update = (delta) => {
    if (state.current) {
      state.timer -= delta;
      if (state.timer <= 0) {
        clear();
      }
    }
    if (!state.current && state.queue.length > 0) {
      const next = state.queue.shift();
      show(next);
    }
  };

  const reset = () => {
    clear();
    state.queue.length = 0;
    state.cooldowns.clear();
    state.firedFlags.clear();
  };

  const hasShown = (id) => state.firedFlags.has(id);

  const getState = () => ({
    current: state.current ? { ...state.current } : null,
    queued: state.queue.length,
  });

  return {
    queueLine,
    triggerThreshold,
    update,
    clear,
    reset,
    hasShown,
    getState,
  };
}