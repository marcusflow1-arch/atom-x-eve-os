// Silver, shop items and cosmetics belong to one character (docs/game3d/CHARACTER_VAULT.md).
// They used to sit under one browser-wide key shared by every character and account.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dom = new JSDOM('', { url: 'http://localhost/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
// before the stores load: an account, its active character and the old browser-wide balance
localStorage.setItem('wwm_storage_user_v1', 'alice');
localStorage.setItem('wwm_character_active_v1::alice', 'char_a');
localStorage.setItem('mmorpg_shop_store_v1', JSON.stringify({ gold: 42000, inventory: { potion: 3 }, equippedCosmetics: {} }));

const temp = await mkdtemp(path.join(tmpdir(), 'axe-silver-'));
await build({ stdin: { contents: "export * as storage from './src/components/game3d/characterStorage.jsx'; export * as shop from './src/components/game3d/shop/shopStore.jsx';", resolveDir: process.cwd() },
  bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', outfile: path.join(temp, 'm.mjs'), logLevel: 'silent' });
const { storage, shop } = await import(pathToFileURL(path.join(temp, 'm.mjs')));
after(async () => { dom.window.close(); await rm(temp, { recursive: true, force: true }); });

const switchTo = (user, character) => {
  if (character) localStorage.setItem(`wwm_character_active_v1::${user}`, character);
  if (storage.getStorageUser() !== user) storage.setStorageUser(user); else storage.notifyCharacterChange();
};

test('the old browser-wide balance goes to the first character, once; every other character has its own', () => {
  assert.equal(shop.getShopState().gold, 42000, 'char_a took the old balance');
  assert.deepEqual(shop.getShopState().inventory, { potion: 3 });
  assert.equal(localStorage.getItem('mmorpg_shop_store_v1_claimed_by'), 'alice::char_a');

  switchTo('alice', 'char_b');
  assert.equal(shop.getShopState().gold, 5000, 'a second character starts with the starting Silver, not a copy');
  assert.ok(shop.spendGold(1200).ok);
  shop.addGold(50);

  switchTo('alice', 'char_a');
  assert.equal(shop.getShopState().gold, 42000, "char_b's spending never touched char_a");
  switchTo('alice', 'char_b');
  assert.equal(shop.getShopState().gold, 3850);

  switchTo('bob', 'char_z');
  assert.equal(shop.getShopState().gold, 5000, 'another account on this computer has its own Silver');
  assert.deepEqual(shop.getShopState().inventory, {});
});

test('anonymous play and the pre-character slot never claim the old balance', () => {
  localStorage.removeItem('mmorpg_shop_store_v1_claimed_by');
  switchTo('__anon__', 'char_q');
  assert.equal(shop.getShopState().gold, 5000);
  switchTo('carol', '__default__');
  assert.equal(shop.getShopState().gold, 5000);
  assert.equal(localStorage.getItem('mmorpg_shop_store_v1_claimed_by'), null, 'still there for a real character');
  switchTo('carol', 'char_c');
  assert.equal(shop.getShopState().gold, 42000);
  assert.equal(localStorage.getItem('mmorpg_shop_store_v1')?.length > 0, true, 'the old key is left in place (nothing deleted)');
});
