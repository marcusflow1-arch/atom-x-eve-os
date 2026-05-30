// Chain Break PvP System — Central State Store

const defaultChainState = {
  chainMeter: 0,       // 0–100
  chainActive: false,
  chainCount: 0,
  chainBuff: { damage: 1.0, crit: 0.0, speed: 1.0 },
  chainReady: false,
  currentTarget: null,
  lastReward: 0,
  clashActive: false,
  clashRole: null,     // 'attacker' | 'defender'
  clashScore: 0,
  clashResult: null,   // 'win' | 'lose' | null
  finisherActive: false,
  finisherClan: null,
  log: [],
};

let ChainState = { ...defaultChainState };
const subscribers = new Set();

export function getChainState() {
  return ChainState;
}

export function subscribeChainState(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  subscribers.forEach(fn => fn({ ...ChainState }));
}

export function updateChainState(patch) {
  ChainState = { ...ChainState, ...patch };
  notify();
}

export function addChainLog(msg, color = 'rgba(255,255,255,0.5)') {
  ChainState = {
    ...ChainState,
    log: [{ msg, color, id: Date.now() + Math.random() }, ...ChainState.log].slice(0, 30),
  };
  notify();
}

export function resetChainState() {
  ChainState = { ...defaultChainState };
  notify();
}

// ── Meter Logic ──────────────────────────────────────────────────────────────

export function addChainMeter(amount) {
  const next = Math.min(100, ChainState.chainMeter + amount);
  const chainReady = next >= 100;
  updateChainState({ chainMeter: next, chainReady });
  if (chainReady && !ChainState.chainReady) {
    addChainLog('⚡ CHAIN BREAK READY!', '#fbbf24');
  }
}

// ── Kill Handler ─────────────────────────────────────────────────────────────

export function onPlayerKill(enemyLevel = 1) {
  addChainMeter(20); // 5 kills = full gauge

  if (!ChainState.chainActive) return 0;

  const chainCount = ChainState.chainCount + 1;
  const buff = {
    damage: Math.min(2.5, ChainState.chainBuff.damage + 0.10),
    crit:   Math.min(0.75, ChainState.chainBuff.crit  + 0.05),
    speed:  Math.min(1.5,  ChainState.chainBuff.speed + 0.02),
  };

  const reward = Math.floor(enemyLevel * (1 + chainCount * 0.15));
  updateChainState({ chainCount, chainBuff: buff, lastReward: reward });
  addChainLog(`Chain ×${chainCount} — Reward: ${reward} (Lv${enemyLevel})`, '#34d399');

  return reward;
}

// ── Activation ───────────────────────────────────────────────────────────────

export function activateChainBreak(target) {
  if (!ChainState.chainReady) return false;

  updateChainState({
    chainActive: true,
    chainReady: false,
    chainMeter: 0,
    chainCount: 0,
    chainBuff: { damage: 1.0, crit: 0.0, speed: 1.0 },
    currentTarget: target,
  });
  addChainLog('🔥 CHAIN BREAK ACTIVATED', '#ef4444');
  return true;
}

// ── Chain Attack ─────────────────────────────────────────────────────────────

export function performChainAttack(target, nextTargetFn) {
  if (!ChainState.chainActive || ChainState.chainCount >= 5) {
    endChainBreak();
    return null;
  }
  if (!target) {
    addChainLog('No target — chain ended.', '#fca5a5');
    endChainBreak();
    return null;
  }

  const { damage: dmgMult, crit: critChance } = ChainState.chainBuff;
  let damage = Math.round(20 * dmgMult);
  const isCrit = Math.random() < critChance;
  if (isCrit) {
    damage = Math.round(damage * 2);
    addChainLog(`💥 CRITICAL HIT — ${damage} dmg`, '#f472b6');
  } else {
    addChainLog(`⚡ Chain hit — ${damage} dmg`, '#c4b5fd');
  }

  const updatedTarget = { ...target, hp: target.hp - damage };
  const killed = updatedTarget.hp <= 0;

  if (killed) {
    const reward = onPlayerKill(target.level || 1);
    if (ChainState.chainCount >= 5) {
      triggerFinisher(target);
      return { killed, isCrit, damage, reward, finisher: true };
    }
    const next = nextTargetFn ? nextTargetFn() : null;
    updateChainState({ currentTarget: next });
    if (!next) {
      addChainLog('No targets remain.', '#fca5a5');
      endChainBreak();
    }
  }

  return { killed, isCrit, damage, updatedTarget };
}

// ── Finisher ─────────────────────────────────────────────────────────────────

export function triggerFinisher(clan = 'WOLF') {
  updateChainState({ finisherActive: true, finisherClan: clan });
  const labels = { WOLF: '🐺 Wolf Spirit Strike', BEAR: '🐻 Bear Slam', SHADOW: '🌑 Shadow Execution' };
  addChainLog(labels[clan] || labels.WOLF, '#fbbf24');
  setTimeout(() => {
    updateChainState({ finisherActive: false, finisherClan: null });
    endChainBreak();
  }, 3000);
}

// ── End ──────────────────────────────────────────────────────────────────────

export function endChainBreak() {
  updateChainState({
    chainActive: false,
    chainCount: 0,
    chainBuff: { damage: 1.0, crit: 0.0, speed: 1.0 },
    currentTarget: null,
    clashActive: false,
    clashRole: null,
  });
  addChainLog('Chain Break ended.', 'rgba(255,255,255,0.3)');
}

// ── Clash System ─────────────────────────────────────────────────────────────

export function tryClash(opponentChainCount, opponentChainActive) {
  if (!ChainState.chainActive || !opponentChainActive) return false;
  if (ChainState.chainCount < 4 || opponentChainCount < 4) return false;

  updateChainState({ clashActive: true, clashScore: 0, clashResult: null, clashRole: 'attacker' });
  addChainLog('⚔️ CLASH TRIGGERED!', '#f59e0b');
  return true;
}

export function addClashInput() {
  if (!ChainState.clashActive) return;
  updateChainState({ clashScore: ChainState.clashScore + 1 });
}

export function resolveClash(opponentScore) {
  const won = ChainState.clashScore > opponentScore;
  const result = won ? 'win' : 'lose';
  updateChainState({ clashResult: result, clashActive: false });
  if (won) {
    addChainLog('🏆 CLASH WIN — Bonus rewards!', '#fbbf24');
    addChainMeter(30); // reward partial meter refill
  } else {
    addChainLog('💀 CLASH LOST', '#ef4444');
    endChainBreak();
  }
}