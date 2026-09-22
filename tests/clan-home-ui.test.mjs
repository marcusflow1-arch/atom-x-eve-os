import assert from 'node:assert/strict';
import Module, {createRequire} from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/Clan',pretendToBeVisual:true});
for(const name of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Element','Node','NodeFilter','Event','CustomEvent','MutationObserver'])globalThis[name]=dom.window[name];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame=callback=>setTimeout(callback,0);
globalThis.cancelAnimationFrame=clearTimeout;
dom.window.HTMLElement.prototype.scrollIntoView=function(){};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const {QueryClient,QueryClientProvider}=createRequire(import.meta.url)('@tanstack/react-query');
const F=globalThis.clanFixture={
 role:'leader',failPublish:false,navigated:null,chat:0,writes:[],
 clan:{id:'guild',name:'Nightwatch',motto:'Leave no one behind',description:'Our guild, our ground.',level:4,sizeLimit:50,clanAchievements:[{title:'First victory',completed:true}]},
 announcements:[{id:'a1',content:'A shared milestone',author:'Leader',role:'leader',created_date:'2026-09-21',isPinned:true},{id:'a2',content:'Welcome to our guild',author:'Officer',role:'officer',created_date:'2026-09-20'}],
};
globalThis.clanSdk={
 functions:{invoke:async(name,{action,data})=>{
  if(action==='home_state')return {success:true,clan:F.clan,role:F.role,members:[{id:'m1'},{id:'m2'}],announcements:F.announcements,upgrades:[{id:'u1',upgrade_name:'Shared vault',status:'in_progress',tier:1,progress_seconds:50,build_seconds:100}],hall:{hall_name:'Moon Hall',favor:42,aetherium:23},failures:[]};
  assert.equal(action,'post_message');
  if(F.failPublish)throw new Error('Please retry publishing');
  F.writes.push(data);F.announcements.push({id:'a3',author:'Leader',role:'leader',content:data.content,created_date:new Date().toISOString()});return {success:true};
 }},
 entities:new Proxy({}, {get:()=>({subscribe:()=>()=>{}})}),
};
const code=await build({
 stdin:{contents:"export {default as Home,upgradeProgress} from './src/components/clan/ClanHome.jsx';",loader:'jsx',resolveDir:process.cwd()},
 bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
 plugins:[{name:'clan-fixtures',setup(b){
  b.onResolve({filter:/^lucide-react$/},()=>({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
  b.onResolve({filter:/base44Client|TransparentModel3DViewer/},args=>({path:args.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'jsx',resolveDir:process.cwd(),contents:args.path.includes('base44Client')?'export const base44=globalThis.clanSdk;':'export default function Viewer(p){return <div data-clan-viewer="true" data-environment={p.roomModelUrl}>Existing player avatar</div>}'}));
 }}],
});
const module=new Module(process.cwd()+'/tests/__clan_ui_bundle.cjs');module.paths=Module._nodeModulePaths(process.cwd());module._compile(code.outputFiles[0].text,process.cwd()+'/tests/__clan_ui_bundle.cjs');
const {Home,upgradeProgress}=module.exports;
assert.equal(upgradeProgress({status:'in_progress',build_seconds:0,progress_seconds:25}),0);
assert.equal(upgradeProgress({status:'in_progress',build_seconds:100,progress_seconds:200}),100);
assert.equal(upgradeProgress({status:'active'}),100);
const h=React.createElement,run=async fn=>act(async()=>{fn();await new Promise(resolve=>setTimeout(resolve,35));});
let root,client;
function App(){const [enabled,setEnabled]=React.useState(false);return h(Home,{clan:F.clan,currentUserRole:F.role,isStrongholdEnabled:enabled,onToggleStronghold:()=>setEnabled(value=>!value),onNavigate:tab=>F.navigated=tab,onLeave:()=>{},onDisband:()=>{}});}
async function mount(){client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});root=createRoot(document.getElementById('root'));await run(()=>root.render(h(QueryClientProvider,{client},h(App))));await run(()=>{});}
async function unmount(){await run(()=>root.unmount());client.clear();}
const button=text=>[...document.querySelectorAll('button')].find(node=>node.textContent.trim()===text);
const byLabel=label=>document.querySelector('[aria-label="'+label+'"]');
window.addEventListener('openClanChatOverlay',()=>F.chat++);
await mount();
assert.equal(document.querySelector('h1').textContent,'Nightwatch');
assert.ok(document.body.textContent.includes('Leave no one behind'));
assert.equal(document.querySelectorAll('.clan-announcement').length,2);
assert.equal(document.querySelector('progress').value,50);
assert.ok(document.body.textContent.includes('First victory'));
assert.ok(!document.body.textContent.includes('Gold III'));
await run(()=>button('View roster').click());assert.equal(F.navigated,'roster');
await run(()=>[...document.querySelectorAll('.clan-home-shortcuts button')].find(node=>node.textContent.includes('Game rooms')).click());assert.equal(F.navigated,'games_chat');
await run(()=>[...document.querySelectorAll('.clan-home-shortcuts button')].find(node=>node.textContent.includes('Manage clan')).click());assert.equal(F.navigated,'admin_overview');
await run(()=>button('Open clan chat').click());assert.equal(F.chat,1);
assert.equal(document.querySelector('[data-clan-viewer]'),null);
await run(()=>button('Enter 3D stronghold').click());await run(()=>{});
assert.ok(document.querySelector('[data-clan-viewer]').dataset.environment.endsWith('ModularEnvironment.fbx'),'existing room and avatar viewer are preserved');
await run(()=>byLabel('Expand stronghold view').click());assert.ok(document.querySelector('.clan-home.is-viewer-expanded'));
await run(()=>byLabel('Reduce stronghold view').click());
await run(()=>button('Pinned').click());assert.equal(document.querySelectorAll('.clan-announcement').length,1);
await run(()=>button('All updates').click());
await run(()=>button('Post update').click());
assert.ok(document.querySelector('[role="dialog"]'));
assert.equal(document.querySelector('[data-clan-viewer]'),null,'viewer pauses while composing');
const textarea=document.getElementById('clan-update-content');
await run(()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'We completed the new guild mission.');textarea.dispatchEvent(new window.Event('input',{bubbles:true}));});
F.failPublish=true;await run(()=>button('Publish update').click());
assert.ok(document.querySelector('[role="alert"]').textContent.includes('retry publishing'));
assert.equal(textarea.value,'We completed the new guild mission.');
F.failPublish=false;await run(()=>button('Publish update').click());
assert.equal(F.writes.length,1);assert.equal(F.writes[0].divisionId,'guild');assert.equal(F.writes[0].isAnnouncement,true);assert.equal(F.writes[0].channelId,'clan_global');
assert.ok(document.querySelector('.clan-announcement-list').textContent.includes('We completed the new guild mission.'));
assert.ok(document.querySelector('[data-clan-viewer]'),'closing the composer resumes the requested viewer');
await unmount();
F.role='member';await mount();
assert.equal(button('Post update'),undefined);
assert.ok(!document.querySelector('.clan-home-shortcuts').textContent.includes('Manage clan'));
assert.ok(document.querySelector('.clan-announcement-list').textContent.includes('We completed the new guild mission.'));
await unmount();dom.window.close();
console.log('PASS: Clan homepage identity, announcements/pinned filter, saved progress and achievements, roster/game/admin/chat actions, existing 3D viewer toggle/expansion, officer publishing with retry retention, and member role restrictions.');
