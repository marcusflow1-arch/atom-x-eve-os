import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevApiHandler, createDevViteConfig } from '../../../src/game5/gameplay/devServer.mjs';
import { createLostCardGameplayController } from '../../../src/game5/gameplay/lostCardGameplayController.mjs';
import { DevQuestRepository } from '../../../src/game5/gameplay/devQuestRepository.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';
async function setup(t){const dir=await mkdtemp(join(tmpdir(),'g5-api-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));const controller=createLostCardGameplayController({repository:new DevQuestRepository({file:join(dir,'state.json')})});const api=createDevApiHandler(controller);const server=createServer(async(req,res)=>{if(!await api(req,res)){res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());return `http://127.0.0.1:${server.address().port}`;}
test('HTTP responds with server snapshots, errors, and never exposes direct service',async(t)=>{
 const base=await setup(t);
 const req=(path,body,headers={})=>fetch(base+'/api/game5/'+path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json',...headers}:headers,body:body?JSON.stringify(body):undefined});
 let r=await req('state');assert.equal(r.status,200);assert.equal((await r.json()).snapshot.quest.status,'not_started');
 r=await req('complete',{npcId:DEV_WORLD.npc.id,position:{x:0,z:-5}});assert.equal(r.status,409);assert.ok((await r.json()).error);
 r=await req('accept',{npcId:DEV_WORLD.npc.id,position:{x:0,z:-5}});assert.equal(r.status,200);assert.equal((await r.json()).snapshot.quest.status,'active');
 r=await req('pickup',{pickupId:DEV_WORLD.card.id,position:{x:14,z:-8}});assert.equal(r.status,200);assert.equal((await r.json()).snapshot.quest.objective.current,1);
 r=await req('complete',{npcId:DEV_WORLD.npc.id,position:{x:0,z:-5}});assert.equal(r.status,200);assert.equal((await r.json()).snapshot.testWallet,1);
 r=await req('state');assert.equal((await r.json()).snapshot.quest.status,'completed');
 r=await req('accept',{npcId:DEV_WORLD.npc.id,position:{x:0,z:-5}},{origin:'https://evil.example'});assert.equal(r.status,403);
 r=await req('unknown',{position:{x:0,z:0}});assert.equal(r.status,404);
});

test('same-origin on an alternate bound port works; foreign origins and incorrect ports are rejected',async(t)=>{
 const base=await setup(t); // ephemeral port, not hardcoded 4178
 const endpoint=base+'/api/game5/state';
 let r=await fetch(endpoint,{headers:{Origin:base}});
 assert.equal(r.status,200);
 assert.equal((await r.json()).snapshot.quest.status,'not_started');
 r=await fetch(endpoint,{headers:{Origin:'https://foreign.example'}});
 assert.equal(r.status,403);
 r=await fetch(endpoint,{headers:{Origin:'null'}});
 assert.equal(r.status,403);
 const wrongOrigin='http://127.0.0.1:'+ (Number(new URL(base).port)+1);
 r=await fetch(endpoint,{headers:{Origin:wrongOrigin}});
 assert.equal(r.status,403);
 const action={npcId:DEV_WORLD.npc.id,position:{x:0,z:-5}};
 r=await fetch(base+'/api/game5/accept',{
   method:'POST',headers:{Origin:base,'content-type':'application/json'},body:JSON.stringify(action)
 });
 assert.equal(r.status,200);
 assert.equal((await r.json()).snapshot.quest.status,'active');
});

test('Vite dev root only exposes Game 5 client, gameplay and existing dependencies',()=>{
 const vite=createDevViteConfig();
 assert.ok(vite.root.endsWith('/src/game5/client'));
 assert.equal(vite.configFile,false);
 assert.equal(vite.publicDir,false);
 assert.equal(vite.server.middlewareMode,true);
 assert.equal(vite.server.fs.strict,true);
 assert.equal(vite.server.fs.allow.length,3);
 assert.ok(vite.server.fs.allow.some(p=>p.endsWith('/src/game5/gameplay')));
 assert.ok(vite.server.fs.allow.some(p=>p.endsWith('/node_modules')));
 assert.ok(vite.server.fs.allow.every(p=>!p.endsWith('/src')&&!p.endsWith('/src/game5/quests')));
 assert.ok(vite.server.fs.deny.includes('**/.git/**'));
});
