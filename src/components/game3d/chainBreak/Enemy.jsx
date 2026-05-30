// Enemy.js — mirrors Enemy.cs

export class Enemy {
  constructor({ id, name, hp = 100, level = 30, position = { x: 0, y: 0, z: 0 } }) {
    this.id = id;
    this.name = name;
    this.maxHp = hp;
    this.hp = hp;
    this.level = level;
    this.position = position;
    this.dead = false;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.dead = true;
    }
  }

  isDead() {
    return this.dead;
  }
}