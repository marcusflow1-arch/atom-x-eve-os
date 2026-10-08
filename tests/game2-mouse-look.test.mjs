import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/components/game2/engine/input.js';
import { readFileSync } from 'node:fs';

function move(target, x, y) {
  const event = new Event('mousemove');
  Object.defineProperties(event, { movementX: { value: x }, movementY: { value: y } });
  target.dispatchEvent(event);
}
test('Game 2 mouse camera accepts canvas movement when an iframe rejects pointer lock', () => {
  const wasWindow = globalThis.window, wasDocument = globalThis.document;
  const window = new EventTarget(), document = new EventTarget(), canvas = new EventTarget();
  document.pointerLockElement = null;
  canvas.requestPointerLock = () => Promise.reject(new Error('blocked'));
  document.exitPointerLock = () => {};
  globalThis.window = window; globalThis.document = document;
  let input;
  try {
    input = new Input(canvas);
    move(canvas, 24, -12);
    assert.equal(input.locked, false);
    assert.equal(input.dx, 24);
    assert.equal(input.dy, -12);
    input.endFrame();
    assert.equal(input.dx, 0);
    assert.equal(input.dy, 0);
    document.pointerLockElement = canvas;
    document.dispatchEvent(new Event('pointerlockchange'));
    move(window, -18, 7);
    move(canvas, -18, 7);
    assert.equal(input.dx, -18); // browser bubbling must not duplicate locked deltas
    assert.equal(input.dy, 7);
    document.pointerLockElement = null;
    document.dispatchEvent(new Event('pointerlockchange'));
    assert.equal(input.locked, false);
  } finally {
    input?.dispose();
    globalThis.window = wasWindow; globalThis.document = wasDocument;
  }
});
test('Game 2 applies captured mouse deltas even without pointer lock', () => {
  const game = readFileSync(new URL('../src/components/game2/engine/game.js', import.meta.url), 'utf8');
  assert.match(game, /if \(i\.dx \|\| i\.dy\) \{ c\.yaw -= i\.dx \* i\.sens; c\.pitch \+= i\.dy \* i\.sens;/);
});
