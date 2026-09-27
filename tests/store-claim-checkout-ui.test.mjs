import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://app.example/Checkout' });
for (const name of ['window','document','HTMLElement','Element','Node','Event','MutationObserver']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react'), { act } = React;
const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const fixture = {
  user: { id: 'a' }, authenticated: true, params: new URLSearchParams(), cart: [], calls: [],
  login: 0, removed: [], navigation: [], owned: false,
  claimStatus: { success: true, owned: false, rewards_pending: false },
  claimReplies: [], verifyReplies: [], checkoutReply: {},
};
const SDK = {
  functions: { invoke: async (name, args) => {
    fixture.calls.push({name,args});
    if (name === 'claimFreeGame') {
      if (args.action === 'status') return { data: fixture.claimStatus };
      const response = fixture.claimReplies.shift();
      if (response instanceof Error) throw response;
      fixture.claimStatus = response;
      return { data: response };
    }
    if (name === 'verifyStripeSession') {
      const response = fixture.verifyReplies.shift();
      if (response instanceof Error) throw response;
      return { data: response };
    }
    if (name === 'createCheckoutSession') {
      if (fixture.checkoutReply instanceof Error) throw fixture.checkoutReply;
      return { data: fixture.checkoutReply };
    }
    throw new Error('Unexpected function '+name);
  } },
  entities: { Order: { get: async id => { assert.equal(id, fixture.order?.id); return fixture.order; } } },
};
fixture.SDK = SDK;
const built = await build({
  stdin: { contents: "export {default as Purchase} from './src/components/game/detail/GamePurchasePanel.jsx'; export {default as Checkout} from './src/pages/Checkout.jsx'; export {default as Confirmation} from './src/pages/OrderConfirmation.jsx'; export * from './src/lib/storeCheckout.js';", resolveDir: process.cwd(), loader:'jsx' },
  bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',alias:{'@':process.cwd()+'/src'},
  plugins:[{name:'isolated-services',setup(b){
    b.onResolve({filter:/base44Client|AuthContext|CartContext|WishlistContext|react-router-dom/},args=>({path:args.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:
      args.path.includes('base44Client') ? 'export const base44=globalThis.fixture.SDK;' :
      args.path.includes('AuthContext') ? 'export const useAuth=()=>({user:globalThis.fixture.user,isAuthenticated:globalThis.fixture.authenticated,login:()=>globalThis.fixture.login++});' :
      args.path.includes('CartContext') ? 'export const useCart=()=>({cart:globalThis.fixture.cart,isPurchased:()=>globalThis.fixture.owned,removeFromCart:(id,type)=>globalThis.fixture.removed.push([id,type]),addToCart:item=>globalThis.fixture.cart.push(item),openCart:()=>{}});' :
      args.path.includes('WishlistContext') ? 'export const useWishlist=()=>({isWishlisted:()=>false,toggle:async()=>{},loaded:true});' :
      'import React from "react"; export const useSearchParams=()=>[globalThis.fixture.params]; export const useNavigate=()=>path=>globalThis.fixture.navigation.push(path); export const Link=({to,children,...props})=>React.createElement("a",{href:to,...props},children);'
    }));
  }}],
});
const module={exports:{}};
vm.runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,globalThis:{fixture},window,document,navigator,crypto:webcrypto,URL,console,setTimeout,clearTimeout,setInterval,clearInterval});
const {Purchase,Checkout,Confirmation,checkoutAttempt,forgetCheckoutAttempt}=module.exports;
let root,client;
const wait=()=>new Promise(resolve=>setTimeout(resolve,15));
async function render(component,props={}) { await act(async()=>{root.render(React.createElement(QueryClientProvider,{client},React.createElement(component,props)));await wait();});await act(wait); }
const text=()=>document.body.textContent;
const find=text=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===text);
async function click(label){const button=find(label);assert.ok(button,'Missing button '+label);await act(async()=>{button.click();await wait();});await act(wait);}
const game={id:'game',title:'Example',price:0,status:'available',description:'A game'};
const order={id:'order-123',status:'pending',payment_status:'paid',currency:'USD',total_amount:12.5,items:[{item_id:'game',item_type:'game',title:'Example',price:12.5,quantity:1}]};
beforeEach(()=>{
  Object.assign(fixture,{user:{id:'a'},authenticated:true,params:new URLSearchParams(),cart:[],calls:[],login:0,removed:[],navigation:[],owned:false,claimStatus:{success:true,owned:false,rewards_pending:false},claimReplies:[],verifyReplies:[],checkoutReply:{},order:null});
  window.sessionStorage.clear();
  client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});
  root=createRoot(document.getElementById('root'));
});
afterEach(async()=>{await act(async()=>root.unmount());client.clear();});

test('free game claims from the actual purchase panel and exposes a working reward retry',async()=>{
  fixture.claimReplies.push({success:true,owned:true,rewards_pending:true,can_retry:true},{success:true,owned:true,rewards_pending:false,can_retry:false});
  await render(Purchase,{game});
  await click('Claim free game');
  assert.ok(text().includes('Starter rewards are still pending'));
  assert.ok(find('Open in library'));assert.equal(fixture.cart.length,0);
  await click('Retry starter rewards');
  assert.equal(find('Retry starter rewards'),undefined);
  assert.equal(fixture.calls.filter(call=>call.name==='claimFreeGame'&&!call.args.action).length,2);
  await click('Open in library');assert.deepEqual(fixture.navigation,['/Library']);
});
test('a pending free claim remains recoverable after remounting the panel',async()=>{
  fixture.claimStatus={success:true,owned:true,rewards_pending:true,can_retry:true};
  await render(Purchase,{game:{...game,price:20,status:'planned'}});
  assert.ok(find('Retry starter rewards'));
  fixture.claimReplies.push(new Error('Connection interrupted'));
  await click('Retry starter rewards');
  assert.ok(document.querySelector('[role="alert"]').textContent.includes('Connection interrupted'));
  assert.equal(find('Retry starter rewards').disabled,false);
});
test('signed-out free claim opens sign in and never calls the grant endpoint',async()=>{
  fixture.authenticated=false;fixture.user=null;
  await render(Purchase,{game});await click('Sign in to claim');
  assert.equal(fixture.login,1);assert.equal(fixture.calls.length,0);
});
test('paid purchase panel keeps the existing add-to-cart action',async()=>{
  await render(Purchase,{game:{...game,price:15}});
  await click('Add to cart');
  assert.equal(fixture.cart[0].price,15);assert.equal(fixture.calls.filter(call=>!call.args.action).length,0);
});
test('confirmation shows the verification error rather than a false success and retries without charging',async()=>{
  fixture.params=new URLSearchParams('session_id=cs_test_1');
  fixture.verifyReplies=[new Error('Verification is offline'),{success:true,order:{...order,status:'completed'},rewards_pending:false}];
  await render(Confirmation);
  assert.ok(text().includes('We couldn’t confirm'));assert.ok(!text().includes('Your games are ready'));
  await click('Check order status again');
  assert.ok(text().includes('Your games are ready'));assert.ok(text().includes('$12.50'));assert.ok(!text().includes('AGP'));
  assert.equal(fixture.calls.filter(call=>call.name==='createCheckoutSession').length,0);
  assert.deepEqual(fixture.removed,[['game','game']]);
});
test('pending paid order shows its delivery state and retry action',async()=>{
  fixture.params=new URLSearchParams('session_id=cs_test_1');
  fixture.verifyReplies=[{success:true,order,rewards_pending:true},{success:true,order:{...order,status:'completed'},rewards_pending:false}];
  await render(Confirmation);
  assert.ok(text().includes('This does not charge you again'));
  await click('Retry delivery');assert.ok(text().includes('Your games are ready'));
});
test('an order-history link resumes verification by its saved Stripe session',async()=>{
  fixture.params=new URLSearchParams('orderId=order-123');fixture.order={...order,stripe_session_id:'cs_test_1'};
  fixture.verifyReplies=[{success:true,order:{...order,status:'completed'},rewards_pending:false}];
  await render(Confirmation);
  assert.equal(fixture.calls[0].args.sessionId,'cs_test_1');assert.ok(text().includes('Your games are ready'));
});
test('missing confirmation input and unpaid draft orders do not display paid success',async()=>{
  await render(Confirmation);assert.ok(text().includes('No order was selected'));assert.ok(!text().includes('Purchase recorded'));
  fixture.params=new URLSearchParams('orderId=order-123');fixture.order={...order,payment_status:'unpaid'};
  await render(Confirmation);assert.ok(text().includes('Payment has not been recorded'));assert.ok(!text().includes('Your games are ready'));
});
test('legacy order review does not hide a remaining license-delivery retry',async()=>{
  fixture.params=new URLSearchParams('session_id=cs_test_1');
  fixture.verifyReplies=[{success:true,order,rewards_pending:true,legacy_rewards_unverified:true}];
  await render(Confirmation);assert.ok(find('Retry delivery'));assert.ok(text().includes('support review'));
});
test('mixed cart has individual free claims and sends only paid IDs to Stripe checkout',async()=>{
  fixture.cart=[{id:'free',type:'game',title:'Free game',price:0},{id:'paid',type:'game',title:'Paid game',price:12.5}];
  fixture.checkoutReply={verify:true,sessionId:'cs_test_1'};
  await render(Checkout);
  assert.ok(find('Claim free game'));assert.equal(document.querySelectorAll('input').length,0);
  assert.ok(!text().includes('Mock Payment'));await click('Continue to secure checkout');
  const request=fixture.calls.find(call=>call.name==='createCheckoutSession').args;
  assert.deepEqual(Array.from(request.items,item=>[item.id,item.type]),[['paid','game']]);
  assert.ok(request.checkoutKey.length>=16);
  assert.deepEqual(fixture.navigation,['/OrderConfirmation?session_id=cs_test_1']);
});
test('unsupported cart items cannot submit checkout',async()=>{
  fixture.cart=[{id:'card',type:'card',title:'Card',price:5}];await render(Checkout);
  assert.equal(find('Continue to secure checkout').disabled,true);
  assert.ok(document.querySelector('[role="alert"]').textContent.includes('unsupported'));
});
test('retrying the same checkout retains its request key; an expired session resets it',async()=>{
  const cart=[{id:'game',type:'game',price:10}], storage=window.sessionStorage;
  const first=checkoutAttempt('a',cart,storage);
  assert.equal(checkoutAttempt('a',cart,storage),first);
  assert.notEqual(checkoutAttempt('b',cart,storage),first);
  forgetCheckoutAttempt('a',cart,storage);assert.notEqual(checkoutAttempt('a',cart,storage),first);
  fixture.cart=cart;fixture.checkoutReply=Object.assign(new Error('expired'),{response:{data:{error:'Checkout expired',code:'CHECKOUT_EXPIRED'}}});
  await render(Checkout);await click('Continue to secure checkout');
  const previous=fixture.calls.find(call=>call.name==='createCheckoutSession').args.checkoutKey;
  fixture.checkoutReply={verify:true,sessionId:'cs_test_1'};
  await click('Continue to secure checkout');
  assert.notEqual(fixture.calls.filter(call=>call.name==='createCheckoutSession')[1].args.checkoutKey,previous);
});
