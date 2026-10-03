import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Store' });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');

const listed = [];
const card = {
  id: 'owned-card-1',
  title: 'Chidori',
  name: 'Chidori',
  rarity: 'Legendary',
  playable_tier: 'Legendary',
  series: 'Adam XE',
  game_name: 'Adam XE',
  image: '',
  enhancement_percent: 76,
  ascension: 5,
  stack_level: 4,
  mastery_visual: 'holographic_3d',
  passport_id: 'AXE-CARD-CHIDORI-001',
  equipped_to: 'none',
  trade_status: 'available',
  passport_events: [
    { sequence: 1, event_type: 'created', event_hash: 'hash-created', timestamp: '2026-09-27T12:00:00Z' },
    { sequence: 2, event_type: 'ascend', event_hash: 'hash-ascend', timestamp: '2026-09-28T12:00:00Z' },
  ],
};

const code = await build({
  entryPoints: ['src/components/blacksmith/TradingPanel.jsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  packages: 'external',
  jsx: 'automatic',
  alias: { '@': process.cwd() + '/src' },
  plugins: [{
    name: 'market-v2-fixture',
    setup(buildApi) {
      buildApi.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
      buildApi.onResolve({ filter: /components\/ui\/(badge|button)$/ }, (args) => ({ path: args.path, namespace: 'market-v2-ui' }));
      buildApi.onResolve({ filter: /\.\/MaterialSystem$/ }, () => ({ path: 'material-system', namespace: 'market-v2-ui' }));
      buildApi.onLoad({ filter: /.*/, namespace: 'market-v2-ui' }, (args) => {
        if (args.path === 'material-system') return { loader: 'js', resolveDir: process.cwd(), contents: 'export const MATERIAL_INFO={precision_shard:{name:"Precision Shard",icon:"◆"}};' };
        if (args.path.includes('badge')) return { loader: 'jsx', resolveDir: process.cwd(), contents: 'import React from "react"; export function Badge({children,...props}){return <span {...props}>{children}</span>}' };
        return { loader: 'jsx', resolveDir: process.cwd(), contents: 'import React from "react"; export function Button({children,...props}){return <button {...props}>{children}</button>}' };
      });
    },
  }],
});

const filename = process.cwd() + '/tests/__card_system_v2_market_ui_bundle.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(code.outputFiles[0].text, filename);
const TradingPanel = mod.exports.default;

const root = createRoot(document.getElementById('root'));
const findButtonContaining = (label) => [...document.querySelectorAll('button')].find((button) => button.textContent.replace(/\s+/g, ' ').trim().includes(label));

try {
  await act(async () => {
    root.render(React.createElement(TradingPanel, {
      card,
      onClose: () => {},
      onListCard: (payload) => listed.push(payload),
    }));
  });

  const text = document.body.textContent;
  assert.match(text, /Card System v2/);
  assert.match(text, /Playable TierLegendary/);
  assert.match(text, /Enhancement76\/120%/);
  assert.match(text, /AscensionA5\/5/);
  assert.match(text, /Stack Level4\/4/);
  assert.match(text, /MasteryHolographic 3D/);
  assert.match(text, /AXE-CARD-CHIDORI-001/);
  assert.match(text, /Progression follows ownership/);
  // "Stack Level" is a v2 label; reject only the removed legacy level/star/stage presentation.
  assert.doesNotMatch(text, /\bLv\s*\d|\bStars\b|Leveled to|★ stage|\bStage\s*\d/);

  const historyButton = findButtonContaining('Digital Passport history');
  assert.ok(historyButton, 'Digital Passport history control is visible');
  await act(async () => { historyButton.click(); });
  assert.match(document.body.textContent, /created/i);
  assert.match(document.body.textContent, /hash-ascend/);

  const listButton = findButtonContaining('List Card Instance');
  assert.ok(listButton, 'Card instance listing control is visible');
  await act(async () => { listButton.click(); });
  assert.equal(listed.length, 1);
  const snapshot = listed[0].card_snapshot;
  assert.equal(snapshot.enhancement_percent, 76);
  assert.equal(snapshot.ascension, 5);
  assert.equal(snapshot.stack_level, 4);
  assert.equal(snapshot.mastery_visual, 'holographic_3d');
  assert.equal(snapshot.passport_id, 'AXE-CARD-CHIDORI-001');
  assert.equal(snapshot.level, undefined);
  assert.equal(snapshot.stars, undefined);

  console.log('PASS: marketplace panel uses Card System v2 labels and emits v2 instance snapshots without legacy level/star fields.');
} finally {
  await act(async () => { root.unmount(); });
  dom.window.close();
}
