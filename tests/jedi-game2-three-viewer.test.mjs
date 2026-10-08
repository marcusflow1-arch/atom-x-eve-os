import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Game 2 uses the working Game 3D camera/player stack instead of the Jedi iframe', () => {
  const page = read('src/pages/Game2.jsx');
  const viewer = read('src/components/jedioutcast/game2/Game2ThreeViewer.jsx');

  assert.match(page, /Game2ThreeViewer/);
  assert.doesNotMatch(page, /JediOutcastRuntime/);
  assert.match(viewer, /PlayerCameraSystem/);
  assert.match(viewer, /PlayerMovementSystem/);
  assert.match(viewer, /PlayerRotationSystem/);
  assert.match(viewer, /new PlayerCameraSystem/);
  assert.match(viewer, /new PlayerMovementSystem/);
  assert.match(viewer, /new PlayerRotationSystem/);
  assert.doesNotMatch(viewer, /<iframe/);
});

test('Game 2 preserves the working GameWorld3D camera initialization and orbit controls', () => {
  const viewer = read('src/components/jedioutcast/game2/Game2ThreeViewer.jsx');
  assert.match(viewer, /PerspectiveCamera\(\s*55/);
  assert.match(viewer, /camera\.position\.set\(0, 3, -5\)/);
  assert.match(viewer, /yaw:\s*0,\s*pitch:\s*0\.4,\s*distance:\s*4\.5/);
  assert.match(viewer, /orbit\.current\.yaw -= dx \* 0\.005/);
  assert.match(viewer, /Math\.max\(2, Math\.min\(12/);
  assert.match(viewer, /playerCameraSystem\.update\(delta, intent\)/);
});

test('Game 2 exposes the complete Jedi Outcast single-player Force enum on the active avatar', () => {
  const controller = read('src/components/jedioutcast/game2/Game2JediController.js');
  for (const token of [
    'FP_HEAL',
    'FP_LEVITATION',
    'FP_SPEED',
    'FP_PUSH',
    'FP_PULL',
    'FP_TELEPATHY',
    'FP_GRIP',
    'FP_LIGHTNING',
    'FP_SABERTHROW',
    'FP_SABER_DEFENSE',
    'FP_SABER_OFFENSE',
  ]) {
    assert.match(controller, new RegExp(token));
  }
  assert.match(controller, /F1:\s*'push'/);
  assert.match(controller, /F2:\s*'pull'/);
  assert.match(controller, /F3:\s*'speed'/);
  assert.match(controller, /F4:\s*'telepathy'/);
  assert.match(controller, /F5:\s*'heal'/);
  assert.match(controller, /F6:\s*'grip'/);
  assert.match(controller, /F7:\s*'lightning'/);
});

test('Game 2 gives the active model saber combat, Force Jump, Force UI and animation hooks', () => {
  const viewer = read('src/components/jedioutcast/game2/Game2ThreeViewer.jsx');
  const controller = read('src/components/jedioutcast/game2/Game2JediController.js');

  assert.match(viewer, /loadAvatarModel\(avatarConfig, 1\.7\)/);
  assert.match(viewer, /loadPlayerAnimationClips/);
  assert.match(viewer, /createPlayerAnimationController/);
  assert.match(viewer, /event\.code === 'Space'/);
  assert.match(viewer, /jediController\?\.forceJump/);
  assert.match(viewer, /GAME2_FORCE_POWERS\.map/);
  assert.match(controller, /makeSaberVisual/);
  assert.match(controller, /attack\(\)/);
  assert.match(controller, /forceJump\(\)/);
  assert.match(controller, /saberThrow/);
  assert.match(controller, /lightning/);
});
