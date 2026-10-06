import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module,{createRequire} from 'node:module';
import vm from 'node:vm';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
import {makeRewardFixture} from './helpers/reward-fixture.mjs';

const require=createRequire(import.meta.url);
const loadPure=path=>{
 const result=buildSync({entryPoints:[path],bundle:true,write:false,format:'cjs',platform:'node'});
 const mod=new Module(process.cwd()+'/tests/__studio_pure.cjs');
 mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(result.outputFiles[0].text,process.cwd()+'/tests/__studio_pure.cjs');
 return mod.exports;
};
const {buildStudioDirectory,studioKey,validateStudioPost}=loadPure('base44/shared/studioHub.ts');
const {filterStudios}=loadPure('src/components/store/devstore/studioDiscovery.js');
const f=makeRewardFixture();
let actor={id:'editor',role:'user'},serial=0,handler,calls=[],pausePublish=null;
const service=new Proxy(f.entities(),{get(target,key){
 if(key!=='StudioUpdate')return target[key];
 return {...target.StudioUpdate,
  create:async data=>{const row={...structuredClone(data),id:'update-'+(++serial)};f.rows('StudioUpdate').push(row);return structuredClone(row);},
  update:async(id,data)=>{const row=f.rows('StudioUpdate').find(p=>p.id===id);assert(row);Object.assign(row,structuredClone(data));return structuredClone(row);}
 };
}});
const server=buildSync({entryPoints:['base44/functions/studio-hub/entry.ts'],bundle:true,write:false,format:'cjs',platform:'node',external:['npm:*']});
const serverModule={exports:{}};
vm.runInNewContext(server.outputFiles[0].text,{module:serverModule,exports:serverModule.exports,Response,Date,console,Deno:{serve:fn=>handler=fn},require:()=>({createClientFromRequest:()=>({auth:{me:async()=>actor},entities:f.entities(actor),asServiceRole:{entities:service}})})});
async function request(action,data={}){
 const response=await handler(new Request('https://test.local',{method:'POST',body:JSON.stringify({action,data})}));
 return {status:response.status,data:await response.json()};
}
const games=Array.from({length:40},(_,i)=>({id:'game-'+i,title:'Game '+String(i).padStart(2,'0'),genre:i%2?'rpg':'action',price:i%2?15:0,release_date:'2025-06-01',created_date:'2026-01-01',status:'available',...(i===1?{demo_url:'https://demo.example/one'}:{}),...(i===3?{demo_url:'javascript:alert(1)'}:{})}));
function seed(){
 f.reset();actor={id:'editor',role:'user'};serial=0;calls=[];pausePublish=null;
 f.rows('Game').push(...structuredClone(games));
 f.rows('StudioProfile').push(
  {id:'alpha',developer_name:'Alpha Studio',game_key:'Game 00',tagline:'Explore new worlds',notable_games:games.slice(0,38).map(g=>({title:g.title})),upcoming_projects:[{title:'Next World',description:'An upcoming adventure.',status:'in_development'}]},
  {id:'alpha-old',developer_name:'Alpha Studio, Inc.',game_key:'Game 01',upcoming_projects:[{title:'Next World'}]},
  {id:'beta',developer_name:'Beta Games',game_key:'Game 38',notable_games:[{title:'Game 39'}]},
  ...Array.from({length:20},(_,i)=>({id:'studio-'+i,developer_name:'Catalog Studio '+String(i).padStart(2,'0')}))
 );
 f.rows('StudioMember').push({id:'membership',studio_key:'alpha-studio',user_id:'editor',role:'editor',active:true});
 f.rows('StudioUpdate').push({id:'news',studio_key:'alpha-studio',studio_name:'Alpha Studio',author_user_id:'other-editor',title:'A new world is taking shape',body:'We are sharing an early look at our next adventure. '.repeat(16),category:'development',status:'published',published_at:'2026-01-01',game_id:'game-0',project_title:'Next World'});
}
const validPost={studio_key:'alpha-studio',title:'Development diary',body:'A detailed update about our next game.',category:'development',status:'published',game_id:'game-0'};

test('directory merges duplicate studio profiles and connects game titles without duplicate games',async()=>{
 seed();const response=await request('directory');assert.equal(response.status,200);
 const studios=response.data.studios,alpha=studios.find(s=>s.key==='alpha-studio');
 assert.equal(studios.length,22);assert.equal(alpha.profile_ids.length,2);
 assert.equal(alpha.games.length,38);assert.equal(alpha.projects.length,1);
 assert.deepEqual(response.data.editable_studios,['alpha-studio']);
 assert.equal(studioKey('Álpha Studio, Inc.'),'alpha-studio');
 assert.equal(filterStudios(studios,{query:'game 00'}).length,1);
 assert.equal(filterStudios(studios,{letter:'B'})[0].key,'beta-games');
 assert.equal(filterStudios(studios,{status:'projects'}).length,1);
 assert.equal(filterStudios(studios,{query:'Alpha',genre:'rpg'}).length,1);
 assert.equal(filterStudios(studios,{sort:'za'})[0].name,'Catalog Studio 19');
 const merged=buildStudioDirectory([{developer_name:'Team',game_key:'Demo Game'}],[{id:'one',title:'Demo Game'},{id:'two',title:'Demo Game'}]);
 assert.equal(merged[0].games.length,1);
});
test('only authorized studio editors can publish; author and studio identity are server-controlled',async()=>{
 seed();actor=null;assert.equal((await request('savePost',validPost)).status,401);
 actor={id:'outsider',role:'user'};assert.equal((await request('savePost',validPost)).status,403);
 actor={id:'editor',role:'user'};
 assert.equal((await request('savePost',{...validPost,studio_key:'beta-games'})).status,403);
 assert.equal((await request('savePost',{...validPost,game_id:'game-39'})).status,400);
 assert.equal((await request('savePost',{...validPost,image_url:'javascript:alert(1)'})).status,400);
 assert.equal((await request('savePost',{...validPost,body:'short'})).status,400);
 const saved=await request('savePost',{...validPost,author_user_id:'spoof',studio_name:'Spoof'});
 assert.equal(saved.status,200);assert.equal(saved.data.post.author_user_id,'editor');assert.equal(saved.data.post.studio_name,'Alpha Studio');
 const edited=await request('savePost',{...validPost,id:'news',title:'Edited update',author_user_id:'spoof'});
 assert.equal(edited.status,200);assert.equal(edited.data.post.author_user_id,'other-editor');assert.equal(edited.data.post.published_at,'2026-01-01');
 f.rows('StudioUpdate').push({...saved.data.post,id:'foreign',studio_key:'beta-games'});
 assert.equal((await request('savePost',{...validPost,id:'foreign'})).status,404);
 actor={id:'admin',role:'admin'};
 assert.equal((await request('savePost',{...validPost,studio_key:'beta-games',game_id:'game-39'})).status,200);
 assert.throws(()=>validateStudioPost({...validPost,category:'invalid'},{key:'alpha-studio',name:'Alpha',games}),/category/);
});
test('published updates paginate, filter and exclude drafts and private author IDs',async()=>{
 seed();f.rows('StudioUpdate').length=0;
 for(let i=0;i<27;i++)f.rows('StudioUpdate').push({id:'post-'+i,studio_key:i===26?'beta-games':'alpha-studio',author_user_id:'private',title:'Update '+i,body:'Development report',category:i===25?'release':'development',status:i===24?'draft':'published',published_at:new Date(1700000000000+i*1000).toISOString()});
 actor=null;
 const first=(await request('feed')).data;assert.equal(first.posts.length,12);assert(first.has_more);assert.equal(first.next_offset,12);assert(!('author_user_id' in first.posts[0]));assert(!first.posts.find(p=>p.id==='post-24'));
 const second=(await request('feed',{offset:12})).data;
 const third=(await request('feed',{offset:24})).data;
 assert.equal(new Set([...first.posts,...second.posts,...third.posts].map(p=>p.id)).size,26);
 assert.equal(third.has_more,false);
 assert.equal((await request('feed',{category:'release'})).data.posts.length,1);
 assert.equal((await request('feed',{studio_key:'beta-games'})).data.posts.length,1);
 assert.equal((await request('feed',{offset:-1})).status,400);
 assert.equal((await request('feed',{category:'private'})).status,400);
});
test('entity permissions block client-authored posts and self-assigned editor membership',async()=>{
 seed();
 await assert.rejects(f.entities(actor).StudioUpdate.create({...validPost,studio_name:'Alpha',author_user_id:actor.id}),/Forbidden/);
 await assert.rejects(f.entities(actor).StudioUpdate.update('news',{title:'Unauthorized direct write'}),/Forbidden/);
 await assert.rejects(f.entities(actor).StudioMember.create({studio_key:'beta-games',user_id:actor.id,role:'owner'}),/Forbidden/);
 f.rows('StudioUpdate').push({id:'draft',status:'draft',author_user_id:'someone-else'});
 assert(!((await f.entities(actor).StudioUpdate.list()).some(p=>p.id==='draft')));
 const schema=JSON.parse(readFileSync('base44/entities/studio-update.jsonc','utf8'));
 assert.equal(schema.rls.delete,false);
});
test('catalog pagination reads more than 200 records and terminates repeated pages',async()=>{
 seed();for(let i=0;i<210;i++)f.rows('StudioProfile').push({id:'bulk-'+i,developer_name:'Bulk Studio '+i});
 assert.equal((await request('directory')).data.studios.length,232);
});

const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/Store?mode=devcards',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','KeyboardEvent','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement'])globalThis[key]=dom.window[key];
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
globalThis.localStorage=window.localStorage;
Object.defineProperty(globalThis,'navigator',{value:window.navigator,configurable:true});
window.matchMedia=()=>({matches:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const {QueryClient,QueryClientProvider}=require('@tanstack/react-query');
const {MemoryRouter}=require('react-router-dom');
globalThis.studioTestSDK={
 functions:{invoke:async(name,body)=>{
  calls.push({name,body});
  if(name==='storeDiscovery'){
   if(body.action==='sales')return {data:{sales:{'game-0':4},complete:true}};
   return {data:{preference:{genres:[],played_game_ids:[],use_play_history:true},played_game_ids:[],owned_game_ids:[]}};
  }
  assert.equal(name,'studio-hub');
  if(body.action==='savePost'&&pausePublish)await new Promise(resolve=>pausePublish.resolve=resolve);
  const result=await request(body.action,body.data);
  if(result.status>=400)throw Object.assign(new Error(result.data.error),{response:{data:result.data}});
  return {data:result.data};
 }},
 entities:{StudioUpdate:{subscribe:()=>()=>{}}},
 integrations:{Core:{UploadFile:async()=>({file_url:'https://images.example/upload.webp'})}}
};
globalThis.studioTestAuth=()=>({user:actor,isAuthenticated:!!actor});
const bundle=await import('esbuild').then(({build})=>build({
 stdin:{contents:"export {default as Dev} from './src/components/store/DevCardsContent.jsx';export {default as Store} from './src/components/store/redesign/StorefrontLayout.jsx';",resolveDir:process.cwd(),loader:'jsx'},
 bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
 plugins:[{name:'studio-sdk',setup(b){
  b.onResolve({filter:/^lucide-react$/},()=>({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
  b.onResolve({filter:/base44Client|AuthContext|WishlistButton/},args=>({path:args.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:args.path.includes('base44Client')?'export const base44=globalThis.studioTestSDK;':args.path.includes('AuthContext')?'export const useAuth=()=>globalThis.studioTestAuth();':'export default function WishlistButton(){return null;}'}));
 }}]
}));
const mod=new Module(process.cwd()+'/tests/__studio_ui.cjs');mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(bundle.outputFiles[0].text,process.cwd()+'/tests/__studio_ui.cjs');
const {Dev,Store}=mod.exports;
let root,client,selectedGame;
const run=fn=>act(async()=>{await fn?.();await new Promise(resolve=>setTimeout(resolve,25));});
const button=(text,scope=document)=>{const found=[...scope.querySelectorAll('button')].find(el=>el.textContent.trim()===text||el.getAttribute('aria-label')===text);assert(found,'Missing button: '+text);return found;};
const click=value=>run(()=>{const el=typeof value==='string'?button(value):value;assert(el&&!el.disabled,'Expected enabled button');el.click();});
const input=(el,value)=>run(()=>{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});
async function renderUI(Component,props={},url='/Store?mode=devcards'){
 client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});root=createRoot(document.getElementById('root'));selectedGame=null;
 await run(()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(MemoryRouter,{initialEntries:[url],future:{v7_startTransition:true,v7_relativeSplatPath:true}},React.createElement(Component,{onNavigateToGame:id=>selectedGame=id,...props})))));
 await run();
}
async function cleanup(){await run(()=>root.unmount());client.clear();}
test('Dev renders actual projects, A–Z search, 15-studio pages, profiles and game navigation',async()=>{
 seed();await renderUI(Dev);
 try{
  assert(document.querySelector('.dev-project-spotlight').textContent.includes('Next World'));
  await click('Studios A–Z');assert.equal(document.querySelectorAll('.dev-studio-card').length,15);
  await click('Next');assert.equal(document.querySelectorAll('.dev-studio-card').length,7);
  await input(document.querySelector('[aria-label="Search studios and projects"]'),'Alpha');
  assert.equal(document.querySelectorAll('.dev-studio-card').length,1);
  await click(document.querySelector('.dev-studio-card'));
  assert.equal(document.querySelector('.dev-profile h1').textContent,'Alpha Studio');
  await click('Games');assert.equal(document.querySelectorAll('.dev-games-grid .sf-game').length,15);
  await click(document.querySelector('.dev-games-grid .sf-game-open'));assert.equal(selectedGame,'game-0');
  await click(button('In development',document.querySelector('.dev-profile-tabs')));
  assert(document.querySelector('.dev-project-grid').textContent.includes('Next World'));
  await click('About');assert(document.querySelector('.dev-about').textContent.includes('Alpha Studio'));
  await click('All studios');assert.equal(document.querySelectorAll('.dev-studio-card').length,1);
  await click('Clear studio filters');
  await click('Studios starting with B');assert.equal(document.querySelectorAll('.dev-studio-card').length,1);assert.match(document.querySelector('.dev-studio-card').textContent,/Beta Games/);
 }finally{await cleanup();}
});
test('studio update UI expands long posts, filters types and publishes once through the authorized backend',async()=>{
 seed();await renderUI(Dev);
 try{
  assert(document.querySelector('.dev-post-body'),document.body.textContent+' '+JSON.stringify(calls));
  assert.equal(document.querySelector('.dev-post-body').getAttribute('data-expanded'),'false');
  await click('Read full update');assert.equal(document.querySelector('.dev-post-body').getAttribute('data-expanded'),'true');
  const filter=document.querySelector('[aria-label="Filter studio updates"]');
  await run(()=>{filter.value='release';filter.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(document.querySelectorAll('.dev-post').length,0);
  await run(()=>{filter.value='all';filter.dispatchEvent(new Event('change',{bubbles:true}));});
  await click('Write update');
  const form=document.querySelector('.dev-composer form');
  await input(form.querySelector('input[minlength="3"]'),'An editor update');
  await input(form.querySelector('textarea'),'The next world is in development. Here is our new milestone.');
  assert.equal(document.querySelectorAll('[aria-label="Publishing studio"] option').length,1);
  pausePublish={};
  await run(()=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  assert.equal(calls.filter(c=>c.body.action==='savePost').length,1);
  await run(()=>{pausePublish.resolve();pausePublish=null;});await run();
  assert.equal(f.rows('StudioUpdate').length,2);
  assert.equal(document.querySelector('.dev-composer'),null);
  assert(document.querySelector('.dev-posts').textContent.includes('An editor update'));
 }finally{await cleanup();}
});
test('Store shelves remain bounded; full catalog paginates and demos require playable links',async()=>{
 seed();await renderUI(Store,{games,searchTerm:''},'/Store');
 try{
  assert.equal(document.querySelectorAll('.sf-top-seven li').length,1);
  assert(document.querySelectorAll('.sf-shelf .sf-game').length<=18);
  await click('All games');assert.equal(document.querySelectorAll('.sf-game-grid .sf-game').length,15);
  const first=document.querySelector('.sf-game h3').textContent;
  await click('Next');assert.equal(document.querySelectorAll('.sf-game-grid .sf-game').length,15);assert.notEqual(document.querySelector('.sf-game h3').textContent,first);
  await click('RPG');assert(document.querySelector('.sf-pagination').textContent.includes('Page 1 of 2'));
  assert.equal(document.querySelectorAll('.sf-game-grid .sf-game').length,15);
  await click('Reset filters');await click('Demos');
  assert.equal(document.querySelectorAll('.sf-game-grid .sf-game').length,1);
  assert.equal(document.querySelector('.sf-demo-link').href,'https://demo.example/one');
  assert.equal(document.querySelector('.sf-demo-link').rel,'noopener noreferrer');
  await click(document.querySelector('.sf-game-open'));assert.equal(selectedGame,'game-1');
 }finally{await cleanup();}
});
test.after(()=>dom.window.close());
