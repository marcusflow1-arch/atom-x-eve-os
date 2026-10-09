import assert from 'node:assert/strict';
import Module from 'node:module';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { fitWindow, moveWindow, resizeWindow, createWindowStack } from '../src/components/dashboard/windows/windowGeometry.js';

// Window logic is mounted with React + a real portal in a DOM fixture.
const dom = new JSDOM('<div id="root"></div><div class="glass-page-top-bar"></div><div class="glass-page-bottom-bar"></div>', {
  url:'https://test.local/LunaTemplate', pretendToBeVisual:true,
});
for(const name of ['window','document','HTMLElement','Element','Node','SVGElement','Event','CustomEvent','MouseEvent','MutationObserver','sessionStorage']){
  globalThis[name]=dom.window[name];
}
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.navigator ||= window.navigator;
Object.defineProperty(window,'innerWidth',{configurable:true,value:1280});
Object.defineProperty(window,'innerHeight',{configurable:true,value:880});
const bounds = selector => selector === '.glass-page-top-bar' ? {bottom:64} : {top:832};
for(const selector of ['.glass-page-top-bar','.glass-page-bottom-bar']) {
  document.querySelector(selector).getBoundingClientRect=()=>bounds(selector);
}
globalThis.ResizeObserver=class { observe() {} unobserve() {} disconnect() {} };
Element.prototype.setPointerCapture=function(pointerId){this._pointerId=pointerId;};
Element.prototype.hasPointerCapture=function(pointerId){return this._pointerId===pointerId;};
Element.prototype.releasePointerCapture=function(pointerId){if(this._pointerId===pointerId)this._pointerId=null;};
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const bundle=await build({
  stdin:{contents:"export {default as DashboardWindow, focusDashboardWindow, activeDashboardWindow} from './src/components/dashboard/windows/DashboardWindow.jsx';",resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},
  alias:{'@':process.cwd()+'/src'},
  plugins:[{name:'window-fixtures',setup(builder) {
    builder.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'fixture'}));
    builder.onLoad({filter:/^icons$/,namespace:'fixture'},()=>({loader:'js',contents:
      "export const Grip=()=>null; export const Maximize2=()=>null; export const Minimize2=()=>null; export const Minus=()=>null; export const X=()=>null;"
    }));
    builder.onResolve({filter:/AuthContext$/},()=>({path:'auth',namespace:'fixture'}));
    builder.onLoad({filter:/^auth$/,namespace:'fixture'},()=>({contents:"export const useAuth=()=>({user:{id:'test-player'}});",loader:'js'}));
  }}],
});
const filename=process.cwd()+'/tests/__floating_window_runtime.cjs',module=new Module(filename);
module.paths=Module._nodeModulePaths(process.cwd());
module._compile(bundle.outputFiles[0].text,filename);
const {DashboardWindow,focusDashboardWindow,activeDashboardWindow}=module.exports;
let state={inventory:true,messages:true};
const root=createRoot(document.getElementById('root'));
function Windows(){
  const [,rerender]=React.useState(0);
  globalThis.rerenderWindows=()=>rerender(x=>x+1);
  const renderWindow=(id,title,index)=>state[id] && React.createElement(DashboardWindow,{
    key:id,id,title,width:510,height:480,index,onClose:()=>{state[id]=false;rerender(x=>x+1);}
  },React.createElement('div',{'data-content':id},title+' content'));
  return React.createElement(React.Fragment,null,renderWindow('inventory','Inventory',0),renderWindow('messages','Messages',3));
}
const render=()=>act(async()=>root.render(React.createElement(Windows)));
const win=id=>document.querySelector('[data-luna-window="'+id+'"]');
const pos=id=>({x:parseFloat(win(id).style.left),y:parseFloat(win(id).style.top),width:parseFloat(win(id).style.width),height:parseFloat(win(id).style.height)});
const pointer=(el,name,x,y,pid=7)=>{
  const e=new window.MouseEvent(name,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y});
  Object.defineProperty(e,'pointerId',{value:pid});
  el.dispatchEvent(e);
};
const click=(id,label)=>win(id).querySelector('[aria-label="'+label+'"]')?.click();
try {
  assert.equal(fitWindow({x:-500,y:-300,width:1500,height:900},{x:0,y:64,width:1280,height:768}).width,1280);
  assert.deepEqual(moveWindow({x:50,y:100,width:400,height:350},200,0,{x:0,y:64,width:1000,height:768}).x,250);
  assert.equal(resizeWindow({x:100,y:100,width:400,height:350},300,0,{x:0,y:64,width:600,height:768}).width,500);
  const stack=createWindowStack();stack.focus('a');stack.focus('b');assert.equal(stack.top(),'b');stack.remove('b');assert.equal(stack.top(),'a');
  await render();
  assert.ok(win('inventory') && win('messages'),'two separate nonmodal windows mount concurrently');
  assert.equal(document.querySelectorAll('[role="dialog"][aria-modal="false"]').length,2);
  assert.ok(pos('inventory').x!==pos('messages').x,'windows start in separate cascaded positions');
  const before=pos('inventory'),other=pos('messages');
  await act(async()=>{
    const grip=win('inventory').querySelector('[aria-label="Move Inventory window"]');
    pointer(grip,'pointerdown',before.x+30,before.y+20);
    pointer(grip,'pointermove',before.x+170,before.y+90);
    pointer(grip,'pointerup',before.x+170,before.y+90);
  });
  assert.equal(pos('inventory').x,before.x+140,'pointer drag moves inventory horizontally');
  assert.equal(pos('inventory').y,before.y+70,'pointer drag moves inventory vertically');
  assert.deepEqual(pos('messages'),other,'dragging inventory does not move messages');
  const afterDrag=pos('inventory');
  await act(async()=>{
    const resize=win('inventory').querySelector('[aria-label="Resize Inventory window"]');
    pointer(resize,'pointerdown',afterDrag.x+afterDrag.width,afterDrag.y+afterDrag.height);
    pointer(resize,'pointermove',afterDrag.x+afterDrag.width+40,afterDrag.y+afterDrag.height+30);
    pointer(resize,'pointerup',afterDrag.x+afterDrag.width+40,afterDrag.y+afterDrag.height+30);
  });
  assert.equal(pos('inventory').width,afterDrag.width+40,'resize handle expands one window');
  assert.equal(pos('inventory').height,afterDrag.height+30);
  assert.deepEqual(pos('messages'),other,'other window dimensions stay unchanged');
  await act(async()=>{click('inventory','Minimize Inventory');});
  assert.equal(win('inventory').dataset.minimized,'true');
  assert.equal(parseFloat(win('inventory').style.height),40,'minimized window leaves a titlebar');
  await act(async()=>{focusDashboardWindow('inventory');});
  assert.ok(!win('inventory').dataset.minimized,'quick-action focus restores the minimized window');
  assert.equal(activeDashboardWindow(),'inventory');
  await act(async()=>{click('inventory','Maximize Inventory');});
  assert.equal(pos('inventory').width,1280,'maximized window fills dashboard work area');
  await act(async()=>{click('inventory','Restore size of Inventory');});
  assert.equal(pos('inventory').width,afterDrag.width+40,'restore returns previous size');
  await act(async()=>{focusDashboardWindow('messages');});
  assert.ok(Number(win('messages').style.zIndex)>Number(win('inventory').style.zIndex),'focused window rises above other windows');
  await act(async()=>{window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));});
  assert.ok(!win('messages'),'Escape closes only the topmost window');
  assert.ok(win('inventory'),'other windows remain open');
  assert.ok(sessionStorage.getItem('luna-window-v1:test-player:inventory'),'window geometry is saved separately');
  console.log('PASS: independent portals, pointer drag, resize, minimize/restore, maximize/restore, focus stacking, topmost Escape, session geometry and viewport bounds');
} finally {
  await act(async()=>root.unmount());
  dom.window.close();
}

const overview=readFileSync('src/components/dashboard/DashboardAvatarOverview.jsx','utf8');
const luna=readFileSync('src/pages/LunaTemplate.jsx','utf8');
for(const key of ['inventory','memories','messages','cards','ai-story','ai-battle','season','leaderboard']){
  assert.match(overview,new RegExp('<DashboardWindow id="'+key+'"'),'missing independently mounted '+key+' window');
}
assert.match(overview,/slotItems\.map\(item/);
assert.match(overview,/handleQuickAction\(item\)/);
assert.match(overview,/id="friends" title="Friends"/);
assert.match(luna,/id="skill-tree" title="Skill Tree"/);
console.log('PASS: all eight dashboard buttons map to independent floating windows; Friends and Skill Tree also use this system');
