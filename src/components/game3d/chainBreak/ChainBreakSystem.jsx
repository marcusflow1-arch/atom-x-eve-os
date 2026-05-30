// ChainBreakSystem.js — mirrors ChainBreakSystem.cs
// Pure JS class: no React, no DOM. Drop-in for any engine or UI layer.

import { TargetingSystem } from './TargetingSystem';
import { PlayerCombat } from './PlayerCombat';

export const ClanType = { Wolf: 'Wolf', Bear: 'Bear', Shadow: 'Shadow' };

const MAX_METER = 100;
const MAX_CHAINS = 5;
const TELEPORT_DELAY_MS = 100;
const CHAIN_DELAY_MS = 200;

export class ChainBreakSystem {
  constructor({
    clan = ClanType.Wolf,
    baseDamage = 20,
    targetRange = 20,
    onStateChange = () => {},
    onLog = () => {},
    onFinisher = () => {},
  } = {}) {
    this.clan = clan;
    this.targeting = new TargetingSystem({ range: targetRange });
    this.combat = new PlayerCombat({ baseDamage });
    this.onStateChange = onStateChange;
    this.onLog = onLog;
    this.onFinisher = onFinisher;

    // State — mirrors Unity public fields
    this.chainMeter = 0;
    this.chainCount = 0;
    this.chainActive = false;
    this.damageMultiplier = 1;
    this.critChance = 0;

    this._running = false;
    this._playerPos = { x: 0, y: 0, z: 0 };
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  _emit() {
    this.onStateChange({
      chainMeter: this.chainMeter,
      chainCount: this.chainCount,
      chainActive: this.chainActive,
      damageMultiplier: this.damageMultiplier,
      critChance: this.critChance,
      chainReady: this.chainMeter >= MAX_METER,
    });
  }

  _log(msg, color) {
    this.onLog(msg, color);
  }

  _delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // ── Meter ───────────────────────────────────────────────────────────────────

  addMeter(amount) {
    this.chainMeter = Math.min(MAX_METER, this.chainMeter + amount);
    if (this.chainMeter >= MAX_METER) {
      this._log('⚡ CHAIN BREAK READY!', '#fbbf24');
    }
    this._emit();
  }

  // ── Kill callback — mirrors OnKill() ────────────────────────────────────────

  onKill(enemyLevel = 1) {
    this.addMeter(20);

    if (!this.chainActive) return 0;

    this.chainCount++;
    this.damageMultiplier = Math.min(2.5, this.damageMultiplier + 0.1);
    this.critChance = Math.min(0.75, this.critChance + 0.05);

    const reward = Math.floor(enemyLevel * (1 + this.chainCount * 0.15));
    this._log(`Chain ×${this.chainCount} — Reward: ${reward} (Lv${enemyLevel})`, '#34d399');
    this._emit();

    return reward;
  }

  // ── Activation — mirrors ActivateChainBreak() ───────────────────────────────

  activate(enemies) {
    if (this.chainMeter < MAX_METER || this._running) return false;

    this.chainActive = true;
    this.chainMeter = 0;
    this.chainCount = 0;
    this.damageMultiplier = 1;
    this.critChance = 0;

    this._log('🔥 CHAIN BREAK ACTIVATED', '#ef4444');
    this._emit();

    this._chainNext(enemies);
    return true;
  }

  // ── Chain loop — mirrors ChainNextTarget() + ChainAttack() coroutine ────────

  async _chainNext(enemies) {
    if (this._running) return;

    if (this.chainCount >= MAX_CHAINS) {
      this._finalFinisher();
      return;
    }

    const target = this.targeting.getNextTarget(enemies, this._playerPos);

    if (!target) {
      this._log('No targets — chain ended.', '#fca5a5');
      this._endChain();
      return;
    }

    this._running = true;
    await this._chainAttack(target, enemies);
    this._running = false;
  }

  async _chainAttack(target, enemies) {
    // Teleport
    this._playerPos = { ...target.position, z: (target.position.z ?? 0) - 2 };
    this._log(`⚡ Teleport → ${target.name}`, '#c4b5fd');
    await this._delay(TELEPORT_DELAY_MS);

    const { damage, isCrit, killed } = this.combat.attack(target, {
      chainActive: this.chainActive,
      damageMultiplier: this.damageMultiplier,
      critChance: this.critChance,
    });

    if (isCrit) this._log(`💥 CRITICAL HIT — ${damage} dmg`, '#f472b6');
    else this._log(`Hit ${target.name} for ${damage} dmg`, '#a5b4fc');

    this._emit();

    if (killed) {
      this.onKill(target.level);
      await this._delay(CHAIN_DELAY_MS);

      if (this.chainCount >= MAX_CHAINS) {
        this._finalFinisher();
      } else {
        await this._chainNext(enemies);
      }
    } else {
      this._endChain();
    }
  }

  // ── Finisher — mirrors FinalFinisher() ─────────────────────────────────────

  _finalFinisher() {
    const labels = {
      Wolf:   '🐺 Wolf Spirit Strike',
      Bear:   '🐻 Bear Slam',
      Shadow: '🌑 Shadow Execution',
    };
    this._log(labels[this.clan] || labels.Wolf, '#fbbf24');
    this.onFinisher(this.clan);
    this._endChain();
  }

  // ── End — mirrors EndChain() ────────────────────────────────────────────────

  _endChain() {
    this.chainActive = false;
    this.chainCount = 0;
    this.damageMultiplier = 1;
    this.critChance = 0;
    this._running = false;
    this._log('Chain ended.', 'rgba(255,255,255,0.3)');
    this._emit();
  }
}