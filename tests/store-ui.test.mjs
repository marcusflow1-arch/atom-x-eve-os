import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
globalThis.localStorage=dom.window.localStorage;
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
window.matchMedia=()=>({matches:true});
const React=await import('react'),{act}=React;
const {createRoot}=await import('react-dom/client');
const {QueryClient,QueryClientProvider}=await import('@tanstack/react-query');
let preference={genres:[],played_game_ids:[],use_play_history:true},saves=0,selected;
const base44={functions:{invoke:async(name,{action,data})=>{
 assert.equal(name,'storeDiscovery');
 if(action==='sales')return {data:{sales:{sky:2},complete:true}};
 if(action==='save'){saves++;preference=structuredClone(data);return {data:{preference}};}
 return {data:{preference,played_game_ids:[],owned_game_ids:['sky']}};
}}};
const code=await build({
 stdin:{contents:"export {default as Store} from './src/components/store/redesign/StorefrontLayout.jsx';export {default as Search} from './src/components/store/redesign/StoreSearch.jsx';",resolveDir:process.cwd(),loader:'jsx'},
 bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},
 plugins:[{name:'isolated-sdk',setup(b){
  b.onResolve({filter:/base44Client|AuthContext|WishlistButton/},args=>({path:args.path,namespace:'test'}));
  b.onLoad({filter:/.*/,namespace:'test'},args=>({loader:'js',contents:args.path.includes('base44Client')?'export const base44=globalThis.testSDK;':args.path.includes('AuthContext')?"export const useAuth=()=>({user:{id:'test-player',purchased_items:['sky']},isAuthenticated:true});":'export default function WishlistButton(){return null;}'}));
 }}]
});
const module={exports:{}};
vm.runInNewContext(code.outputFiles[0].text,{module,exports:module.exports,require:createRequire(import.meta.url),globalThis:{testSDK:base44},window,document,localStorage,console,setTimeout,clearTimeout,setInterval,clearInterval});
const {Store,Search}=module.exports;
const games=[
 {id:'sky',title:'Skybound',genre:'rpg',price:20,release_date:'2025-01-01'},
 {id:'sky2',title:'Skybound II',genre:'rpg',price:30,release_date:'2025-02-01'},
 {id:'city',title:'City Lights',genre:'simulation',price:0,release_date:'2025-03-01'},
 {id:'race',title:'Night Racer',genre:'racing',price:15,release_date:'2025-04-01'}
];
function App(){
 const [query,setQuery]=React.useState('');
 return React.createElement(React.Fragment,null,
  React.createElement(Search,{games,value:query,onChange:setQuery,onSelect:id=>selected=id}),
  React.createElement(Store,{games,searchTerm:query,onClearSearch:()=>setQuery(''),onNavigateToGame:id=>selected=id})
 );
}
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
const root=createRoot(document.getElementById('root'));
const settle=()=>new Promise(resolve=>setTimeout(resolve,5));
const run=async fn=>{await act(async()=>{fn();await settle();});};
const buttons=(scope=document)=>[...scope.querySelectorAll('button')];
const button=(text,scope=document)=>{const b=buttons(scope).find(x=>x.textContent.trim()===text);assert.ok(b,'Missing button: '+text);return b;};
const text=()=>document.body.textContent;
const input=async(el,value)=>{
 await run(()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}));});
};
await run(()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(App))));
await run(()=>{});
assert.ok(text().includes('Browse by genre'));
assert.ok(text().includes('Worth discovering'));
await run(()=>button('Filters').click());
const filterPanel=document.getElementById('store-filters');
const price=filterPanel.querySelector('select');
await run(()=>{price.value='free';price.dispatchEvent(new window.Event('change',{bubbles:true}));});
assert.ok(text().includes('1 game match your filters'));
assert.ok(document.querySelector('main article h3').textContent==='City Lights');
await run(()=>button('RPG',filterPanel).click());
assert.ok(text().includes('No games match these filters.'));
assert.equal(document.querySelectorAll('main article').length,0);
await run(()=>button('Reset filters').click());
await run(()=>button('Top sellers',document.querySelector('nav')).click());
assert.equal(document.querySelector('main article h3').textContent,'Skybound');
const search=document.querySelector('[role="combobox"]');
await input(search,'City');
assert.equal(document.querySelector('main article h3').textContent,'City Lights','global search must work while Top sellers is selected');
assert.ok(document.querySelector('[role="listbox"]'));
await run(()=>search.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})));
await run(()=>search.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
assert.equal(selected,'city');
await run(()=>document.querySelector('[aria-label="Clear search"]').click());
await run(()=>button('For you',document.querySelector('nav')).click());
const form=document.querySelector('form');
const rpg=[...form.querySelectorAll('label')].find(l=>l.textContent.trim()==='RPG');
await run(()=>rpg.querySelector('input').click());
await run(()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
assert.equal(saves,1);assert.deepEqual(preference.genres,['rpg']);
assert.ok(text().includes('Preferences saved.'));
assert.equal(document.querySelectorAll('main article').length,2);
await run(()=>button('All games',document.querySelector('nav')).click());
await run(()=>button('For you',document.querySelector('nav')).click());
assert.equal(document.querySelector('form input[type="checkbox"]').checked,false); // Racing sorts before RPG
assert.ok([...document.querySelectorAll('form label')].find(l=>l.textContent.trim()==='RPG').querySelector('input').checked);
await run(()=>root.unmount());client.clear();dom.window.close();
console.log('PASS: rendered store controls, combined filtering/empty results, global search, keyboard suggestions, navigation, and preference save/reload using an isolated SDK.');
