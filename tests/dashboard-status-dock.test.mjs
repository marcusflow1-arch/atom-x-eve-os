import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/LunaTemplate', pretendToBeVisual: true });
for (const name of ['window','document','HTMLElement','Element','Node','SVGElement','MutationObserver','Event','MouseEvent','CustomEvent']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
window.matchMedia = () => ({ matches: true, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
globalThis.ResizeObserver = class { observe(){} disconnect(){} };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Control only UI timers. React Query keeps its normal scheduler.
let now = 0, nextTimer = 1;
const timers = new Map();
window.setTimeout = (fn, delay = 0) => { const id = nextTimer++; timers.set(id,{fn,at:now+delay}); return id; };
window.clearTimeout = id => timers.delete(id);
window.setInterval = (fn, delay) => { const id=nextTimer++;timers.set(id,{fn,at:now+delay,interval:delay});return id; };
window.clearInterval = window.clearTimeout;
function tick(ms) {
  const end = now + ms;
  let next, iterations=0;
  while ((next = [...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0])) {
    if(++iterations>2000)throw new Error('UI timer loop: '+String(next[1].fn));
    const [id,timer]=next;now=timer.at;
    if(timer.interval)timer.at+=timer.interval;else timers.delete(id);
    timer.fn();
  }
  now=end;
}
const React = await import('react'), { act } = React, { createRoot } = await import('react-dom/client');
const { QueryClient, QueryClientProvider } = createRequire(import.meta.url)('@tanstack/react-query');
const calls=[], toasts=[], subscriptions={};
let failUpdates=false;
const updates=[{id:'u0',title:'Existing update',description:'Previously published.',created_date:'2026-10-01T10:00:00Z'}];
const reminders=[{id:'r0',title:'Guild raid',start_time:'2026-10-12T18:00:00Z',event_type:'reminder'}];
const notices=[];
const entity=name=>({
  filter:async()=>{if(failUpdates)throw new Error('Offline');return structuredClone(updates);},
  subscribe:callback=>{const set=subscriptions[name] ||= new Set();set.add(callback);return ()=>set.delete(callback);},
});
globalThis.statusFixture={
  user:{id:'player'}, toasts,
  sdk:{
    entities:{PlatformUpdate:entity('updates'),UserEvent:entity('reminders'),SocialNotification:entity('notifications')},
    functions:{invoke:async(name,body)=>{
      calls.push({name,body:structuredClone(body)});
      if(name==='calendarAgent')return {data:{occurrences:structuredClone(reminders)}};
      if(name==='socialActions'&&body.action==='get_pending_actions')return {data:{notifications:structuredClone(notices)}};
      if(name==='socialActions'&&body.action==='respond_friend_request'){
        const notice=notices.find(item=>item.related_entity_id===body.data.request_id);
        notice.actionable=false;notice.status='actioned';return {data:{accepted:body.data.decision==='accept'}};
      }
      throw new Error('Unexpected service call '+name+':'+body.action);
    }},
  },
};
const built=await build({
  stdin:{contents:"export {default as Status} from './src/components/dashboard/DateTimeTile.jsx';export {SocialNotificationAlerts as Alerts} from './src/components/social/SocialNotifications.jsx';",resolveDir:process.cwd(),loader:'jsx'},
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
  plugins:[{name:'status-fixtures',setup(b){
    b.onResolve({filter:/^react(?:\/|$)/},a=>({path:a.path,external:true}));
    b.onResolve({filter:/^lucide-react$/},()=>({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
    b.onResolve({filter:/base44Client$|AuthContext$|^react-router-dom$|^react-hot-toast$/},a=>({path:a.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'jsx',contents:
      a.path.endsWith('base44Client')?'export const base44=globalThis.statusFixture.sdk;':
      a.path.endsWith('AuthContext')?'export const useAuth=()=>({user:globalThis.statusFixture.user});':
      a.path==='react-router-dom'?'export const useNavigate=()=>()=>{};':
      'export const toast={custom:(...args)=>globalThis.statusFixture.toasts.push(args),dismiss:()=>{}};export default toast;'
    }));
  }}],
});
const filename=process.cwd()+'/tests/__status_dock.cjs',mod=new Module(filename);
mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(built.outputFiles[0].text,filename);
const {Status,Alerts}=mod.exports;
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false,gcTime:0}}});
const root=createRoot(document.getElementById('root'));
const run=(fn=()=>{})=>act(async()=>{fn();await new Promise(resolve=>setTimeout(resolve,40));});
const advance=ms=>run(()=>tick(ms));
const button=label=>{const node=[...document.querySelectorAll('button')].find(n=>n.getAttribute('aria-label')===label||n.textContent.trim()===label);assert.ok(node,'Missing '+label);return node;};
const pointer=(node,type,extra={})=>node.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:10,clientY:10,...extra}));
const click=node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
const signal=(name,event={})=>subscriptions[name]?.forEach(callback=>callback(event));
const preview=()=>document.querySelector('.luna-status-preview');
const expanded=()=>preview().hasAttribute('data-expanded');
const title=()=>preview().querySelector('strong').textContent;
let calendars=0;
try {
  await run(()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(React.Fragment,null,
    React.createElement(Alerts),React.createElement(Status,{onCalendarClick:()=>calendars++})))));
  await run();
  assert.equal(expanded(),false,'old items do not trigger arrival popups');
  assert.equal(document.querySelectorAll('.luna-status-selectors button').length,2);
  assert.ok(document.querySelector('.luna-status-divider'));
  assert.ok(document.querySelector('.luna-status-underline'));
  assert.equal(document.querySelector('.luna-status .lucide-chevron-right'),null);
  assert.equal(document.querySelector('.luna-status-quick'),null);
  await run(()=>button('Open calendar').click());assert.equal(calendars,1);

  notices.unshift({id:'n1',recipient_id:'player',title:'Friend request',body:'Nova sent you a friend request.',type:'friend_request',action_kind:'friend_request',related_entity_id:'friend-1',status:'unread',actionable:true,created_date:'2026-10-03T17:00:00Z'});
  await run(()=>signal('notifications',{data:{recipient_id:'player'}}));await run();
  assert.equal(expanded(),true);assert.equal(title(),'Friend request');
  assert.match(preview().textContent,/Nova sent you/);
  assert.equal(toasts.length,0,'the dashboard dock replaces the duplicate global toast');
  assert.ok(button('Notifications').hasAttribute('data-unread'));
  await run(()=>preview().dispatchEvent(new MouseEvent('mouseover',{bubbles:true})));
  await advance(9000);assert.equal(expanded(),true,'hover pauses retraction for reading');
  await run(()=>preview().dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body})));
  await advance(6000);assert.equal(expanded(),false);
  await advance(260);assert.equal(title(),'');
  await run(()=>signal('notifications'));await run();assert.equal(expanded(),false,'refetching an existing notice does not replay it');

  // Short click previews; releasing, leaving, dragging or cancelling early cannot open a panel.
  const updatesButton=button('System updates');
  updatesButton.focus();
  await run(()=>pointer(updatesButton,'pointerdown'));await advance(500);
  await run(()=>{pointer(updatesButton,'pointerup');click(updatesButton);});
  assert.equal(title(),'Existing update');assert.equal(document.querySelector('[role="dialog"]'),null);
  await advance(1000);assert.equal(document.querySelector('[role="dialog"]'),null);
  for(const [cancel,extra] of [['pointerout',{}],['pointercancel',{}],['pointermove',{clientX:30}]]){
    await run(()=>pointer(updatesButton,'pointerdown'));await advance(700);
    await run(()=>pointer(updatesButton,cancel,extra));await advance(400);
    assert.equal(document.querySelector('[role="dialog"]'),null,cancel+' cancels the hold');
  }
  await run(()=>pointer(updatesButton,'pointerdown'));await advance(999);
  assert.equal(document.querySelector('[role="dialog"]'),null,'hold threshold is a full second');
  await advance(1);
  assert.equal(document.querySelector('[role="dialog"]').getAttribute('aria-label'),'System Updates');
  await run(()=>{pointer(updatesButton,'pointerup');click(updatesButton);});
  assert.equal(expanded(),false,'release after long press does not generate an extra preview');
  await run(()=>button('Close status feed').click());
  assert.equal(document.activeElement,updatesButton,'closing returns keyboard focus to the icon');

  // Clicking the brief message opens that exact item in the existing slide-out.
  await run(()=>click(button('Notifications')));
  assert.equal(title(),'Friend request');
  await run(()=>click(preview().querySelector('button')));await run();
  assert.equal(document.querySelector('[role="dialog"]').getAttribute('aria-label'),'Notifications & reminders');
  assert.match(document.querySelector('[aria-label="Selected feed item"]').textContent,/Nova sent you/);
  await run(()=>button('Accept').click());await run();
  assert.deepEqual(calls.find(call=>call.body.action==='respond_friend_request').body,{action:'respond_friend_request',data:{request_id:'friend-1',decision:'accept'}});
  assert.equal(notices[0].status,'actioned');
  assert.equal(document.querySelector('[aria-label="Selected feed item"]').textContent.includes('Decline'),false);
  await run(()=>button('Close status feed').click());

  // Concurrent feed types take turns. Updated metadata is not a second arrival.
  updates.unshift({id:'u1',title:'New system update',description:'Improved dashboard stability.',created_date:'2026-10-03T17:10:00Z'});
  await run(()=>signal('updates'));await run();assert.equal(title(),'New system update');
  notices.unshift({id:'n2',title:'New message',body:'Orion: ready to play?',type:'message',status:'unread',created_date:'2026-10-03T17:11:00Z'});
  await run(()=>signal('notifications'));await run();assert.equal(title(),'New system update');
  await advance(6000);assert.equal(expanded(),false);
  await advance(260);assert.equal(title(),'New message');assert.equal(expanded(),true);
  await advance(6000);await advance(260);assert.equal(expanded(),false);
  await run(()=>signal('updates'));await run();assert.equal(expanded(),false);
  const before=calls.length;
  await run(()=>signal('notifications',{data:{recipient_id:'someone-else'}}));
  assert.equal(calls.length,before,'foreign notification events do not refresh this user inbox');

  reminders.unshift({id:'r1',title:'Tournament check-in',start_time:'2026-10-14T18:00:00Z',event_type:'reminder'});
  await run(()=>signal('reminders'));await run();assert.equal(title(),'Tournament check-in');
  await run(()=>preview().querySelector('button').focus());await advance(9000);
  assert.equal(expanded(),true,'keyboard focus also preserves the message');
  await run(()=>click(preview().querySelector('button')));await run();
  assert.match(document.querySelector('[aria-label="Selected feed item"] h3').textContent,/Tournament check-in/,'the clicked reminder opens even when notifications precede it');
  assert.ok(button('Open Calendar'));
  await run(()=>button('Close status feed').click());

  // Keyboard/assistive click opens directly, even without a pointer hold.
  await run(()=>button('Notifications').click());await run();
  assert.ok(document.querySelector('[role="dialog"]'));
  await run(()=>window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  assert.equal(document.querySelector('[role="dialog"]'),null);

  failUpdates=true;
  await run(()=>signal('updates'));await run();
  await run(()=>button('System updates').click());await run();
  assert.match(document.querySelector('[role="alert"]').textContent,/could not load/);
  failUpdates=false;
  await run(()=>button('Retry').click());await run();
  assert.equal(document.querySelector('[role="alert"]'),null);
  await run(()=>button('Close status feed').click());

  console.log('PASS: quiet dock, arrival-only notifications/reminders/updates, no duplicate toast, six-second retract/queue, hover/focus pause, exact one-second hold/cancellation, keyboard access, selected-item slide-out, friend acceptance, retry and scoped subscriptions.');
} finally {
  await act(async()=>root.unmount());client.clear();
  assert.ok(Object.values(subscriptions).every(set=>set.size===0),'all live subscriptions are removed');
  assert.equal(timers.size,0,'clock, hold and preview timers are removed');
  dom.window.close();delete globalThis.statusFixture;
}
