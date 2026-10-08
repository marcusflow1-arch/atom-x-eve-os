import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Force, FORCE_QUICK_SLOTS, FORCE_QUICK_BINDINGS, FORCE_HOTKEY_LABELS, SELECT_ORDER,
} from '../src/components/game2/engine/force.js';
import { Game } from '../src/components/game2/engine/game.js';

function harness() {
  const casts = [], releases = [], ticks = [];
  const game = { t: 0, hud: { msg: () => {} } };
  const player = { status: 'normal', jumpLevel: 1 };
  const force = new Force(game, player);
  force.activate = (id, via) => {
    casts.push([id, via]);
    force.gcd = 0.25;
    if (['grip', 'lightning', 'heal', 'drain'].includes(id)) {
      force.holding = id; force.holdVia = via;
    }
    return true;
  };
  force.tickHold = (id, dt) => ticks.push([id, dt]);
  force.regenBolts = () => {}; // isolate input routing from WebGL/actor-only VFX
  force.release = () => { releases.push(force.holding); force.holding = null; };
  const input = (press = '', held = press) => ({
    pressed: code => code === press,
    held: code => code === held,
  });
  return { game, player, force, casts, releases, ticks, input };
}

test('1 through 0 directly activate ten distinct Force powers; numpad mirrors them', () => {
  assert.deepEqual(FORCE_QUICK_SLOTS.map(([digit]) => digit), [...'1234567890']);
  assert.equal(new Set(FORCE_QUICK_SLOTS.map(([, id]) => id)).size, 10);
  for (const [digit, id] of FORCE_QUICK_SLOTS) {
    assert.equal(FORCE_HOTKEY_LABELS[id], digit);
    for (const key of ['Digit' + digit, 'Numpad' + digit]) {
      assert.ok(FORCE_QUICK_BINDINGS.some(binding => binding.id === id && binding.code === key));
      const h = harness();
      h.force.update(1 / 60, h.input(key, key));
      assert.deepEqual(h.casts, [[id, key]]);
    }
  }
});

test('scroll selection remains independent of number-key hotkey assignments', () => {
  const h = harness();
  assert.equal(h.force.selId(), 'push');
  h.force.select(1);
  assert.equal(h.force.selId(), 'pull');
  h.force.select(11);
  assert.equal(h.force.selId(), 'push');
  h.force.selectId('see');
  assert.equal(h.force.selId(), 'see');
  assert.ok(SELECT_ORDER.includes('drain') && SELECT_ORDER.includes('see'));
  h.force.update(1 / 60, h.input('KeyF'));
  assert.deepEqual(h.casts, [['see', 'KeyF']]);
});

test('F selects only the highlighted ability, not the old dedicated Force Push binding', () => {
  const h = harness();
  h.force.selectId('lightning');
  h.force.update(1 / 60, h.input('KeyF'));
  assert.deepEqual(h.casts, [['lightning', 'KeyF']]);
  const old = harness();
  old.force.update(1 / 60, old.input('KeyZ'));
  assert.deepEqual(old.casts, []);
});

test('channelled powers remain active only while their activation key is held', () => {
  for (const [id, key] of [['grip', 'Digit3'], ['lightning', 'Digit4'], ['heal', 'Digit5'], ['drain', 'KeyF']]) {
    const h = harness();
    if (key === 'KeyF') h.force.selectId(id);
    h.force.update(1 / 60, h.input(key, key));
    assert.deepEqual(h.casts, [[id, key]]);
    assert.equal(h.force.holding, id);
    assert.equal(h.force.holdVia, key);
    h.force.update(1 / 60, h.input('', key));
    assert.equal(h.force.holding, id);
    assert.ok(h.ticks.length);
    h.force.update(1 / 60, h.input('', ''));
    assert.equal(h.force.holding, null);
    assert.deepEqual(h.releases, [id]);
  }
});

test('Tab cycles stance and F1 opens controls without stealing number shortcuts', () => {
  const messages = [], pressed = new Set(['Tab']);
  const player = {
    status: 'normal', saber: { level: 2, holstered: false },
    setStyle(level) { this.saber.level = level; },
    toggleSaber() {},
    throwSaber() { return false; },
  };
  const mock = {
    input: {
      pressed: code => pressed.has(code), pressedSet: pressed,
      held: () => false, btnPressed: [false, false, false], wheel: 0, zoom: 0, dx: 0, dy: 0,
    },
    player,
    cam: { yaw: 0, pitch: 0, dist: 3 },
    hud: { help: false, debug: false, msg: message => messages.push(message) },
    sfx: { muted: false },
    force: { select() { throw new Error('should not scroll'); } },
    round: { state: 'fight' },
    duel: true,
    started: true,
  };
  Game.prototype.frameInput.call(mock, 1 / 60);
  assert.equal(player.saber.level, 3);
  Game.prototype.frameInput.call(mock, 1 / 60);
  assert.equal(player.saber.level, 1);
  assert.deepEqual(messages, ['Saber style: STRONG', 'Saber style: FAST']);
  pressed.clear();
  pressed.add('F1');
  Game.prototype.frameInput.call(mock, 1 / 60);
  assert.equal(mock.hud.help, true);
});

test('wheel changes the highlighted Force power without casting it', () => {
  const pressed = new Set();
  const selected = [];
  const mock = {
    input: {
      pressed: c => pressed.has(c), pressedSet: pressed, held: () => false,
      btnPressed: [false, false, false], wheel: 1, zoom: 0, dx: 0, dy: 0,
    },
    player: { status: 'normal', saber: { level: 2, holstered: false } },
    cam: { yaw: 0, pitch: 0, dist: 3 },
    hud: { help: false, debug: false, msg() {} },
    sfx: { muted: false },
    force: { select: direction => selected.push(direction) },
    duel: true, round: { state: 'fight' }, started: true,
  };
  Game.prototype.frameInput.call(mock, 1 / 60);
  assert.deepEqual(selected, [1]);
});
