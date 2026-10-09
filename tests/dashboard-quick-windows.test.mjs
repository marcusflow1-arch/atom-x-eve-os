import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/LunaTemplate',pretendToBeVisual:true});
for(const name of ['window','document','HTMLElement','Element','Node','SVGElement','Event','CustomEvent','MouseEvent','MutationObserver','sessionStorage'])globalThis[name]=dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.ResizeObserver=class {observe(){}disconnect(){}};
globalThis.navigator ||= window.navigator;
Object.defineProperty(window,'innerWidth',{configurable:true,value:1520});
Object.defineProperty(window,'innerHeight',{configurable:true,value:1000});
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);
Element.prototype.setPointerCapture=function(id){this._captured=id;};
Element.prototype.hasPointerCapture=function(id){return this._captured===id;};
Element.prototype.releasePointerCapture=function(id){if(this._captured===id)this._captured=null;};

const {act,createElement}=await import('react');
const {createRoot}=await import('react-dom/client');
const fakeNames=new Set(['PartyPortraitRail','MemoriesDrawer','AIStoryOverlay','DashboardAvatarScene','InventoryGrid',
  'LunaSplitInventory','LunaCardsPanel','LunaLeaderboardOverlay','LunaAIBattleOverlay','LunaFriendsQuickAccessPanel',
  'LunaSeasonPassOverlay','LunaSkillXpHud','LunaMessageFriendsPanel','MessengerHub','AIBoxSocialPanel','LunaGamerProfile','LunaOrnateChrome']);
const fakeHooks={
  AuthContext:"export const useAuth=()=>({user:{id:'quick-window-user',name:'Player'}});",
  CompanionIdentityContext:"export const useCompanionIdentity=()=>({name:'Artemis'});",
  useEquipment:"export const useEquipment=()=>({equipItem:()=>{},equippedItems:{}});",
  useAvatarCombatStats:"export default ()=>({state:{combat:{level:5,max_hp:500,attack:200,defense:80,dodge_chance:0.01,attack_speed:1,cooldown_reduction:0},available:11,allocations:{},progression:{global_xp:4000}}});",
  useDashboardSkillLayout:"export default ()=>({hud:{},stacked:false});",
  useAIBattleQueue:"export const useAIBattleSnapshot=()=>({match:null});",
  aiBoxSocialMode:"export const setAIBoxSocialMode=()=>{};export const toggleAIBoxSocialMode=()=>{};export const useAIBoxSocialMode=()=>({mode:null});",
  mockData:"export const inventoryData={};",
  equipmentSlotRules:"export const itemFitsSlot=()=>true;export const getEquipmentSlotLabel=()=> 'Slot';",
  ErrorToast:"export const showError=()=>{};",
  'react-query':"export const useQuery=()=>({data:{unread_total:0}});",
  base44Client:"export const base44={functions:{invoke:async()=>({data:{}})}};",
};
const compiled=await build({
  stdin:{contents:"export {default as Overview} from './src/components/dashboard/DashboardAvatarOverview.jsx';",resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},
  alias:{'@':process.cwd()+'/src'},
  plugins:[{name:'dashboard-quick-fixtures',setup(builder){
    builder.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'quick-fixture'}));
    builder.onResolve({filter:/.*/},args=>{
      if(args.path==='@tanstack/react-query')return {path:'react-query',namespace:'quick-fixture'};
      const name=args.path.split('/').at(-1).replace(/\.(jsx|js)$/,'');
      if(fakeNames.has(name)||Object.hasOwn(fakeHooks,name))return {path:name,namespace:'quick-fixture'};
      return undefined;
    });
    builder.onLoad({filter:/.*/,namespace:'quick-fixture'},args=>({
      loader:'js',contents:args.path==='icons'
        ? "export const "+['Activity','Heart','Zap','Trophy','Gamepad2','Star','Shield','ChevronRight','BarChart3','Gauge','Target','Sparkles','Users','UserPlus','Camera','MessageSquare','Crown','PackageOpen','Medal','X','Grip','Maximize2','Minimize2','Minus'].map(name=>name+'=()=>null').join(',')+';'
        : fakeNames.has(args.path)
        ? "export default function Placeholder(){return null;}"
        : fakeHooks[args.path],
    }));
  }}],
});
const filename=process.cwd()+'/tests/__quick_window_bundle.cjs',mod=new Module(filename);
mod.paths=Module._nodeModulePaths(process.cwd());
mod._compile(compiled.outputFiles[0].text,filename);
const {Overview}=mod.exports;
const root=createRoot(document.getElementById('root'));
const run=async(fn)=>act(async()=>{fn?.();await Promise.resolve();});
const popup=id=>document.querySelector('[data-luna-window="'+id+'"]');
const tile=label=>[...document.querySelectorAll('[data-dashboard-quick-control]')].find(e=>e.getAttribute('aria-label')===label);
try {
  await run(()=>root.render(createElement(Overview)));
  const expected=[
    ['Inventory','inventory'],['Memories','memories'],['Message','messages'],['Cards','cards'],
    ['AI Story','ai-story'],['AI Battle','ai-battle'],['Season','season'],['Leaderboard','leaderboard']
  ];
  assert.equal(document.querySelectorAll('[data-dashboard-quick-control]').length,8);
  for (const [label,id] of expected) {
    assert.ok(tile(label),'missing '+label+' quick-action button');
    await run(()=>tile(label).click());
    assert.ok(popup(id),label+' must open its own floating window');
    assert.equal(popup(id).getAttribute('aria-modal'),'false');
  }
  assert.equal(document.querySelectorAll('[data-luna-window]').length,8,
    'opening all eight features simultaneously must not replace earlier windows');
  const allIds=[...document.querySelectorAll('[data-luna-window]')].map(e=>e.dataset.lunaWindow);
  assert.deepEqual(new Set(allIds).size,8);
  await run(()=>tile('Inventory').click());
  assert.equal(document.querySelectorAll('[data-luna-window]').length,8,'reopening a tile focuses rather than duplicates its window');
  const inventory=popup('inventory');
  assert.ok(+inventory.style.zIndex > +popup('leaderboard').style.zIndex,'clicked tile brings an existing window to front');
  await run(()=>inventory.querySelector('[aria-label="Close Inventory window"]').click());
  assert.equal(popup('inventory'),null);
  assert.equal(document.querySelectorAll('[data-luna-window]').length,7,
    'closing Inventory must not close the other seven panels');
  for(const [,id] of expected.slice(1))assert.ok(popup(id));
  // Plus slots and both AI Attribute icons use the same independent popup;
  // opening it cannot replace the AI Attribute's live-stat content.
  await run(()=>window.dispatchEvent(new CustomEvent('openLunaSocialWindow',{detail:{mode:'party'}})));
  assert.ok(popup('social-directory'),'party plus buttons open a movable social window');
  assert.match(popup('social-directory').getAttribute('aria-label'),/Invite Friends to Party/);
  assert.ok(document.querySelector('[aria-label="AI Attribute Box"]'));
  const people=[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')==='People Online');
  const friends=[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')==='Friends Online');
  await run(()=>people.click());
  assert.match(popup('social-directory').getAttribute('aria-label'),/People Online/);
  await run(()=>friends.click());
  assert.match(popup('social-directory').getAttribute('aria-label'),/Friends Online/);
  assert.equal(document.querySelectorAll('[data-luna-window="social-directory"]').length,1);
  await run(()=>window.dispatchEvent(new CustomEvent('openLunaGamerProfile',{detail:{player:{id:'friend-77',name:'Nova'}}})));
  assert.ok(popup('gamer-profile'),'View Profile opens a second independent floating window');
  assert.ok(popup('social-directory'),'profile remains independent of friends list');
  assert.ok(document.querySelector('[aria-label="AI Attribute Box"]'));
  console.log('PASS: eight independent quick-action windows plus social directory, both AI icons, profile and preserved AI Attributes');
}finally{
  await act(async()=>root.unmount());
  dom.window.close();
}
