import React from 'react';
import { createRoot } from 'react-dom/client';
import GameWorldEditDock from './GameWorldEditDock';
import * as THREE from 'three';

let root = null;
let host = null;
let poll = null;
let shellObserver = null;
let shell = null;
const STYLE_ID = 'atomxe-editor-unified-layout-style';
const TAB_LABELS = ['World','Models','Physics','Effects','Damage','Actors','Equipment','Animation','Stats','Camera'];

function hideButton(button) {
  button.style.setProperty('display', 'none', 'important');
  button.style.setProperty('visibility', 'hidden', 'important');
  button.style.setProperty('opacity', '0', 'important');
  button.style.setProperty('pointer-events', 'none', 'important');
  button.style.setProperty('width', '0', 'important');
  button.style.setProperty('height', '0', 'important');
  button.style.setProperty('min-width', '0', 'important');
  button.style.setProperty('min-height', '0', 'important');
  button.style.setProperty('margin', '0', 'important');
  button.style.setProperty('padding', '0', 'important');
  button.setAttribute('aria-hidden', 'true');
}

function injectLayoutStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #atomxe-live-world-editor-root > aside {
      right: 0 !important;
      left: auto !important;
      top: 0 !important;
      bottom: 25vh !important;
      width: 30vw !important;
      min-width: 360px !important;
      max-width: 520px !important;
      border-radius: 0 !important;
    }
    #atomxe-live-world-editor-root > button { display:none !important; visibility:hidden !important; pointer-events:none !important; }
    #atomxe-editor-shell button, #atomxe-editor-shell input, #atomxe-editor-shell select { font: inherit; }
    #atomxe-editor-left-panel, #atomxe-editor-bottom-panel { box-sizing:border-box; }
  `;
  document.head.appendChild(style);
}

function glassButton(label, action, compact=false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = `border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:rgba(255,255,255,.72);border-radius:9px;padding:${compact?'6px 7px':'7px 8px'};font-size:9px;text-align:left;cursor:pointer;backdrop-filter:blur(18px);white-space:nowrap;`;
  button.addEventListener('mouseenter', () => { button.style.background = 'rgba(255,255,255,.08)'; button.style.color = '#fff'; });
  button.addEventListener('mouseleave', () => { button.style.background = 'rgba(255,255,255,.035)'; button.style.color = 'rgba(255,255,255,.72)'; });
  button.addEventListener('click', action);
  return button;
}

function findLegacyLaunchers() {
  const editorRoot = document.querySelector('#atomxe-live-world-editor-root');
  const buttons = editorRoot ? [...editorRoot.querySelectorAll('button')] : [];
  return buttons.filter(button => {
    const text = button.textContent?.trim().toLowerCase().replace(/\s+/g,' ') || '';
    return text === 'edit' || text === 'edit world' || text.includes('edit world');
  });
}
function hideLegacyEditLauncher() { findLegacyLaunchers().forEach(hideButton); }

function openOriginalEdit() {
  const original = findLegacyLaunchers()[0];
  if (!original) return;
  original.style.setProperty('display','block','important');
  original.style.setProperty('visibility','visible','important');
  original.style.setProperty('opacity','0','important');
  original.style.setProperty('pointer-events','auto','important');
  original.click();
  hideLegacyEditLauncher();
}

function canvasElement() {
  const scene = window.__gw3dScene;
  return scene?.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
}
function getSceneObjects(query='') {
  const scene = window.__gw3dScene;
  if (!scene) return [];
  const q = query.trim().toLowerCase();
  const rows=[];
  scene.traverse(o => {
    if (!o || o===scene || o.visible===false || o.isLight || o.isCamera || o.userData?.editorOnly || o.userData?.editorHelper) return;
    if (!(o.isMesh || o.isGroup || o.isObject3D)) return;
    const hay=`${o.name||''} ${o.userData?.role||''} ${o.userData?.type||''}`.toLowerCase();
    if (!q || hay.includes(q)) rows.push(o);
  });
  return rows.slice(0,80);
}

function createShell() {
  if (shell || typeof document === 'undefined') return;
  injectLayoutStyle();
  shell = document.createElement('div');
  shell.id = 'atomxe-editor-shell';
  shell.style.cssText = 'position:fixed;inset:0;z-index:119;pointer-events:none;display:block;';

  const editButton = document.createElement('button');
  editButton.type='button';
  editButton.textContent='EDIT';
  editButton.style.cssText='position:absolute;left:50%;top:88px;transform:translateX(-50%);pointer-events:auto;border:1px solid rgba(255,255,255,.16);background:rgba(10,10,14,.62);color:rgba(255,255,255,.92);border-radius:999px;padding:8px 18px;font-size:11px;font-weight:700;letter-spacing:.12em;box-shadow:0 12px 40px rgba(0,0,0,.35);backdrop-filter:blur(22px);cursor:pointer;';
  editButton.addEventListener('click', openOriginalEdit);
  shell.appendChild(editButton);

  const left=document.createElement('section');
  left.id='atomxe-editor-left-panel';
  left.style.cssText='position:absolute;left:0;top:0;bottom:25vh;width:30vw;pointer-events:auto;overflow:hidden;border-right:1px solid rgba(255,255,255,.10);background:rgba(7,10,18,.76);box-shadow:0 24px 60px rgba(0,0,0,.24);backdrop-filter:blur(28px);padding:14px;box-sizing:border-box;display:none;color:#fff;';
  left.innerHTML='<div style="font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.42);">OBJECT INSPECTOR</div><div id="atomxe-left-selected" style="margin-top:4px;font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">No object selected</div><div id="atomxe-left-kind" style="margin-top:3px;font-size:8px;color:rgba(255,255,255,.32);">Select anything in the live Three.js world</div>';
  const select=document.createElement('select');
  select.id='atomxe-left-tool-select';
  select.style.cssText='display:none;margin-top:12px;width:100%;height:34px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(0,0,0,.32);color:#fff;padding:0 10px;font-size:10px;outline:none;';
  select.innerHTML='<option value="">Select editor category…</option>'+TAB_LABELS.map(x=>`<option value="${x}">${x}</option>`).join('');
  select.addEventListener('change',()=>{if(select.value)window.dispatchEvent(new CustomEvent('gameEditorSetTab',{detail:{label:select.value}}));});
  left.appendChild(select);
  const divider=document.createElement('div');
  divider.style.cssText='height:1px;background:rgba(255,255,255,.10);margin:12px 0;';
  left.appendChild(divider);
  const searchWrap=document.createElement('div');
  searchWrap.style.cssText='display:flex;align-items:center;gap:7px;';
  const search=document.createElement('input');
  search.placeholder='Search world objects…';
  search.style.cssText='width:100%;height:32px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:rgba(0,0,0,.22);color:#fff;padding:0 9px;font-size:9px;outline:none;';
  searchWrap.appendChild(search); left.appendChild(searchWrap);
  const results=document.createElement('div');
  results.id='atomxe-left-search-results';
  results.style.cssText='margin-top:8px;display:none;max-height:220px;overflow:auto;';
  left.appendChild(results);
  const blank=document.createElement('div');
  blank.id='atomxe-left-details';
  blank.style.cssText='margin-top:10px;font-size:9px;line-height:1.6;color:rgba(255,255,255,.36);';
  blank.textContent='Select an object in the 3D viewer or search for one. The category you choose opens the matching editor controls in the right panel.';
  left.appendChild(blank);
  search.addEventListener('input',()=>{
    const rows=getSceneObjects(search.value);
    results.innerHTML='';
    if(!search.value.trim()){results.style.display='none';return;}
    results.style.display='block';
    rows.forEach(o=>{
      const b=glassButton(o.name||o.type||'Unnamed object',()=>window.dispatchEvent(new CustomEvent('gameEditorSearchSelect',{detail:{uuid:o.uuid}})),true);
      b.style.width='100%'; b.style.marginBottom='4px'; results.appendChild(b);
    });
  });
  shell.appendChild(left);

  const bottom=document.createElement('section');
  bottom.id='atomxe-editor-bottom-panel';
  bottom.style.cssText='position:absolute;left:30vw;right:30vw;bottom:0;height:25vh;pointer-events:auto;border-top:1px solid rgba(255,255,255,.10);background:rgba(7,10,18,.80);box-shadow:0 -18px 50px rgba(0,0,0,.25);backdrop-filter:blur(28px);padding:10px 14px;box-sizing:border-box;overflow:auto;display:none;color:#fff;';
  bottom.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div><div style="font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.42);">CONTENT BROWSER · WORLD ASSET LIBRARY</div><div style="font-size:8px;color:rgba(255,255,255,.28);margin-top:2px;">Models · animations · montages · effects · PC imports · live scene assets</div></div><div id="atomxe-bottom-status" style="font-size:8px;color:rgba(255,255,255,.30);">Live world</div></div>';
  const toolbar=document.createElement('div'); toolbar.style.cssText='display:flex;gap:7px;margin-top:8px;align-items:center;flex-wrap:wrap;';
  const fileInput=document.createElement('input'); fileInput.type='file'; fileInput.multiple=true; fileInput.accept='.glb,.gltf,.fbx,.obj,.bin'; fileInput.style.display='none';
  fileInput.addEventListener('change',()=>{window.dispatchEvent(new CustomEvent('gameEditorImportFiles',{detail:{files:[...fileInput.files]}}));fileInput.value='';});
  toolbar.appendChild(fileInput);
  toolbar.appendChild(glassButton('IMPORT FROM PC',()=>fileInput.click()));
  ['+ Box','+ Sphere','+ Cylinder'].forEach(label=>{
    toolbar.appendChild(glassButton(label,()=>window.dispatchEvent(new CustomEvent('gameEditorPrimitive',{detail:{type:label.replace('+ ','').toLowerCase()}}))));
  });
  bottom.appendChild(toolbar);
  const sceneAssets=document.createElement('div'); sceneAssets.id='atomxe-bottom-scene-assets'; sceneAssets.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:9px;'; bottom.appendChild(sceneAssets);
  shell.appendChild(bottom);

  document.body.appendChild(shell);
  window.addEventListener('gameEditorObjectSelected',event=>{
    const label=document.getElementById('atomxe-left-selected');
    const kind=document.getElementById('atomxe-left-kind');
    const obj=event.detail?.object;
    if(label) label.textContent=obj?.name||obj?.type||'Selected object';
    if(kind) kind.textContent=`${event.detail?.kind||'object'} · live scene object`;
    const picker=document.getElementById('atomxe-left-tool-select');
    if(picker) picker.style.display='block';
    const details=document.getElementById('atomxe-left-details');
    if(details) details.textContent='Selection is active. Use the category dropdown above or the right-side editor to change transform, physics, effects, damage, stats, equipment, animation, camera, or world settings.';
  });
  window.addEventListener('gameEditorAssetsChanged',event=>refreshBottomAssets(event.detail||[]));
  window.addEventListener('gameEditorSearchSelect',event=>{
    const uuid=event.detail?.uuid; const scene=window.__gw3dScene; const camera=window.__gw3dCamera; const canvas=canvasElement();
    if(!uuid||!scene||!camera||!canvas)return;
    let found=null; scene.traverse(o=>{if(o.uuid===uuid)found=o;});
    if(!found)return;
    const box=new THREE.Box3().setFromObject(found);
    const center=box.getCenter(new THREE.Vector3()).project(camera);
    const r=canvas.getBoundingClientRect();
    const x=r.left+(center.x+1)*0.5*r.width;
    const y=r.top+(1-center.y)*0.5*r.height;
    canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:x,clientY:y,button:0,buttons:1}));
  });
}

function refreshBottomAssets(assetRows=[]){
  const box=document.getElementById('atomxe-bottom-scene-assets'); if(!box)return;
  box.innerHTML='';
  assetRows.slice(0,12).forEach(a=>{
    const b=glassButton(a.name||a.type||'Asset',()=>window.dispatchEvent(new CustomEvent('gameEditorAssetActivate',{detail:{id:a.id}})),true);
    b.draggable=true;
    b.addEventListener('dragstart',e=>e.dataTransfer.setData('application/x-game-editor-asset',a.id));
    b.style.overflow='hidden'; b.style.textOverflow='ellipsis'; b.style.width='100%'; box.appendChild(b);
  });
  const sceneLabel=document.createElement('div'); sceneLabel.style.cssText='grid-column:1/-1;font-size:8px;color:rgba(255,255,255,.28);margin-top:4px;'; sceneLabel.textContent='LIVE WORLD OBJECTS'; box.appendChild(sceneLabel);
  getSceneObjects('').slice(0,12).forEach(o=>{
    const b=glassButton(o.name||o.type||'Unnamed',()=>window.dispatchEvent(new CustomEvent('gameEditorSearchSelect',{detail:{uuid:o.uuid}})),true);
    b.style.overflow='hidden'; b.style.textOverflow='ellipsis'; b.style.width='100%'; box.appendChild(b);
  });
}

function syncShell(){
  if(!shell)return;
  hideLegacyEditLauncher();
  const editorOpen=!!document.querySelector('#atomxe-live-world-editor-root > aside');
  shell.style.display='block';
  const editButton=shell.querySelector(':scope > button');
  const left=document.getElementById('atomxe-editor-left-panel');
  const bottom=document.getElementById('atomxe-editor-bottom-panel');
  if(editButton)editButton.style.display=editorOpen?'none':'block';
  if(left)left.style.display=editorOpen?'block':'none';
  if(bottom)bottom.style.display=editorOpen?'block':'none';
  if(editorOpen)refreshBottomAssets();
}

function editorFlags(){
  const root=document.querySelector('#atomxe-live-world-editor-root');
  if(!root)return { gameplay:false, movement:false };
  const buttons=[...root.querySelectorAll('button')];
  const gameplayButton=buttons.find(b=>/Gameplay\s+(ON|OFF)/i.test(b.textContent||''));
  const movementButton=buttons.find(b=>/Movement\s+(ON|OFF)/i.test(b.textContent||''));
  return {
    gameplay:/Gameplay\s+ON/i.test(gameplayButton?.textContent||''),
    movement:/Movement\s+ON/i.test(movementButton?.textContent||''),
  };
}

function installInteractionGuard(){
  const guard=e=>{
    if(!document.querySelector('#atomxe-live-world-editor-root > aside'))return;
    const insideEditor=e.target?.closest?.('#atomxe-editor-shell, #atomxe-live-world-editor-root');
    if(insideEditor)return;
    const {gameplay,movement}=editorFlags();
    if(gameplay)return;
    if(e.key==='Escape')return;
    const isPointer=['mousedown','mouseup','click','pointerdown','pointerup'].includes(e.type);
    const isKeyboard=['keydown','keyup'].includes(e.type);
    if(isPointer || (isKeyboard && !movement)){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  ['keydown','keyup','mousedown','mouseup','click','pointerdown','pointerup'].forEach(t=>document.addEventListener(t,guard,true));
  return()=>['keydown','keyup','mousedown','mouseup','click','pointerdown','pointerup'].forEach(t=>document.removeEventListener(t,guard,true));
}

function mountEditor(){
  if(root||typeof document==='undefined')return;
  host=document.createElement('div'); host.id='atomxe-live-world-editor-root'; host.style.position='fixed'; host.style.inset='0'; host.style.pointerEvents='none'; host.style.zIndex='120'; document.body.appendChild(host);
  root=createRoot(host); root.render(<GameWorldEditDock onClose={()=>{}}/>); createShell();
  if(!shellObserver){shellObserver=new MutationObserver(syncShell);shellObserver.observe(host,{childList:true,subtree:true});}
  setTimeout(syncShell,0);
}
function unmountEditor(){shellObserver?.disconnect();shellObserver=null;root?.unmount();root=null;host?.remove();host=null;shell?.remove();shell=null;document.getElementById(STYLE_ID)?.remove();}

if(typeof window!=='undefined'){
  const cleanupGuard=installInteractionGuard();
  const sync=()=>{if(window.__gw3dScene)mountEditor();else if(root)unmountEditor();syncShell();};
  poll=window.setInterval(sync,500); sync();
  window.addEventListener('beforeunload',()=>{if(poll)window.clearInterval(poll);cleanupGuard();unmountEditor();},{once:true});
}

export default null;
