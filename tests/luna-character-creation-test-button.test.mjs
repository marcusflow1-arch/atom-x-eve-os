import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('dashboard Test button sits immediately after Game 3 and opens character creator', () => {
  const layout = read('../src/Layout.jsx');
  const start = layout.indexOf('Original street-racing Game 3');
  const end = layout.indexOf("navigate(createPageUrl('Game2'))", start);
  assert.ok(start >= 0 && end > start, 'Game 3 and Game 2 header buttons are found');
  const buttons = layout.slice(start, end);
  assert.match(buttons, /navigate\(createPageUrl\('Game3'\)\)/);
  assert.match(buttons, /aria-label="Test character creation"/);
  assert.match(buttons, /navigate\('\/CharacterCreationTest'\)/);
  assert.ok(buttons.indexOf("navigate(createPageUrl('Game3'))") < buttons.indexOf("navigate('/CharacterCreationTest')"), 'Test follows Game 3');
  assert.match(buttons, />\s*Test\s*<\/button>/);
});

test('Test route reuses same GenesisWizard after authentication', () => {
  const app = read('../src/App.jsx');
  const gate = read('../src/components/onboarding/AvatarGenesisGate.jsx');
  const wizard = read('../src/components/onboarding/GenesisWizard.jsx');
  assert.match(app, /<AvatarGenesisGate user=\{user\}>/);
  assert.match(app, /path="\/CharacterCreationTest" element=\{<GenesisWizard user=\{user\} testMode \/>}/);
  assert.match(gate, /status: ready \? 'ready' : 'setup'/);
  assert.match(gate, /<GenesisWizard key=\{user.id\} user=\{user\} initialProfile=\{state.profile\} onComplete=\{complete\} \/>/);
  for (const step of ['Body','Face','Appearance','Identity','Voice','Review']) {
    assert.ok(wizard.includes("'" + step + "'"), 'Creator has ' + step + ' step');
  }
});

test('Test completion does not invoke avatarSystem or change live character', () => {
  const wizard = read('../src/components/onboarding/GenesisWizard.jsx');
  const review = read('../src/components/onboarding/GenesisReview.jsx');
  const marker = wizard.indexOf('if (testMode) { setTestFinished(true); return; }');
  const mutation = wizard.indexOf("base44.functions.invoke('avatarSystem'");
  assert.ok(marker >= 0 && mutation > marker, 'Test exits before avatarSystem call');
  assert.match(wizard, /testMode \? 'Finish test' : preview \? 'Save preview'/);
  assert.match(wizard, /data-testid="genesis-test-finished"/);
  assert.match(wizard, /Test mode · No changes saved/);
  assert.match(review, /testMode \? 'This is a test walkthrough\./);
});
