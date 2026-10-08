import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Game 2 is routed beside Jedi Outcast and uses the canonical engine sandbox', () => {
  const layout = read('src/Layout.jsx');
  const pages = read('src/pages.config.js');
  const page = read('src/pages/Game2.jsx');
  const runtime = read('src/components/jedioutcast/JediOutcastRuntime.jsx');
  const launcher = read('public/games/jedi-outcast/atom-launcher.mjs');
  const camera = read('public/games/jedi-outcast/game2-camera.js');

  const jedi = layout.indexOf("createPageUrl('JediOutcast')");
  const game2 = layout.indexOf("createPageUrl('Game2')");
  assert.ok(jedi >= 0);
  assert.ok(game2 > jedi);
  assert.match(layout, />\s*Game 2\s*</);
  assert.match(pages, /import Game2 from '\.\/pages\/Game2'/);
  assert.match(pages, /"Game2": Game2/);
  assert.match(page, /mode="game2"/);
  assert.match(runtime, /mode === 'game2'/);
  assert.match(runtime, /game2-kyle-v1&mode=game2/);
  assert.match(launcher, /'\+devmap', 'pit'/);
  assert.match(launcher, /'\+setForceAll', '3'/);
  assert.match(launcher, /'\+weapon', '1'/);
  assert.match(camera, /range:\s*80/);
  assert.match(camera, /maxRange:\s*150/);
  assert.match(camera, /horizontalOffset:\s*0/);
  assert.doesNotMatch(camera, /horizontalOffset:\s*-22/);
});

test('Game 2 UI names Kyle rather than hallucinating Cal Kestis', () => {
  const page = read('src/pages/Game2.jsx');
  const runtime = read('src/components/jedioutcast/JediOutcastRuntime.jsx');
  assert.doesNotMatch(page + runtime, /Cal Kestis/i);
  assert.match(runtime, /Kyle Combat Sandbox/);
  assert.match(runtime, /original Jedi Outcast engine and retail PK3 data/);
});
