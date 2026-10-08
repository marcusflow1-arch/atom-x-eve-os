import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layout = readFileSync(new URL('../src/Layout.jsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../src/components/jedioutcast/JediOutcastRuntime.jsx', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('../public/games/jedi-outcast/atom-launcher.mjs', import.meta.url), 'utf8');

test('Jedi character test button is directly after the Jedi Outcast button', () => {
  const outcast = layout.indexOf("createPageUrl('JediOutcast')");
  const lab = layout.indexOf("createPageUrl('JediCharacterLab')");
  assert.ok(outcast >= 0, 'Jedi Outcast button missing');
  assert.ok(lab > outcast, 'Jedi character lab must be to the right of Jedi Outcast');
});

test('Jedi character lab is a full-screen isolated route with return-only runtime UI', () => {
  assert.match(app, /currentPageName === 'JediCharacterLab'/);
  assert.match(runtime, /minimalUi/);
  assert.match(runtime, /Return to Dashboard/);
  assert.match(runtime, /lab=character/);
});

test('character lab boots Raven gameplay systems with all player gear and force powers', () => {
  assert.match(launcher, /params\.get\('lab'\) === 'character'/);
  assert.match(launcher, /'\+devmap', 'kejim_post'/);
  assert.match(launcher, /'\+give', 'all'/);
  assert.match(launcher, /'\+setForceAll', '3'/);
  assert.match(launcher, /'\+weapon', '1'/);
});
