// Game 2 offline arena trainer. Calls the real Fighter and Force actions; never creates
// fake UI-only casts, alters multiplayer, rewards, or player inventories.
import { buildGame2TutorialLessons } from './tutorialCatalog.js';

const STORAGE_KEY = 'atomxe.game2.tutorial.completed.v1';

export class Game2TutorialDirector {
  constructor(game) {
    this.g = game;
    this.trainer = game.tutorialTrainer;
    this.target = game.tutorialTarget;
    this.selectedId = 'draw';
    this.phase = 'select';
    this.events = [];
    this.scheduled = [];
    this.demoAttackUntil = 0;
    this.demoJumpUntil = 0;
    this.demoJumpStart = 0;
    this.startedY = game.player.pos[1];
    this.startedStyle = game.player.saber.level;
    try {
      this.completed = new Set(JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || '[]'));
    } catch { this.completed = new Set(); }
    this.resetActors();
  }

  lessons() { return buildGame2TutorialLessons(this.g); }
  selected() { return this.lessons().find(l => l.id === this.selectedId) || this.lessons()[0]; }
  snapshot() {
    return {
      selectedId: this.selected()?.id, phase: this.phase, completed: [...this.completed],
      lessons: this.lessons().map(({ id, title, group, steps, automatic }) => ({ id, title, group, steps, automatic: !!automatic })),
    };
  }
  select(id) {
    if (!this.lessons().some(l => l.id === id)) return false;
    this.selectedId = id; this.phase = 'select'; this.scheduled = [];
    this.resetActors();
    return true;
  }
  next() {
    const ls = this.lessons(), i = ls.findIndex(l => l.id === this.selectedId);
    return this.select(ls[(i + 1) % ls.length].id);
  }
  // Keeps the tutorial entirely offline and the opponent stationary, with the real
  // enemy model present to receive attacks. Resetting also prevents residual Force
  // holds, collisions, knockdowns and deaths leaking between lessons.
  resetActors() {
    const g = this.g;
    this.events = []; this.scheduled = [];
    this.demoAttackUntil = this.demoJumpUntil = 0;
    g.force.reset(); g.force.pulse = 0; g.respawnPlayer();
    g.player.spawnShield = 0; g.player.hp = g.player.maxHp;
    for (const npc of [this.trainer, this.target]) {
      if (!npc) continue;
      npc.force?.reset();
      g.respawnNpc(npc); npc.hp = npc.maxHp; npc.spawnShield = 0;
    }
    if (this.trainer) {
      this.trainer.force.fp = this.trainer.force.max = 180;
      this.trainer.yaw = this.trainer.targetYaw = Math.atan2(this.target.pos[0] - this.trainer.pos[0], this.target.pos[2] - this.trainer.pos[2]);
      this.trainer.aiFoe = this.target;
    }
    this.startedY = g.player.pos[1]; this.startedStyle = g.player.saber.level;
    const lesson = this.selected();
    if (lesson?.id === 'kick') g.player.setSaberKit('staff');
    if (lesson?.goal === 'repulse' || lesson?.goal === 'dominance') g.force.pulse = 100;
    if (lesson?.powerId === 'heal') g.player.hp = Math.max(35, g.player.maxHp * 0.55);
    g.tutorialPhase = this.phase;
  }
  onCast(fighter, id, options = {}) {
    if (fighter !== this.g.player || this.phase !== 'practice') return;
    this.events.push({ id, t: this.g.t, airborne: !fighter.onGround, charge: options.charge || 0 });
    if (this.events.length > 24) this.events.shift();
  }
  onSwing(fighter) {
    if (fighter === this.g.player && this.phase === 'practice') this.events.push({ id: 'swing', t: this.g.t });
  }
  onTaunt(fighter) {
    if (fighter === this.g.player && this.phase === 'practice') this.events.push({ id: 'taunt', t: this.g.t });
  }
  demo() {
    this.phase = 'demo';
    this.resetActors();
    const lesson = this.selected();
    if (!lesson) return;
    this.demoStarted = this.g.t; this.scheduled = [];
    const add = (delay, fn) => this.scheduled.push({ at: this.demoStarted + delay, fn });
    const f = this.trainer, F = f?.force, g = this.g;
    if (!f || !F) return;
    const cast = (id, opts) => { F.fp = Math.max(F.fp, 95); F.cast(id, opts); };
    const hold = (id, duration) => {
      F.want[id] = true; cast(id);
      add(duration, () => { F.want[id] = false; F.release(); });
    };
    switch (lesson.demo) {
      case 'draw': f.saber.holstered = true; f.blade.set(false); f.blade.len = 0; f.hilt = 'thigh'; add(0.4, () => f.igniteNow()); break;
      case 'attack': add(0.45, () => { this.demoAttackUntil = g.t + 0.85; }); break;
      case 'jump': add(0.45, () => { this.demoJumpStart = g.t; this.demoJumpUntil = g.t + 0.6; }); break;
      case 'style': add(0.45, () => f.setStyle(3)); break;
      case 'throw': add(0.5, () => f.throwSaber([Math.sin(f.yaw), 0, Math.cos(f.yaw)])); break;
      case 'kata': add(0.5, () => f.startKata()); break;
      case 'kick': add(0.45, () => { f.setSaberKit('staff'); f.startKick('F'); }); break;
      case 'taunt': add(0.4, () => f.taunt()); break;
      case 'charge-push': add(0.6, () => cast('push', { charge: 1 })); break;
      case 'push-speed':
        add(0.5, () => cast('push'));
        add(0.95, () => cast('speed'));
        break;
      case 'pull-push':
        add(0.5, () => { f.pos[1] += 2; f.onGround = false; cast('pull'); });
        add(1.15, () => cast('push'));
        break;
      case 'throw-lightning':
        add(0.5, () => f.throwSaber([Math.sin(f.yaw), 0, Math.cos(f.yaw)]));
        add(1.3, () => hold('lightning', 1.2));
        break;
      case 'storm': add(0.5, () => hold('lightning', 2.3)); break;
      case 'counter':
        add(0.5, () => { f.critTarget = this.target; f.critUntil = g.t + 1.5; f.startCritStrike(); });
        break;
      case 'repulse': add(0.5, () => { F.pulse = 100; F.startPulse(); }); break;
      case 'dominance': add(0.6, () => { F.pulse = 100; F.startDominance(this.target); }); break;
      case 'dodge':
        add(0.5, () => f.startDodge(-1, [f.pos[0] - 2, f.pos[1], f.pos[2]]));
        break;
      case 'power':
        add(0.5, () => {
          if (lesson.powerId === 'heal') f.hp = f.maxHp * 0.5;
          if (lesson.powerId === 'levitate' && this.target.status === 'dead') g.respawnNpc(this.target);
          if (['grip', 'lightning', 'heal', 'drain'].includes(lesson.powerId)) hold(lesson.powerId, 1.6);
          else cast(lesson.powerId);
        });
        break;
      default: break;
    }
    // Held casts have release events scheduled *during* their first action. Do not
    // end the demonstration before the channel duration/second combo action.
    const duration = { storm: 3.6, 'throw-lightning': 3.8, 'pull-push': 3.1,
      'push-speed': 2.7, repulse: 3.5, power: 3.1, dominance: 3.2 }[lesson.demo] || 2.8;
    this.demoEnds = this.demoStarted + duration;
  }
  practice() {
    if (this.selected()?.automatic) return false;
    this.phase = 'practice'; this.resetActors();
    this.g.hud.msg('Training: follow the steps on the right. F1 opens game controls.');
    return true;
  }
  demoCmd(cmd) {
    if (this.phase !== 'demo') return;
    if (this.g.t < this.demoAttackUntil) cmd.attack = true;
    if (this.g.t < this.demoJumpUntil) {
      cmd.jump = true; cmd.up = 1; cmd.jumpPressed = this.g.t - this.demoJumpStart < 0.04;
    }
  }
  hasCast(id) { return this.events.some(e => e.id === id); }
  hasSequence(ids) {
    let found = 0;
    for (const e of this.events) if (e.id === ids[found]) found++;
    return found === ids.length;
  }
  achieved(lesson) {
    const g = this.g, p = g.player, F = g.force;
    switch (lesson.goal) {
      case 'draw': return !p.saber.holstered;
      case 'swing': return this.events.some(e => e.id === 'swing');
      case 'jump': return p.pos[1] > this.startedY + 0.35;
      case 'style': return p.saber.level !== this.startedStyle;
      case 'throw': return !!p.thrown;
      case 'kata': return !!p.kata;
      case 'kick': return !!p.kicking;
      case 'taunt': return this.events.some(e => e.id === 'taunt');
      case 'power': return this.hasCast(lesson.powerId);
      case 'chargedpush': return this.events.some(e => e.id === 'push' && e.charge >= 0.66);
      case 'pushspeed': return this.hasSequence(['push', 'speed']) && ((p.interceptBonusUntil || 0) > g.t || !!F.dash);
      case 'pullpush': {
        const pull = this.events.find(e => e.id === 'pull' && e.airborne);
        return !!pull && this.events.some(e => e.id === 'push' && e.t > pull.t);
      }
      case 'chargedblade': return !!p.thrown && (p.thrown.chargedUntil || 0) > g.t;
      case 'storm': return !!F.storm;
      case 'counter': return !!p.critStrike;
      case 'repulse': return !!F.pulsing;
      case 'dominance': return (F.pulse || 0) < 100 && (g.executions || []).some(e => e.kind === 'dominance');
      default: return false; // automatic lessons complete only after a real AI demonstration
    }
  }
  update() {
    const g = this.g; g.tutorialPhase = this.phase;
    if (this.phase === 'demo') {
      for (const action of this.scheduled) {
        if (action.at <= g.t && !action.done) { action.done = true; action.fn(); }
      }
      if (g.t >= this.demoEnds) {
        this.trainer?.force?.releaseAll();
        this.phase = this.selected()?.automatic ? 'complete' : 'demo-done';
        if (this.phase === 'complete') this.markComplete();
      }
    } else if (this.phase === 'practice') {
      // Unlimited training resources. This is an isolated match, never progression.
      g.force.fp = Math.max(g.force.fp, 85);
      g.player.hp = Math.max(g.player.hp, 80);
      if (this.achieved(this.selected())) { this.phase = 'complete'; this.markComplete(); g.hud.msg('Tutorial complete! Choose another move.'); }
      if (this.target.status === 'dead' && g.t - this.target.deadAt > 1.5) g.respawnNpc(this.target);
      if (g.player.status === 'dead') g.respawnPlayer();
    }
  }
  markComplete() {
    this.completed.add(this.selectedId);
    try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify([...this.completed])); } catch { /* storage optional */ }
  }
}
