export class CombatSystem {
  constructor({ calculateHit, getPlayerHUD, setHP, spawnDamageFloat, playActionSound }) {
    this.calculateHit = calculateHit;
    this.getPlayerHUD = getPlayerHUD;
    this.setHP = setHP;
    this.spawnDamageFloat = spawnDamageFloat;
    this.playActionSound = playActionSound;
    this.hitStopTimer = 0;
  }

  canAttack(cooldown) {
    return cooldown <= 0;
  }

  applyDamage(target, amount, { sourceId = target?.id, sound = 'enemy_hit' } = {}) {
    if (!target || target.dying || !target.alive) return 0;
    const damage = Math.max(1, Math.round(amount));
    target.hp = Math.max(0, target.hp - damage);
    target.hitCooldown = 0.25;
    this.spawnDamageFloat?.(sourceId, damage);
    this.playActionSound?.(sound);
    this.hitStopTimer = 0.045;
    return damage;
  }

  update(delta) {
    if (this.hitStopTimer > 0) this.hitStopTimer = Math.max(0, this.hitStopTimer - delta);
  }
}