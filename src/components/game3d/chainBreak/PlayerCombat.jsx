// PlayerCombat.js — mirrors PlayerCombat.cs

export class PlayerCombat {
  constructor({ baseDamage = 20 } = {}) {
    this.baseDamage = baseDamage;
  }

  // Returns { damage, isCrit, killed }
  attack(enemy, chainState) {
    let damage = this.baseDamage;
    let isCrit = false;

    if (chainState.chainActive) {
      damage *= chainState.damageMultiplier;
    }

    if (Math.random() < chainState.critChance) {
      damage *= 2;
      isCrit = true;
    }

    damage = Math.round(damage);
    enemy.takeDamage(damage);

    return { damage, isCrit, killed: enemy.isDead() };
  }
}