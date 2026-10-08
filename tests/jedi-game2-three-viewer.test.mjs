import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Game 2 swaps the Admin Y Bot into a Raven-source player controller', () => {
  const viewer = read('src/components/jedioutcast/game2/Game2ThreeViewer.jsx');
  const controller = read('src/components/jedioutcast/game2/JediOutcastYBotController.js');
  const resolver = read('src/components/jedioutcast/game2/YBotModelResolver.js');
  const constants = read('src/components/jedioutcast/game2/jediSourceConstants.js');

  assert.match(resolver, /base44\.entities\.Model3D/);
  assert.match(resolver, /Y Bot \(1\)\.fbx/);
  assert.match(viewer, /resolveYBotModelAsset\(\)/);
  assert.match(viewer, /loader\.loadAsync\(yBotAsset\.file_url\)/);
  assert.match(viewer, /JediOutcastYBotController/);
  assert.match(controller, /sourceMovementPath = 'code\/game\/bg_pmove\.cpp'/);
  assert.doesNotMatch(viewer, /YBOT_MODEL_URL/);
  assert.doesNotMatch(viewer + constants, /qtrypzzcjebvfcihiynt\.supabase\.co/);
  assert.doesNotMatch(viewer, /PlayerMovementSystem/);
  assert.doesNotMatch(viewer, /PlayerRotationSystem/);
  assert.doesNotMatch(viewer, /useGameAvatar/);
  assert.doesNotMatch(viewer, /loadAvatarModel/);
});

test('Game 2 leaves the known-good Game 3D camera system as camera authority', () => {
  const viewer = read('src/components/jedioutcast/game2/Game2ThreeViewer.jsx');
  assert.match(viewer, /PlayerCameraSystem/);
  assert.match(viewer, /PerspectiveCamera\(55/);
  assert.match(viewer, /camera\.position\.set\(0, 3, -5\)/);
  assert.match(viewer, /yaw: 0, pitch: 0\.4, distance: 4\.5/);
  assert.match(viewer, /playerCameraSystem\.update\(delta, cameraIntent\)/);
  assert.match(viewer, /orbit\.current\.yaw -= dx \* 0\.005/);
});

test('Raven pmove constants and command scaling are represented explicitly', () => {
  const constants = read('src/components/jedioutcast/game2/jediSourceConstants.js');
  assert.match(constants, /speedUnits:\s*250/);
  assert.match(constants, /stopSpeed:\s*100\s*\/\s*JEDI_SOURCE_UNITS_PER_METER/);
  assert.match(constants, /acceleration:\s*12/);
  assert.match(constants, /airAcceleration:\s*4/);
  assert.match(constants, /friction:\s*6/);
  assert.match(constants, /gravity:\s*800\s*\/\s*JEDI_SOURCE_UNITS_PER_METER/);
  assert.match(constants, /jumpVelocity:\s*225\s*\/\s*JEDI_SOURCE_UNITS_PER_METER/);
  assert.match(constants, /walkCommand:\s*64/);
  assert.match(constants, /runCommand:\s*127/);
  assert.match(constants, /forceJumpStrength/);
  assert.match(constants, /forceJumpHeight/);
});

test('Force selector matches Raven gameplay showPowers order and seven-slot HUD behavior', () => {
  const constants = read('src/components/jedioutcast/game2/jediSourceConstants.js');
  const selector = read('src/components/jedioutcast/game2/JediForceSelector.jsx');
  const controller = read('src/components/jedioutcast/game2/JediOutcastYBotController.js');

  const ordered = ['FP_HEAL', 'FP_SPEED', 'FP_PUSH', 'FP_PULL', 'FP_TELEPATHY', 'FP_GRIP', 'FP_LIGHTNING'];
  let cursor = -1;
  for (const token of ordered) {
    const next = constants.indexOf(token, cursor + 1);
    assert.ok(next > cursor, token + ' is in Raven showPowers order');
    cursor = next;
  }
  assert.match(selector, /\[-3, -2, -1, 0, 1, 2, 3\]/);
  assert.match(selector, /h-\[60px\] w-\[60px\]/);
  assert.match(selector, /h-\[30px\] w-\[30px\]/);
  assert.match(controller, /F1: 'push'/);
  assert.match(controller, /F7: 'lightning'/);
  assert.match(controller, /event\.code === 'Space'/);
});

test('original retail saber is loaded privately and parsed instead of committed as a proxy', () => {
  const constants = read('src/components/jedioutcast/game2/jediSourceConstants.js');
  const bridge = read('src/components/jedioutcast/game2/JediRetailAssetBridge.js');
  const md3 = read('src/components/jedioutcast/game2/StaticMd3Loader.js');
  const controller = read('src/components/jedioutcast/game2/JediOutcastYBotController.js');

  assert.match(constants, /models\/weapons2\/saber\/saber_w\.md3/);
  assert.match(constants, /sound\/weapons\/saber\/saberhum1\.wav/);
  assert.match(bridge, /action: 'importPath'/);
  assert.match(md3, /IDP3/);
  assert.match(md3, /version 15/);
  assert.match(controller, /fetchCanonicalJediAsset\(RAVEN_SABER_ASSETS\.model/);
  assert.doesNotMatch(controller, /IcosahedronGeometry|BoxGeometry/);
});

test('Y Bot animation adapter uses stored admin clips and source-driven enemy AI', () => {
  const animation = read('src/components/jedioutcast/game2/YBotJediAnimationAdapter.js');
  const ai = read('src/components/jedioutcast/game2/JediEnemyAI.js');
  assert.match(animation, /base44\.entities\.AnimationFBX\.list/);
  assert.match(animation, /standing walk forward/);
  assert.match(animation, /standing run back/);
  assert.match(animation, /standing block/);
  assert.match(animation, /standing melee punch/);
  assert.match(animation, /retargetAvatarClip/);
  assert.match(ai, /code\/game\/AI_Jedi\.cpp/);
  assert.match(ai, /aggression/);
  assert.match(ai, /patrol/);
  assert.match(ai, /chase/);
  assert.match(ai, /onForcePush/);
});
