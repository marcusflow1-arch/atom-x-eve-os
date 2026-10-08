import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('legacy Game 2 iframe sandbox has been replaced by the working Game 3D player stack', () => {
  const page = read('src/pages/Game2.jsx');
  assert.match(page, /Game2ThreeViewer/);
  assert.doesNotMatch(page, /JediOutcastRuntime/);
  assert.doesNotMatch(page, /mode="game2"/);
});
