import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Store' });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Event', 'CustomEvent', 'AbortController', 'AbortSignal']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');

const market = {
  userId: 'buyer',
  system_version: 2,
  balance: 2500,
  ownedCards: [],
  listings: [{
    id: 'listing-1', seller_id: 'seller-1', asking_price: 900, views: 12,
    seller: { id: 'seller-1', name: 'Seller One', avatar: '' },
    card_snapshot: {
      user_card_id: 'owned-1', trading_card_id: 'card-1', passport_id: 'AXE-CARD-CHIDORI-001',
      name: 'Chidori', rarity: 'Legendary', playable_tier: 'Legendary', enhancement_percent: 78,
      ascension: 5, stack_level: 3, mastery_visual: 'holographic_3d', mastery: { holographic: true },
      origin_game: 'Adam XE', origin_achievement: 'a1', image: '', external_ledger_status: 'not_anchored',
    },
  }],
};

globalThis.tradingPostV2Sdk = {
  functions: { invoke: async (name, body) => {
    assert.equal(name, 'tradePostMarket');
    assert.ok(['getState', 'buyListing', 'openTrade', 'cancelListing', 'listCard'].includes(body.action));
    return { data: market };
  } },
  entities: {
    Game: { list: async () => [{ id: 'g1', title: 'Adam XE', status: 'available', genre: 'Action RPG', original_year: 2026 }] },
    TradingCard: { list: async () => [{ id: 'card-1', name: 'Chidori', achievement_id: 'a1', game_id: 'g1', playable_tier: 'Legendary', rarity: 'Legendary', status: 'live' }] },
    Achievement: { list: async () => [{ id: 'a1', title: 'Chidori Achievement', game: 'Adam XE', category: 'ability', rarity: 'Legendary' }] },
    CardTrade: { subscribe: () => () => {} },
  },
};

const code = await build({
  entryPoints: ['src/components/store/TradingPostContent.jsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  packages: 'external',
  jsx: 'automatic',
  alias: { '@': process.cwd() + '/src' },
  plugins: [{
    name: 'trading-post-v2-fixture',
    setup(buildApi) {
      buildApi.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
      buildApi.onResolve({ filter: /api\/base44Client$/ }, () => ({ path: 'base44-client', namespace: 'trading-post-v2' }));
      buildApi.onLoad({ filter: /.*/, namespace: 'trading-post-v2' }, () => ({ loader: 'js', contents: 'export const base44 = globalThis.tradingPostV2Sdk;' }));
    },
  }],
});

const filename = process.cwd() + '/tests/__card_system_v2_trading_post_ui_bundle.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(code.outputFiles[0].text, filename);
const TradingPostContent = mod.exports.default;
const root = createRoot(document.getElementById('root'));
const buttonContaining = (text) => [...document.querySelectorAll('button')].find((button) => button.textContent.replace(/\s+/g, ' ').includes(text));

try {
  await act(async () => {
    root.render(React.createElement(TradingPostContent, {}));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
  });
  assert.match(document.body.textContent, /Card System v2 Trading Post/);
  assert.match(document.body.textContent, /Compare the exact instances/);

  const gameButton = buttonContaining('Adam XE');
  assert.ok(gameButton, 'game catalog exposes Adam XE');
  await act(async () => { gameButton.click(); await Promise.resolve(); });
  assert.match(document.body.textContent, /All Tiers/);

  const cardButton = buttonContaining('Chidori');
  assert.ok(cardButton, 'game catalog exposes Chidori');
  await act(async () => { cardButton.click(); await Promise.resolve(); });

  const text = document.body.textContent;
  assert.match(text, /Legendary/);
  assert.match(text, /E 78\/120%/);
  assert.match(text, /A5\/5/);
  assert.match(text, /S3\/4/);
  assert.match(text, /Holographic/);
  assert.match(text, /Passport AXE-CARD-C…R-001|Passport AXE-CARD-CHIDORI-001/);
  assert.match(text, /900 AGP/);
  assert.doesNotMatch(text, /\bLv\s*\d|★ stage|\bStage\s*\d/);

  console.log('PASS: Trading Post exposes exact Card System v2 instances with Enhancement, Ascension, Stack, mastery and Passport instead of legacy level/star labels.');
} finally {
  await act(async () => { root.unmount(); });
  dom.window.close();
  delete globalThis.tradingPostV2Sdk;
}
