import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {transformSync} from 'esbuild';

const tables=new Map();let serial=0;
const clone=v=>JSON.parse(JSON.stringify(v));
const users=Object.fromEntries(['a','b','c','d','e','f','stranger'].map(id=>[id,{id,full_name:'Player '+id}]));
let failure=null;
const entities=new Proxy({}, {get:(_,name)=>{
 const rows=()=>{if(!tables.has(name))tables.set(name,[]);return tables.get(name);};
 return {
  filter:async(q={},sort='',limit=1000,skip=0)=>{
   let found=rows().filter(r=>Object.entries(q).every(([k,v])=>r[k]===v));
   const key=sort.replace(/^-/,'');if(key)found.sort((a,b)=>(String(a[key])>String(b[key])?1:String(a[key])<String(b[key])?-1:0)*(sort.startsWith('-')?-1:1));
   return clone(found.slice(skip,skip+limit));
  },
  get:async id=>{const row=name==='User'?users[id]:rows().find(r=>r.id===id);if(!row)throw new Error('Not found');return clone(row);},
  create:async data=>{
   if(failure?.(name,data))throw new Error('Simulated database failure');
   const schema=JSON.parse(readFileSync('base44/entities/'+name+'.jsonc','utf8'));
   for(const required of schema.required||[])assert.notEqual(data[required],undefined,name+'.'+required);
   for(const [key,value] of Object.entries(data))if(schema.properties[key]?.enum)assert.ok(schema.properties[key].enum.includes(value),name+'.'+key+' rejects '+value);
   const row={...clone(data),id:name+'_'+(++serial),created_date:new Date(Date.now()+serial).toISOString()};
   rows().push(row);return clone(row);
  },
  update:async(id,data)=>{const r=rows().find(x=>x.id===id);if(!r)throw new Error('Not found');Object.assign(r,clone(data));return clone(r);},
  delete:async id=>{tables.set(name,rows().filter(r=>r.id!==id));}
 };
}});
const handlers={};
for(const name of ['socialActions','partySystem','dashboardSession','storeDiscovery']){
 let handler;
 const source=readFileSync('base44/functions/'+name+'/entry.ts','utf8').replace(/^import .*;\n/,'');
 vm.runInNewContext(transformSync(source,{loader:'ts',format:'cjs'}).code,{
  Response,Date,console:{warn(){},error(){}},Deno:{serve:h=>handler=h},
  createClientFromRequest:req=>({auth:{me:async()=>users[req.headers.get('test-user')]||null},asServiceRole:{entities}})
 });
 handlers[name]=handler;
}
async function call(name,user,action,data={},status=200){
 const res=await handlers[name](new Request('https://test.local',{method:'POST',headers:{'test-user':user},body:JSON.stringify({action,data})}));
 const body=await res.json();assert.equal(res.status,status,JSON.stringify(body));return body;
}
const social=(u,a,d,s)=>call('socialActions',u,a,d,s);
const party=(u,a,d,s)=>call('partySystem',u,a,d,s);
const room=(u,a,d,s)=>call('dashboardSession',u,a,d,s);

await social('missing','get_pending_actions',{},401);
const sent=await social('a','send_friend_request',{target_user_id:'b'});
assert.equal(tables.get('SocialNotification').length,1);
assert.equal((await social('a','send_friend_request',{target_user_id:'b'})).already_pending,true);
assert.equal(tables.get('SocialNotification').length,1);
await social('stranger','respond_friend_request',{request_id:sent.request.id,decision:'accept'},404);
const notice=tables.get('SocialNotification')[0];
await social('b','mark_notification_read',{notification_id:notice.id});
assert.equal((await social('b','get_pending_actions')).notifications[0].actionable,true);
failure=(entity,data)=>entity==='Friend'&&data.user_id==='a';
await social('b','respond_friend_request',{request_id:sent.request.id,decision:'accept'},500);
assert.equal((await entities.FriendRequest.get(sent.request.id)).status,'pending');
failure=null;
await social('b','respond_friend_request',{request_id:sent.request.id,decision:'accept'});
await social('b','respond_friend_request',{request_id:sent.request.id,decision:'accept'});
assert.equal(tables.get('Friend').length,2);
assert.equal(tables.get('SocialFriendship').length,1);
assert.equal((await entities.SocialNotification.get(notice.id)).status,'actioned');
const legacy=await social('a','send_friend_request',{target_user_id:'c'});
tables.set('SocialNotification',tables.get('SocialNotification').filter(n=>n.related_entity_id!==legacy.request.id));
assert.ok((await social('c','get_pending_actions')).notifications.some(n=>n.related_entity_id===legacy.request.id&&n.actionable));
await social('c','respond_friend_request',{request_id:legacy.request.id,decision:'accept'});
for(const id of ['d','e','f']){
 const r=await social('a','send_friend_request',{target_user_id:id});
 await social(id,'respond_friend_request',{request_id:r.request.id,decision:'accept'});
}
const invitations={};
for(const id of ['b','c','d','e','f'])invitations[id]=await party('a','invite_member',{inviteeId:id});
assert.equal(invitations.b.party.maxSize,5);
assert.ok((await social('b','get_pending_actions')).notifications.some(n=>n.action_kind==='party_invite'));
await party('stranger','accept_invite',{inviteId:invitations.b.invite.id},404);
for(const id of ['b','c','d','e'])await party(id,'accept_invite',{inviteId:invitations[id].invite.id});
await party('b','accept_invite',{inviteId:invitations.b.invite.id});
assert.equal((await party('a','get_state')).members.length,5);
await party('f','accept_invite',{inviteId:invitations.f.invite.id},409);
assert.equal((await party('a','get_state')).members.length,5);
await party('b','leave_party');
assert.equal((await party('a','get_state')).members.length,4);
await party('f','accept_invite',{inviteId:invitations.f.invite.id});
await room('a','heartbeat',{host_id:'a'});
await room('b','join',{host_id:'a'});
const joined=await room('b','heartbeat',{host_id:'a'});
assert.equal(joined.players[0].player_id,'a');
assert.equal(joined.players[1].x,-0.9);
assert.equal(joined.players[1].model_url,'/models/luna-hi3d/warrior.glb');
for(const id of ['c','d','e'])await room(id,'heartbeat',{host_id:'a'});
await room('f','join',{host_id:'a'});
await room('f','heartbeat',{host_id:'a'},409);
await room('b','leave',{channel_id:'dashboard_b'});
assert.equal((await entities.PlayerState.filter({player_id:'b'}))[0].status,'online');
await room('a','leave',{channel_id:'dashboard_a'});
await room('b','join',{host_id:'a'});
await room('b','heartbeat',{host_id:'a'},409);
const dm=await social('a','send_message',{target_user_id:'b',content:'Simulated test only'});
assert.equal((await social('b','get_thread',{target_user_id:'a'})).messages[0].id,dm.message.id);
assert.equal((await social('stranger','get_thread',{target_user_id:'a'})).messages.length,0);
await social('b','mark_thread_read',{target_user_id:'a'});
assert.equal((await entities.DirectMessage.get(dm.message.id)).is_read,true);
console.log('PASS: authenticated friend requests, partial-write retry, notifications, mutual friendship, parties/capacity, dashboard positioning/presence, and private messages. No live records changed.');
