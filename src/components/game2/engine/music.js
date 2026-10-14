/* eslint-disable */
// Map music, generated live with Web Audio (no audio files): an original battle score for each authored arena.
// A small sequencer schedules one bar at a time a little ahead of the audio clock; every note is a few oscillators
// through a filter and an envelope. Layers (low strings, string pads, a string ostinato, brass, a horn melody, a choir,
// taiko and snare) feed buses whose levels follow the fight: setIntensity(0) is the calm mix, 1 is full battle.
// The score is original (written for Atom X Eve), not taken from any game or film.

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = { // root position triads from the third octave (MIDI); the bass plays the root an octave or two down
  Dm: [50, 53, 57], Bb: [46, 50, 53], Gm: [43, 46, 50], A: [45, 49, 52], F: [41, 45, 48], C: [48, 52, 55],
};

// "Skybridge" (D minor, 116 BPM): A A B C, 8 bars each (about 66 s), then again from the top
export const SCORES = Object.freeze({
  skybridge: {
    name: 'Skybridge', bpm: 116,
    sections: {
      A: { chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A'], drums: 'pulse', brass: 'stab' },
      B: { chords: ['Bb', 'C', 'Dm', 'Dm', 'Gm', 'Bb', 'A', 'A'], drums: 'march', brass: 'swell', choir: true, ostinato: 4 },
      C: { chords: ['Dm', 'F', 'C', 'Bb', 'Gm', 'Bb', 'A', 'A'], drums: 'battle', brass: 'stab2', choir: true, ostinato: 0 },
    },
    // the theme: [beat in the bar, MIDI note, beats long] per bar
    melodies: {
      A: [
        [[0, 62, 1.5], [1.5, 69, 0.5], [2, 69, 1], [3, 67, 1]], [[0, 65, 2], [2, 62, 1], [3, 65, 1]],
        [[0, 67, 1.5], [1.5, 70, 0.5], [2, 69, 1], [3, 67, 1]], [[0, 69, 3], [3, 64, 1]],
        [[0, 62, 1.5], [1.5, 69, 0.5], [2, 74, 1], [3, 72, 1]], [[0, 70, 2], [2, 69, 1], [3, 65, 1]],
        [[0, 67, 1], [1, 70, 1], [2, 74, 1], [3, 72, 1]], [[0, 69, 4]],
      ],
      C: [
        [[0, 74, 1.5], [1.5, 81, 0.5], [2, 81, 1], [3, 79, 1]], [[0, 77, 2], [2, 72, 1], [3, 77, 1]],
        [[0, 76, 1.5], [1.5, 79, 0.5], [2, 76, 1], [3, 72, 1]], [[0, 74, 2], [2, 77, 2]],
        [[0, 79, 1.5], [1.5, 82, 0.5], [2, 81, 1], [3, 79, 1]], [[0, 77, 2], [2, 74, 2]],
        [[0, 76, 2], [2, 73, 2]], [[0, 69, 4]],
      ],
    },
    form: [{ s: 'A' }, { s: 'A', melody: 'A' }, { s: 'B' }, { s: 'C', melody: 'C' }],
  },
});

// bus levels: [calm, battle]
const BUS = { bass: [0.8, 1], pad: [1, 0.9], ostinato: [0.5, 1], brass: [0.22, 1], horn: [0.75, 1], choir: [0.6, 1], drums: [0.2, 1] };

export class Score {
  constructor(ctx, def, o = {}) {
    this.ctx = ctx; this.def = def; this.beat = 60 / def.bpm; this.barLen = this.beat * 4;
    this.bars = def.form.flatMap(f => def.sections[f.s].chords.map((chord, i) => ({ sec: f.s, i, chord, melody: f.melody ? def.melodies[f.melody][i] : null })));
    this.intensity = o.intensity ?? 0.35; this.target = this.intensity; this.level = o.level ?? 0.5; this.running = false; this.timer = null; this.lookahead = o.lookahead ?? 1.6; this.manual = !!o.manual; // manual: only tick() schedules (tests)
    // output: buses -> dry + reverb send -> compressor -> level -> speakers
    const c = ctx; this.out = c.createGain(); this.out.gain.value = this.level; this.out.connect(o.destination || c.destination);
    this.comp = c.createDynamicsCompressor(); try { this.comp.threshold.value = -16; this.comp.ratio.value = 3; this.comp.attack.value = 0.01; this.comp.release.value = 0.25; } catch (e) { } this.comp.connect(this.out);
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(2.4); this.wet = c.createGain(); this.wet.gain.value = 0.3; this.verb.connect(this.wet); this.wet.connect(this.comp);
    this.bus = {}; for (const k of Object.keys(BUS)) { const g = c.createGain(); g.gain.value = this.busLevel(k); g.connect(this.comp); g.connect(this.verb); this.bus[k] = g; }
    this.noise = this.noiseBuffer();
  }
  busLevel(k, I = this.intensity) { const [a, b] = BUS[k]; return a + (b - a) * I; }
  impulse(sec) { const c = this.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); } return b; }
  noiseBuffer() { const c = this.ctx, n = c.sampleRate, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }

  // ---------- transport
  start(at) {
    if (this.running) return; this.running = true; this.bar = 0; this.nextBar = (at ?? this.ctx.currentTime) + 0.1;
    this.out.gain.cancelScheduledValues?.(this.ctx.currentTime); this.out.gain.setValueAtTime(0, this.ctx.currentTime); this.out.gain.linearRampToValueAtTime(this.level, this.ctx.currentTime + 2); // fade in
    this.tick(); if (typeof setInterval !== 'undefined' && !this.manual) this.timer = setInterval(() => this.tick(), 200);
  }
  stop(fade = 0.8) {
    if (!this.running) return; this.running = false; if (this.timer) clearInterval(this.timer); this.timer = null;
    const t = this.ctx.currentTime; try { this.out.gain.cancelScheduledValues(t); this.out.gain.setValueAtTime(this.out.gain.value, t); this.out.gain.linearRampToValueAtTime(0, t + fade); } catch (e) { }
    const out = this.out; setTimeout?.(() => { try { out.disconnect(); } catch (e) { } }, (fade + 0.2) * 1000);
  }
  // schedule every bar that starts within the lookahead (the timer is coarse on purpose: hidden tabs throttle it)
  tick() { if (!this.running) return; while (this.nextBar < this.ctx.currentTime + this.lookahead) { this.scheduleBar(this.bars[this.bar % this.bars.length], this.nextBar); this.bar++; this.nextBar += this.barLen; } }
  setLevel(v) { if (Math.abs(v - this.level) < 0.005) return; this.level = v; const t = this.ctx.currentTime; try { this.out.gain.setTargetAtTime(v, t, 0.15); } catch (e) { } }
  // the fight around the player (0 calm .. 1 battle); the mix follows over a couple of seconds
  setIntensity(I, dt = 0.016) { this.target = Math.max(0, Math.min(1, I)); this.intensity += (this.target - this.intensity) * Math.min(1, dt * 0.6); const t = this.ctx.currentTime; for (const k in this.bus) { try { this.bus[k].gain.setTargetAtTime(this.busLevel(k), t, 0.3); } catch (e) { } } }

  // ---------- instruments
  // one note: oscillators (one per detune, in cents) -> filter (optional sweep) -> envelope -> bus
  note(t, midi, dur, o) {
    const c = this.ctx, f = mtof(midi), env = c.createGain(), flt = c.createBiquadFilter(), a = o.a ?? 0.02, rel = o.rel ?? 0.2, end = t + dur + rel;
    flt.type = o.ft || 'lowpass'; flt.Q.value = o.q ?? 0.7; flt.frequency.setValueAtTime(o.f0 ?? o.f ?? 2000, t); if (o.f1) flt.frequency.linearRampToValueAtTime(o.f1, t + (o.fT ?? a + 0.1));
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(o.peak, t + a); env.gain.setTargetAtTime(o.peak * (o.sus ?? 0.8), t + a, o.dec ?? 0.2); env.gain.setTargetAtTime(0, t + dur, rel / 3);
    flt.connect(env); env.connect(this.bus[o.bus]);
    for (const cents of o.det || [0]) { const os = c.createOscillator(); os.type = o.type || 'sawtooth'; os.frequency.setValueAtTime(f, t); os.detune.setValueAtTime(cents, t); os.connect(flt); os.start(t); os.stop(end); }
  }
  hit(t, kind, v = 1) {
    const c = this.ctx, bus = this.bus.drums;
    if (kind === 'taiko' || kind === 'tom') { // a big drum: a falling sine body and a thump of filtered noise
      const os = c.createOscillator(), g = c.createGain(), f0 = kind === 'tom' ? 160 : 105; os.type = 'sine';
      os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f0 * 0.4, t + 0.35);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55 * v, t + 0.005); g.gain.setTargetAtTime(0, t + 0.02, kind === 'tom' ? 0.12 : 0.22);
      os.connect(g); g.connect(bus); os.start(t); os.stop(t + 1.2);
    }
    const n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); n.buffer = this.noise; n.playbackRate.value = 0.7 + Math.random() * 0.6;
    if (kind === 'snare') { fl.type = 'highpass'; fl.frequency.value = 1700; g.gain.setValueAtTime(0.16 * v, t); g.gain.setTargetAtTime(0, t + 0.01, 0.05); }
    else if (kind === 'swell') { fl.type = 'highpass'; fl.frequency.value = 5000; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * v, t + this.barLen * 0.95); g.gain.setTargetAtTime(0, t + this.barLen, 0.03); }
    else { fl.type = 'lowpass'; fl.frequency.value = 700; g.gain.setValueAtTime(0.25 * v, t); g.gain.setTargetAtTime(0, t + 0.005, 0.05); }
    n.connect(fl); fl.connect(g); g.connect(bus); n.start(t, Math.random() * 0.5); n.stop(t + (kind === 'swell' ? this.barLen + 0.2 : 0.6));
  }

  // ---------- one bar of the arrangement
  scheduleBar(B, t0) {
    const S = this.def.sections[B.sec], b = this.beat, ch = CHORDS[B.chord], root = ch[0], last = B.i === S.chords.length - 1;
    // low strings: driving eighths on the root, accents in 3 + 3 + 2
    for (let k = 0; k < 8; k++) { const acc = k === 0 || k === 3 || k === 6; this.note(t0 + k * b / 2, root - 12 + (k === 7 && B.sec === 'C' ? 7 : 0), b * 0.42, { bus: 'bass', peak: acc ? 0.2 : 0.12, det: [0, -7], f0: acc ? 1300 : 800, f1: 420, fT: 0.12, a: 0.008, dec: 0.08, sus: 0.6, rel: 0.08 }); }
    // string pad: the chord held for the bar, two octaves
    for (const m of [...ch, ch[1] + 12]) this.note(t0, m, this.barLen * 0.98, { bus: 'pad', peak: 0.035, det: [-9, 8], f: 1500, a: 0.35, dec: 0.6, sus: 0.85, rel: 0.5 });
    // string ostinato (16ths: root, fifth, octave, fifth) in the build-up's second half and the climax
    if (S.ostinato != null && B.i >= S.ostinato) for (let k = 0; k < 16; k++) this.note(t0 + k * b / 4, [root + 12, ch[2] + 12, root + 24, ch[2] + 12][k % 4], b * 0.2, { bus: 'ostinato', peak: 0.05 + (k % 4 === 0 ? 0.02 : 0), det: [0, 6], f: 2600, a: 0.005, dec: 0.05, sus: 0.5, rel: 0.05 });
    // brass
    const brass = (t, len, peak) => { for (const m of ch.map(x => x + 12)) this.note(t, m, len, { bus: 'brass', peak, det: [-6, 5], f0: 500, f1: 2600, fT: 0.09, q: 1.2, a: 0.03, dec: 0.25, sus: 0.6, rel: 0.25 }); };
    if (S.brass === 'stab') brass(t0, b * 1.2, 0.05);
    else if (S.brass === 'stab2') { brass(t0, b * 1.4, 0.065); brass(t0 + b * 2.5, b * 0.9, 0.05); }
    else if (S.brass === 'swell') for (const m of ch.map(x => x + 12)) this.note(t0, m, this.barLen * 0.9, { bus: 'brass', peak: 0.045, det: [-6, 5], f0: 400, f1: 2200, fT: this.barLen * 0.8, a: this.barLen * 0.7, dec: 0.5, sus: 1, rel: 0.2 });
    // the theme on the horn (the climax: the strings take it up an octave, the horn doubles below)
    if (B.melody) for (const [at, m, len] of B.melody) {
      const hi = B.sec === 'C'; this.note(t0 + at * b, hi ? m - 12 : m, len * b * 0.95, { bus: 'horn', peak: 0.09, type: 'sawtooth', det: [-4, 4], f0: 700, f1: 1700, fT: 0.12, q: 1.5, a: 0.06, dec: 0.3, sus: 0.85, rel: 0.25 });
      if (hi) this.note(t0 + at * b, m, len * b * 0.95, { bus: 'horn', peak: 0.04, det: [-10, 0, 10], f: 3200, a: 0.08, dec: 0.3, sus: 0.9, rel: 0.3 });
    }
    // choir: an open "ah" (formant band) on the chord
    if (S.choir) for (const m of ch.map(x => x + 12)) this.note(t0, m, this.barLen * 0.95, { bus: 'choir', peak: 0.06, det: [-12, 0, 11], ft: 'bandpass', f: 800, q: 2.2, a: 0.5, dec: 0.8, sus: 0.9, rel: 0.6 });
    // drums
    const beats = { pulse: [[0, 'taiko', 1], [2, 'taiko', 0.7], [3.5, 'tom', 0.45]], march: [[0, 'taiko', 1], [1, 'snare', 0.7], [2, 'taiko', 0.8], [2.5, 'taiko', 0.5], [3, 'snare', 0.8]], battle: [[0, 'taiko', 1], [0.5, 'tom', 0.5], [1, 'snare', 0.9], [1.5, 'taiko', 0.6], [2, 'taiko', 0.9], [2.75, 'tom', 0.5], [3, 'snare', 1], [3.5, 'tom', 0.6]] }[S.drums] || [];
    for (const [at, kind, v] of beats) this.hit(t0 + at * b, kind, v);
    if (last) { this.hit(t0, 'swell', 1); for (let k = 0; k < 4; k++) this.hit(t0 + (3 + k / 4) * b, 'tom', 0.5 + k * 0.12); } // into the next section
  }
}
