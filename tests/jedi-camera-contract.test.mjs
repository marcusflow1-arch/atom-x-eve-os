import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contract = readFileSync(new URL('../src/components/jedioutcast/cameraContract.js', import.meta.url), 'utf8');
const playable = readFileSync(new URL('../src/components/jedioutcast/JediOutcastPlayableRuntime.jsx', import.meta.url), 'utf8');
const reconstruction = readFileSync(new URL('../src/components/jedioutcast/ReconstructionRuntime.jsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../src/components/jedioutcast/JediOutcastRuntime.jsx', import.meta.url), 'utf8');
const index = readFileSync(new URL('../public/games/jedi-outcast/index.html', import.meta.url), 'utf8');

test('editable Jedi viewers share the 1024x768 camera contract', () => {
  assert.match(contract, /renderWidth:\s*1024/);
  assert.match(contract, /renderHeight:\s*768/);
  assert.match(contract, /aspect:\s*1024\s*\/\s*768/);
  assert.match(contract, /fov:\s*80/);
  assert.match(playable, /JEDI_CAMERA_CONTRACT/);
  assert.match(reconstruction, /JEDI_CAMERA_CONTRACT/);
  assert.match(playable, /jediViewportStyle/);
  assert.match(reconstruction, /jediViewportStyle/);
});

test('playable reconstruction uses one follow camera instead of an eye camera plus viewer camera', () => {
  assert.equal((playable.match(/<Canvas\b/g) || []).length, 1);
  assert.doesNotMatch(playable, /OrbitControls/);
  assert.doesNotMatch(playable, /camera\.position\.set\(pos\.x,\s*pos\.y\s*\+\s*VIEW_HEIGHT/);
  assert.match(playable, /camera\.position\.lerp\(desiredCamera/);
  assert.match(playable, /camera\.lookAt\(cameraTarget\)/);
});

test('native Jedi runtime uses the new camera cache generation', () => {
  assert.match(runtime, /native-camera-v11/);
  assert.match(index, /native-camera-v11/);
  assert.doesNotMatch(runtime, /native-camera-v10/);
  assert.doesNotMatch(index, /native-camera-v10/);
});
