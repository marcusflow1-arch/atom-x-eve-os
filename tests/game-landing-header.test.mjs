import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/GameDetail?id=example'});
for(const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent'])globalThis[name]=dom.window[name];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{act}=React;
const {createRoot}=await import('react-dom/client');
const require=createRequire(import.meta.url);
const calls={navigation:null,opened:0,selected:null};
const code=await build({
 stdin:{contents:"export {default as Header} from './src/components/game/detail/GameStoreHeader.jsx';export {default as Frame} from './src/components/shared/GlassPageFrame.jsx';",loader:'jsx',resolveDir:process.cwd()},
 bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
 plugins:[{name:'isolated-legacy-overlays',setup(b){
  b.onResolve({filter:/^lucide-react$/},()=>({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
  b.onResolve({filter:/react-router-dom|GameStreamPanel|StudioProfileView|DevGamesPanel/},args=>({path:args.path,namespace:'mock'}));
  b.onLoad({filter:/.*/,namespace:'mock'},args=>({loader:'js',contents:
   args.path==='react-router-dom'?'export const useNavigate=()=>path=>globalThis.calls.navigation=path;':
   args.path.includes('DevGamesPanel')?'export default function DevGamesPanel({open}){return open?globalThis.React.createElement("div",{"data-test":"games-panel"},"Games panel"):null;}':
   args.path.includes('StudioProfileView')?'export default function StudioProfileView(){return globalThis.React.createElement("div",{"data-test":"studio-panel"},"Studio overlay");}':
   'export default function GameStreamPanel(){return globalThis.React.createElement("div",{"data-test":"stream-panel"},"Stream overlay");}'
  }));
 }}]
});
const module={exports:{}};
vm.runInNewContext(code.outputFiles[0].text,{module,exports:module.exports,require,globalThis:{calls,React},window,document,Event:dom.window.Event,console,setTimeout,clearTimeout,setInterval,clearInterval});
const {Header,Frame}=module.exports;
const games=[{id:'frontier',title:'Glass Frontier',genre:'rpg'},{id:'origin',title:'Origins',genre:'adventure'}];
function App(){
 const [query,setQuery]=React.useState('');
 return React.createElement(Frame,{showTriggerTab:true,gameData:games[0],
  topContent:React.createElement(Header,{user:{full_name:'Player',avatar_gamer_points:1200},cartCount:2,games,searchTerm:query,onSearchChange:setQuery,onSelectGame:id=>calls.selected=id,onSearchOpen:()=>calls.opened++}),
  bottomContent:React.createElement('span',null,'Store navigation')
 },React.createElement('div',null,'Game page'));
}
let drawer=0;window.addEventListener('openAppDrawer',()=>drawer++);
const root=createRoot(document.getElementById('root'));
const run=async fn=>act(async()=>{fn();await new Promise(resolve=>setTimeout(resolve,10));});
await run(()=>root.render(React.createElement(App)));
const byLabel=label=>document.querySelector('[aria-label="'+label+'"]');
await run(()=>byLabel('Open main navigation').click());assert.equal(drawer,1);
await run(()=>byLabel('Luna Dashboard').click());assert.equal(calls.navigation,'/LunaTemplate');
await run(()=>byLabel('Shopping cart, 2 items').click());assert.equal(calls.navigation,'/Cart');
assert.ok(document.body.textContent.includes('1,200'));
const search=byLabel('Search the store');
await run(()=>search.focus());
assert.ok(document.querySelector('[role="listbox"]'),'search presents suggestions on focus');
assert.ok(calls.opened>0,'the existing second search panel is requested');
await run(()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(search,'Glass');search.dispatchEvent(new window.Event('input',{bubbles:true}));});
await run(()=>search.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
assert.equal(calls.selected,'frontier','Enter opens the matching game');
await run(()=>byLabel('Studio').click());
assert.ok(document.querySelector('[data-test="studio-panel"]'),'Studio opens the original overlay');
assert.equal(byLabel('Studio').getAttribute('aria-pressed'),'true');
await run(()=>byLabel('Games').click());
assert.ok(document.querySelector('[data-test="games-panel"]'),'Games opens the original developer-games panel');
assert.equal(document.querySelector('[data-test="studio-panel"]'),null,'opening Games closes Studio');
await run(()=>byLabel('Stream').click());
assert.ok(document.querySelector('[data-test="stream-panel"]'),'Stream opens the original stream overlay');
assert.equal(document.querySelector('[data-test="games-panel"]'),null,'opening Stream closes Games');
await run(()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape'})));
assert.equal(document.querySelector('[data-test="stream-panel"]'),null,'Escape closes the footer overlay');
await run(()=>root.unmount());dom.window.close();
console.log('PASS: game-page header navigation/balance/cart, catalog search, and restored footer-owned Games/Studio/Stream panels.');
