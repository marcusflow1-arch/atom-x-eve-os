import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', {url:'https://test.local/Luna'});
for (const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','sessionStorage']) globalThis[name]=dom.window[name];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'), {act}=React;
const {createRoot}=await import('react-dom/client');
const {QueryClient,QueryClientProvider}=createRequire(import.meta.url)('@tanstack/react-query');
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false,gcTime:0}}});
const subscriptions=new Map(), calls=[];
let attackFails=false;
let server={queue:{id:'q',status:'waiting',match_id:null,connected_at:null,ready_at:null},match:null};
globalThis.pvpFixture={
  client, user:{id:'a'}, avatar:{gender:'male'},
  session:{players:[],channel_id:'',status:'disconnected'},
  sdk:{
    entities:new Proxy({}, {get:(_,name)=>({
      subscribe(callback){
        if(!subscriptions.has(name))subscriptions.set(name,new Set());
        subscriptions.get(name).add(callback);
        return ()=>subscriptions.get(name).delete(callback);
      },
    })}),
    functions:{invoke:async(name,{action,data})=>{
      assert.equal(name,'aiBattleMatchmaker');calls.push({action,data});
      if(attackFails&&action==='use_skill')throw Object.assign(new Error('Rate limit exceeded'),{status:429});
      return {data:{...structuredClone(server),server_received_at:Date.now(),server_time:Date.now()}};
    }},
  },
};
const fixtureSources={
  base44Client:'export const base44=globalThis.pvpFixture.sdk;',
  'query-client':'export const queryClientInstance=globalThis.pvpFixture.client;',
  AuthContext:'export const useAuth=()=>({user:globalThis.pvpFixture.user});',
  ErrorToast:'export const showInfo=()=>{};',
  dashboardSession:'export const dashboardSession={publish(){}}; export const joinDashboard=async()=>{}; export const useDashboardSession=()=>globalThis.pvpFixture.session;',
  CompanionIdentityContext:'export const useCompanionIdentity=()=>globalThis.pvpFixture.avatar;',
  characterStore:'export const getActiveCharacter=()=>globalThis.pvpFixture.avatar;export const subscribeCharacters=()=>()=>{};',
};
const code=await build({
  entryPoints:['src/components/battle/useAIBattleQueue.js'],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',
  alias:{'@':process.cwd()+'/src'},
  plugins:[{name:'queue-fixtures',setup(b){
    b.onResolve({filter:/base44Client$|query-client$|AuthContext$|ErrorToast$|dashboardSession$|CompanionIdentityContext$|characterStore$/},(args)=>({path:args.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},(args)=>({loader:'js',contents:fixtureSources[Object.keys(fixtureSources).find((key)=>args.path.endsWith(key))]}));
  }}],
});
const filename=process.cwd()+'/tests/__pvp_queue_bundle.cjs', module=new Module(filename);
module.paths=Module._nodeModulePaths(process.cwd()); module._compile(code.outputFiles[0].text,filename);
const {default:useQueue,stopAIBattleQueueHeartbeat}=module.exports;
let host, popup;
function Host(){host=useQueue({polling:true,sessionBridge:false});return React.createElement('output',null,host.match?.status||host.queue?.status||'idle');}
function Popup(){popup=useQueue({polling:false,sessionBridge:false});return null;}
const root=createRoot(document.getElementById('root'));
const flush=(fn=()=>{},ms=40)=>act(async()=>{await fn();await new Promise((resolve)=>setTimeout(resolve,ms));});
const emit=(name,data)=>{for(const callback of subscriptions.get(name)||[])callback({type:'update',id:data.id,data});};
let mounted=false;
try{
  await flush(()=>{root.render(React.createElement(QueryClientProvider,{client},React.createElement(React.Fragment,null,React.createElement(Host),React.createElement(Popup))));mounted=true;});
  await flush();
  assert.equal(calls.filter((row)=>row.action==='status').length,1,'two observers share initial request');
  assert.equal(subscriptions.get('AIBattleQueueEntry').size,1,'only host subscribes');
  assert.equal(subscriptions.get('AIBattleMatch').size,1);
  assert.equal(document.querySelector('output').textContent,'waiting');
  const beforeHeartbeat=calls.length;
  await flush(()=>emit('AIBattleQueueEntry',{...server.queue,user_id:'a',last_seen_at:'later'}),90);
  assert.equal(calls.length,beforeHeartbeat,'own heartbeat does not cause a refresh loop');
  await flush(()=>emit('AIBattleQueueEntry',{...server.queue,id:'foreign',user_id:'other',status:'matched',match_id:'foreign'}),90);
  assert.equal(calls.length,beforeHeartbeat,'foreign queue cannot wake this cache');

  server={
    queue:{...server.queue,status:'matched',match_id:'m',connected_at:'ack'},
    match:{id:'m',status:'connecting',host_id:'a',player_ids:['a','b'],players:[{id:'a',hp:1000},{id:'b',hp:1000}],attack_revision:0,pending_hits:[]},
  };
  const matchedAt=Date.now();
  await flush(()=>emit('AIBattleQueueEntry',{...server.queue,user_id:'a'}),90);
  await flush();
  assert.equal(host.match?.id,'m');assert.equal(popup.match?.id,'m');
  assert.ok(Date.now()-matchedAt<1500,'match appears without waiting for the 3-second queue poll');

  server.match={...server.match,status:'fighting',attack_revision:1,players:[{id:'a',hp:1000},{id:'b',hp:930}]};
  const beforeHit=calls.length;
  await flush(()=>{for(let i=0;i<10;i++)emit('AIBattleMatch',server.match);},90);
  await flush();
  assert.equal(calls.length,beforeHit+1,'ten copies of a combat event produce one status request');
  assert.equal(host.match.players[1].hp,930);
  const beforeMovement=calls.length;
  await flush(()=>emit('AIBattleMatch',{...server.match,positions:{a:{x:4,z:3}},updated_date:'later'}),90);
  assert.equal(calls.length,beforeMovement,'movement does not trigger extra status requests');

  attackFails=true;
  await flush(async()=>{await assert.rejects(popup.useSkill(0,'rejected',{},{}),/Rate limit/);});
  assert.equal(calls.filter((row)=>row.action==='use_skill').length,1,'combat 429 is not replayed later');
  assert.equal(host.match.players[1].hp,930,'failed attack preserves server state');

  await flush(()=>{root.unmount();mounted=false;});
  assert.equal(subscriptions.get('AIBattleQueueEntry').size,0);
  assert.equal(subscriptions.get('AIBattleMatch').size,0);
  console.log('PASS: real queue hooks share requests, receive scoped realtime matches/hits, ignore heartbeat/movement events, never retry attacks, and clean up subscriptions.');
}finally{
  if(mounted)await act(async()=>root.unmount());
  stopAIBattleQueueHeartbeat();client.clear();dom.window.close();delete globalThis.pvpFixture;
}
