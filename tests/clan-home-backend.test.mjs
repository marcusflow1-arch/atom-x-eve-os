import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import vm from 'node:vm';

const tables = {
  Division: [{ id:'guild',name:'Nightwatch',leaderId:'leader',motto:'Leave no one behind',level:4,sizeLimit:50,internalNote:'not for the homepage' }],
  ClanMember: [{ id:'m1',clan_id:'guild',user_id:'leader',role:'leader' },{ id:'m2',clan_id:'guild',user_id:'member',role:'member' }],
  ClanMessage: [
    { id:'public',divisionId:'guild',channelId:'clan_global',isAnnouncement:true,content:'Welcome to the guild',author:'Leader',role:'leader',created_date:'2026-09-20',isPinned:false },
    { id:'pinned',divisionId:'guild',channelId:'',isAnnouncement:true,content:'Our shared priorities',author:'Officer',role:'officer',created_date:'2026-09-19',isPinned:true },
    { id:'private',divisionId:'guild',channelId:'clan_leaders',isAnnouncement:true,content:'Private leadership discussion',created_date:'2026-09-21' },
    { id:'other-channel',divisionId:'guild',channelId:'private-room',isAnnouncement:true,content:'A different room',created_date:'2026-09-21' },
    { id:'chat',divisionId:'guild',channelId:'clan_global',isAnnouncement:false,content:'Hello',created_date:'2026-09-21' },
    { id:'different-guild',divisionId:'other',isAnnouncement:true,content:'Another guild',created_date:'2026-09-21' },
  ],
  ClanUpgrade: [{ id:'up1',clan_id:'guild',upgrade_name:'Vault',status:'in_progress',tier:1,progress_seconds:30,build_seconds:100 }],
  ClanHall: [{ id:'hall',clan_id:'guild',hall_name:'Moon Hall',hall_type:'gilded_hollow',favor:42,aetherium:23 }],
};
const users = {leader:{id:'leader',full_name:'Leader'},member:{id:'member',full_name:'Member'},outsider:{id:'outsider'}};
let writes=0, failEntity;
const entities=new Proxy({}, { get:(_,name)=>({
  filter:async(filter={})=>{
    if(name===failEntity) throw new Error('Read unavailable');
    return (tables[name] || []).filter(row=>Object.entries(filter).every(([key,value])=>row[key]===value)).map(row=>({...row}));
  },
  get:async id=>(tables[name] || []).find(row=>row.id===id),
  create:async data=>{writes++;const row={id:'new'+writes,created_date:new Date().toISOString(),...data};(tables[name] ||= []).push(row);return row;},
  update:async()=>{writes++;},delete:async()=>{writes++;},
}) });
const handlers={};
for(const name of ['clanOperations','clanSystem']){
  let handler;const module={exports:{}};
  const source=readFileSync('base44/functions/'+name+'/entry.ts','utf8').replace(/^import .*;\n/,'');
  vm.runInNewContext(transformSync(source,{loader:'ts',format:'cjs'}).code,{
    module,exports:module.exports,Response,Date,console:{warn(){},error(){},log(){}},Deno:{serve:value=>handler=value},
    createClientFromRequest:req=>({auth:{me:async()=>users[req.headers.get('test-user')] || null},entities,asServiceRole:{entities}}),
  });
  handlers[name]=handler;
}
async function call(name,user,action,data,status=200){
  const response=await handlers[name](new Request('https://test.local',{method:'POST',headers:{'test-user':user},body:JSON.stringify({action,data})}));
  const body=await response.json();assert.equal(response.status,status,JSON.stringify(body));return body;
}
await call('clanOperations','missing','home_state',{clanId:'guild'},401);
await call('clanOperations','outsider','home_state',{clanId:'guild'},403);
await call('clanOperations','member','home_state',{clanId:'other'},403);
const home=await call('clanOperations','member','home_state',{clanId:'guild'});
assert.equal(home.role,'member');
assert.equal(home.clan.name,'Nightwatch');
assert.equal(home.clan.internalNote,undefined);
assert.equal(home.members.length,2);
assert.equal(home.members[0].user_id,undefined,'home does not return user identity fields it does not need');
assert.deepEqual(home.announcements.map(row=>row.id),['pinned','public'],'private channels, plain chat, and other guilds never appear');
assert.equal(home.hall.favor,42);
assert.equal(writes,0,'reading the homepage must not change resources or complete upgrades');
failEntity='ClanHall';
const partial=await call('clanOperations','member','home_state',{clanId:'guild'});
assert.deepEqual(partial.failures,['halls']);
assert.equal(partial.announcements.length,2);
assert.equal(partial.hall,null);
failEntity=undefined;
await call('clanSystem','member','post_message',{divisionId:'guild',channelId:'clan_global',content:'Not authorized',isAnnouncement:true},403);
await call('clanSystem','leader','post_message',{divisionId:'guild',channelId:'clan_global',content:'A new shared milestone',isAnnouncement:true});
const refreshed=await call('clanOperations','member','home_state',{clanId:'guild'});
assert.ok(refreshed.announcements.some(row=>row.content==='A new shared milestone'&&row.author==='Leader'));
assert.equal(writes,1);
console.log('PASS: clan home authentication/membership, private-channel isolation, safe projection, partial read failures, read-only progress, and server-enforced announcement publishing.');
