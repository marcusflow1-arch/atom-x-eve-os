import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
const read=p=>readFileSync(p,'utf8');

test('environment picker uses one compact independent Luna window, not a page overlay',()=>{
 const page=read('src/pages/LunaTemplate.jsx'),scene=read('src/components/dashboard/DashboardAvatarScene.jsx');
 const picker=read('src/components/dashboard/EnvHubDrawer.jsx'),css=read('src/components/dashboard/luna-environment-window.css');
 const banner=read('src/components/dashboard/FocusModePanel.jsx');
 const footer=read('src/components/dashboard/LunaBottomNav.jsx');
 assert.match(page,/<DashboardWindow id="environment-hub" title="Environment Hub" width=\{580\} height=\{510\}/);
 assert.match(page,/<EnvHubDrawer open currentEnvId=\{currentEnvId\}/);
 assert.match(page,/focusDashboardWindow\('environment-hub'\)/);
 assert.match(page,/window\.addEventListener\('openEnvironmentHub', open\)/);
 assert.match(page,/environmentWindowOpen=\{showEnvironmentCollection\}/);
 assert.match(banner,/aria-label="Open Environment Hub"/);
 assert.match(banner,/aria-expanded=\{Boolean\(environmentWindowOpen\)\}/);
 assert.match(banner,/onClick=\{\(\) => window\.dispatchEvent\(new Event\('openEnvironmentHub'\)\)\}/);
 assert.equal((banner.match(/data-luna-environment-trigger/g)||[]).length,1);
 assert.doesNotMatch(footer,/data-luna-environment-trigger/);
 assert.doesNotMatch(footer,/<Globe aria-hidden="true" \/><span>Environments<\/span>/);
 assert.doesNotMatch(scene,/<EnvironmentHubWorkspace/);
 assert.doesNotMatch(picker,/createPortal|collectionGeometry|fixed bottom-\[54px\]/);
 assert.match(css,/\.luna-window:has\(\.luna-env-picker\)/);
 assert.match(css,/\.luna-env-picker__grid/);
 assert.doesNotMatch(picker,/HubProgressionHeader|CompanionsGrid|Upgrade|WALLPAPER_PRESETS/);
 assert.match(page,/savedId\?\.startsWith\('scene-'\)/);
 assert.match(page,/savedId\?\.startsWith\('model-'\)/);
});

test('real admin 3D environments and owned backgrounds can be selected and applied',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/LunaTemplate',pretendToBeVisual:true});
 for(const k of ['window','document','HTMLElement','Element','Node','SVGElement','Event','MouseEvent','CustomEvent','MutationObserver'])globalThis[k]=dom.window[k];
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 globalThis.navigator ||=window.navigator;
 const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
 globalThis.__envFixture={
  user:{id:'player'},
  owned:[{id:'owned',owner_id:'player',name:'Sunlit Atrium',model_url:'/atrium.glb'}],
  scenes:[{id:'castle',name:'Castle Courtyard',environment_url:'/castle.glb',player_spawn:{x:1,y:2,z:3}}],
  models:[{id:'forest',name:'Moonlit Forest Map',file_url:'/forest.glb'},{id:'avatar',name:'Male Avatar',file_url:'/avatar.glb'}]
 };
 const bundle=await build({
  stdin:{contents:"export {default as Picker} from './src/components/dashboard/EnvHubDrawer.jsx';",resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},alias:{'@':process.cwd()+'/src'},
  plugins:[{name:'env-fixture',setup(b){
   b.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'mock'}));
   b.onLoad({filter:/^icons$/,namespace:'mock'},()=>({contents:"export const Check=()=>null; export const Globe2=()=>null; export const Loader2=()=>null; export const RefreshCw=()=>null; export const ImageOff=()=>null;",loader:'js'}));
   b.onResolve({filter:/AuthContext$/},()=>({path:'auth',namespace:'mock'}));
   b.onLoad({filter:/^auth$/,namespace:'mock'},()=>({contents:"export const useAuth=()=>({user:globalThis.__envFixture.user});",loader:'js'}));
   b.onResolve({filter:/base44Client$/},()=>({path:'client',namespace:'mock'}));
   b.onLoad({filter:/^client$/,namespace:'mock'},()=>({contents:"export const base44={entities:{EnvironmentInstance:{filter:async()=>globalThis.__envFixture.owned},SceneLayout:{list:async()=>globalThis.__envFixture.scenes,filter:async()=>globalThis.__envFixture.scenes},Model3D:{list:async()=>globalThis.__envFixture.models}}};",loader:'js'}));
  }}]
 });
 const filename=process.cwd()+'/tests/__env_window_runtime.cjs',mod=new Module(filename);
 mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(bundle.outputFiles[0].text,filename);
 const {Picker}=mod.exports,root=createRoot(document.getElementById('root')),applied=[],closed=[];
 const run=fn=>act(async()=>{fn?.();await new Promise(r=>setTimeout(r,10));});
 try {
  await run(()=>root.render(React.createElement(Picker,{open:true,currentEnvId:'default_room',defaultModelUrl:'/default.glb',onSelectEnv:async row=>applied.push(row),onClose:()=>closed.push(true)})));
  assert.equal(document.querySelectorAll('[data-env-id]').length,4);
  assert.equal(document.querySelector('[data-env-id="model-avatar"]'),null);
  assert.ok(document.querySelector('[data-env-id="scene-castle"]'));
  const apply=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Apply background'));
  assert.ok(apply.disabled);
  await run(()=>document.querySelector('[data-env-id="model-forest"]').click());
  assert.equal(document.querySelector('[data-env-id="model-forest"]').getAttribute('aria-pressed'),'true');
  await run(()=>apply.click());
  assert.equal(applied.length,1);
  assert.equal(applied[0].modelUrl,'/forest.glb');
  assert.equal(applied[0].id,'model-forest');
  assert.equal(closed.length,1);
  assert.equal(document.querySelector('[role="dialog"]'),null);
 } finally {
  await run(()=>root.unmount());
  dom.window.close();
  delete globalThis.__envFixture;
 }
});
