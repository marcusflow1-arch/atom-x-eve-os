/* eslint-disable */
// WebAudio sound effects (original JO sounds), simple distance attenuation
const FILES = {
  saberon: 'saber/saberon.mp3', saberoff: 'saber/saberoff.mp3', hum1: 'saber/saberhum1.wav', hum2: 'saber/saberhum2.wav', hum3: 'saber/saberhum3.wav', hum4: 'saber/saberhum4.wav',
  swing1: 'saber/saberhup1.mp3', swing2: 'saber/saberhup2.mp3', hit1: 'saber/saberhit1.mp3', hit2: 'saber/saberhit2.mp3', hit3: 'saber/saberhit3.mp3', hit: 'saber/saberhit.mp3',
  block1: 'saber/saberblock1.mp3', block2: 'saber/saberblock2.mp3', block3: 'saber/saberblock3.mp3', block4: 'saber/saberblock4.mp3', block5: 'saber/saberblock5.mp3', block6: 'saber/saberblock6.mp3', block7: 'saber/saberblock7.mp3', block8: 'saber/saberblock8.mp3', block9: 'saber/saberblock9.mp3',
  bounce1: 'saber/bounce1.mp3', bounce2: 'saber/bounce2.mp3', bounce3: 'saber/bounce3.mp3', wall1: 'saber/saberhitwall1.mp3', wall2: 'saber/saberhitwall2.mp3', wall3: 'saber/saberhitwall3.mp3', spin: 'saber/saberspin.wav', spinoff: 'saber/saberspinoff.wav', catch: 'saber/saber_catch.mp3',
  push: 'force/push.mp3', pull: 'force/pull.mp3', grip: 'force/grip.mp3', lightning: 'force/lightning.mp3', lightning2: 'force/lightning2.wav', lhit1: 'force/lightninghit1.mp3', lhit2: 'force/lightninghit2.mp3', lhit3: 'force/lightninghit3.mp3',
  heal: 'force/heal.wav', heal1: 'force/heal1.mp3', heal2: 'force/heal2.mp3', heal3: 'force/heal3.mp3', heal4: 'force/heal4.mp3', speed: 'force/speed.mp3', speedloop: 'force/speedloop.wav', jump: 'force/jump.mp3', jumpbuild: 'force/jumpbuild.mp3',
  rage: 'force/rage.mp3', rageloop: 'force/rageloop.wav', protect: 'force/protect.mp3', protectloop: 'force/protectloop.wav', protecthit: 'force/protecthit.mp3', absorb: 'force/absorb.mp3', absorbloop: 'force/absorbloop.wav', absorbhit: 'force/absorbhit.mp3',
  drain: 'force/drain.mp3', drained: 'force/drained.mp3', see: 'force/see.mp3', seeloop: 'force/seeloop.wav', distract: 'force/distract.wav', distractstop: 'force/distractstop.wav', teamheal: 'force/teamheal.mp3', teamforce: 'force/teamforce.mp3',
};
export class Sfx {
  constructor(base) { this.base = base || 'assets/sfx/'; this.ctx = null; this.buf = {}; this.master = null; this.listener = [0, 0, 0]; this.muted = false; this.loading = null; }
  resume() {
    if (this.ctx) { this.ctx.resume(); return; }
    try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination); this.loading = this.loadAll(); } catch (e) { console.warn('audio unavailable', e); }
  }
  dispose() { try { if (this.ctx) this.ctx.close(); } catch (e) { } this.ctx = null; this.buf = {}; }
  async loadAll() {
    await Promise.all(Object.entries(FILES).map(async ([k, f]) => { try { const r = await fetch(this.base + f); const a = await r.arrayBuffer(); this.buf[k] = await this.ctx.decodeAudioData(a); } catch (e) { console.warn('sfx', k, e.message); } }));
  }
  _gain(vol, pos) {
    let v = vol; if (pos) { const d = Math.hypot(pos[0] - this.listener[0], pos[1] - this.listener[1], pos[2] - this.listener[2]); v *= 1 / (1 + d * 0.18); }
    const g = this.ctx.createGain(); g.gain.value = v; g.connect(this.master); return g;
  }
  play(name, o = {}) {
    if (!this.ctx || this.muted) return null; const b = this.buf[name]; if (!b) return null;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = (o.rate ?? 1) * (o.vary ? 1 + (Math.random() - 0.5) * o.vary : 1); const g = this._gain(o.vol ?? 1, o.pos); s.connect(g); s.start(); return s;
  }
  pick(names, o) { return this.play(names[Math.floor(Math.random() * names.length)], o); }
  loop(name, o = {}) {
    if (!this.ctx || this.muted) return { stop() { }, set() { } }; const b = this.buf[name]; if (!b) return { stop() { }, set() { } };
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = o.rate ?? 1; const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.master); s.connect(g); s.start();
    const target = o.vol ?? 0.5; g.gain.linearRampToValueAtTime(target, this.ctx.currentTime + (o.fade ?? 0.1));
    return { set: v => { g.gain.value = v; }, stop: (f = 0.15) => { try { g.gain.cancelScheduledValues(this.ctx.currentTime); g.gain.setValueAtTime(g.gain.value, this.ctx.currentTime); g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + f); s.stop(this.ctx.currentTime + f + 0.05); } catch (e) { } } };
  }
}
