import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
const require=createRequire(import.meta.url);
const out=path.resolve('node_modules/.cache/records-check');
await fs.mkdir(out,{recursive:true});
const bundle=async(entry,name,mocks={})=>{
 const dest=path.join(out,name+'.cjs');
 await build({entryPoints:[entry],outfile:dest,bundle:true,platform:'node',format:'cjs',jsx:'automatic',packages:'external',loader:{'.css':'empty'},plugins:[{name:'test-stubs',setup(b){
  b.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'stub'}:args.path.startsWith('@/')?{path:path.resolve('src',args.path.slice(2)+(path.extname(args.path)?'':'.jsx'))}:undefined);
  b.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:mocks[args.path],loader:'js'}));
 }}]});
 return require(dest);
};
const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});
for(const key of ['window','document','Element','HTMLElement','CustomEvent','Event','sessionStorage','navigator'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
HTMLElement.prototype.setPointerCapture=function(){};
HTMLElement.prototype.hasPointerCapture=()=>false;
const {default:DashboardWindow,focusDashboardWindow}=await bundle('src/components/dashboard/windows/DashboardWindow.jsx','windows',{'@/components/auth/AuthContext':"export const useAuth=()=>({user:{id:'test-player'}});"});
function Counter(){const [n,set]=React.useState(0);return React.createElement('button',{'data-counter':true,onClick:()=>set(n+1)},String(n));}
function Harness(){const [ids,setIds]=React.useState(['one','two']);return ids.map(id=>React.createElement(DashboardWindow,{key:id,id,title:id,width:400,height:400,onClose:()=>setIds(ids=>ids.filter(i=>i!==id))},React.createElement(Counter)));}
const root=createRoot(document.getElementById('root'));
await act(async()=>root.render(React.createElement(Harness)));
const win=id=>document.querySelector('[data-luna-window="'+id+'"]');
const button=label=>document.querySelector('[aria-label="'+label+'"]');
const click=async node=>act(async()=>node.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
assert.equal(document.querySelectorAll('[data-luna-window]').length,2);
await click(win('one').querySelector('[data-counter]'));
await click(button('Minimize one'));
assert.equal(win('one').querySelector('.luna-window__body').hidden,true);
assert.equal(win('one').querySelector('[data-counter]').textContent,'1','Minimize must preserve content state');
await act(async()=>focusDashboardWindow('one'));
assert.equal(win('one').querySelector('.luna-window__body').hidden,false);
const x=parseFloat(win('one').style.left);
await act(async()=>button('Move one window').dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
assert.equal(parseFloat(win('one').style.left),x+16);
const width=parseFloat(win('one').style.width);
await act(async()=>button('Resize one window').dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
assert.equal(parseFloat(win('one').style.width),width+16);
await act(async()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
assert.equal(win('one'),null);assert.ok(win('two'),'Escape closes only active window');
await act(async()=>root.unmount());
console.log('PASS windows: independent state, minimize/restore, move, resize, topmost Escape');

let handler,identity={id:'owner'},llmCalls=0,signedCalls=0,updated;
let moment={id:'m1',user_id:'owner',record_id:'r1',image_uri:'private/owner/frame.jpg',timestamp:15,source:'manual',kind:'highlight'};
let record={id:'r1',user_id:'owner',game_name:'Test game'};
globalThis.Deno={serve:fn=>{handler=fn;}};
globalThis.__recordsClient={
 auth:{me:async()=>identity},
 entities:{
  GameplayMoment:{get:async()=>moment,update:async(id,patch)=>{updated={...moment,...patch};return updated;}},
  GameplayRecord:{get:async()=>record}
 },
 integrations:{Core:{
  CreateFileSignedUrl:async args=>{signedCalls++;assert.equal(args.file_uri,moment.image_uri);return {signed_url:'https://example.test/private-frame'};},
  InvokeLLM:async args=>{llmCalls++;assert.equal(args.file_urls.length,1);assert.match(args.prompt,/ONE player-selected/);return {title:'Review',kind:'coaching',summary:'Visible cover',evidence:'Wall',suggestion:'Consider cover',practice:'Practice peeking',confidence:'medium',limitations:'Only one frame'};}
 }}
};
await bundle('base44/functions/reviewGameplayMoment/entry.ts','review',{'npm:@base44/sdk':'export const createClientFromRequest=()=>globalThis.__recordsClient;'});
const request=()=>new Request('https://example.test/review',{method:'POST',body:JSON.stringify({moment_id:'m1',file_url:'https://untrusted.test/ignored'})});
identity=null;assert.equal((await handler(request())).status,401);
identity={id:'intruder'};assert.equal((await handler(request())).status,404);assert.equal(signedCalls,0);assert.equal(llmCalls,0);
identity={id:'owner'};record.user_id='other';assert.equal((await handler(request())).status,404);assert.equal(llmCalls,0);
record.user_id='owner';assert.equal((await handler(request())).status,200);assert.equal(updated.kind,'highlight','Preserve manual bookmark');assert.equal(llmCalls,1);
moment=updated;assert.equal((await handler(request())).status,200);assert.equal(llmCalls,1,'Cached review must not charge a second AI call');
for(const name of ['GameplayRecord','GameplayMoment']){
 const schema=JSON.parse(await fs.readFile('base44/entities/'+name+'.jsonc','utf8'));
 for(const action of ['create','read','update','delete'])assert.deepEqual(schema.rls[action],{'data.user_id':'{{user.id}}'});
}
console.log('PASS review: authentication, ownership, private image signing, manual bookmark preservation, cached analysis, owner-only RLS');

const dbRows=new Map();
globalThis.indexedDB={open:()=>{
 const open={};setTimeout(()=>{open.result={createObjectStore(){},close(){},transaction(){
  const tx={};const operation=(kind,value,key)=>{const req={};setTimeout(()=>{if(kind==='put')dbRows.set(key,value);if(kind==='delete')dbRows.delete(key);req.result=dbRows.get(key);req.onsuccess?.();tx.oncomplete?.();},0);return req;};
  tx.objectStore=()=>({get:key=>operation('get',null,key),put:(value,key)=>operation('put',value,key),delete:key=>operation('delete',null,key)});return tx;
 }};open.onsuccess?.();},0);return open;
}};
let denied=true,stopped=0,uploadsFail=false,nextRecord=0;
const tracks=[{stop(){stopped++;},addEventListener(){}}];
Object.defineProperty(navigator,'mediaDevices',{value:{getDisplayMedia:async()=>{if(denied)throw Object.assign(new Error('Denied'),{name:'NotAllowedError'});return {getTracks:()=>tracks,getVideoTracks:()=>tracks};}},configurable:true});
window.HTMLMediaElement.prototype.play=async()=>{};
window.HTMLMediaElement.prototype.pause=()=>{};
globalThis.MediaRecorder=window.MediaRecorder=class{
 static isTypeSupported(){return true;}
 constructor(){this.state='inactive';this.mimeType='video/webm';}
 start(){this.state='recording';}
 stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['test video'],{type:'video/webm'})});this.done=this.onstop?.();}
};
globalThis.File=class extends Blob{constructor(parts,name,opts){super(parts,opts);this.name=name;}};
const records=new Map();
globalThis.__captureClient={entities:{GameplayRecord:{
 create:async data=>{const row={...data,id:'r'+(++nextRecord)};records.set(row.id,row);return row;},
 update:async(id,data)=>{const row={...records.get(id),...data};records.set(id,row);return row;}
}},integrations:{Core:{UploadPrivateFile:async()=>{if(uploadsFail)throw new Error('Offline');return {file_uri:'private/owner/video.webm'};}}}};
const capture=await bundle('src/components/records/recordsCapture.js','capture',{'@/api/base44Client':'export const base44=globalThis.__captureClient;'});
await assert.rejects(()=>capture.startRecording({userId:'owner',gameName:'Test'}));
assert.equal(capture.getRecordsCapture().active,false);assert.equal(records.size,0,'Cancelled permission must create no record');
denied=false;uploadsFail=true;
await capture.startRecording({userId:'owner',gameName:'Test'});
assert.equal(capture.getRecordsCapture().active,true);
capture.stopRecording();
const waitFor=async condition=>{for(let i=0;i<100&&!condition();i++)await new Promise(r=>setTimeout(r,5));assert.ok(condition());};
await waitFor(()=>capture.getRecordsCapture().draft&&!capture.getRecordsCapture().saving);
assert.ok(capture.getRecordsCapture().draft.blob.size>0);
assert.ok(dbRows.get('owner'),'Recoverable draft survives upload failure');
assert.ok(stopped>0,'Capture tracks stop');
uploadsFail=false;await capture.saveRecordDraft();
assert.equal(capture.getRecordsCapture().draft,null);
assert.equal(records.get('r1').status,'ready');assert.equal(dbRows.has('owner'),false);
console.log('PASS capture: permission cancellation, start/stop, tracks cleanup, failed upload recovery, retry and private save');
