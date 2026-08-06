// BossEncounterController — single source of truth for "boss encounter" mode.
//
// While active the world is in a focused fight state: quest NPCs hide, boss
// music plays, and combat dialogue is scoped to the fight. Future boss attack
// patterns (tornado-lift-beam, telegraphs, grab chains) gate on this so they
// never leak into normal exploration.
//
// The controller owns a small encounter state object and exposes imperative
// hooks (start / beginCombat / end / queueLine / update) plus read accessors
// (isActive / isNPCSuppressed / getPhase / getState). It deliberately does NOT
// touch Three.js directly — the world component passes in the side-effect
// callbacks (dialogue setter, NPC-suppress setter, music hooks).

export function createBossEncounterController({
  setActiveDialogue,
  setQuestNPCSuppressed,
  startBossMusic,
  stopBossMusic,
} = {}) {
  const state = {
    active: false,
    phase: 'inactive', // inactive | intro | active | finisher | ended
    bossId: null,
    startedAt: 0,
    npcSuppressed: false,
    music: 'none', // none | intro | boss
    pendingDialogue: null,
    dialogueTimer: 0,
  };

  const setNPCSuppressed = (value) => {
    state.npcSuppressed = !!value;
    setQuestNPCSuppressed?.(!!value);
  };

  const showDialogue = (name, text, duration = 3.5) => {
    state.pendingDialogue = { name, text, duration };
    state.dialogueTimer = duration;
    setActiveDialogue?.({ name, text });
  };

  const clearDialogue = () => {
    state.pendingDialogue = null;
    state.dialogueTimer = 0;
    setActiveDialogue?.(null);
  };

  const start = ({ bossId, introLine } = {}) => {
    state.active = true;
    state.phase = 'intro';
    state.bossId = bossId || null;
    state.startedAt = performance.now();
    setNPCSuppressed(true);
    if (state.music !== 'boss') {
      startBossMusic?.();
      state.music = 'boss';
    }
    if (introLine?.name && introLine?.text) {
      showDialogue(introLine.name, introLine.text, introLine.duration || 4);
    }
  };

  const beginCombat = () => {
    if (!state.active) return;
    state.phase = 'active';
  };

  const end = ({ outroLine } = {}) => {
    state.phase = 'ended';
    state.active = false;
    state.bossId = null;
    setNPCSuppressed(false);
    stopBossMusic?.();
    state.music = 'none';
    if (outroLine?.name && outroLine?.text) {
      showDialogue(outroLine.name, outroLine.text, outroLine.duration || 4);
    } else {
      clearDialogue();
    }
  };

  // Non-blocking combat banter — shows a line for a few seconds while the
  // fight continues. Ignored when no encounter is active.
  const queueLine = ({ name, text, duration = 3 }) => {
    if (!state.active || !name || !text) return;
    showDialogue(name, text, duration);
  };

  const update = (delta) => {
    if (state.dialogueTimer > 0) {
      state.dialogueTimer -= delta;
      if (state.dialogueTimer <= 0) clearDialogue();
    }
  };

  const isActive = () => state.active;
  const isNPCSuppressed = () => state.npcSuppressed;
  const getPhase = () => state.phase;
  const getState = () => ({
    active: state.active,
    phase: state.phase,
    bossId: state.bossId,
    npcSuppressed: state.npcSuppressed,
    music: state.music,
    hasDialogue: !!state.pendingDialogue,
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