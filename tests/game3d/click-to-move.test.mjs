// Click-to-move (docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md, build order 8): an option the player switches
// on in Settings (Esc); WASD stays the default. Runs the real move logic (axe/player/AXEClickToMove.js)
// through the per-frame contract GameWorld3D uses (WASD fills the vector first, else the click move
// steers it, the step is speed × delta, then noteStep), the real click ray and marker
// (AXEClickToMoveScene.js, three.js), and the Settings switch (PauseMenu.jsx) with its per-user store,
// in JSDOM. Only the Base44 service boundary is stubbed.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/game3d', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement', 'localStorage', 'CustomEvent']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const require = createRequire(import.meta.url);
require('framer-motion').MotionGlobalConfig.skipAnimations = true;
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const THREE = require('three');

// One bundle, so the Settings menu and the test share the one settings store.
const built = await build({
  stdin: {
    contents: [
      "export * from './src/components/game3d/axe/player/AXEClickToMove.js';",
      "export * from './src/components/game3d/axe/player/AXEClickToMoveScene.js';",
      "export * from './src/components/game3d/axe/player/AXEControlSettingsStore.js';",
      "export { AXE_PLAYER_TRAVERSAL_CONFIG } from './src/components/game3d/axe/player/AXEPlayerTraversalConfig.js';",
      "export { setStorageUser, userScopedKey } from './src/components/game3d/characterStorage.jsx';",
      "export { default as PauseMenu } from './src/components/game3d/PauseMenu.jsx';",
    ].join('\n'),
    resolveDir: process.cwd(),
    loader: 'jsx',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'framer-motion', 'three'],
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    // lucide-react's CJS build cannot be required here; bundle its ESM build (as social-routing.test.mjs does).
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-test', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents:
      'export const base44 = { auth: { logout: async () => {}, me: async () => ({}) } };' }));
  } }],
  logLevel: 'silent',
});
const filename = process.cwd() + '/tests/game3d/__click_to_move.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(built.outputFiles[0].text, filename);
const {
  AXE_CLICK_TO_MOVE_CONFIG: CONFIG, createAXEClickToMove, classifyAXEClick, directionRelativeToFacing,
  pickAXEClickToMoveGround, createAXEClickToMoveMarker,
  isAXEClickToMoveEnabled, setAXEClickToMoveEnabled, getAXEControlSettings, AXE_CONTROL_SETTINGS_KEY,
  AXE_PLAYER_TRAVERSAL_CONFIG, setStorageUser, userScopedKey, PauseMenu,
} = mod.exports;

after(() => dom.window.close());

const WALK = AXE_PLAYER_TRAVERSAL_CONFIG.movement.walkSpeed;
const DT = 1 / 60;
let user = 0;
const freshUser = () => setStorageUser(`click-move-qa-${++user}`);

// A click-to-move controller wired like GameWorld3D: the live option, a walkable test, a marker log.
function rig({ walkable = () => true } = {}) {
  const changes = [];
  const ctm = createAXEClickToMove({ isEnabled: isAXEClickToMoveEnabled, isWalkable: walkable, onChange: (t, reason) => changes.push({ t, reason }) });
  return { ctm, changes };
}

// One GameWorld3D frame. Returns the steer (null when the click move did not drive this frame).
function frame(ctm, hero, { keys = {}, speed = WALK, delta = DT, collide = null, locked = false } = {}) {
  const keyMoving = CONFIG.movementKeys.some((k) => keys[k]);
  const steer = ctm.steer({ position: hero, delta, keyMoving });
  if (!steer) return null;
  const from = { x: hero.x, z: hero.z };
  if (!locked) {
    hero.x += steer.x * speed * delta;
    hero.z += steer.z * speed * delta;
    collide?.(hero, from);
  }
  ctm.noteStep({ from, to: hero, expectedMeters: locked ? 0 : speed * delta });
  return steer;
}
function walk(ctm, hero, opts, maxFrames = 3000) {
  let frames = 0;
  while (ctm.isActive() && frames < maxFrames) { frame(ctm, hero, opts); frames += 1; }
  return frames;
}

test('option off (the default): a click sets nothing and the hero does not move', () => {
  freshUser();
  assert.equal(isAXEClickToMoveEnabled(), false, 'off for a player who never switched it on');
  const { ctm, changes } = rig();
  assert.equal(ctm.setTarget({ x: 5, y: 0, z: 0 }), false);
  const hero = { x: 0, z: 0 };
  assert.equal(frame(ctm, hero), null);
  assert.deepEqual(hero, { x: 0, z: 0 });
  assert.equal(ctm.isActive(), false);
  assert.deepEqual(changes, [], 'no marker');
  assert.equal(classifyAXEClick({ enabled: false, groundDistance: 10, walkable: true }), 'default', 'the click stays the attack');
});

test('a click on walkable ground sets the target and the hero heads for it', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm, changes } = rig();
  assert.equal(ctm.setTarget({ x: 5, y: 0.2, z: 0 }), true);
  assert.deepEqual(ctm.getTarget(), { x: 5, y: 0.2, z: 0 });
  assert.deepEqual(changes, [{ t: { x: 5, y: 0.2, z: 0 }, reason: 'set' }], 'the marker shows at the target');
  const hero = { x: 0, z: 0 };
  const steer = frame(ctm, hero);
  assert.ok(Math.abs(steer.x - 1) < 1e-9 && Math.abs(steer.z) < 1e-9, 'a unit vector toward the target');
  assert.ok(Math.abs(hero.x - WALK * DT) < 1e-9, 'one frame at walking speed, the same step WASD takes');
});

test('reaching the target stops the move and clears the marker', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm, changes } = rig();
  ctm.setTarget({ x: 3, y: 0, z: 4 }); // 5 m away
  const hero = { x: 0, z: 0 };
  const frames = walk(ctm, hero);
  assert.equal(ctm.getLastStopReason(), 'arrived');
  assert.ok(Math.hypot(3 - hero.x, 4 - hero.z) <= CONFIG.arriveRadiusMeters + 1e-9);
  assert.ok(Math.abs(frames - (5 - CONFIG.arriveRadiusMeters) / (WALK * DT)) <= 2, `about ${frames} frames at walk speed`);
  assert.deepEqual(changes.at(-1), { t: null, reason: 'arrived' });
  assert.equal(frame(ctm, hero), null, 'nothing steers after arrival');
});

test('a big frame (low fps) that steps past the target counts as arrived, it does not turn back', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm } = rig();
  ctm.setTarget({ x: 1, y: 0, z: 0 });
  const hero = { x: 0, z: 0 };
  frame(ctm, hero, { speed: 12, delta: 0.1 }); // a 1.2 m step past a 1 m target
  assert.equal(ctm.getLastStopReason(), 'arrived');
});

test('any WASD key cancels the move; Shift, Ctrl, Space and skill keys do not', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm, changes } = rig();
  for (const key of ['w', 'A', 's', 'd']) {
    ctm.setTarget({ x: 8, y: 0, z: 0 });
    for (const other of ['shift', 'control', ' ', '1', 'e', 'q']) assert.equal(ctm.noteKey(other), false, `${other} keeps the move`);
    assert.equal(ctm.isActive(), true);
    assert.equal(ctm.noteKey(key), true, `${key} cancels`);
    assert.equal(ctm.isActive(), false);
    assert.equal(ctm.getLastStopReason(), 'wasd');
  }
  assert.deepEqual(changes.at(-1), { t: null, reason: 'wasd' }, 'the marker goes');
  // A key already held when the frame runs (WASD filled the vector) also cancels it.
  ctm.setTarget({ x: 8, y: 0, z: 0 });
  assert.equal(frame(ctm, { x: 0, z: 0 }, { keys: { w: true } }), null);
  assert.equal(ctm.getLastStopReason(), 'wasd');
});

test('Shift and Ctrl change only the speed: the run takes fewer frames on the same line', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm } = rig();
  ctm.setTarget({ x: 10, y: 0, z: 0 });
  const walkFrames = walk(ctm, { x: 0, z: 0 });
  ctm.setTarget({ x: 10, y: 0, z: 0 });
  const runFrames = walk(ctm, { x: 0, z: 0 }, { speed: AXE_PLAYER_TRAVERSAL_CONFIG.movement.runSpeed });
  assert.ok(runFrames < walkFrames);
});

test('unwalkable ground: a click on it sets nothing, and a move stops at its edge', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  // Walkable except a ditch between x = 2 and x = 3.
  const { ctm } = rig({ walkable: (x) => x < 2 || x > 3 });
  assert.equal(ctm.setTarget({ x: 2.5, y: 0, z: 0 }), false, 'a click in the ditch');
  assert.equal(ctm.isActive(), false);
  assert.equal(ctm.setTarget({ x: 6, y: 0, z: 0 }), true, 'a click across it');
  const hero = { x: 0, z: 0 };
  walk(ctm, hero);
  assert.equal(ctm.getLastStopReason(), 'unwalkable');
  assert.ok(hero.x < 2 && hero.x > 2 - CONFIG.lookAheadMeters - WALK * DT, `stopped at the edge (x = ${hero.x.toFixed(2)})`);
});

test('a blocked step (no headway, e.g. a body in the way) stops the move; no pathfinding', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm } = rig();
  ctm.setTarget({ x: 10, y: 0, z: 0 });
  const hero = { x: 0, z: 0 };
  const wall = (h, from) => { if (h.x > 1) { h.x = from.x; } };
  const frames = walk(ctm, hero, { collide: wall });
  assert.equal(ctm.getLastStopReason(), 'blocked');
  assert.ok(hero.x <= 1 + 1e-9);
  assert.ok(frames < 1 / (WALK * DT) + CONFIG.blockedStepsToStop + 2, 'it gives up a few frames after the wall');
});

test('a locked step (an attack or dodge in progress) pauses the move; the timeout ends it', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm } = rig();
  ctm.setTarget({ x: 10, y: 0, z: 0 });
  const hero = { x: 0, z: 0 };
  for (let i = 0; i < 30; i += 1) frame(ctm, hero, { locked: true });
  assert.equal(ctm.isActive(), true, 'half a second locked is not a block');
  for (let s = 0; s < CONFIG.timeoutSeconds; s += 1) frame(ctm, hero, { locked: true, delta: 1 });
  assert.equal(ctm.isActive(), false);
  assert.equal(ctm.getLastStopReason(), 'timeout');
});

test('switching the option off mid-move stops it', () => {
  freshUser();
  setAXEClickToMoveEnabled(true);
  const { ctm } = rig();
  ctm.setTarget({ x: 10, y: 0, z: 0 });
  frame(ctm, { x: 0, z: 0 });
  setAXEClickToMoveEnabled(false);
  assert.equal(frame(ctm, { x: 0, z: 0 }), null);
  assert.equal(ctm.getLastStopReason(), 'disabled');
});

test('the click decides: walkable ground moves; an enemy, NPC or player in front, the sky or unwalkable ground stays the click attack', () => {
  assert.equal(classifyAXEClick({ enabled: true, groundDistance: 12, walkable: true }), 'move');
  assert.equal(classifyAXEClick({ enabled: true, entityDistance: 9, groundDistance: 12, walkable: true }), 'default', 'an enemy in front');
  assert.equal(classifyAXEClick({ enabled: true, entityDistance: 20, groundDistance: 12, walkable: true }), 'move', 'an enemy behind the clicked ground');
  assert.equal(classifyAXEClick({ enabled: true, entityDistance: null, groundDistance: null }), 'default', 'the sky');
  assert.equal(classifyAXEClick({ enabled: true, groundDistance: 12, walkable: false }), 'default', 'outside the arena');
});

test('locked on, the walk animation follows the move relative to the facing (strafe)', () => {
  const facing = { x: 0, z: 1 }; // right is (-facing.z, facing.x) = (-1, 0), as in characterDodgeVector.js
  assert.equal(directionRelativeToFacing({ x: 0, z: 1 }, facing), 'forward');
  assert.equal(directionRelativeToFacing({ x: 0, z: -1 }, facing), 'backward');
  assert.equal(directionRelativeToFacing({ x: -1, z: 0 }, facing), 'right');
  assert.equal(directionRelativeToFacing({ x: 1, z: 0.2 }, facing), 'left');
});

test('the click ray (three.js): ground gives a point, an enemy in front wins, a hidden one is ignored; the marker shows and goes', () => {
  const scene = new THREE.Scene();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial());
  ground.rotation.x = -Math.PI / 2;
  const enemy = new THREE.Group();
  enemy.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 1), new THREE.MeshBasicMaterial()));
  enemy.position.set(0, 0.9, 0);
  scene.add(ground, enemy);
  scene.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(55, 800 / 600, 0.1, 1000);
  camera.position.set(0, 8, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const element = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) };
  const pick = (clientX, clientY) => pickAXEClickToMoveGround({ event: { clientX, clientY }, element, camera, groundMeshes: [ground], entityRoots: [enemy, null] });

  const onEnemy = pick(400, 300);
  assert.ok(onEnemy.entityDistance < onEnemy.groundDistance);
  assert.equal(classifyAXEClick({ enabled: true, ...onEnemy, walkable: true }), 'default');

  const onGround = pick(700, 420);
  assert.equal(onGround.entityDistance, null);
  assert.ok(Math.abs(onGround.point.y) < 1e-6, 'a point on the ground plane');
  assert.ok(onGround.point.x > 1, 'to the right of the enemy');
  assert.equal(classifyAXEClick({ enabled: true, ...onGround, walkable: true }), 'move');

  enemy.visible = false;
  assert.equal(pick(400, 300).entityDistance, null, 'a hidden entity does not catch the click');

  const marker = createAXEClickToMoveMarker(scene);
  const node = scene.getObjectByName('AXE_ClickToMoveMarker');
  assert.equal(node.visible, false);
  marker.show(onGround.point, 0);
  assert.equal(node.visible, true);
  assert.ok(Math.abs(node.position.x - onGround.point.x) < 1e-9 && node.position.y > 0);
  marker.update(0.1);
  marker.hide();
  assert.equal(node.visible, false);
  marker.dispose();
  assert.equal(scene.getObjectByName('AXE_ClickToMoveMarker'), undefined);
});

test('the Settings switch turns the option on and off, saved per user', async () => {
  freshUser();
  const firstUser = `click-move-qa-${user}`;
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(PauseMenu, { open: true, onClose: () => {}, volume: 0.5, onVolumeChange: () => {} })));
  const toggle = () => document.querySelector('button[role="switch"][aria-label="Click to move"]');
  assert.ok(toggle(), 'the switch is in the Settings menu');
  assert.equal(toggle().getAttribute('aria-checked'), 'false');

  await act(async () => toggle().dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
  assert.equal(toggle().getAttribute('aria-checked'), 'true');
  assert.equal(isAXEClickToMoveEnabled(), true);
  assert.deepEqual(JSON.parse(localStorage.getItem(userScopedKey(AXE_CONTROL_SETTINGS_KEY))), { v: 1, clickToMove: true });

  await act(async () => freshUser());
  assert.equal(isAXEClickToMoveEnabled(), false, 'another player on this browser keeps the default');
  assert.equal(toggle().getAttribute('aria-checked'), 'false');

  await act(async () => setStorageUser(firstUser));
  assert.deepEqual(getAXEControlSettings(), { clickToMove: true }, 'the first player gets their choice back');
  assert.equal(toggle().getAttribute('aria-checked'), 'true');

  await act(async () => toggle().dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
  assert.equal(isAXEClickToMoveEnabled(), false);
  await act(async () => root.unmount());
});
