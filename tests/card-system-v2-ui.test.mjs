import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Luna' });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');

const calls = [];
const baseState = {
  success: true,
  userCard: {
    id: 'card-1',
    user_id: 'user-1',
    card_name: 'Chidori',
    card_rarity: 'Legendary',
    playable_tier: 'Legendary',
    game_name: 'Adam XE',
    card_image: '',
  },
  definition: {
    id: 'definition-1',
    name: 'Chidori',
    playable_tier: 'Legendary',
    rarity: 'Legendary',
  },
  progression: {
    system_version: 2,
    enhancement_percent: 120,
    ascension: 4,
    stack_level: 2,
    permanent_stats: { attack: 48 },
    current_cycle_stats: { attack: 24 },
    effective_stats: { attack: 172, defense: 80, magic: 64, vitality: 90, speed: 40 },
    power_score: 446,
    mastery_visual: 'standard',
  },
  mastery: {
    enhancement_percent: 120,
    enhancement_cap: 120,
    ascension: 4,
    ascension_cap: 5,
    stack_level: 2,
    stack_cap: 4,
    can_ascend: true,
    mastered: false,
    holographic: false,
    visual_tier: 'ascension_4',
  },
  combat_preview: { base_damage: 812 },
  avatar_level: 18,
  materials: [{
    id: 'material-stack-1', quantity: 3, can_enhance: true, enhancement_value: 8,
    definition: { id: 'material-1', name: 'Uncommon Enhancement Core', rarity: 'Uncommon' },
  }],
  duplicates: [{
    id: 'card-duplicate', card_name: 'Chidori', card_rarity: 'Legendary', acquired_at: '2026-09-28T12:00:00Z', card_image: '',
  }],
  passport: {
    passport_id: 'AXE-CARD-CHIDORI-001',
    authenticity_status: 'registered_internal',
    ledger_adapter: 'internal_hash_chain_v1',
    external_ledger_status: 'not_anchored',
    event_count: 2,
    events: [
      { sequence: 1, event_type: 'created', event_hash: 'hash-created', timestamp: '2026-09-27T12:00:00Z' },
      { sequence: 2, event_type: 'enhance', event_hash: 'hash-enhance', timestamp: '2026-09-28T12:00:00Z' },
    ],
  },
};

let currentState = structuredClone(baseState);

globalThis.cardV2Sdk = {
  functions: {
    invoke: async (name, body) => {
      assert.equal(name, 'cardProgression');
      calls.push(body);
      if (body.action === 'ascend') {
        currentState = {
          ...currentState,
          progression: {
            ...currentState.progression,
            enhancement_percent: 0,
            ascension: 5,
            permanent_stats: { attack: 72 },
            current_cycle_stats: {},
            power_score: 446,
            mastery_visual: 'holographic_3d',
          },
          mastery: {
            ...currentState.mastery,
            enhancement_percent: 0,
            ascension: 5,
            can_ascend: false,
            mastered: true,
            holographic: true,
            visual_tier: 'holographic_3d',
          },
          passport: {
            ...currentState.passport,
            event_count: 3,
            events: [
              ...currentState.passport.events,
              { sequence: 3, event_type: 'ascend', event_hash: 'hash-ascend', timestamp: '2026-09-29T00:00:00Z' },
            ],
          },
        };
      }
      if (body.action === 'stack') {
        currentState = {
          ...currentState,
          progression: { ...currentState.progression, stack_level: 3, power_score: 500 },
          mastery: { ...currentState.mastery, stack_level: 3 },
          duplicates: [],
        };
      }
      return { data: structuredClone(currentState) };
    },
  },
};

const code = await build({
  entryPoints: ['src/components/streaming/MysteryCardDetail.jsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  packages: 'external',
  jsx: 'automatic',
  alias: { '@': process.cwd() + '/src' },
  plugins: [{
    name: 'card-v2-ui-fixture',
    setup(buildApi) {
      buildApi.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
      buildApi.onResolve({ filter: /api\/base44Client$/ }, () => ({ path: 'base44-client', namespace: 'card-v2-fixture' }));
      buildApi.onLoad({ filter: /.*/, namespace: 'card-v2-fixture' }, () => ({
        loader: 'js',
        contents: 'export const base44 = globalThis.cardV2Sdk;',
      }));
    },
  }],
});

const filename = process.cwd() + '/tests/__card_system_v2_ui_bundle.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(code.outputFiles[0].text, filename);
const CardDetail = mod.exports.default;

const root = createRoot(document.getElementById('root'));
const findButton = (label) => [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === label);
const render = () => act(async () => {
  root.render(React.createElement(CardDetail, { card: { user_card_id: 'card-1', name: 'Chidori' }, onBack: () => {} }));
  await Promise.resolve();
  await Promise.resolve();
});

try {
  await render();
  assert.match(document.body.textContent, /Card System v2 · one card, one progression record/);
  assert.match(document.body.textContent, /Enhancement cycle/);
  assert.match(document.body.textContent, /120 \/ 120%/);
  assert.match(document.body.textContent, /Ascension4\/5/);
  assert.match(document.body.textContent, /Stack Level2\/4/);
  assert.match(document.body.textContent, /PvP Damage812/);
  assert.doesNotMatch(document.body.textContent, /Over-Enchant|Skill Tree|Leveled to|Stars/);

  await act(async () => { findButton('ENHANCE').click(); });
  assert.match(document.body.textContent, /Enhancement Materials/);
  assert.match(document.body.textContent, /Uncommon Enhancement Core/);
  assert.equal(findButton('Feed Material').disabled, true, 'a full 120% cycle cannot consume more enhancement material');
  assert.equal(findButton('Ascend').disabled, false);

  await act(async () => {
    findButton('Ascend').click();
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(calls.at(-1).action, 'ascend');
  assert.match(document.body.textContent, /Ascension 5\/5/);
  assert.match(document.body.textContent, /Maximum mastery · 3D holographic presentation unlocked/);
  assert.match(document.body.textContent, /0 \/ 120%/);

  await act(async () => { findButton('OVERVIEW').click(); });
  assert.match(document.body.textContent, /Holographic Mastery/);
  assert.match(document.body.textContent, /Card Power446/);
  assert.match(document.body.textContent, /Permanent Power/);
  assert.match(document.body.textContent, /Attack \+72/);

  await act(async () => { findButton('STACK').click(); });
  assert.match(document.body.textContent, /Stack Level 2 \/ 4/);
  assert.match(document.body.textContent, /ChidoriLegendary/);
  await act(async () => {
    findButton('Stack').click();
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(calls.at(-1).action, 'stack');
  assert.equal(calls.at(-1).payload.duplicateUserCardId, 'card-duplicate');
  assert.match(document.body.textContent, /Stack Level 3 \/ 4/);

  await act(async () => { findButton('PASSPORT').click(); });
  assert.match(document.body.textContent, /Digital Passport/);
  assert.match(document.body.textContent, /AXE-CARD-CHIDORI-001/);
  assert.match(document.body.textContent, /External LedgerNOT ANCHORED/);
  assert.match(document.body.textContent, /tamper-evident internal hash-chain registry/);
  assert.match(document.body.textContent, /ascend/);

  console.log('PASS: Card System v2 UI uses Enhancement/Ascension/Stack/Passport labels, preserves power across Ascension, exposes mastery, stacking and provenance.');
} finally {
  await act(async () => { root.unmount(); });
  dom.window.close();
  delete globalThis.cardV2Sdk;
}
