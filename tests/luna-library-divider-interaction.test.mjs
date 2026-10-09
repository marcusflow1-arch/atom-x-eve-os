import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { libraryWidthFromRatio, libraryRatioFromWidth } from '../src/components/dashboard/libraryResize.js';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/LunaTemplate', pretendToBeVisual:true });
for (const name of ['window','document','HTMLElement','Element','Node','SVGElement','MutationObserver','Event','MouseEvent','CustomEvent']) globalThis[name] = dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.navigator ||= window.navigator;
HTMLElement.prototype.setPointerCapture = function(pointerId) { this.__captured = pointerId; };
HTMLElement.prototype.hasPointerCapture = function(pointerId) { return this.__captured === pointerId; };
HTMLElement.prototype.releasePointerCapture = function(pointerId) { if (this.__captured === pointerId) this.__captured = null; };

const React = await import('react'), { act } = React, { createRoot } = await import('react-dom/client');
const bundled = await build({
  stdin:{contents:"export {default as Divider} from './src/components/dashboard/LibraryWidthDivider.jsx';",resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},
  plugins:[{name:'mock-icon',setup(builder) {
    builder.onResolve({filter:/^lucide-react$/},()=>({path:'icon',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"export function GripVertical(){return null;}",loader:'js'}));
  }}],
});
const filename=process.cwd()+'/tests/__library_resize.cjs', mod=new Module(filename);
mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(bundled.outputFiles[0].text,filename);
const { Divider } = mod.exports;
let parentWidth = 1400;
const container = { current:{getBoundingClientRect:()=>({left:100,width:parentWidth,right:100+parentWidth})} };
function App({total}) {
  const [ratio,setRatio]=React.useState(() => libraryRatioFromWidth(330,1400));
  const width=libraryWidthFromRatio(ratio,total);
  return React.createElement(React.Fragment,null,
    React.createElement('div',{id:'library-width', 'data-width':width}),
    React.createElement(Divider,{width,onResize:pixels=>setRatio(libraryRatioFromWidth(pixels,total)),containerRef:container}),
    React.createElement('div',{id:'main-width','data-left':width,'data-width':total-width})
  );
}
const root=createRoot(document.getElementById('root'));
const render=async()=>act(async()=>root.render(React.createElement(App,{total:parentWidth})));
await render();
const width=()=>Number(document.getElementById('library-width').getAttribute('data-width'));
const handle=()=>document.querySelector('[role="separator"]');
const pointer=(type,x)=> {
  const e=new window.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x});
  Object.defineProperty(e,'pointerId',{value:3});
  handle().dispatchEvent(e);
};
try {
  assert.equal(width(),330);
  await act(async()=>{pointer('pointerdown',430);pointer('pointermove',545);pointer('pointerup',545);});
  assert.equal(width(),445,'dragging left/right changes actual pane width');
  assert.equal(document.getElementById('main-width').getAttribute('data-left'),'445');
  assert.equal(handle().getAttribute('aria-valuenow'),'445');
  assert.equal(document.body.style.cursor,'','drag-end restores global cursor');
  await act(async()=>{handle().dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));});
  assert.equal(width(),433,'keyboard ArrowLeft resizes');
  await act(async()=>{handle().dispatchEvent(new window.MouseEvent('dblclick',{bubbles:true,detail:2}));});
  assert.equal(width(),330,'double-click resets');
  await act(async()=>{pointer('pointerdown',430);pointer('pointermove',-100);pointer('pointerup',-100);});
  assert.equal(width(),220,'minimum width is enforced');
  await act(async()=>{pointer('pointerdown',430);pointer('pointermove',800);pointer('pointerup',800);});
  assert.equal(width(),700,'user can make the two panes 50/50, not capped at 485px');
  assert.equal(Number(document.getElementById('main-width').getAttribute('data-width')),700);
  assert.match(handle().getAttribute('aria-valuetext'), /Library 50%, main area 50%/);
  parentWidth = 1000;
  await render();
  assert.equal(width(),500,'ratio is maintained when viewport width changes');
  assert.equal(Number(document.getElementById('main-width').getAttribute('data-width')),500);
  parentWidth = 800;
  await render();
  assert.equal(width(),350,'right workspace minimum still applies');
  assert.equal(Number(document.getElementById('main-width').getAttribute('data-width')),450);
  console.log('PASS: live ratio resizing, 50/50 split, viewport adaptation, ARIA value, cursor cleanup, keyboard, reset and width bounds.');
} finally {
  await act(async()=>root.unmount());
  dom.window.close();
}
