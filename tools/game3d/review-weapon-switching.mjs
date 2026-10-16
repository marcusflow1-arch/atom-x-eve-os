// Browser QA of the production weapon panel, hotkey mount and identity binding.
// Uses disposable local characters; only the external Base44 boundary is stubbed.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-weapons-'));
const output = process.env.REVIEW_OUTPUT_DIR || path.join(temp, 'review');
await mkdir(output, { recursive: true });
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import Panel from './src/components/game3d/progression/hub/WeaponAffinityPanel.jsx';
import Hotkeys from './src/components/game3d/axe/weapons/AXEWeaponQuickSwitchMount.jsx';
import Identity from './src/components/game3d/axe/weapons/AXEWeaponIdentityMount.jsx';
import * as inv from './src/components/game3d/axe/equipment/AXEEquipmentInventoryStore.js';
import * as affinity from './src/components/game3d/axe/weapons/AXEWeaponAffinityStore.js';
import * as storage from './src/components/game3d/characterStorage.jsx';
import * as hud from './src/components/game3d/playerHUDStore.jsx';
import * as mastery from './src/components/game3d/progression/weaponMasteryStore.jsx';
import * as buffs from './src/components/game3d/weaponClassBuffStore.jsx';
import * as abilities from './src/components/game3d/abilityStore.jsx';
storage.setStorageUser('weapon-browser-review');
if (!localStorage.getItem('weapon-qa-seeded')) {
 inv.resetAXEEquipmentInventoryToStarter();
 for (const w of inv.getEquippedAXEItemsByCategory('weapon')) inv.unequipAXEInventoryItem(w.instanceId);
 const make = (name, extra={}) => ({id:name.toLowerCase().replaceAll(' ','_'),name,slot:'weapon',category:'weapon',rarity:'common',baseStats:{damage:10},...extra});
 const sword = inv.addAXEEquipmentItem(make('Review Sword'),{equipped:true}).item;
 inv.addAXEEquipmentItem(make('Old Health Bow',{baseStats:{damage:10,hp:100}}),{equipped:true});
 inv.setActiveAXEWeapon(sword.instanceId);
 const bow = inv.addAXEEquipmentItem(make('Level Twelve Longbow',{baseStats:{damage:10,hp:100},itemLevel:12})).item;
 const dagger = inv.addAXEEquipmentItem(make('Review Dagger')).item;
 affinity.assignAXEQuickWeapon(0,bow.instanceId);
 affinity.assignAXEQuickWeapon(1,dagger.instanceId);
 hud.setPlayerHUD({level:12}); hud.setHP(25);
 localStorage.setItem('weapon-qa-seeded',JSON.stringify({sword:sword.instanceId,bow:bow.instanceId,dagger:dagger.instanceId}));
}
window.qa={inv,affinity,storage,hud,mastery,buffs,abilities,ids:JSON.parse(localStorage.getItem('weapon-qa-seeded'))};
createRoot(document.getElementById('root')).render(<div style={{minHeight:'100dvh',background:'#0a1019',color:'white',padding:20}}>
 <header style={{marginBottom:20,fontSize:12,color:'#b8c6d8'}}>GAME 3D / WEAPON AFFINITY · ISOLATED REVIEW</header>
 <label style={{display:'block',marginBottom:20}}>Chat input test <input aria-label="Chat input test" style={{background:'#223442'}}/></label>
 <main><Panel/></main><Identity/><Hotkeys/>
</div>);`;

await build({ stdin: { contents: entry, resolveDir: root, loader: 'jsx' }, bundle: true, jsx: 'automatic',
  format: 'esm', platform: 'browser', outfile: path.join(temp, 'app.js'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'offline-backend', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'qa-base44', namespace: 'qa' }));
    b.onLoad({ filter: /.*/, namespace: 'qa' }, () => ({ contents:
      'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'warning' });
execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/index.css', '-o', path.join(temp, 'style.css'), '--minify'], { cwd: root, stdio: 'pipe' });
await writeFile(path.join(temp, 'index.html'), '<!doctype html><html class="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
const server = createServer(async (req,res) => {
  const file = { '/': ['index.html','text/html'], '/app.js': ['app.js','text/javascript'], '/style.css': ['style.css','text/css'] }[req.url];
  if (!file) { res.writeHead(404).end(); return; }
  res.writeHead(200, {'content-type':file[1]}); res.end(await readFile(path.join(temp,file[0])));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser = await chromium.launch({ headless:true, executablePath:process.env.CHROMIUM_PATH || undefined,
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage({viewport:{width:1440,height:1050}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const ready = () => page.getByRole('heading',{name:'Five archetypes, one specialty'}).waitFor();
  await ready();
  const active = () => page.evaluate(()=>qa.inv.getActiveEquippedAXEWeapon().instanceId);
  const ids = await page.evaluate(()=>qa.ids);
  const draw = async (key='Digit1') => {
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.press('Shift+'+key);
  };
  const rejectSave = prefix => page.evaluate(prefix => {
    const original=Storage.prototype.setItem;
    window.restoreReviewStorage=()=>{Storage.prototype.setItem=original;};
    Storage.prototype.setItem=function(key,value) {
      if(String(key).startsWith(prefix))throw new DOMException('QA storage failure','QuotaExceededError');
      return original.call(this,key,value);
    };
  },prefix);
  const restoreSave = () => page.evaluate(()=>window.restoreReviewStorage());
  await page.evaluate(()=>qa.abilities.equipAbility(0,'shadow_teleport'));
  await draw();
  assert.equal(await active(),ids.bow,'real hotkey uses character level 12');
  assert.equal(await page.evaluate(()=>qa.hud.getPlayerHUD().hp),25,'equal HP draw must not heal');
  assert.equal(await page.evaluate(()=>qa.mastery.getMasteryState().activeWeaponId),'bow');
  assert.equal(await page.evaluate(()=>qa.buffs.getActiveWeaponPath()),'ranged');
  assert.equal(await page.evaluate(()=>qa.inv.getEquippedAXEItemsByCategory('weapon').length),2);
  await page.evaluate(()=>qa.abilities.equipAbility(0,'lightning_strike'));
  await draw();
  assert.equal(await active(),ids.sword);
  assert.equal(await page.evaluate(()=>qa.abilities.getAbilityState().equipped[0]),'shadow_teleport');

  // Both hotkeys work; an input, selector or held-key repeat must not draw again.
  await draw('Digit2'); assert.equal(await active(),ids.dagger);
  await draw('Digit2'); assert.equal(await active(),ids.sword);
  await page.getByRole('textbox',{name:'Chat input test'}).focus();
  await page.keyboard.press('Shift+Digit1'); assert.equal(await active(),ids.sword);
  await page.getByRole('combobox').first().focus();
  await page.keyboard.press('Shift+Digit1'); assert.equal(await active(),ids.sword);
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit1',key:'!',shiftKey:true,repeat:true})));
  assert.equal(await active(),ids.sword);

  await page.evaluate(()=>qa.hud.setPlayerHUD({level:11}));
  await draw();
  await page.getByRole('status').filter({hasText:'level is too low'}).waitFor();
  assert.equal(await active(),ids.sword);
  await page.evaluate(()=>qa.hud.setPlayerHUD({level:12}));
  const beforeFailure = await page.evaluate(()=>({hp:qa.hud.getPlayerHUD().hp,derived:qa.hud.getPlayerHUD().derived}));
  await rejectSave('axe_equipment_inventory_v2'); await draw();
  await page.getByRole('status').filter({hasText:'Weapon unchanged'}).waitFor();
  assert.equal(await active(),ids.sword);
  assert.deepEqual(await page.evaluate(()=>({hp:qa.hud.getPlayerHUD().hp,derived:qa.hud.getPlayerHUD().derived})),beforeFailure);
  await page.screenshot({path:path.join(output,'weapon-switch-save-failure.png')});
  await restoreSave(); await draw(); assert.equal(await active(),ids.bow);

  // Active weapon and return history are one persistent document.
  await page.reload(); await ready(); assert.equal(await active(),ids.bow);
  await draw(); assert.equal(await active(),ids.sword);
  assert.equal(await page.evaluate(()=>qa.mastery.getMasteryState().activeWeaponId),'sword');

  const beforePreferences = await page.evaluate(()=>qa.affinity.getAXEWeaponAffinityState());
  await rejectSave('axe_weapon_affinity_v1');
  await page.getByRole('button',{name:'Specialize',exact:true}).first().click();
  await page.getByRole('status').filter({hasText:'Could not save weapon preferences'}).waitFor();
  await page.getByRole('combobox').nth(1).selectOption(ids.sword);
  assert.deepEqual(await page.evaluate(()=>qa.affinity.getAXEWeaponAffinityState()),beforePreferences);
  assert.equal(await page.getByRole('combobox').nth(1).inputValue(),ids.dagger);
  await restoreSave();
  await page.getByRole('button',{name:'Specialize',exact:true}).first().click();
  await page.getByRole('button',{name:'Specialized (click to clear)'}).waitFor();
  await page.getByRole('combobox').nth(1).selectOption(ids.sword);
  await page.reload(); await ready();
  assert.equal(await page.getByRole('combobox').nth(1).inputValue(),ids.sword);
  await page.getByRole('button',{name:'Specialized (click to clear)'}).waitFor();
  await page.screenshot({path:path.join(output,'weapon-affinity-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'panel fits mobile width');
  await page.screenshot({path:path.join(output,'weapon-affinity-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: real Shift+1/2, level validation, no transient healing, mastery/role and legacy hotbar, typing/select/repeat guards, save failure/retry and feedback, active/history/preferences reload, mobile width; no page errors.');
} finally {
  await browser?.close(); await new Promise(resolve=>server.close(resolve));
  await rm(temp,{recursive:true,force:true});
}
