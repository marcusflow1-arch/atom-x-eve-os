// ClashSystem.js — mirrors ClashSystem.cs
// Manages PvP clash detection and resolution between two ChainBreakSystem instances

export class ClashSystem {
  constructor({ onLog = () => {}, onClashStart = () => {}, onClashEnd = () => {} } = {}) {
    this.onLog = onLog;
    this.onClashStart = onClashStart;
    this.onClashEnd = onClashEnd;
    this.active = false;
    this.playerScore = 0;
    this.duration = 3000; // ms
    this._timer = null;
  }

  // mirrors TryClash()
  tryClash(player, opponent) {
    if (!player.chainActive || !opponent.chainActive) return false;
    if (player.chainCount < 4 || opponent.chainCount < 4) return false;

    this._startClash(player, opponent);
    return true;
  }

  _startClash(player, opponent) {
    this.active = true;
    this.playerScore = 0;
    this.onLog('⚔️ CLASH TRIGGERED!', '#f59e0b');
    this.onClashStart();

    // Auto-resolve after duration
    this._timer = setTimeout(() => {
      const opponentScore = Math.random() * 0.8 + 0.4; // simulated opponent
      this._resolve(player, opponent, opponentScore);
    }, this.duration);
  }

  // Call this on each player key press during clash
  addInput() {
    if (!this.active) return;
    this.playerScore += 0.1;
  }

  _resolve(player, opponent, opponentScore) {
    clearTimeout(this._timer);
    this.active = false;

    if (this.playerScore > opponentScore) {
      this.onLog('🏆 CLASH WIN — Bonus rewards!', '#fbbf24');
      this._rewardPlayer(player);
    } else {
      this.onLog('💀 CLASH LOST', '#ef4444');
    }

    this.onClashEnd(this.playerScore > opponentScore ? 'win' : 'lose');
  }

  // Force resolve externally (e.g. timer up from UI)
  forceResolve(player, opponent) {
    const opponentScore = Math.random() * 0.8 + 0.4;
    this._resolve(player, opponent, opponentScore);
  }

  _rewardPlayer(player) {
    player.addMeter(30); // bonus meter refill on clash win
    this.onLog('Bonus meter +30%', '#34d399');
  }
}