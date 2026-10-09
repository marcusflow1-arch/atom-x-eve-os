import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';

const read=path=>readFileSync(path,'utf8');
test('all five plus buttons use the social popup instead of replacing the AI Attribute panel',()=>{
 const slots=read('src/components/dashboard/FocusModePanel.jsx');
 const panel=read('src/components/dashboard/DashboardAvatarOverview.jsx');
 assert.match(slots,/partySlots\.map/);
 assert.match(slots,/openLunaSocialWindow[\s\S]*mode: 'party'/);
 assert.doesNotMatch(slots,/setAIBoxSocialMode\('party'\)/);
 assert.match(panel,/openLunaSocialWindow/);
 assert.match(panel,/<DashboardWindow id="social-directory"/);
 assert.match(panel,/anchor="ai-attributes"/);
 assert.match(panel,/setSocialDirectoryMode\(id\)/);
 assert.match(panel,/socialModeActive = false/);
 assert.match(panel,/<AIBoxSocialPanel key=\{socialDirectoryMode\} mode=\{socialDirectoryMode\}/);
 assert.match(panel,/<DashboardWindow id="gamer-profile"/);
 assert.match(panel,/data-dashboard-attribute-actions/);
 const windowCode=read('src/components/dashboard/windows/DashboardWindow.jsx');
 assert.match(windowCode,/anchor === 'ai-attributes'/);
});

test('directory uses a permission-aware online presence API and exposes real player actions',()=>{
 const panel=read('src/components/dashboard/AIBoxSocialPanel.jsx');
 const backend=read('base44/functions/dashboardSession/entry.ts');
 assert.match(panel,/action: 'online_players'/);
 assert.match(panel,/friendRows \|\| \[\]/);
 assert.match(panel,/filterSocialPlayers\(availablePlayers/);
 assert.match(panel,/action: 'invite_member'/);
 assert.match(panel,/partySession\.publish\(next\)/);
 assert.match(panel,/openLunaGamerProfile/);
 assert.match(panel,/openPlayerMessage/);
 assert.match(panel,/__lunaPendingVoiceTargetId/);
 assert.match(panel,/sendTradeRequest/);
 assert.match(backend,/action === 'online_players'/);
 assert.match(backend,/svc\.PlayerState\.filter/);
 assert.match(backend,/byPlayer\.size >= 100/);
 assert.ok(!backend.slice(backend.indexOf("action === 'online_players'"),backend.indexOf("action === 'online_summary'")).includes('model_url:'));
});

test('party membership updates the roster, joins the same dashboard and spaces remote players',()=>{
 const accepted=read('src/components/social/SocialNotifications.jsx');
 const drawer=read('src/components/dashboard/PartyDrawer.jsx');
 const dashboard=read('base44/functions/dashboardSession/entry.ts');
 const scene=read('src/components/dashboard/DashboardAvatarScene.jsx');
 const chat=read('src/components/friends/MessengerHub.jsx');
 assert.match(accepted,/action:accept\?'accept_invite'/);
 assert.match(accepted,/await joinDashboard\(\{id:leaderId/);
 assert.match(drawer,/const acceptPartyInvite = async/);
 assert.match(drawer,/await joinDashboard\(\{ id: leaderId/);
 assert.match(dashboard,/index-\(players\.length-1\)\/2\)\*1\.65/);
 assert.match(scene,/gap-\[clamp\(8px,1\.2vw,20px\)\]/);
 assert.match(scene,/data-dashboard-player=\{player\.player_id\}/);
 assert.match(chat,/__lunaPendingVoiceTargetId/);
 assert.match(chat,/startCall\('voice'\)/);
});

test('profile popup actions are wired to existing persistent follow, report, trade and messaging services',()=>{
 const profile=read('src/components/dashboard/LunaGamerProfile.jsx');
 assert.match(profile,/base44\.entities\.Follow\.create/);
 assert.match(profile,/base44\.entities\.Follow\.delete/);
 assert.match(profile,/action: 'remove_friend'/);
 assert.match(profile,/action: 'send_friend_request'/);
 assert.match(profile,/action: 'report'[\s\S]*target_type:'user'/);
 assert.match(profile,/sendTradeRequest/);
 assert.match(profile,/Join Dashboard/);
 assert.match(profile,/Report Player/);
 assert.match(profile,/Voice Chat/);
 assert.match(profile,/Offer Trade/);
 assert.match(profile,/More options/);
});

test('basic gamer profile renders, opens options, and calls the real backend action contracts',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local/luna',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','SVGElement','Event','MouseEvent','CustomEvent','MutationObserver'])globalThis[key]=dom.window[key];
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.navigator||=window.navigator;
 window.confirm=()=>true;
 globalThis.socialFixture={
   follow:[],friends:[{id:'f0',friend_id:'friend-1'}],calls:[],
   sdk:{
     entities:{
       Follow:{
         filter:async()=>globalThis.socialFixture.follow,
         create:async data=>{globalThis.socialFixture.follow.push({...data,id:'follow-1'});return data;},
         delete:async id=>{globalThis.socialFixture.follow=globalThis.socialFixture.follow.filter(p=>p.id!==id);}
       },
       Friend:{filter:async()=>globalThis.socialFixture.friends}
     },
     functions:{invoke:async(name,input)=>{globalThis.socialFixture.calls.push({name,input});return {data:{success:true}};}}
   }
 };
 const bundle=await build({
   stdin:{contents:"export {default as Profile} from './src/components/dashboard/LunaGamerProfile.jsx';",resolveDir:process.cwd(),loader:'jsx'},
   bundle:true,format:'cjs',platform:'node',packages:'external',write:false,jsx:'automatic',loader:{'.css':'empty'},alias:{'@':process.cwd()+'/src'},
   plugins:[{name:'profiles',setup(b){
     b.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'mock'}));
     b.onLoad({filter:/^icons$/,namespace:'mock'},()=>({contents:"export const ChevronDown=()=>null,Flag=()=>null,Heart=()=>null,LogIn=()=>null,MessageSquare=()=>null,Mic=()=>null,Repeat2=()=>null,UserMinus=()=>null,UserPlus=()=>null;",loader:'js'}));
     for(const [suffix,path,code] of [
       ['/base44Client$','base44',"export const base44=globalThis.socialFixture.sdk;"],
       ['/AuthContext$','auth',"export const useAuth=()=>({user:{id:'me'}});"],
       ['/dashboardSession$','session',"export const joinDashboard=async(target)=>globalThis.socialFixture.calls.push({name:'join',target});export const openPlayerMessage=target=>globalThis.socialFixture.calls.push({name:'message',target});"],
       ['/tradeRequest$','trade',"export const sendTradeRequest=async(a,b)=>globalThis.socialFixture.calls.push({name:'trade',a,b});"],
       ['/ErrorToast$','toast',"export const showError=()=>{};export const showSuccess=()=>{};"]
     ]){
       b.onResolve({filter:new RegExp(suffix)},()=>({path,namespace:'mock'}));
       b.onLoad({filter:new RegExp('^'+path+'$'),namespace:'mock'},()=>({contents:code,loader:'js'}));
     }
   }}]
 });
 const file=process.cwd()+'/tests/__luna_profile_mock.cjs',mod=new Module(file);
 mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(bundle.outputFiles[0].text,file);
 const {Profile}=mod.exports;
 const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
 const root=createRoot(document.getElementById('root'));
 const run=fn=>act(async()=>{fn?.();await new Promise(resolve=>setTimeout(resolve,20));});
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text));
 try{
   await run(()=>root.render(React.createElement(Profile,{player:{id:'friend-1',name:'Nova',status:'online',friend:true}})));
   assert.ok(button('Join Dashboard'));
   assert.ok(button('Voice Chat'));
   await run(()=>button('More options').click());
   assert.ok(button('Follow'));
   assert.ok(button('Unfriend'));
   assert.ok(button('Report Player'));
   await run(()=>button('Follow').click());
   assert.equal(globalThis.socialFixture.follow.length,1);
   await run(()=>button('Message').click());
   assert.ok(globalThis.socialFixture.calls.some(c=>c.name==='message'&&c.target.id==='friend-1'));
   await run(()=>button('Offer Trade').click());
   assert.ok(globalThis.socialFixture.calls.some(c=>c.name==='trade'&&c.b.id==='friend-1'));
   await run(()=>button('Join Dashboard').click());
   assert.ok(globalThis.socialFixture.calls.some(c=>c.name==='join'&&c.target.id==='friend-1'));
   await run(()=>button('Report Player').click());
   await run(()=>button('Submit report').click());
   assert.ok(globalThis.socialFixture.calls.some(c=>c.name==='forumSystem'&&c.input.action==='report'&&c.input.data.target_type==='user'));
   await run(()=>button('Unfriend').click());
   assert.ok(globalThis.socialFixture.calls.some(c=>c.name==='socialActions'&&c.input.action==='remove_friend'));
   await run(()=>button('Voice Chat').click());
   assert.equal(window.__lunaPendingVoiceTargetId,'friend-1');
 }finally{
   await run(()=>root.unmount());dom.window.close();delete globalThis.socialFixture;
 }
});
