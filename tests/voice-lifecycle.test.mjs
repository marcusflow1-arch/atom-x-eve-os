import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import React,{act,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://test.local'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const signals=[],pcs=[],errors=[];
let listener,permissionCalls=0,mediaResult=()=>Promise.reject(new Error('Denied')),pollResult=async()=>[];
const schema=JSON.parse(readFileSync('base44/entities/VoiceSignal.jsonc'));
class Peer {
 constructor(){this.signalingState='stable';this.connectionState='new';this.transceivers=[];this.candidates=[];pcs.push(this);}
 createDataChannel(){return {readyState:'open',send(){}};}
 addTransceiver(){const t={receiver:{track:{kind:'audio'}},sender:{track:null,replaceTrack:async track=>{t.sender.track=track;}}};this.transceivers.push(t);return t;}
 getTransceivers(){return this.transceivers;}
 async createOffer(){return {type:'offer',sdp:'test-offer'};}
 async createAnswer(){return {type:'answer',sdp:'test-answer'};}
 async setLocalDescription(d){this.localDescription=d;this.signalingState=d.type==='offer'?'have-local-offer':'stable';}
 async setRemoteDescription(d){this.remoteDescription=d;this.signalingState=d.type==='offer'?'have-remote-offer':'stable';}
 async addIceCandidate(c){assert.ok(this.remoteDescription,'ICE must wait for remote SDP');this.candidates.push(c);}
 close(){if(this.connectionState==='closed')return;this.connectionState='closed';this.signalingState='closed';this.onconnectionstatechange?.();}
}
const module={exports:{}};
const source=readFileSync('src/components/shared/useWebRTCVoice.jsx','utf8').replace(/^import .*;\n/gm,'');
vm.runInNewContext(transformSync(source,{loader:'jsx',format:'cjs'}).code,{
 module,exports:module.exports,useEffect,useRef,window,document,CustomEvent:dom.window.CustomEvent,
 console:{warn(){},error(...args){errors.push(args);}},setTimeout,clearTimeout,Date,
 navigator:{mediaDevices:{getUserMedia:()=>{permissionCalls++;return mediaResult();}}},
 RTCPeerConnection:Peer,RTCSessionDescription:class{constructor(v){Object.assign(this,v);}},RTCIceCandidate:class{constructor(v){Object.assign(this,v);}},
 base44:{entities:{VoiceSignal:{
  filter:()=>pollResult(),
  subscribe:fn=>{listener=fn;return()=>{listener=null;};},
  create:async data=>{assert.ok(schema.properties.type.enum.includes(data.type));signals.push(data);return {...data,id:String(signals.length)};}
 }}}
});
const {useWebRTCVoice}=module.exports;
function Harness(props){useWebRTCVoice(props.room||'dashboard_b',{id:props.id||'b'},props.muted??true,false,props.peers||['a','b']);return null;}
let root=createRoot(document.getElementById('root'));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const render=async props=>{await act(async()=>{root.render(React.createElement(Harness,props));await settle();});};
const receive=async data=>{await act(async()=>{listener({type:'create',data:{id:'signal-'+Math.random(),channel_id:'dashboard_b',target_id:'b',sender_id:'a',created_date:new Date().toISOString(),...data}});await settle();});};
await render({});
assert.equal(permissionCalls,0,'joining muted must not request microphone');
assert.equal(signals.filter(s=>s.type==='offer').length,1,'only one offer per peer');
const first=pcs[0];
await receive({id:'ice-before-answer',type:'ice',payload:{candidate:'candidate-one'}});
assert.equal(first.candidates.length,0);
await receive({id:'answer-one',type:'answer',payload:{type:'answer',sdp:'test-answer'}});
assert.equal(first.candidates.length,1);
await receive({id:'ice-before-answer',type:'ice',payload:{candidate:'candidate-one'}});
assert.equal(first.candidates.length,1,'duplicate signal ignored');
first.onicecandidate({candidate:{toJSON:()=>({candidate:'outgoing'})}});
assert.equal(signals.at(-1).type,'ice');
let denied=0;window.addEventListener('webrtcPermissionDenied',()=>denied++);
await render({muted:false});
assert.equal(permissionCalls,1);assert.equal(denied,1);
assert.notEqual(first.connectionState,'closed','mic denial must not disconnect signaling');
await render({peers:['b']});
assert.equal(first.connectionState,'closed');
await act(async()=>root.unmount());
assert.equal(listener,null);
assert.equal(window.webrtcBroadcast,undefined);

// A delayed permission grant after leaving must release the microphone.
root=createRoot(document.getElementById('root'));
let grant;
mediaResult=()=>new Promise(resolve=>{grant=resolve;});
await render({muted:false,peers:['b']});
await act(async()=>root.unmount());
let stopped=0;
await act(async()=>{grant({getTracks:()=>[{stop:()=>stopped++}],getAudioTracks:()=>[]});await settle();});
assert.equal(stopped,1);

// A late polling response from a departed room must never create another peer.
root=createRoot(document.getElementById('root'));
let resolvePoll;
pollResult=()=>new Promise(resolve=>{resolvePoll=resolve;});
const before=pcs.length;
await render({peers:['b']});
await act(async()=>root.unmount());
await act(async()=>{resolvePoll([]);await settle();});
assert.equal(pcs.length,before);
assert.deepEqual(errors,[]);
console.log('PASS: voice offer/ICE negotiation, signal deduplication, mic opt-in/denial, peer departure, delayed mic release, and room cleanup with simulated peers.');
dom.window.close();
