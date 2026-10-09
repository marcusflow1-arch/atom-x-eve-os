import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(path,'utf8');
test('dashboard owns a detachable calendar, other routes keep their normal overlay', () => {
  const layout = read('src/Layout.jsx');
  const calendar = read('src/components/calendar/IntelligentCalendarOverlay.jsx');
  const status = read('src/components/dashboard/DateTimeTile.jsx');
  const theme = read('src/components/calendar/luna-calendar-window.css');
  assert.match(layout, /<DashboardWindow id="calendar" title="Calendar" width=\{980\} height=\{690\}/);
  assert.match(layout, /<IntelligentCalendarOverlay embedded/);
  assert.match(layout, /<IntelligentCalendarOverlay onClose=/);
  assert.match(layout, /focusDashboardWindow\('calendar'\)/);
  assert.match(calendar, /return embedded \? overlay : createPortal\(overlay, document\.body\)/);
  assert.match(status, /luna-status-calendar-side[\s\S]*luna-status-announcements/);
  assert.doesNotMatch(status, /luna-status-divider|luna-status-underline/);
  assert.match(theme, /#315d80|#315f82/);
  assert.match(theme, /text-white\/22/);
});

test('embedded calendar renders actual month, day, and event creation without body scroll lock', async () => {
  const dom = new JSDOM('<main id="root"></main>',{url:'https://test.local/LunaTemplate',pretendToBeVisual:true});
  for(const name of ['window','document','HTMLElement','Element','Node','SVGElement','MutationObserver','Event','MouseEvent','CustomEvent'])globalThis[name]=dom.window[name];
  globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
  globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);
  globalThis.getComputedStyle=window.getComputedStyle.bind(window);
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
  let dataLoads=0;
  globalThis.calendarFixture={sdk:{
    functions:{invoke:async(name,params)=>{assert.equal(name,'calendarAgent');if(params.action==='getState'){dataLoads++;return {data:{events:[],occurrences:[],tasks:[],notes:[]}};}return {data:{success:true}};}},
    entities:{UserEvent:{subscribe:()=>()=>{}},UserTask:{subscribe:()=>()=>{}},UserNote:{subscribe:()=>()=>{}}}
  }};
  console.log('calendar-test: before bundle');
  const built=await build({
    stdin:{contents:"export {default as Calendar} from './src/components/calendar/IntelligentCalendarOverlay.jsx';",resolveDir:process.cwd(),loader:'jsx'},
    bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
    plugins:[{name:'calendar-fixtures',setup(b){
      b.onResolve({filter:/^lucide-react$/},()=>({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
      b.onResolve({filter:/^react(?:\/|$)/},a=>({path:a.path,external:true}));
      b.onResolve({filter:/base44Client$/},()=>({path:'sdk',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const base44=globalThis.calendarFixture.sdk;',loader:'js'}));
    }}],
  });
  console.log('calendar-test: after bundle');
  const filename=process.cwd()+'/tests/__calendar-float.cjs',mod=new Module(filename);
  mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(built.outputFiles[0].text,filename);
  const {Calendar}=mod.exports;
  const root=createRoot(document.getElementById('root'));
  let closed=0;
  const run=fn=>act(async()=>{fn?.();await new Promise(resolve=>setTimeout(resolve,80));});
  try{
    document.body.style.overflow='auto';
    console.log('calendar-test: before render');
    await run(()=>root.render(React.createElement(Calendar,{embedded:true,currentUserId:'player',onClose:()=>closed++})));
    console.log('calendar-test: rendered');
    assert.ok(document.querySelector('.luna-calendar-window'),'calendar is mounted inside dashboard window body');
    assert.equal(document.querySelector('.luna-calendar-window').getAttribute('role'),'region');
    assert.equal(document.body.style.overflow,'auto','other dashboard windows are not scroll-locked');
    assert.equal(document.querySelectorAll('[data-calendar-day]').length,42);
    assert.ok(dataLoads>0,'real calendarAgent read path is retained');
    await run(()=>[...document.querySelectorAll('.luna-calendar-header button')].find(b=>b.textContent.trim()==='week').click());
    assert.equal(document.querySelectorAll('.luna-calendar-week-label').length,7);
    await run(()=>[...document.querySelectorAll('.luna-calendar-header button')].find(b=>b.textContent.trim()==='month').click());
    await run(()=>[...document.querySelectorAll('.luna-calendar-header button')].find(b=>b.textContent.includes('Create')).click());
    assert.ok(document.querySelector('.luna-calendar-creator'),'event creation remains available');
    await run(()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    assert.equal(document.querySelector('.luna-calendar-creator'),null,'Escape closes the creator before the calendar');
    assert.equal(closed,0,'calendar is not closed by child Escape');
    assert.equal(document.body.style.overflow,'auto');
  }finally{
    await run(()=>root.unmount());
    assert.equal(document.body.style.overflow,'auto','no page scroll lock after closing');
    dom.window.close();delete globalThis.calendarFixture;
  }
});
