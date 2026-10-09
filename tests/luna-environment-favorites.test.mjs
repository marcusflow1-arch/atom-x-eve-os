import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import {
  MAX_ENVIRONMENT_PINS, environmentPinsKey, normalizeEnvironmentPins,
  readEnvironmentPins, toggleEnvironmentPin, writeEnvironmentPins,
} from '../src/components/dashboard/environmentQuickPins.mjs';

test('favorite environment slots are limited to four, unique, persistent and account-scoped', () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key) || null, setItem: (key, val) => map.set(key, val) };
  assert.equal(MAX_ENVIRONMENT_PINS, 4);
  assert.deepEqual(normalizeEnvironmentPins(['castle','castle','forest','desert','ocean','ignored']),['castle','forest','desert','ocean']);
  for(const id of ['castle','forest','desert','ocean']) assert.equal(toggleEnvironmentPin('first',id,storage).ok,true);
  const full = toggleEnvironmentPin('first','fifth',storage);
  assert.equal(full.full,true);
  assert.deepEqual(readEnvironmentPins('first',storage),['castle','forest','desert','ocean']);
  assert.deepEqual(readEnvironmentPins('second',storage),[]);
  assert.equal(environmentPinsKey('first') === environmentPinsKey('second'),false);
  assert.equal(toggleEnvironmentPin('first','castle',storage).ok,true);
  assert.deepEqual(readEnvironmentPins('first',storage),['forest','desert','ocean']);
  assert.deepEqual(writeEnvironmentPins('second',['forest'],storage).pins,['forest']);
  assert.deepEqual(readEnvironmentPins('first',storage),['forest','desert','ocean']);
  map.set(environmentPinsKey('first'),'{invalid');
  assert.deepEqual(readEnvironmentPins('first',storage),[]);
});

test('pin action in Hub populates shortcut; filled shortcut applies real 3D background without opening Hub',async()=>{
  const dom = new JSDOM('<div id="root"></div>',{url:'https://luna.local/LunaTemplate',pretendToBeVisual:true});
  for(const key of ['window','document','HTMLElement','Element','Node','SVGElement','Event','MouseEvent','CustomEvent','MutationObserver']) globalThis[key]=dom.window[key];
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  globalThis.navigator ||=dom.window.navigator;
  globalThis.__favoriteTest={
    user:{id:'p1'}, selected:[], opens:0,
    owned:[{id:'atrium',owner_id:'p1',name:'Sunlit Atrium',model_url:'/atrium.glb'}],
    scenes:[
      {id:'castle',name:'Castle Courtyard',environment_url:'/castle.glb',player_spawn:{x:1,y:2,z:3}},
      {id:'temple',name:'Ancient Temple',environment_url:'/temple.glb'},
      {id:'arena',name:'Arena',environment_url:'/arena.glb'}
    ],
    models:[
      {id:'forest',name:'Moonlit Forest Map',file_url:'/forest.glb'},
      {id:'desert',name:'Desert Landscape',file_url:'/desert.glb'},
    ]
  };
  const bundle=await build({
    stdin:{contents:"export { default as Picker } from './src/components/dashboard/EnvHubDrawer.jsx'; export {default as Slots} from './src/components/dashboard/EnvironmentFavoriteSlots.jsx';",resolveDir:process.cwd(),loader:'jsx'},
    bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},alias:{'@':process.cwd()+'/src'},
    plugins:[{name:'favorite-stubs',setup(b){
      b.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'mock'}));
      b.onLoad({filter:/^icons$/,namespace:'mock'},()=>({contents:"export const Check=()=>null;export const Globe2=()=>null;export const Loader2=()=>null;export const RefreshCw=()=>null;export const ImageOff=()=>null;export const Pin=()=>null;export const Plus=()=>null;export const X=()=>null;export const Mountain=()=>null;",loader:'js'}));
      b.onResolve({filter:/AuthContext$/},()=>({path:'auth',namespace:'mock'}));
      b.onLoad({filter:/^auth$/,namespace:'mock'},()=>({contents:"export const useAuth=()=>({user:globalThis.__favoriteTest.user});",loader:'js'}));
      b.onResolve({filter:/base44Client$/},()=>({path:'client',namespace:'mock'}));
      b.onLoad({filter:/^client$/,namespace:'mock'},()=>({contents:"export const base44={entities:{EnvironmentInstance:{filter:async()=>globalThis.__favoriteTest.owned},SceneLayout:{list:async()=>globalThis.__favoriteTest.scenes,filter:async({id})=>globalThis.__favoriteTest.scenes.filter(s=>s.id===id)},Model3D:{list:async()=>globalThis.__favoriteTest.models}}};",loader:'js'}));
    }}]
  });
  const filename=process.cwd()+'/tests/__favorites_bundle.cjs',mod=new Module(filename);
  mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(bundle.outputFiles[0].text,filename);
  const {Picker,Slots}=mod.exports;
  const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
  const root=createRoot(document.getElementById('root'));
  const run=fn=>act(async()=>{fn?.();await new Promise(resolve=>setTimeout(resolve,35));});
  const render=()=>React.createElement(React.Fragment,null,
    React.createElement(Slots,{currentEnvId:'default_room',defaultModelUrl:'/default.glb',onSelectEnv:async x=>globalThis.__favoriteTest.selected.push(x),onOpenHub:()=>globalThis.__favoriteTest.opens++}),
    React.createElement(Picker,{open:true,currentEnvId:'default_room',defaultModelUrl:'/default.glb',onSelectEnv:async x=>globalThis.__favoriteTest.selected.push(x),onClose:()=>{}}));
  const findByLabel = text=>[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===text);
  try{
    await run(()=>root.render(render()));
    assert.equal(document.querySelectorAll('[data-environment-slot]').length,4);
    await run(()=>findByLabel('Pin favorite environment in slot 1').click());
    assert.equal(globalThis.__favoriteTest.opens,1,'an empty pin opens the Environment Hub');
    assert.ok(findByLabel('Pin Castle Courtyard to quick access'),'real scene is selectable for pinning');
    await run(()=>findByLabel('Pin Castle Courtyard to quick access').click());
    assert.deepEqual(readEnvironmentPins('p1'),['scene-castle']);
    assert.ok(findByLabel('Activate favorite environment Castle Courtyard'));
    await run(()=>findByLabel('Activate favorite environment Castle Courtyard').click());
    assert.equal(globalThis.__favoriteTest.opens,1,'filled shortcut does not open Environment Hub');
    assert.equal(globalThis.__favoriteTest.selected.length,1);
    assert.equal(globalThis.__favoriteTest.selected[0].id,'scene-castle');
    assert.equal(globalThis.__favoriteTest.selected[0].modelUrl,'/castle.glb');
    assert.deepEqual(globalThis.__favoriteTest.selected[0].playerSpawn,{x:1,y:2,z:3});
    // Original pinned environment remains accessible after re-render.
    await run(()=>root.render(render()));
    assert.ok(findByLabel('Activate favorite environment Castle Courtyard'));
    // Unpin directly from the shortcut; the same slot becomes an add control.
    await run(()=>findByLabel('Unpin environment in slot 1').click());
    assert.deepEqual(readEnvironmentPins('p1'),[]);
    assert.ok(findByLabel('Pin favorite environment in slot 1'));
    // Fill all four through Hub and reject a fifth without overwriting.
    for(const name of ['Sunlit Atrium','Ancient Temple','Arena','Moonlit Forest Map']) {
      await run(()=>findByLabel('Pin '+name+' to quick access').click());
    }
    assert.equal(document.querySelectorAll('[data-environment-slot]').length,4);
    assert.equal(readEnvironmentPins('p1').length,4);
    await run(()=>findByLabel('Pin Desert Landscape to quick access').click());
    assert.equal(readEnvironmentPins('p1').length,4);
    assert.match(document.querySelector('[role="alert"]').textContent,/All four favorites/);
    // Pinned IDs for the first account never appear for a different user.
    globalThis.__favoriteTest.user={id:'p2'};
    await run(()=>root.render(render()));
    assert.deepEqual(readEnvironmentPins('p2'),[]);
    assert.ok(findByLabel('Pin favorite environment in slot 1'));
  }finally{
    await run(()=>root.unmount());
    dom.window.close();
    delete globalThis.__favoriteTest;
  }
});

test('shortcut, environment icon, and existing party portraits remain independent',()=>{
  const focus=readFileSync('src/components/dashboard/FocusModePanel.jsx','utf8');
  const css=readFileSync('src/components/dashboard/dashboard-status.css','utf8');
  const page=readFileSync('src/pages/LunaTemplate.jsx','utf8');
  const markup=focus.slice(focus.indexOf('className="luna-environment-party-group"'),focus.indexOf('className="luna-attribute-clock-group"'));
  assert.ok(markup.indexOf('luna-environment-top-icon')<markup.indexOf('luna-environment-party-divider'));
  assert.ok(markup.indexOf('luna-environment-party-divider')<markup.indexOf('<EnvironmentFavoriteSlots'));
  assert.ok(markup.indexOf('<EnvironmentFavoriteSlots')<markup.indexOf('luna-party-five-slots'));
  assert.match(css,/\.luna-environment-party-group\{[^}]*margin-left:25px/);
  assert.match(css,/\.luna-environment-top-icon\{[^}]*border:0;border-radius:0;color:#78cfff;background:transparent;box-shadow:none/);
  assert.match(css,/\.luna-env-quickslot-shell\{[^}]*width:46px;height:46px/);
  assert.match(css,/\.luna-party-five-slots\{[^}]*margin-left:calc\(clamp\(112px,15vw,247px\) \+ 12px - 25px\)/);
  assert.match(page,/defaultModelUrl=\{GAME1_ENV_URL\}/);
  assert.match(focus,/partySlots\.map\(\(member, index\) =>/);
  assert.match(focus,/mode: 'party'/);
});
