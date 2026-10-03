import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/LunaTemplate', pretendToBeVisual: true });
for (const name of ['window','document','HTMLElement','Element','Node','HTMLInputElement','HTMLSelectElement','SVGElement','MutationObserver','Event','CustomEvent']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
window.matchMedia = () => ({ matches: true, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
globalThis.ResizeObserver = class { observe(){} disconnect(){} };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react'), { act } = React, { createRoot } = await import('react-dom/client');
const { QueryClient, QueryClientProvider } = createRequire(import.meta.url)('@tanstack/react-query');
const calls = [], navigations = [];
const state = { userCard: { id:'card', user_id:'a', card_name:'Moonstep', card_type:'ability', card_rarity:'Rare' }, progression: { level:1, xp:0, xp_to_next:100, max_level:10, stage:1, stat_points:1, skill_points:1, base_stats:{ attack:20,defense:15,magic:12,vitality:16,speed:10 }, enhanced_stats:{}, effective_stats:{ attack:20,defense:15,magic:12,vitality:16,speed:10 }, enchantments:[], active_perks:[], unlocked_skill_nodes:[] }, materials:[], skillTree:[], events:[], compatibleCards:[], enchantments:[] };
const entity = (rows = []) => ({ list:async()=>rows, filter:async()=>rows, subscribe:()=>()=>{} });
globalThis.pdfFixture = {
  calls, navigations, user:{id:'a'},
  sdk:{
    entities:{ PlatformUpdate:entity([{id:'u',title:'October patch',published:true}]), UserEvent:entity(), CardProgression:entity(), UserCard:entity(), ClanMember:entity(), Game:entity(), Division:entity([{id:'crew',name:'Sky Crew',playstyles:['Trading'],memberCount:3,sizeLimit:25,recruitmentStatus:'Public'}]) },
    functions:{ invoke:async(name,body)=>{
      calls.push({name,body});
      if(name==='socialActions') return {data:{notifications:[]}};
      if(name==='calendarAgent') return {data:{occurrences:[{id:'r',title:'Guild raid',start_time:'2026-10-12T18:00:00Z',event_type:'reminder'}]}};
      if(name==='cardProgression')return {data:structuredClone(state)};
      if(name==='clanSystem')return {data:{success:true,clanId:'created-clan'}};
      if(name==='tradePostMarket')return {data:{success:true,listings:[],ownedCards:[]}};
      throw new Error(name);
    }},
  },
};
const built = await build({
  stdin:{ contents:"export {default as Status} from './src/components/dashboard/DateTimeTile.jsx';export {default as Card} from './src/components/streaming/MysteryCardDetail.jsx';export {default as Clan} from './src/components/clan/ClanIntro.jsx';", resolveDir:process.cwd(), loader:'jsx' },
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},
  plugins:[{name:'fixtures',setup(b){
    b.onResolve({filter:/^react(?:\/|$)/},a=>({path:a.path,external:true}));
    b.onResolve({filter:/^lucide-react$/},()=>({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
    b.onResolve({filter:/base44Client$|AuthContext$|SystemUpdatesRemindersOverlay$|^react-router-dom$/}, a=>({path:a.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'jsx',contents:
      a.path.endsWith('base44Client')?'export const base44=globalThis.pdfFixture.sdk;':
      a.path.endsWith('AuthContext')?'export const useAuth=()=>({user:globalThis.pdfFixture.user});':
      a.path==='react-router-dom'?'export const useNavigate=()=>value=>globalThis.pdfFixture.navigations.push(value);export const Link=({to,children})=><a href={to}>{children}</a>;':
      'export default function Overlay({mode}){return <div data-testid="status-overlay">{mode}</div>}'
    }));
  }}],
});
const file=process.cwd()+'/tests/__pdf_ui.cjs',mod=new Module(file);mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(built.outputFiles[0].text,file);
const { Status, Card, Clan }=mod.exports;
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false,gcTime:0}}});
const root=createRoot(document.getElementById('root'));
const run=(fn=()=>{})=>act(async()=>{await fn();await new Promise(resolve=>setTimeout(resolve,50));});
const render=(Component,props={})=>run(()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(Component,props))));
const button=text=>{const el=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===text||el.getAttribute('aria-label')===text);assert.ok(el,'Missing '+text);return el;};
const setInput=(el,value)=>{const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
try{
  let calendars=0;
  await render(Status,{onCalendarClick:()=>calendars++});await run();
  assert.equal(document.querySelector('.luna-status-preview').hasAttribute('data-expanded'),false);
  await run(()=>button('System updates').dispatchEvent(new window.MouseEvent('click',{bubbles:true,detail:1})));
  assert.ok(document.querySelector('.luna-status-feed').textContent.includes('October patch'));
  await run(()=>button('Notifications').dispatchEvent(new window.MouseEvent('click',{bubbles:true,detail:1})));
  assert.ok(document.querySelector('.luna-status-feed').textContent.includes('Guild raid'));
  assert.equal(button('Notifications').getAttribute('aria-expanded'),'true');
  await run(()=>button('Open calendar').click());assert.equal(calendars,1);
  await run(()=>button('System updates').click());assert.equal(document.querySelector('[data-testid="status-overlay"]').textContent,'updates');

  await render(Card,{card:{title:'Moonstep',user_card_id:'card'},onBack:()=>{}});await run();
  assert.deepEqual([...document.querySelectorAll('[role="tab"]')].map(el=>el.textContent),['Overview','Enhancement','Skill Tree','Combined Stage','Essential']);
  for(const label of ['Enhancement','Skill Tree','Combined Stage','Essential']){
    await run(()=>button(label).click());
    assert.equal(document.querySelector('[role="tabpanel"]').getAttribute('aria-label'),label);
  }
  assert.ok(document.querySelector('select[aria-label="Socket type"]'));
  await run(()=>button('Trade Card').click());assert.equal(navigations.at(-1),'/Store?mode=trading&offerCard=card');
  await run(()=>button('Post to Black Market').click());
  await run(()=>setInput(document.querySelector('.card-scroll-actions input'), '75'));
  await run(()=>document.querySelector('.card-scroll-actions form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  assert.deepEqual(calls.find(call=>call.name==='tradePostMarket').body,{action:'listCard',payload:{userCardId:'card',price:75,market:'black_market'}});

  let created;
  await render(Clan,{onClanCreated:id=>{created=id;},onClanJoined:()=>{}});await run();
  assert.equal(document.querySelectorAll('.clan-intro-paths>button').length,2);
  for(const label of ['PvP','PvE','Competitive','Trading','Casual']) assert.ok(button(label));
  const preview=document.querySelector('img[alt="Live clan crest preview"]'), before=preview.src;
  await run(()=>setInput([...document.querySelectorAll('.clan-intro-crest select')][1], 'swords'));
  assert.notEqual(preview.src,before);
  await run(()=>setInput(document.querySelector('input[placeholder="Your clan name"]'),'Nightwatch'));
  await run(()=>setInput(document.querySelector('input[placeholder="AXE"]'),'NITE'));
  await run(()=>button('Trading').click());
  await run(()=>document.querySelector('form.clan-intro-create').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(created,'created-clan');
  const creation=calls.find(call=>call.name==='clanSystem');
  assert.equal(creation.body.data.emblemDesign.symbol,'swords');
  assert.deepEqual(creation.body.data.playstyles,['Trading']);
  await run(()=>document.querySelectorAll('.clan-intro-paths>button')[1].click());
  assert.ok(document.querySelector('.clan-intro-results').textContent.includes('Sky Crew'));
  await run(()=>setInput(document.querySelector('select[aria-label="Filter clans by focus"]'),'PvP'));
  assert.ok(document.querySelector('.clan-intro-empty'));
  console.log('PASS: status feed switching, calendar/updates controls, all five card tabs, selected-card market handoff, clan paths, live SVG preview, saved crest/focus and clan filtering.');
}finally{await act(async()=>root.unmount());client.clear();dom.window.close();delete globalThis.pdfFixture;}
