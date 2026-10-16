// Isolated browser QA for the real Character Hub panels/stores. No app route,
// live account, backend writes, assets, or gameplay simulation are substituted.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-ui-'));
const output = process.env.REVIEW_OUTPUT_DIR || path.join(root, 'docs/game3d/review');
await mkdir(output, { recursive: true });
const entry = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Mount from './src/components/game3d/progression/hub/MountSubTab.jsx';
import Vanity from './src/components/game3d/progression/hub/VanitySubTab.jsx';
import Halo from './src/components/game3d/progression/hub/HaloSubTab.jsx';
import * as mounts from './src/components/game3d/axe/progression/AXEMountStore.js';
import * as vanity from './src/components/game3d/axe/progression/AXEVanityStore.js';
import * as halo from './src/components/game3d/progression/haloStore.jsx';
import * as storage from './src/components/game3d/characterStorage.jsx';
import { incrementKillCount } from './src/components/game3d/killCountStore.jsx';
storage.setStorageUser('progression-ui-review');
if (!localStorage.getItem('qa-seeded')) {
 mounts.awardAXEMountXP(mounts.getAXEMountState().activeMountId, 10000);
 incrementKillCount(500); localStorage.setItem('qa-seeded', 'yes');
}
window.qa = { mounts, vanity, halo, storage };
function Review() {
 const [tab,setTab] = useState('Mounts');
 const Panel = { Mounts: Mount, Vanity, Halo }[tab];
 return <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#0a1019',color:'white'}}>
  <header style={{padding:'16px 20px',borderBottom:'1px solid #ffffff20'}}>
    <div style={{fontSize:12,color:'#b8c6d8',marginBottom:12}}>GAME 3D / CHARACTER HUB · ISOLATED PANEL REVIEW</div>
    <nav aria-label="Review panels" style={{display:'flex',gap:12}}>{['Mounts','Vanity','Halo'].map(t => <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',borderRadius:8,background:t===tab?'#223442':'#121b27'}}>{t}</button>)}</nav>
  </header>
  <main style={{flex:1,minHeight:0}}><Panel /></main>
 </div>
}
createRoot(document.getElementById('root')).render(<Review/>);`;
await build({ stdin: { contents: entry, resolveDir: root, loader: 'jsx' }, bundle: true, jsx: 'automatic',
  format: 'esm', platform: 'browser', outfile: path.join(temp, 'app.js'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'offline-backend', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'qa-base44', namespace: 'qa' }));
    b.onLoad({ filter: /.*/, namespace: 'qa' }, () => ({ contents: 'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
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
 await page.getByRole('heading',{name:'Mounts',exact:true}).waitFor();
 const rank = () => page.evaluate(()=>qa.mounts.getAXEMountState().mounts[0].spiritualProfile.rank);
 const rejectSave = (prefix) => page.evaluate(prefix => {
  const proto = Storage.prototype; const original = proto.setItem;
  window.restoreReviewStorage = () => { proto.setItem = original; };
  proto.setItem = function(key,value) {
   if (String(key).startsWith(prefix)) throw new DOMException('QA storage failure','QuotaExceededError');
   return original.call(this,key,value);
  };
 },prefix);
 const restoreSave = () => page.evaluate(()=>window.restoreReviewStorage());
 await page.getByRole('button',{name:/Strengthen ·/}).click();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await rank(),0);
 await rejectSave('axe_mount_progression_v1');
 await page.getByRole('button',{name:/Strengthen ·/}).click();
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).click();
 assert.match(await page.getByRole('status').filter({hasText:/Could not save your changes|removed/}).innerText(),/Could not save your changes/);
 assert.equal(await rank(),0);
 assert.equal(await page.evaluate(()=>qa.mounts.getAXEMountState().mounts[0].spiritualProfile.availableXp),10000);
 await page.screenshot({path:path.join(output,'mount-save-failure-desktop.png')});
 await restoreSave();
 await page.getByRole('button',{name:/Strengthen ·/}).click();
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).click();
 assert.equal(await rank(),1);
 await page.getByRole('button',{name:'utility',exact:true}).click();
 assert.equal(await page.evaluate(()=>qa.mounts.getAXEMountState().mounts[0].spiritualProfile.mode),'utility');
 await page.getByRole('button',{name:'Craft Legendary Mount',exact:true}).click();
 await page.getByText('12,000',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).click();
 assert.equal(await page.evaluate(()=>qa.mounts.getAXEMountState().materials.gold),8000);
 await page.reload();
 await page.getByRole('heading',{name:'Mounts',exact:true}).waitFor();
 assert.equal(await rank(),1);
 await page.screenshot({path:path.join(output,'mount-progression-desktop.png')});
 await page.getByRole('navigation',{name:'Review panels'}).getByRole('button',{name:'Vanity',exact:true}).click();
 await page.getByRole('button',{name:'Activate with Silver Card'}).first().click();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await page.evaluate(()=>qa.vanity.getAXEVanityState().cards.silver),4);
 await rejectSave('axe_vanity_custom_pieces_v1');
 await page.getByRole('button',{name:'Activate with Silver Card'}).first().click();
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).click();
 assert.match(await page.getByRole('status').filter({hasText:/Could not save your changes|removed/}).innerText(),/Could not save your changes/);
 assert.equal(await page.evaluate(()=>qa.vanity.getAXEVanityState().cards.silver),4);
 await restoreSave();
 await page.getByRole('button',{name:'Activate with Silver Card'}).first().click();
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).click();
 assert.equal(await page.evaluate(()=>qa.vanity.getAXEVanityState().cards.silver),3);
 await page.getByRole('button',{name:'Remove Overlay'}).first().click();
 assert.match(await page.getByRole('status').filter({hasText:/Could not save your changes|removed/}).innerText(),/removed/);
 await page.reload();
 await page.getByRole('navigation',{name:'Review panels'}).getByRole('button',{name:'Vanity',exact:true}).click();
 await page.getByText('Empty Vanity Slot',{exact:true}).waitFor();
 await page.getByRole('navigation',{name:'Review panels'}).getByRole('button',{name:'Halo',exact:true}).click();
 const killsBefore = await page.evaluate(()=>qa.halo.getHaloState().kills);
 await page.getByRole('button',{name:'10×',exact:true}).click();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await page.evaluate(()=>qa.halo.getHaloState().kills),killsBefore);
 await page.getByRole('button',{name:'10×',exact:true}).click();
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).click();
 assert.equal(await page.evaluate(()=>qa.halo.getHaloState().kills),killsBefore-100);
 await page.setViewportSize({width:390,height:844});
 for (const tab of ['Mounts','Vanity','Halo']) {
  await page.getByRole('navigation',{name:'Review panels'}).getByRole('button',{name:tab,exact:true}).click();
  await page.getByRole('heading',{name:tab==='Halo'?'Halo progression':tab,exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).overflowX==='visible').every(e=>e.getBoundingClientRect().right<=innerWidth+1)),true,tab+' mobile overflow');
 }
 await page.screenshot({path:path.join(output,'halo-progression-mobile.png')});
 // A pending spend cannot carry to another character after switching.
 await page.getByRole('button',{name:'10×',exact:true}).click();
 await page.evaluate(()=>qa.storage.setStorageUser('another-review-character'));
 await page.getByRole('button',{name:'Confirm upgrade',exact:true}).waitFor({state:'detached'});
 assert.deepEqual(errors,[]);
 console.log('PASS: mount/vanity save-failure rollback and retry; mount upgrade/cancel/reload/mode/craft, vanity spending/removal/reload, halo batch/cancel, mobile layout for all 3 panels, pending-review reset; no page errors.');
} finally {
 await browser?.close(); await new Promise(resolve=>server.close(resolve));
 await rm(temp,{recursive:true,force:true});
}
