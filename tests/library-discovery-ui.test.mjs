import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/LunaTemplate',pretendToBeVisual:true});
for(const name of ['window','document','HTMLElement','Element','Node','NodeFilter','HTMLInputElement','HTMLSelectElement','SVGElement','MutationObserver','Event','CustomEvent','localStorage'])globalThis[name]=dom.window[name];
globalThis.getComputedStyle=window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);
Object.defineProperty(globalThis,'navigator',{value:window.navigator,configurable:true});
Object.defineProperty(window,'innerWidth',{value:1280,configurable:true});
Object.defineProperty(window,'innerHeight',{value:900,configurable:true});
window.matchMedia=()=>({matches:true,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height,x:left,y:top});
window.HTMLElement.prototype.getBoundingClientRect=function(){
  return this.hasAttribute('data-luna-environment-hub')?rect(330,80,270,96):this.classList.contains('ll-results')?rect(0,390,330,446):rect(0,0,330,800);
};
window.HTMLElement.prototype.scrollBy=function({left}){this.scrollLeft=(this.scrollLeft||0)+left;this.dispatchEvent(new Event('scroll'));};
window.HTMLElement.prototype.scrollIntoView=()=>{};
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const {QueryClient,QueryClientProvider}=createRequire(import.meta.url)('@tanstack/react-query');
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
const games=[
  {id:'z',title:'Zulu',genre:'Shooter'}, {id:'a',title:'Alpha',genre:'RPG'},
  {id:'b',title:'Bravo',genre:'RPG'}, {id:'c',title:'Charlie',genre:'Action'},
  {id:'d',title:'Delta',genre:'Action'}, {id:'e',title:'Echo',genre:'Racing'},
  {id:'xe',title:'Adam XE',genre:'Action'},
];
const cards=[
  {id:'2',name:'Zephyr',game_id:'a',card_type:'Ability',rarity:'Rare',owned:true,user_card_id:'owned-2'},
  {id:'1',name:'Aether',game_id:'a',card_type:'Equipment',rarity:'Epic',owned:false},
  {id:'3',name:'Arc wave',game_id:'b',card_type:'Ability',rarity:'Rare',owned:false},
  {id:'4',name:'Chidori',game_id:'xe',card_type:'Ability',rarity:'Unique',owned:true,user_card_id:'owned-4'},
];
const calls=[];
globalThis.libraryFixture={
  user:{id:'u'}, games,
  sdk:{entities:{Game:{list:async()=>{calls.push('games');return games;}}},functions:{invoke:async(name)=>{
    assert.equal(name,'cardCollection');calls.push(name);return {data:{cards}};
  }}},
};
const built=await build({
  stdin:{contents:"export {default as Browser} from './src/components/dashboard/gamehub/LibraryBrowser.jsx';export {default as Explorer} from './src/components/dashboard/gamehub/LibraryCardExplorer.jsx';export {default as Owned} from './src/components/dashboard/gamehub/OwnedLibraryView.jsx';",resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
  plugins:[{name:'library-fixtures',setup(b){
    b.onResolve({filter:/base44Client$|AuthContext$|useOwnedGames$|CrossScrollGameMenu$|MysteryCardDetail$|OwnedLibraryTile$|LibraryLandingPage$|RelatedLibraryGames$/},a=>({path:a.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'jsx',contents:
      a.path.endsWith('base44Client')?'export const base44=globalThis.libraryFixture.sdk;':
      a.path.endsWith('AuthContext')?'export const useAuth=()=>({user:globalThis.libraryFixture.user});':
      a.path.endsWith('useOwnedGames')?'export default ()=>({games:globalThis.libraryFixture.games,isLoading:false,isError:false,refetch:()=>{}});':
      a.path.endsWith('CrossScrollGameMenu')?'export default function Rail({games}){return <div data-testid="owned-rail">{games.map(g=><button key={g.id}>{g.title}</button>)}</div>}':
      a.path.endsWith('OwnedLibraryTile')?'export default function Tile({game,onSelect}){return <button onClick={()=>onSelect(game)}>{game.title}</button>}':
      a.path.endsWith('MysteryCardDetail')?'export default function Detail({card}){return <div data-testid="owned-card-detail">{card.title} · {card.user_card_id}</div>}':
      'export default function Unused(){return null;}'
    }));
  }}],
});
const filename=process.cwd()+'/tests/__library_bundle.cjs',module=new Module(filename);
module.paths=Module._nodeModulePaths(process.cwd());module._compile(built.outputFiles[0].text,filename);
const {Browser,Explorer,Owned}=module.exports;
let live;
const HarnessComponent=()=>{
  const [filters,setFilters]=React.useState({view:'library',scope:'games',search:'',genre:'all',gameId:null});
  const [full,setFull]=React.useState(false);
  const change=React.useCallback(patch=>setFilters(old=>({...old,...patch})),[]);
  live={filters,full};
  return React.createElement('main',{'data-luna-dashboard-content':true},
    React.createElement('div',{'data-luna-environment-hub':true}),
    React.createElement(Browser,{filters,onFiltersChange:change,fullView:full,onToggleFullView:()=>setFull(x=>!x)}),
    full&&(filters.view==='cards'?React.createElement(Explorer,{full:true,filters,onChange:change,onClose:()=>setFull(false)}):React.createElement(Owned,{filters,onFiltersChange:change,onClose:()=>setFull(false)}))
  );
};
const root=createRoot(document.getElementById('root'));
const run=(fn=()=>{},ms=45)=>act(async()=>{await fn();await new Promise(resolve=>setTimeout(resolve,ms));});
const label=(name,within=document)=>{const el=[...within.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name);assert.ok(el,'Missing '+name);return el;};
const changeSelect=async(value)=>run(()=>{const el=document.querySelector('select[aria-label="Filter library by genre"]');el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));});
const search=async(value)=>run(()=>{const el=document.querySelector('input[type="search"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});
const shownGames=()=>[...document.querySelector('[data-testid="library-discovery-games"]')?.querySelectorAll('.ll-game strong')||[]].map(e=>e.textContent);
let mounted=false;
try{
  await run(()=>{root.render(React.createElement(QueryClientProvider,{client},React.createElement(HarnessComponent)));mounted=true;});
  assert.equal(calls.length,0,'normal library does not fetch the card catalog');
  assert.equal(document.querySelectorAll('.ll-search-line').length,1);
  assert.ok(![...document.querySelectorAll('button')].some(b=>['All','Favorites'].includes(b.textContent.trim())));
  await search('brav');
  assert.equal(document.querySelector('[data-testid="owned-rail"]').textContent,'Bravo');
  await run(()=>label('Full game library').click());
  assert.equal(document.querySelector('[data-testid="owned-library-tiles"]').textContent,'Bravo','Full View shares search');
  await run(()=>label('Close full library').click());
  await search('');
  await run(()=>label('Open card explorer').click());await run();
  assert.deepEqual(shownGames(),['AdamXE','Alpha','Bravo','Charlie','Delta','Echo','Zulu']);
  assert.equal(calls.filter(x=>x==='cardCollection').length,1);
  assert.equal(calls.filter(x=>x==='games').length,1);
  await changeSelect('RPG');
  assert.deepEqual(shownGames(),['Alpha','Bravo']);
  await run(()=>label('Show cards for Alpha').click(),100);await run();
  let leaf=document.querySelector('[data-testid="library-card-scroll"]');
  assert.ok(leaf);assert.equal(leaf.style.left,'330px');assert.equal(leaf.style.maxWidth,'270px');
  assert.deepEqual([...leaf.querySelectorAll('.ll-card>strong')].map(e=>e.textContent),['Aether','Zephyr']);
  assert.equal(label('Show cards for Alpha').getAttribute('aria-expanded'),'true');
  await run(()=>label('Show cards for Alpha').click(),100);await run();
  assert.equal(document.querySelector('[data-testid="library-card-scroll"]'),null,'same game contracts the leaf');
  await run(()=>label('Browse by card').click());
  assert.deepEqual([...document.querySelectorAll('.ll-card>strong')].map(e=>e.textContent),['Aether','Arc wave','Zephyr']);
  await search('zeph');
  assert.deepEqual([...document.querySelectorAll('.ll-card>strong')].map(e=>e.textContent),['Zephyr']);
  await run(()=>label('Full card explorer').click());await run();
  assert.equal(document.querySelector('[aria-label="Full card explorer"]').textContent.includes('Zephyr'),true);
  assert.equal(document.querySelector('[aria-label="Full card explorer"]').querySelectorAll('.ll-card').length,1);
  await run(()=>label('Close full card explorer').click());
  await run(()=>label('View Zephyr card').click());await run();
  assert.equal(document.querySelector('[data-testid="owned-card-detail"]').textContent,'Zephyr · owned-2');
  await run(()=>document.querySelector('[role="dialog"] button').click());await run();

  let speech;
  window.SpeechRecognition=class{constructor(){speech=this;}start(){}stop(){this.onend?.();}abort(){}};
  await run(()=>label('Search cards by voice').click());
  await run(()=>{speech.onresult({results:[[{transcript:'Arc'}]]});speech.onend();});
  assert.equal(live.filters.search,'Arc');
  assert.equal(document.querySelector('.ll-card>strong').textContent,'Arc wave');
  await run(()=>label('View Arc wave card').click());await run();
  assert.ok(document.querySelector('[role="dialog"]').textContent.includes('To unlock'));
  assert.equal(document.querySelector('[data-testid="owned-card-detail"]'),null);
  await run(()=>document.querySelector('[role="dialog"] button').click());await run();
  await search('');await changeSelect('AdamXE');
  assert.equal(document.querySelector('.ll-card>strong').textContent,'Chidori');
  await run(()=>label('Browse by game').click());
  assert.deepEqual(shownGames(),['AdamXE']);
  await run(()=>label('Show cards for AdamXE').click());await run();
  await run(()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})),100);await run();
  assert.equal(live.filters.gameId,null);
  assert.equal(document.activeElement.getAttribute('aria-label'),'Show cards for AdamXE');
  await run(()=>label('Return to game library').click());
  assert.ok(document.querySelector('[data-testid="owned-rail"]'));
  assert.equal(calls.filter(x=>x==='cardCollection').length,1,'browse, search and full view reuse the catalog');
  console.log('PASS: shared search/full view, game/card filters, alphabetical genre results, scoped scroll geometry, repeat-click collapse, voice search, owned/unowned details, Escape focus and AdamXE cards.');
}finally{
  if(mounted)await act(async()=>root.unmount());client.clear();dom.window.close();delete globalThis.libraryFixture;
}
