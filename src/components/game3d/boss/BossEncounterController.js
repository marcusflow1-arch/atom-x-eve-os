// BossEncounterController — single source of truth for the live world-boss fight.
// It owns encounter state, music, and quest-NPC suppression only. Boss dialogue
// is routed through BossCombatDialogue so quest/NPC dialogue and boss banter do
// not compete for the same responsibility.

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

export function createBossEncounterController({
  setQuestNPCSuppressed,
  startBossMusic,
  stopBossMusic,
} = {}) {
  const state = {
    active: false,
    phase: 'inactive', // inactive | waiting | intro | active | finisher | ended
    bossId: null,
    bossName: null,
    startedAt: 0,
    npcSuppressed: false,
    music: 'none',
    pendingStart: null,
  };

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const setNPCSuppressed = (value) => {
    state.npcSuppressed = !!value;
    setQuestNPCSuppressed?.(!!value);
  };

  const routeBossLine = ({ text, duration = 3.5 } = {}) => {
    if (!text || typeof window === 'undefined') return false;
    const boss = getLiveWorldBoss();
    if (!boss) return false;
    return !!window.__gw3dBossDialogue?.queueLine?.({
      name: boss.name || boss.title || 'World Boss',
      text,
      duration,
    });
  };

  const activate = (request = {}) => {
    const boss = getLiveWorldBoss();
    if (!boss) return false;

    state.active = true;
    state.phase = 'intro';
    state.bossId = boss.id;
    state.bossName = boss.name || boss.title || 'World Boss';
    state.startedAt = nowMs();
    state.pendingStart = null;
    setNPCSuppressed(true);

    if (state.music !== 'boss') {
      startBossMusic?.();
      state.music = 'boss';
    }

    if (request.introLine?.text) {
      routeBossLine({ text: request.introLine.text, duration: request.introLine.duration || 4 });
    }
    return true;
  };

  const start = ({ bossId, introLine } = {}) => {
    if (state.active) return true;
    const request = { bossId, introLine };
    if (activate(request)) return true;

    // Player/world assets load asynchronously. Remember the request, but do not
    // enter encounter mode or fire attacks until the real world boss exists.
    state.pendingStart = request;
    state.phase = 'waiting';
    state.active = false;
    return false;
  };

  const beginCombat = () => {
    if (!state.active || !getLiveWorldBoss()) return false;
    state.phase = 'active';
    return true;
  };

  const end = ({ outroLine, suppressOutro = false } = {}) => {
    const bossWasAlive = !!getLiveWorldBoss();
    state.phase = 'ended';
    state.active = false;
    state.pendingStart = null;
    state.bossId = null;
    state.bossName = null;
    setNPCSuppressed(false);
    stopBossMusic?.();
    state.music = 'none';

    if (!suppressOutro && bossWasAlive && outroLine?.text) {
      routeBossLine({ text: outroLine.text, duration: outroLine.duration || 4 });
    }
  };

  // Compatibility hook for existing scripted boss patterns. It forwards to the
  // dedicated boss-dialogue system rather than owning dialogue itself.
  const queueLine = ({ text, duration = 3 } = {}) => {
    if (!state.active || !getLiveWorldBoss() || !text) return false;
    return routeBossLine({ text, duration });
  };

  const update = () => {
    if (!state.active && state.pendingStart) activate(state.pendingStart);

    if (state.active) {
      const boss = getLiveWorldBoss();
      if (!boss || boss.id !== state.bossId) {
        // Death/vanish is a hard encounter boundary. This prevents GameWorld's
        // auto-pattern loop from continuing during the death animation.
        end({ suppressOutro: true });
      }
    }
  };

  const isActive = () => state.active && !!getLiveWorldBoss();
  const isNPCSuppressed = () => state.npcSuppressed;
  const getPhase = () => state.phase;
  const getState = () => ({
    active: isActive(),
    phase: state.phase,
    bossId: state.bossId,
    bossName: state.bossName,
    npcSuppressed: state.npcSuppressed,
    music: state.music,
    waitingForBoss: !!state.pendingStart,
  });

  return {
    start,
    beginCombat,
    end,
    queueLine,
    update,
    isActive,
    isNPCSuppressed,
    getPhase,
    getState,
  };
}