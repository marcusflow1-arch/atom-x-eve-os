import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Luna Friends has clickable Profile and Trade actions using the existing trade workspace', async () => {
  const quickSource = source('../src/components/dashboard/LunaFriendsQuickAccessPanel.jsx');
  const tradeSource = source('../src/components/streaming/FriendTradePanel.jsx');
  const sidebarSource = source('../src/components/streaming/LibrarySidebar.jsx');
  assert.match(quickSource, /onClick=\{\(\) => openProfile\(friend\)\}/);
  assert.match(quickSource, /onClick=\{\(\) => openTrade\(friend\)\}/);
  assert.match(quickSource, /openLunaGamerProfile/);
  assert.match(quickSource, /<FriendTradePanel[^>]*overlayMode="dashboard"/);
  assert.match(sidebarSource, /<FriendTradePanel friend=\{tradingFriend\}/);
  assert.match(tradeSource, /friendCardTrade/);
  assert.match(tradeSource, /overlayMode === 'dashboard'/);
  assert.match(tradeSource, /data-friend-trade-menu=\{overlayMode\}/);

  const dom = new JSDOM('<div id="root"></div>', { url:'https://test.local/LunaTemplate', pretendToBeVisual:true });
  for (const name of ['window','document','HTMLElement','Element','Node','SVGElement','Event','CustomEvent','MouseEvent','MutationObserver']) {
    globalThis[name] = dom.window[name];
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.navigator ||= dom.window.navigator;
  const { act, createElement } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const mocks = {
    'AuthContext': "export const useAuth=()=>({user:{id:'self-1'}});",
    'react-query': "export const useQuery=({queryKey})=>({data:queryKey[0]==='luna-friends-quick-access'?[{id:'friend-record-99',friend_id:'friend-player-42',friend_name:'Aria',friend_avatar:'',status:'online'}]:[],isLoading:false});",
    'base44Client': "export const base44={functions:{invoke:async()=>({data:{}})}};",
    'ErrorToast': "export const showError=()=>{}; export const showSuccess=()=>{};",
    'FriendTradePanel': "import React from 'react'; export default function TradePreview({friend,onClose,overlayMode}){return React.createElement('div',{'data-trade-preview':friend.id,'data-mode':overlayMode},React.createElement('button',{type:'button',onClick:onClose},'Close Trade'));}",
  };
  const bundle = await build({
    stdin:{contents:"export {default as Friends} from './src/components/dashboard/LunaFriendsQuickAccessPanel.jsx';",resolveDir:process.cwd(),loader:'jsx'},
    bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',
    alias:{'@':process.cwd()+'/src'},
    plugins:[{name:'friends-menu-fixtures',setup(builder){
      builder.onResolve({filter:/.*/},args=>{
        const base=args.path.split('/').at(-1).replace(/\.(jsx|js)$/,'');
        if (args.path==='@tanstack/react-query') return {path:'react-query',namespace:'friends-fixture'};
        if (Object.hasOwn(mocks,base)) return {path:base,namespace:'friends-fixture'};
        return undefined;
      });
      builder.onLoad({filter:/.*/,namespace:'friends-fixture'},args=>({loader:'js',contents:mocks[args.path]}));
    }}],
  });
  const filename=process.cwd()+'/tests/__friends_actions_bundle.cjs';
  const mod=new Module(filename);
  mod.paths=Module._nodeModulePaths(process.cwd());
  mod._compile(bundle.outputFiles[0].text,filename);
  const {Friends}=mod.exports;
  const root=createRoot(document.getElementById('root'));
  const run=async fn=>act(async()=>{fn();await Promise.resolve();});
  let target=null;
  const record=event=>{target=event.detail.player;};
  window.addEventListener('openLunaGamerProfile',record);
  try {
    await run(()=>root.render(createElement(Friends)));
    const profile=document.querySelector('[aria-label="View Aria profile"]');
    const trade=document.querySelector('[aria-label="Trade with Aria"]');
    assert.ok(profile,'Profile button must render');
    assert.ok(trade,'Trade button must render');
    assert.ok(document.querySelector('[aria-label="Message Aria"]'),'Message action remains available');
    assert.ok(document.querySelector('[aria-label="Invite Aria to party"]'),'Party action remains available');
    await run(()=>profile.click());
    assert.equal(target?.id,'friend-player-42','Profile uses friend player ID, not Friend row ID');
    assert.equal(target?.is_friend,true);
    await run(()=>trade.click());
    const menu=document.querySelector('[data-trade-preview="friend-player-42"]');
    assert.ok(menu,'Trade opens the shared FriendTradePanel rather than a new trade implementation');
    assert.equal(menu.getAttribute('data-mode'),'dashboard');
    assert.ok(document.querySelector('[aria-label="Close trade menu overlay"]'),'Trade menu has a backdrop');
    await run(()=>document.querySelector('[aria-label="Close trade menu overlay"]').click());
    assert.equal(document.querySelector('[data-trade-preview]'),null,'Closing trade removes its popup');
  } finally {
    window.removeEventListener('openLunaGamerProfile',record);
    await act(async()=>root.unmount());
    dom.window.close();
  }
});
