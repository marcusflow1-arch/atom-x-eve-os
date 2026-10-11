import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { BATTLE_GENRES, getBattleQueueTarget } from '../src/components/battle/battleMenuCatalog.js';
const dom = new JSDOM('<div id="root"></div>', {url:'https://test.local/LunaTemplate'});
for (const key of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','KeyboardEvent','MouseEvent']) globalThis[key] = dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const {act, createElement} = await import('react');
const {createRoot} = await import('react-dom/client');
const fixtures = {
  useAIBattleQueue: 'export default () => globalThis.__battleMenu.battle; export const isRateLimited = e => e.status === 429; export const setAIBattleOverlayOpen = value => globalThis.__battleMenu.overlay.push(value);',
  DashboardWindow: 'export const activeDashboardWindow = () => globalThis.__battleMenu.activeWindow;',
  useOnlineSummary: 'export default () => ({data:globalThis.__battleMenu.summary});',
  useLunaStore: 'export default selector => selector(globalThis.__battleMenu.store);',
  combatAudioStore: 'export const startLoopSound = () => globalThis.__battleMenu.audio.push("start"); export const stopLoopSound = () => globalThis.__battleMenu.audio.push("stop");',
  ErrorToast: 'export const showError = e => globalThis.__battleMenu.errors.push(e.message); export const showInfo = m => globalThis.__battleMenu.errors.push(m);',
};
const result = await build({
  entryPoints:['src/components/dashboard/LunaAIBattleOverlay.jsx'], bundle:true, write:false,
  platform:'node', format:'cjs', packages:'external', jsx:'automatic', loader:{'.css':'empty'},
  alias:{'@':process.cwd()+'/src'},
  plugins:[{name:'battle-menu-fixtures', setup(builder){
    builder.onResolve({filter:/^lucide-react$/}, () => ({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
    builder.onResolve({filter:/.*/}, args => {
      const name=args.path.split('/').at(-1).replace(/\.(jsx|js)$/, '');
      return fixtures[name] ? {path:name,namespace:'fixture'} : undefined;
    });
    builder.onLoad({filter:/.*/,namespace:'fixture'}, args=>({contents:fixtures[args.path],loader:'js'}));
  }}],
});
const module = new Module(process.cwd()+'/battle-menu-test.cjs');
module.paths=Module._nodeModulePaths(process.cwd());
module._compile(result.outputFiles[0].text, process.cwd()+'/battle-menu-test.cjs');
const Menu=module.exports.default;
let root, f;
beforeEach(()=> {
  f=globalThis.__battleMenu={
    joins:[], cancels:0, closes:0, books:0, audio:[], overlay:[], errors:[], activeWindow:'ai-battle',
    summary:undefined, store:{hotbar:{0:{card_name:'Owned test card'}},activeSkillRow:1},
  };
  f.battle={queue:null,match:null,busy:false,isLoading:false,
    join:async mode=>{f.joins.push(mode);return {};},
    cancel:async()=>{f.cancels++;},
  };
  delete window.__lunaAIBattlePreferredMode;
  root=createRoot(document.getElementById('root'));
});
afterEach(async()=>{await act(async()=>root.unmount());});
async function render(props={}) {await act(async()=>root.render(createElement(Menu,{embedded:true,onClose:()=>f.closes++,onOpenSkillBook:()=>f.books++,...props})));}
function button(prefix) {
  const found=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(prefix));
  assert.ok(found, 'button exists: '+prefix);return found;
}
async function click(prefix) {await act(async()=>button(prefix).click());}
async function key(target=window, options={}) {await act(async()=>target.dispatchEvent(new KeyboardEvent('keydown',{key:'q',bubbles:true,...options})));}
test('opening and selecting do not queue; actual dashboard card and unknown counts render',async()=>{
  await render();assert.deepEqual(f.joins,[]);
  assert.match(document.body.textContent,/Owned test card/);
  assert.match(document.body.textContent,/— online/);
  await click('Fighting');assert.deepEqual(f.joins,[]);
  assert.equal(button('Not available yet').disabled,true);
  assert.equal(document.querySelectorAll('.ai-battle-menu__style-grid button').length,3);
  await click('03');assert.match(document.querySelector('.ai-battle-menu__diagram').getAttribute('aria-label'),/AIR/);
  await click('Skill Book');assert.equal(f.books,1);
});
test('all genre and mode previews are unavailable through mouse and Q; no fallback duel',async()=>{
  await render();
  for(const genre of BATTLE_GENRES.filter(g=>g.id!=='core')){
    await click(genre.label);await key();await click('Not available yet');
    assert.deepEqual(f.joins,[]);assert.equal(getBattleQueueTarget('pvp',genre.id),null);
  }
  for(const mode of ['PvE','World Events']){await click(mode);await key();assert.equal(button('Not available yet').disabled,true);}
  assert.deepEqual(f.audio,[]);
  await click('Avatar Duel');assert.equal(button('Find opponent').disabled,false);
  await key();assert.deepEqual(f.joins,['pvp']);
});
test('repeat presses and concurrent click/Q create only one pending join',async()=>{
  let resolve;
  f.battle.join=mode=>{f.joins.push(mode);return new Promise(r=>{resolve=r;});};
  await render();await key();await key();await click('Find opponent');await key(window,{repeat:true});
  assert.deepEqual(f.joins,['pvp']);
  await act(async()=>resolve({match:{id:'reserved',status:'matched'}}));
  assert.equal(f.closes,0);
});
test('Q ignores typing, modifier keys, background and minimized windows',async()=>{
  await render();
  await key(document.querySelector('input'));await key(window,{ctrlKey:true});await key(window,{altKey:true});await key(window,{metaKey:true});
  f.activeWindow='cards';await key();f.activeWindow='ai-battle';
  const shell=document.createElement('div');shell.dataset.lunaWindow='ai-battle';shell.dataset.minimized='true';document.body.append(shell);
  await key();shell.remove();assert.deepEqual(f.joins,[]);
});
test('reopening a waiting queue locks selection, permits cancel, and close does not cancel',async()=>{
  f.battle.queue={mode:'pvp',status:'waiting'};await render();
  assert.equal(button('Racing').disabled,true);await key();assert.deepEqual(f.joins,[]);
  assert.equal(f.cancels,0);await click('Cancel queue');assert.equal(f.cancels,1);
});
test('legacy PvE reservations remain cancellable without enabling new PvE queues',async()=>{
  f.battle.match={id:'legacy',mode:'pve',status:'matched'};await render();
  await key();assert.deepEqual(f.joins,[]);await click('Cancel reservation');assert.equal(f.cancels,1);
});
test('reservation stays open until server confirms connection',async()=>{
  f.battle.join=async mode=>{f.joins.push(mode);return {match:{id:'m',status:'matched'}};};
  await render();await click('Find opponent');assert.equal(f.closes,0);
  f.battle.match={id:'m',mode:'pvp',status:'matched'};await render();assert.equal(f.closes,0);
  f.battle.match={id:'m',mode:'pvp',status:'connecting'};await render();assert.equal(f.closes,1);
});
test('join errors are visible, stop queue audio, and permit a retry',async()=>{
  f.battle.join=async mode=>{f.joins.push(mode);throw new Error('Queue unavailable');};
  await render();await key();assert.deepEqual(f.errors,['Queue unavailable']);assert.deepEqual(f.audio,['start','stop']);
  await key();assert.equal(f.joins.length,2);
});
test('loading state blocks shortcuts and joining until queue state is known',async()=>{
  f.battle.isLoading=true;await render();await key();assert.deepEqual(f.joins,[]);
  assert.equal(button('Checking queue').disabled,true);
});
test('genre search filters and clears without changing the selection or queue',async()=>{
  await render();
  const input=document.querySelector('input');
  await act(async()=>{
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'zzzz');
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(document.body.textContent,/No genre matches/);
  await act(async()=>document.querySelector('[aria-label="Clear genre search"]').click());
  assert.ok(button('Racing'));assert.deepEqual(f.joins,[]);
});
