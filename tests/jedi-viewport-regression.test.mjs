import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const root = new URL('../public/games/jedi-outcast/',import.meta.url);
const read = name => readFileSync(new URL(name,root),'utf8');
function fixture(){
 const dom = new JSDOM(read('index.html'),{
   url:'https://atom.test/games/jedi-outcast/index.html',
   runScripts:'outside-only',pretendToBeVisual:true,
 });
 const w=dom.window;
 w.eval(read('game2-camera.js'));
 w.eval(read('engine-shell.js'));
 const canvas=w.document.getElementById('canvas');
 const messages=[];
 Object.defineProperty(w,'parent',{value:{postMessage:value=>messages.push(value)}});
 let viewport=[0,0,800,600],framebuffer=null;
 const gl={
   canvas, VIEWPORT:0x0ba2,FRAMEBUFFER_BINDING:0x8ca6,
   drawingBufferWidth:800,drawingBufferHeight:600,
   isContextLost:()=>false,
   getParameter(p){if(p===this.VIEWPORT)return viewport.slice();if(p===this.FRAMEBUFFER_BINDING)return framebuffer;},
   viewport(x,y,width,height){viewport=[x,y,width,height];this.calls.push(viewport.slice());},
   calls:[],
 };
 w.GL={currentContext:{GLctx:gl}};
 const show=(width,height)=>{
   gl.drawingBufferWidth=width;gl.drawingBufferHeight=height;
   canvas.width=width;canvas.height=height;
   w.__reportVideo();
 };
 return {dom,w,gl,canvas,show,messages,get viewport(){return viewport;},set viewport(value){viewport=value;},set framebuffer(value){framebuffer=value;}};
}

test('original game exposes 4:3 1024x768 native video size with source 80-degree FOV',()=>{
 const f=fixture();
 try{
  const args=f.w.__tuneArgs();
  const map=new Map();
  for(let i=0;i<args.length-2;i++)if(args[i]==='+set')map.set(args[i+1],args[i+2]);
  assert.equal(map.get('r_mode'),'-1');
  assert.equal(map.get('r_customwidth'),'1024');
  assert.equal(map.get('r_customheight'),'768');
  assert.equal(map.get('r_customaspect'),String(4/3));
  assert.equal(map.get('cg_fov'),'80');
  const css=read('launcher.css');
  assert.match(css,/#canvas\{[^}]*--jedi-aspect/);
  assert.match(css,/#wrap\{[^}]*overflow:hidden/);
 }finally{f.dom.window.close();}
});

test('native transition from menu to a different GPU backing buffer repairs stale full-screen WebGL viewport',()=>{
 const f=fixture();
 try{
  f.show(800,600);
  assert.equal(f.gl.calls.length,0,'already matching native menu viewport stays unmodified');
  f.show(1024,768);
  assert.deepEqual(f.gl.calls,[[0,0,1024,768]]);
  assert.deepEqual(f.viewport,[0,0,1024,768]);
  assert.equal(f.canvas.width,1024);
  assert.equal(f.canvas.height,768);
  const msg=f.messages.filter(m=>m.type==='atom-jedi-video').at(-1);
  assert.deepEqual(msg.viewport,[0,0,1024,768]);
  assert.equal(msg.fullFrame,true);
  assert.equal(msg.renderWidth,1024);
  assert.equal(msg.renderHeight,768);
  assert.equal(f.canvas.style.getPropertyValue('--jedi-aspect'),String(4/3));
 }finally{f.dom.window.close();}
});

test('resizing presentation within the dashboard does not change real GPU resolution or camera FOV',()=>{
 const f=fixture();
 try{
  f.show(800,600);
  Object.defineProperty(f.canvas,'clientWidth',{value:432,configurable:true});
  Object.defineProperty(f.canvas,'clientHeight',{value:324,configurable:true});
  f.w.__reportVideo();
  const m=f.messages.filter(x=>x.type==='atom-jedi-video').at(-1);
  assert.equal(m.clientWidth,432);
  assert.equal(m.clientHeight,324);
  assert.equal(m.renderWidth,800);
  assert.equal(m.renderHeight,600);
  assert.equal(f.canvas.width,800);
  assert.equal(f.canvas.height,600);
  assert.deepEqual(f.gl.calls,[]);
 }finally{f.dom.window.close();}
});

test('viewport correction never overwrites original cinematic sub-viewports',()=>{
 const f=fixture();
 try{
  f.show(800,600);
  f.viewport=[40,30,720,540];
  f.show(1024,768);
  assert.equal(f.gl.calls.length,0);
  assert.deepEqual(f.viewport,[40,30,720,540]);
 }finally{f.dom.window.close();}
});

test('viewport correction never modifies off-screen framebuffer passes',()=>{
 const f=fixture();
 try{
  f.show(800,600);
  f.framebuffer={name:'bloom'};
  f.show(1024,768);
  assert.equal(f.gl.calls.length,0);
  assert.deepEqual(f.viewport,[0,0,800,600]);
 }finally{f.dom.window.close();}
});

test('viewport correction is idempotent and does not force redraw on context errors',()=>{
 const f=fixture();
 try{
  f.show(800,600);
  f.show(1024,768);
  f.show(1024,768);
  assert.equal(f.gl.calls.length,1);
  f.gl.isContextLost=()=>true;
  f.show(1280,960);
  assert.equal(f.gl.calls.length,1);
 }finally{f.dom.window.close();}
});
