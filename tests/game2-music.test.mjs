// The generated map score (engine/music.js) on a fake Web Audio context: the composition, the bar scheduler, the
// fight-driven mix, and the game starting it on Skybridge Citadel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Score, SCORES } from '../src/components/game2/engine/music.js';
import { makeMatch } from './support/game2Sim.mjs';

// just enough of AudioContext: nodes connect, params record their automation, sources record start / stop times
function fakeCtx() {
  const ctx = { currentTime: 0, sampleRate: 8000, destination: { connect() {} }, started: [], late: 0 };
  const param = v => ({ value: v, events: [], setValueAtTime(x, t) { this.events.push(['set', x, t]); }, linearRampToValueAtTime(x, t) { this.events.push(['lin', x, t]); }, exponentialRampToValueAtTime(x, t) { this.events.push(['exp', x, t]); }, setTargetAtTime(x, t, k) { this.events.push(['target', x, t, k]); }, cancelScheduledValues() {} });
  const node = extra => ({ connect() {}, disconnect() {}, ...extra });
  const source = () => node({ start(t = 0) { if (t < ctx.currentTime - 1e-9) ctx.late++; ctx.started.push(t); }, stop() {} });
  Object.assign(ctx, {
    createGain: () => node({ gain: param(1) }),
    createOscillator: () => Object.assign(source(), { type: 'sine', frequency: param(440), detune: param(0) }),
    createBiquadFilter: () => node({ type: 'lowpass', frequency: param(350), Q: param(1) }),
    createBufferSource: () => Object.assign(source(), { buffer: null, playbackRate: param(1) }),
    createBuffer: (ch, n) => { const d = Array.from({ length: ch }, () => new Float32Array(n)); return { getChannelData: i => d[i] }; },
    createConvolver: () => node({ buffer: null }),
    createDynamicsCompressor: () => node({ threshold: param(-24), ratio: param(12), attack: param(0.003), release: param(0.25) }),
  });
  return ctx;
}

test('Skybridge score: A A B C, 32 bars at 116 BPM; every chord is known and the theme stays in D minor', () => {
  const S = SCORES.skybridge, ctx = fakeCtx(), score = new Score(ctx, S, { manual: true });
  assert.equal(score.bars.length, 32);
  assert.ok(Math.abs(score.bars.length * score.barLen - 66.2) < 0.1, 'about 66 s before it loops');
  const DMINOR = new Set([2, 4, 5, 7, 9, 10, 0, 1]); // D E F G A Bb C, and C# leading to D
  for (const B of score.bars) for (const [at, m, len] of B.melody || []) { assert.ok(DMINOR.has(m % 12), 'note ' + m); assert.ok(at >= 0 && at + len <= 4, 'inside its bar'); }
  assert.ok(score.bars.some(B => B.melody), 'the theme plays');
});

test('the scheduler books whole bars a little ahead of the audio clock, never in the past', () => {
  const ctx = fakeCtx(), score = new Score(ctx, SCORES.skybridge, { manual: true });
  score.start(); const first = ctx.started.length; assert.ok(first > 10, 'the first bar is booked at once');
  assert.equal(score.bar, 1, 'only what starts within the lookahead');
  for (let t = 0.5; t <= 70; t += 0.5) { ctx.currentTime = t; score.tick(); }
  assert.equal(score.bar, Math.floor((70 + score.lookahead - 0.1) / score.barLen) + 1, 'bar after bar, past the loop point');
  assert.equal(ctx.late, 0, 'nothing scheduled in the past');
  assert.ok(ctx.started.length / score.bar < 120, 'a light load per bar (' + Math.round(ctx.started.length / score.bar) + ' sources)');
  score.stop(); const n = ctx.started.length; ctx.currentTime = 80; score.tick(); assert.equal(ctx.started.length, n, 'stopped');
});

test('the mix follows the fight: drums and brass come up in battle', () => {
  const ctx = fakeCtx(), score = new Score(ctx, SCORES.skybridge, { manual: true, intensity: 0.3 });
  const calm = { drums: score.busLevel('drums'), brass: score.busLevel('brass') };
  for (let i = 0; i < 400; i++) score.setIntensity(1, 0.016);
  assert.ok(score.intensity > 0.95, 'eased up to battle');
  assert.ok(score.busLevel('drums') > calm.drums * 1.8 && score.busLevel('brass') > calm.brass * 1.8);
});

test('Arena, Free For All and missions stay silent without combat; procedural score cannot overlap the MP3', () => {
  for (const mode of ['tdm', 'ffa', 'mission']) {
    const g = makeMatch(mode);
    assert.equal(g.scoreDef, null, 'no background synth music in '+mode);
    g.startMapMusic();
    g.sfx.ctx = fakeCtx(); g.startMapMusic();
    assert.equal(g.score, undefined, 'no synth track at any time');
    g.stopMapMusic(); assert.equal(g.score, null);
  }
});
