import test from 'node:test';
import assert from 'node:assert/strict';
import Module, {createRequire} from 'node:module';
import vm from 'node:vm';
import {build,buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
import {makeRewardFixture} from './helpers/reward-fixture.mjs';

const dom=new JSDOM('<button id="opener">Open card</button><div id="root"></div>',{url:'https://test.local/GenreMastery',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','KeyboardEvent','CustomEvent','HTMLInputElement'])globalThis[key]=dom.window[key];
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const {QueryClient,QueryClientProvider}=createRequire(import.meta.url)('@tanstack/react-query');
const f=makeRewardFixture(),handlers={},calls=[];
const user={id:'owner',role:'user',full_name:'Card owner',avatar_gamer_points:1000};
const deterministicMath=Object.create(Math);deterministicMath.random=()=>0;
for(const name of ['cardProgression','tradePostMarket']){
 const code=buildSync({entryPoints:['base44/functions/'+name+'/entry.ts'],bundle:true,write:false,format:'cjs',platform:'node',external:['npm:*']}).outputFiles[0].text;
 const module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,Response,Date,Math:deterministicMath,console,Deno:{serve:fn=>handlers[name]=fn},require:()=>({createClientFromRequest:()=>({auth:{me:async()=>user},entities:f.entities(user),asServiceRole:{entities:f.entities()}})})});
}
async function invoke(name,body){
 calls.push({name,body});
 const response=await handlers[name](new Request('https://test.local',{method:'POST',body:JSON.stringify(body)}));
 const data=await response.json();return {data};
}
let override=null;
globalThis.cardDetailFixture={functions:{invoke:(...args)=>override?override(...args):invoke(...args)},entities:{CardProgression:{subscribe:()=>()=>{}},UserCard:{subscribe:()=>()=>{}}}};
const bundle=await build({entryPoints:['src/components/cards/detail/CardDetailWorkspace.jsx'],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},loader:{'.css':'empty'},plugins:[{name:'card-api-fixture',setup(b){b.onResolve({filter:/base44Client$/},()=>({path:'api',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const base44=globalThis.cardDetailFixture;',loader:'js'}));}}]});
const module=new Module(process.cwd()+'/tests/__card_detail_ui.cjs');module.paths=Module._nodeModulePaths(process.cwd());module._compile(bundle.outputFiles[0].text,process.cwd()+'/tests/__card_detail_ui.cjs');
const Card=module.exports.default;
let root,client,closed;
const run=fn=>act(async()=>{await fn?.();await new Promise(resolve=>setTimeout(resolve,25));});
const button=text=>{const el=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===text||el.getAttribute('aria-label')===text);assert(el,'Missing button: '+text);return el;};
const click=async value=>{const el=typeof value==='string'?button(value):value;assert(el&&!el.disabled,'Enabled button: '+value);await run(()=>el.click());};
const tab=id=>click(document.querySelector('[data-tab="'+id+'"]'));
const render=card=>run(()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(Card,{card,onClose:()=>closed++}))));
const p=()=>f.rows('CardProgression').find(row=>row.user_card_id==='main');
const mats=type=>f.rows('UserMaterial').find(row=>row.material_type===type);
const owned={id:'definition',title:'Scavenger Elite',user_card_id:'main',isOwned:true,description:'Master the frontier.',stats:{attack:28}};
async function setup(){
 f.reset();calls.length=0;override=null;closed=0;
 f.rows('User').push({...user});f.rows('Avatar').push({id:'avatar',user_id:user.id,gender:'male',level:5});
 f.rows('UserCard').push({id:'main',user_id:user.id,card_name:'Scavenger Elite',card_rarity:'Rare',card_type:'ability',game_name:'ARC Raiders',quantity:1,trade_status:'available',acquisition_method:'unlocked'});
 for(const id of ['offering-one','offering-two'])f.rows('UserCard').push({id,user_id:user.id,card_name:id,card_rarity:'Rare',card_type:'ability',game_name:'ARC Raiders',quantity:1,trade_status:'available'});
 // This card is too low-rarity for a Rare card's same-game fusion.
 f.rows('UserCard').push({id:'incompatible',user_id:user.id,card_name:'Common material',card_rarity:'Common',game_name:'ARC Raiders',quantity:1});
 for(const type of ['skill_catalyst','precision_shard','combat_core','resonance_fragment','adaptive_shard','ascension_core','wildcard'])f.rows('UserMaterial').push({id:type,user_id:user.id,material_type:type,material_id:type,quantity:20});
 f.rows('Enchantment').push({id:'gem',name:'Azure Ward',socket_type:'gem',slot_cost:1,element:'ice',modifiers:{defense:3},allowed_item_types:['ability'],material_cost:{resonance_fragment:2}});
 await invoke('cardProgression',{action:'getState',userCardId:'main'});
 client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});
 root=createRoot(document.getElementById('root'));document.getElementById('opener').focus();
}
async function cleanup(){await run(()=>root.unmount());client.clear();override=null;}
test('the new workshop runs real level, stat, enchantment, divine and ascension handlers',async()=>{
 await setup();try{
  p().xp=p().xp_to_next;
  await render(owned);await run();
  assert.equal(document.querySelector('.cdw-showcase-power strong').textContent,String(p().power_score));
  assert.equal(document.querySelectorAll('[role="tab"]').length,5);
  await tab('upgrade');
  const originalPower=p().power_score;
  await click('Advance to level 2');assert.equal(p().level,2);assert.equal(p().stat_points,1);assert(p().power_score>originalPower);
  await click('Allocate to Attack');assert.equal(p().stat_points,0);assert.equal(p().enhanced_stats.attack,1);
  const shardBefore=mats('precision_shard').quantity;
  await click('Enhance Attack');assert.equal(mats('precision_shard').quantity,shardBefore-1);assert.equal(p().enhanced_stats.attack,4);
  await click('Train · +60 XP');assert.equal(mats('skill_catalyst').quantity,19);assert.equal(p().xp,60);
  await click('Enchantment');assert.match(document.body.textContent,/Azure Ward/);
  await click('Review infusion');assert.equal(p().enchantments.length,0);
  await run(()=>document.querySelector('[data-card-review]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(closed,0);assert.equal(document.querySelector('[data-card-review]'),null);
  await click('Review infusion');await click('Confirm infusion');assert.equal(p().enchantments[0].id,'gem');assert.equal(mats('resonance_fragment').quantity,18);
  await click('Review over-enchantment');assert.match(document.querySelector('[data-card-review]').textContent,/84%/);
  await click('Attempt over-enchant');assert.equal(p().over_enchant_rank,1);assert.equal(p().over_enchant_stability,95);
  await click('Divine stage');assert(!document.querySelector('.cdw-offerings').textContent.includes('Common material'));
  for(const el of document.querySelectorAll('.cdw-offerings button'))await click(el);
  await click('Review divine evolution');assert.equal(f.rows('UserCard').length,4);
  await click('Confirm divine evolution');assert.equal(p().stage,2);assert.equal(f.rows('UserCard').length,2);
  p().level=p().max_level;p().xp=90;p().revision++;
  await click('Refresh card');await click('Ascension');await click('Review ascension');await click('Confirm ascension');
  assert.equal(p().ascension,1);assert.equal(p().max_level,20);assert.equal(p().level,10);assert.equal(p().xp,0);assert.equal(mats('ascension_core').quantity,19);
  await tab('skills');
  const core=[...document.querySelectorAll('.cdw-skill-node')].find(el=>el.textContent.includes('Core Calibration'));
  await click(core.querySelector('button'));assert(p().unlocked_skill_nodes.includes('core_calibration'));
  const precision=[...document.querySelectorAll('.cdw-skill-node')].find(el=>el.textContent.includes('Precision Memory')&&el.querySelector('h4').textContent==='Precision Memory');
  await click(precision.querySelector('button'));await click(precision.querySelector('button'));assert.deepEqual(p().active_perks,['precision_memory']);
  await tab('chronicle');assert(document.querySelectorAll('.cdw-timeline li').length>7);
  assert(document.querySelector('.cdw-timeline').textContent.includes('Ascension 1 unlocked'));
 }finally{await cleanup();}
});
test('exchange requires review, reserves the real card and cancels its listing',async()=>{
 await setup();try{
  await render(owned);await tab('exchange');await run();
  await click(document.querySelectorAll('.cdw-market-options button')[1]);
  const input=document.querySelector('input[aria-label="Asking price in AGP"]');
  await run(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'75');input.dispatchEvent(new Event('input',{bubbles:true}));});
  await click('Review listing');assert.equal(f.rows('CardTrade').length,0);
  await click('Publish listing');await run();
  assert.equal(f.rows('CardTrade')[0].market,'black_market');assert.equal(f.rows('CardTrade')[0].asking_price,75);assert.equal(f.rows('UserCard')[0].trade_status,'locked_in_trade');
  await tab('upgrade');assert(button('Advance to level 2').disabled);
  await tab('exchange');await run();await click('Review cancellation');await click('Cancel listing');await run();
  assert.equal(f.rows('CardTrade')[0].status,'cancelled');assert.equal(f.rows('UserCard')[0].trade_status,'available');
 }finally{await cleanup();}
});
test('unowned definitions never request progression or display invented power',async()=>{
 await setup();try{
  calls.length=0;
  await render({id:'legacy-card',title:'Uncollected relic',isOwned:false});
  assert.equal(calls.length,0);assert.equal(document.querySelector('.cdw-showcase-power strong').textContent,'—');
  await tab('upgrade');assert.match(document.body.textContent,/Collect this card to unlock/);
  await tab('exchange');assert.equal(document.querySelector('input[aria-label="Asking price in AGP"]'),null);
  assert.equal(calls.length,0);
 }finally{await cleanup();}
});
test('late loads cannot replace a newly selected card and repeated clicks send one mutation',async()=>{
 await setup();try{
  let release;
  override=async(name,body)=>body.action==='getState'&&body.userCardId==='main'?new Promise(resolve=>release=async()=>resolve(await invoke(name,body))):invoke(name,body);
  await render(owned);
  await render({id:'next',title:'Next relic',isOwned:false});
  await run(()=>release());assert.equal(document.querySelector('.cdw-title h1').textContent,'Next relic');assert.equal(document.querySelector('.cdw-showcase-power strong').textContent,'—');
  override=null;await render(owned);await tab('upgrade');
  let finish;override=async(name,body)=>body.action==='train'?new Promise(resolve=>finish=async()=>resolve(await invoke(name,body))):invoke(name,body);
  const train=button('Train · +60 XP');
  await run(()=>{train.click();train.click();});assert.equal(mats('skill_catalyst').quantity,20);
  await run(()=>finish());assert.equal(mats('skill_catalyst').quantity,19);assert.equal(calls.filter(c=>c.body.action==='train').length,1);
  override=async()=>({data:{error:'Card not found in your inventory'}});
  await click('Refresh card');assert.match(document.body.textContent,/could not be loaded/);assert.equal(document.querySelector('.cdw-showcase-power strong').textContent,'—');
 }finally{await cleanup();}
});
