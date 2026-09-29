import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Luna' });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');

const equipCalls = [];
globalThis.cardV2SkillBookFixture = {
  games: [{ key: 'adam-xe', title: 'Adam XE', genre: 'Action RPG', owned_skills: 1, total_skills: 1, image: '' }],
  skills: [{
    id: 'skill-1', user_card_id: 'owned-1', title: 'Chidori', description: 'Lightning thrust.',
    game_name: 'Adam XE', rarity: 'Legendary', playable_tier: 'Legendary', owned: true, can_equip: true,
    card: { id: 'owned-1', user_card_id: 'owned-1', card_name: 'Chidori', card_rarity: 'Legendary', playable_tier: 'Legendary', passport_id: 'AXE-CARD-001', animation_effect: { id: 'chidori' } },
    progression: {
      system_version: 2, enhancement_percent: 65, ascension: 3, stack_level: 2,
      power_score: 500, passport_id: 'AXE-CARD-001', mastery: { holographic: false },
      combat: { source_base_damage: 100, effective_damage: 777 },
    },
  }],
  slots: Array.from({ length: 4 }, (_, index) => ({ index, card: null })),
  isLoading: false,
  isSaving: false,
  equip: async (slot, id) => { equipCalls.push({ slot, id }); },
};

const code = await build({
  entryPoints: ['src/components/dashboard/LunaCardsPanel.jsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  packages: 'external',
  jsx: 'automatic',
  alias: { '@': process.cwd() + '/src' },
  plugins: [{
    name: 'card-v2-skillbook-fixtures',
    setup(buildApi) {
      buildApi.onResolve({ filter: /useSkillBookLoadout$/ }, () => ({ path: 'skill-hook', namespace: 'skill-v2-fixture' }));
      buildApi.onResolve({ filter: /ErrorToast$/ }, () => ({ path: 'toasts', namespace: 'skill-v2-fixture' }));
      buildApi.onResolve({ filter: /CombatPrefabManager$/ }, () => ({ path: 'prefabs', namespace: 'skill-v2-fixture' }));
      buildApi.onLoad({ filter: /.*/, namespace: 'skill-v2-fixture' }, (args) => {
        if (args.path === 'skill-hook') return { loader: 'js', contents: 'export default function useSkillBookLoadout(){ return globalThis.cardV2SkillBookFixture; }' };
        if (args.path === 'toasts') return { loader: 'js', contents: 'export const showError=()=>{}; export const showSuccess=()=>{};' };
        return { loader: 'jsx', resolveDir: process.cwd(), contents: 'import React from "react"; export default function CombatPrefabManager(){ return <div data-testid="prefabs"/>; }' };
      });
    },
  }],
});

const filename = process.cwd() + '/tests/__card_system_v2_skillbook_ui_bundle.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(code.outputFiles[0].text, filename);
const LunaCardsPanel = mod.exports.default;
const root = createRoot(document.getElementById('root'));

try {
  await act(async () => { root.render(React.createElement(LunaCardsPanel)); });
  assert.match(document.body.textContent, /Luna Codex · Card System v2/);
  const gameButton = [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Adam XE'));
  assert.ok(gameButton, 'Adam XE game chapter is visible');
  await act(async () => {
    gameButton.click();
    await Promise.resolve();
  });

  const text = document.body.textContent;
  assert.match(text, /E 65% · A3\/5 · S2\/4/);
  assert.match(text, /Playable TierLegendary/);
  assert.match(text, /Enhancement65\/120%/);
  assert.match(text, /Ascension3\/5/);
  assert.match(text, /Stack Level2\/4/);
  assert.match(text, /Damage before defense777/);
  assert.match(text, /Passport AXE-CARD-001/);
  assert.match(text, /Avatar \+ Card System v2 Scaling/);
  assert.doesNotMatch(text, /\bLv\s*\d|\bStars\b|\bStage\s*\d|Card Boost/);

  const slotOne = [...document.querySelectorAll('button')].find((button) => button.textContent.replace(/\s+/g, ' ').trim().startsWith('Slot 1'));
  assert.ok(slotOne, 'Skill Slot 1 control remains available');
  await act(async () => { slotOne.click(); });
  assert.deepEqual(equipCalls[0], { slot: 0, id: 'owned-1' });

  console.log('PASS: Skill Book presents Card System v2 Enhancement, Ascension, Stack, Passport and combat damage while preserving equip behavior.');
} finally {
  await act(async () => { root.unmount(); });
  dom.window.close();
  delete globalThis.cardV2SkillBookFixture;
}
