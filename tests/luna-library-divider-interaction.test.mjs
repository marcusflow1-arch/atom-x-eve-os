import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

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
const container = { current:{getBoundingClientRect:()=>({left:100,width:1400,right:1500})} };
function App() {
  const [width,setWidth]=React.useState(330);
  return React.createElement(React.Fragment,null,
    React.createElement('div',{id:'library-width', 'data-width':width}),
    React.createElement(Divider,{width,onResize:setWidth,containerRef:container}),
    React.createElement('div',{id:'main-width','data-left':width})
  );
}
const root=createRoot(document.getElementById('root'));
await act(async()=>root.render(React.createElement(App)));
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
  console.log('PASS: live splitter pointer drag, actual pane resize, ARIA width, cursor cleanup, keyboard resize, reset and min clamp.');
} finally {
  await act(async()=>root.unmount());
  dom.window.close();
}
