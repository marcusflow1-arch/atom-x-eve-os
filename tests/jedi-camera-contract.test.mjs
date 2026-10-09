import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contract = readFileSync(new URL('../src/components/jedioutcast/cameraContract.js', import.meta.url), 'utf8');
const cameraSystem = readFileSync(new URL('../src/components/jedioutcast/camera/JediCameraSystem.js', import.meta.url), 'utf8');
const playable = readFileSync(new URL('../src/components/jedioutcast/JediOutcastPlayableRuntime.jsx', import.meta.url), 'utf8');
const reconstruction = readFileSync(new URL('../src/components/jedioutcast/ReconstructionRuntime.jsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../src/components/jedioutcast/JediOutcastRuntime.jsx', import.meta.url), 'utf8');
const index = readFileSync(new URL('../public/games/jedi-outcast/index.html', import.meta.url), 'utf8');

test('editable Jedi viewers share the 1024x768 Raven-grounded camera contract', () => {
  assert.match(contract, /renderWidth:\s*1024/);
  assert.match(contract, /renderHeight:\s*768/);
  assert.match(contract, /aspect:\s*1024\s*\/\s*768/);
  assert.match(contract, /fov:\s*80/);
  assert.match(contract, /cinematicFov:\s*90/);
  assert.match(contract, /ravenDefaultDistance:\s*80/);
  assert.match(contract, /distance:\s*100/);
  assert.match(contract, /maxDistance:\s*150/);
  assert.match(contract, /verticalOffset:\s*16/);
  assert.match(playable, /JEDI_CAMERA_CONTRACT/);
  assert.match(reconstruction, /JEDI_CAMERA_CONTRACT/);
  assert.match(playable, /jediViewportStyle/);
  assert.match(reconstruction, /jediViewportStyle/);
});

test('playable reconstruction delegates follow-camera behavior to JediCameraSystem', () => {
  assert.equal((playable.match(/<Canvas\b/g) || []).length, 1);
  assert.doesNotMatch(playable, /OrbitControls/);
  assert.match(playable, /new JediCameraSystem\(\{ camera, collisionGeometry: geometry \}\)/);
  assert.match(playable, /cameraSystem\.snapGameplay/);
  assert.match(playable, /cameraSystem\.updateGameplay/);
  assert.doesNotMatch(playable, /camera\.position\.lerp\(desiredCamera/);
});

test('camera module preserves Raven camera state-machine concepts', () => {
  for (const name of ['MOVING', 'PANNING', 'ZOOMING', 'FOLLOWING', 'TRACKING', 'ROFFING', 'SMOOTHING']) {
    assert.match(cameraSystem, new RegExp(name));
  }
  for (const method of ['move(', 'pan(', 'zoom(', 'follow(', 'track(', 'distance(', 'shake(', 'smooth(', 'startRoff(']) {
    assert.ok(cameraSystem.includes(method), method);
  }
});

test('native Jedi runtime uses the current viewport/camera cache generation', () => {
  assert.match(runtime, /viewport-v12/);
  assert.match(index, /viewport-v12/);
  assert.doesNotMatch(runtime, /native-camera-v11/);
  assert.doesNotMatch(index, /native-camera-v11/);
});
