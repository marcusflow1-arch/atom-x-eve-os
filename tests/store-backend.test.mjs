import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';
import {priceOf} from '../src/components/store/redesign/discovery.js';

async function handler(name,fixture){
 const built=await build({entryPoints:['base44/functions/'+name+'/entry.ts'],bundle:true,write:false,format:'iife',platform:'node',plugins:[{name:'mock-external-services',setup(b){
  b.onResolve({filter:/^npm:/},args=>({path:args.path,namespace:'isolated'}));
  b.onLoad({filter:/.*/,namespace:'isolated'},args=>({contents:args.path.includes('stripe')?'export default class Stripe {constructor(){return globalThis.fixture.stripe;}}':'export const createClientFromRequest=()=>globalThis.fixture.client;',loader:'js'}));
 }}]});
 let serve;
 vm.runInNewContext(built.outputFiles[0].text,{globalThis:{fixture},Deno:{env:{get:()=>undefined},serve:callback=>serve=callback},Response,console});
 return payload=>serve({json:async()=>payload});
}
let catalog={id:'game',title:'Example',price:40,sale_price:15},user={id:'user',purchased_items:[]},checkout,createdOrder,updates,existingOrders=[];
const fixture={client:{
 auth:{me:async()=>user},
 entities:{Game:{get:async()=>catalog}},
 asServiceRole:{entities:{Game:{get:async()=>catalog},Order:{filter:async()=>existingOrders,create:async data=>{createdOrder=data;return {id:'order',...data};}},User:{update:async(id,data)=>{updates=data;}}}}
},stripe:{checkout:{sessions:{create:async data=>{checkout=data;return {id:'session',url:'https://example.com/checkout'};},retrieve:async()=>({client_reference_id:'user',payment_status:'paid',metadata:{items:JSON.stringify([{id:'game',type:'game',price:1}])},amount_total:1500})}}}};
const create=await handler('createCheckoutSession',fixture);
let result=await create({items:[{id:'game',type:'game',price:1}],successUrl:'https://example.com/ok',cancelUrl:'https://example.com/cancel'});
assert.equal(result.status,200);
assert.equal(checkout.line_items[0].price_data.unit_amount,1500,'checkout uses the displayed sale price and ignores client tampering');
assert.equal(priceOf(catalog)*100,checkout.line_items[0].price_data.unit_amount);
catalog={...catalog,sale_price:50};await create({items:[{id:'game',type:'game'}]});assert.equal(checkout.line_items[0].price_data.unit_amount,4000);
catalog={...catalog,sale_price:-10};await create({items:[{id:'game',type:'game'}]});assert.equal(checkout.line_items[0].price_data.unit_amount,4000);
catalog={...catalog,price:null};result=await create({items:[{id:'game',type:'game'}]});assert.equal(result.status,400);
catalog={id:'game',title:'Example',price:40,sale_price:15};
user={...user,purchased_items:['game']};result=await create({items:[{id:'game',type:'game'}]});assert.equal(result.status,409);
user={...user,purchased_items:[]};
const verify=await handler('verifyStripeSession',fixture);
result=await verify({sessionId:'session'});assert.equal(result.status,200);assert.equal(createdOrder.items[0].price,15);assert.equal(updates.purchased_items[0],'game');
existingOrders=[{id:'order'}];updates=null;result=await verify({sessionId:'session'});assert.equal((await result.json()).alreadyProcessed,true);assert.equal(updates,null);
const salesFixture={client:{auth:{me:async()=>null},asServiceRole:{entities:{Order:{filter:async()=>[
 {created_date:new Date().toISOString(),items:[{id:'game',type:'game'},{id:'dlc',game_id:'game',type:'dlc'},{game_id:'legacy',quantity:2}]},
 {created_date:'2000-01-01',items:[{id:'old-game',type:'game'}]}
]}}}}};
const sales=await handler('storeDiscovery',salesFixture),response=await sales({action:'sales'});
assert.deepEqual((await response.json()).sales,{game:1,legacy:2},'rankings count base games, include legacy orders, and exclude DLC and old orders');
console.log('PASS: isolated backend checkout/verification agree with catalog sale prices, reject invalid prices and duplicate ownership, and rank real game purchases without DLC inflation.');
