/** Integration coverage with unchanged G5-0003-A server quest handler.
 * Requires a complete repository checkout with src/game5/quests/*.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame5MovementAuthority } from '../../../src/game5/gameplay/authoritativeMovement.mjs';
import { createGame5MovementApi } from '../../../src/game5/gameplay/movementApi.mjs';
import { createAuthenticatedQuestHandler } from '../../../src/game5/quests/authenticatedQuestApi.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';

const origin = 'https://game5.example';
const empty = () => ({schema_version:'game5.quest.player.v1',quests:{},wallet:{},rewardLedger:{},outbox:{}});
class AtomicIsolatedTestRepository {
  constructor() {this.records=new Map();this.queues=new Map();}
  async read(id) {return structuredClone(this.records.get(id)??empty());}
  async transact(id,fn) {
    const before=this.queues.get(id)??Promise.resolve();
    const next=before.catch(()=>{}).then(async()=>{
      const record=await this.read(id);
      const result=await fn(record);
      this.records.set(id,structuredClone(record));
      return result;
    });
    this.queues.set(id,next);
    return next;
  }
}
function setup() {
  let clock=100000;
  const now=()=>clock;
  const advance=ms=>clock+=ms;
  const world={...DEV_WORLD,spawn:{x:0,z:-3}}; // trusted spawn near Elder Shen to focus on quest transaction
  const authority=createGame5MovementAuthority({world,now});
  const authenticate=async request=>({authenticated:true,playerId:'base44:'+request.headers.get('x-test-user')});
  const movement=createGame5MovementApi({authority,authenticate,allowedOrigins:[origin]});
  const repository=new AtomicIsolatedTestRepository();
  const quest=createAuthenticatedQuestHandler({repository,authenticate,world:DEV_WORLD,
    getAuthoritativePosition:movement.getAuthoritativePosition,allowedOrigins:[origin],clock:now});
  const request=async (handler,path,body,user='alice')=>{
    const response=await handler(new Request(origin+path,{
      method:'POST',headers:{origin,'x-test-user':user,'content-type':'application/json'},body:JSON.stringify(body),
    }));
    return {status:response.status,...await response.json()};
  };
  const movementRequest=(path,body,user)=>request(movement.handleMovementRequest,'/api/game5/movement/'+path,body,user);
  const questRequest=(path,body,user)=>request(quest,'/api/game5/quest/'+path,body,user);
  const travel=(user,sessionId,seq,dx,dz,sprint=true)=>authority.input({playerId:'base44:'+user,
    intent:{sessionId,seq,moveX:dx,moveZ:dz,sprint}});
  return {authority,repository,advance,movementRequest,questRequest,travel};
}

test('simultaneous verified pickups are player-isolated; one exactly-once test reward',async()=>{
  const r=setup();
  const a=await r.movementRequest('connect',{},'alice');
  const b=await r.movementRequest('connect',{},'bob');
  assert.equal(a.status,200);assert.equal(b.status,200);
  r.travel('alice',a.sessionId,1,1,-.35);
  r.travel('bob',b.sessionId,1,0,0,false);
  assert.equal((await r.questRequest('accept',{npcId:DEV_WORLD.npc.id},'alice')).changed,true);
  assert.equal((await r.questRequest('accept',{npcId:DEV_WORLD.npc.id},'bob')).changed,true);
  for(let seq=2;seq<=21;seq++) {
    r.advance(100);
    r.travel('alice',a.sessionId,seq,1,-.35);
    r.travel('bob',b.sessionId,seq,0,0,false);
  }
  const loc=r.authority.getAuthoritativePosition({playerId:'base44:alice'});
  assert.ok(Math.hypot(loc.position.x-DEV_WORLD.card.x,loc.position.z-DEV_WORLD.card.z)<=DEV_WORLD.interactionRadius);
  const pickups=await Promise.all(Array.from({length:24},()=>r.questRequest('pickup',{pickupId:DEV_WORLD.card.id},'alice')));
  assert.ok(pickups.every(p=>p.status===200));
  assert.equal(pickups.filter(p=>p.changed).length,1);
  const forbidden=await r.questRequest('pickup',{pickupId:DEV_WORLD.card.id},'bob');
  assert.equal(forbidden.error,'NOT_NEAR_TARGET');
  assert.equal((await r.repository.read('base44:bob')).quests['G5-0001'].status,'active');
  r.travel('alice',a.sessionId,22,-1,.35);
  for(let seq=23;seq<=42;seq++) {r.advance(100);r.travel('alice',a.sessionId,seq,-1,.35);}
  const result=await Promise.all(Array.from({length:24},()=>r.questRequest('complete',{npcId:DEV_WORLD.npc.id},'alice')));
  assert.equal(result.filter(x=>x.changed).length,1);
  assert.equal((await r.repository.read('base44:alice')).wallet.game5_quest_token,1);
  assert.equal((await r.repository.read('base44:bob')).wallet.game5_quest_token??0,0);
  assert.equal(Object.keys((await r.repository.read('base44:alice')).rewardLedger).length,1);
});

test('stale server observation blocks pickup even if client claims a card position',async()=>{
 const r=setup();
 const a=await r.movementRequest('connect',{},'alice');
 r.travel('alice',a.sessionId,1,0,0,false);
 await r.questRequest('accept',{npcId:DEV_WORLD.npc.id},'alice');
 r.advance(2600);
 const denied=await r.questRequest('pickup',{pickupId:DEV_WORLD.card.id,position:{x:14,z:-8}},'alice');
 assert.equal(denied.error,'FORBIDDEN_CLIENT_FIELDS');
 const stillDenied=await r.questRequest('pickup',{pickupId:DEV_WORLD.card.id},'alice');
 assert.equal(stillDenied.error,'AUTHORITATIVE_POSITION_UNAVAILABLE');
 assert.equal((await r.repository.read('base44:alice')).quests['G5-0001'].objective.current,0);
});