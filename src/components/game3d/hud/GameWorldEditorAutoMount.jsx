import React from 'react';
import { createRoot } from 'react-dom/client';
import GameWorldEditDock from './GameWorldEditDock';

let root = null;
let host = null;
let poll = null;
let shellObserver = null;
let shell = null;

const STYLE_ID = 'atomxe-editor-three-panel-style';

function injectLayoutStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #atomxe-live-world-editor-root > aside {
      right: 0 !important;
      left: auto !important;
      top: 0 !important;
      bottom: 15vh !important;
      width: 15vw !important;
      min-width: 0 !important;
      max-width: none !important;
      border-radius: 0 !important;
    }
    #atomxe-live-world-editor-root > button {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    #atomxe-editor-shell button {
      font: inherit;
    }
  `;
  document.head.appendChild(style);
}

function glassButton(label, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = 'border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:rgba(255,255,255,.72);border-radius:9px;padding:7px 8px;font-size:9px;text-align:left;cursor:pointer;backdrop-filter:blur(18px);';
  button.addEventListener('mouseenter', () => { button.style.background = 'rgba(255,255,255,.08)'; button.style.color = '#fff'; });
  button.addEventListener('mouseleave', () => { button.style.background = 'rgba(255,255,255,.035)'; button.style.color = 'rgba(255,255,255,.72)'; });
  button.addEventListener('click', action);
  return button;
}

function clickEditorControl(label) {
  const buttons = [...document.querySelectorAll('#atomxe-live-world-editor-root aside button')];
  const target = buttons.find(button => button.textContent?.trim().toLowerCase().includes(label.toLowerCase()));
  target?.click();
}

function hideLegacyEditLauncher() {
  const buttons = [...document.querySelectorAll('#atomxe-live-world-editor-root button')];
  buttons.forEach(button => {
    const text = button.textContent?.trim().toLowerCase() || '';
    if (text.includes('edit world')) {
      button.style.setProperty('display', 'none', 'important');
      button.style.setProperty('visibility', 'hidden', 'important');
      button.style.setProperty('pointer-events', 'none', 'important');
      button.setAttribute('aria-hidden', 'true');
    }
  });
}

function openOriginalEdit() {
  const original = document.querySelector('#atomxe-live-world-editor-root > button');
  original?.click();
}

function createShell() {
  if (shell || typeof document === 'undefined') return;
  injectLayoutStyle();

  shell = document.createElement('div');
  shell.id = 'atomxe-editor-shell';
  shell.style.cssText = 'position:fixed;inset:0;z-index:119;pointer-events:none;display:block;';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.textContent = 'EDIT';
  editButton.style.cssText = 'position:absolute;left:50%;top:88px;transform:translateX(-50%);pointer-events:auto;border:1px solid rgba(255,255,255,.16);background:rgba(10,10,14,.62);color:rgba(255,255,255,.92);border-radius:999px;padding:8px 18px;font-size:11px;font-weight:700;letter-spacing:.12em;box-shadow:0 12px 40px rgba(0,0,0,.35);backdrop-filter:blur(22px);cursor:pointer;';
  editButton.addEventListener('click', openOriginalEdit);
  shell.appendChild(editButton);

  const left = document.createElement('section');
  left.id = 'atomxe-editor-left-panel';
  left.style.cssText = 'position:absolute;left:0;top:0;bottom:15vh;width:15vw;pointer-events:auto;overflow:auto;border-right:1px solid rgba(255,255,255,.10);background:rgba(7,10,18,.76);box-shadow:0 24px 60px rgba(0,0,0,.24);backdrop-filter:blur(28px);padding:12px;box-sizing:border-box;display:none;';
  left.innerHTML = '<div style="font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.42);">OBJECT EDITOR</div><div id="atomxe-left-selected" style="margin-top:4px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">No object selected</div><div style="margin-top:6px;font-size:9px;line-height:1.5;color:rgba(255,255,255,.38);">Select anything in the live Three.js world. Its existing editor controls remain on the right.</div>';
  const leftActions = document.createElement('div');
  leftActions.style.cssText = 'display:grid;gap:5px;margin-top:12px;';
  ['Models','Physics','Effects','Damage','Actors','Equipment','Animation','Stats','Camera'].forEach(label => leftActions.appendChild(glassButton(label, () => clickEditorControl(label))));
  left.appendChild(leftActions);
  shell.appendChild(left);

  const bottom = document.createElement('section');
  bottom.id = 'atomxe-editor-bottom-panel';
  bottom.style.cssText = 'position:absolute;left:15vw;right:15vw;bottom:0;height:15vh;pointer-events:auto;border-top:1px solid rgba(255,255,255,.10);background:rgba(7,10,18,.78);box-shadow:0 -18px 50px rgba(0,0,0,.25);backdrop-filter:blur(28px);padding:10px 14px;box-sizing:border-box;overflow:auto;display:none;';
  bottom.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><div style="font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.42);">WORLD ASSET LIBRARY</div><div style="font-size:8px;color:rgba(255,255,255,.28);">PC assets · primitives · drag into the live world</div></div>';
  const bottomActions = document.createElement('div');
  bottomActions.style.cssText = 'display:flex;gap:7px;margin-top:8px;align-items:center;flex-wrap:wrap;';
  bottomActions.appendChild(glassButton('IMPORT FROM PC', () => {
    const input = document.querySelector('#atomxe-live-world-editor-root aside input[type=file]');
    input?.click();
  }));
  ['Box','Sphere','Cylinder'].forEach(label => bottomActions.appendChild(glassButton(`+ ${label}`, () => clickEditorControl(label))));
  bottom.appendChild(bottomActions);
  shell.appendChild(bottom);

  document.body.appendChild(shell);

  window.addEventListener('gameEditorObjectSelected', event => {
    const label = document.getElementById('atomxe-left-selected');
    const object = event.detail?.object;
    if (label) label.textContent = object?.name || object?.type || 'Selected object';
  });
}

function syncShell() {
  if (!shell) return;
  hideLegacyEditLauncher();
  const editorOpen = !!document.querySelector('#atomxe-live-world-editor-root > aside');
  shell.style.display = 'block';
  const editButton = shell.querySelector(':scope > button');
  const left = document.getElementById('atomxe-editor-left-panel');
  const bottom = document.getElementById('atomxe-editor-bottom-panel');
  if (editButton) editButton.style.display = editorOpen ? 'none' : 'block';
  if (left) left.style.display = editorOpen ? 'block' : 'none';
  if (bottom) bottom.style.display = editorOpen ? 'block' : 'none';
}

function mountEditor() {
  if (root || typeof document === 'undefined') return;
  host = document.createElement('div');
  host.id = 'atomxe-live-world-editor-root';
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '120';
  document.body.appendChild(host);
  root = createRoot(host);
  root.render(<GameWorldEditDock onClose={() => {}} />);
  createShell();
  if (!shellObserver) {
    shellObserver = new MutationObserver(syncShell);
    shellObserver.observe(host, { childList: true, subtree: true });
  }
  setTimeout(syncShell, 0);
}

function unmountEditor() {
  shellObserver?.disconnect();
  shellObserver = null;
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
  shell?.remove();
  shell = null;
  document.getElementById(STYLE_ID)?.remove();
}

if (typeof window !== 'undefined') {
  const sync = () => {
    if (window.__gw3dScene) mountEditor();
    else if (root) unmountEditor();
    syncShell();
  };
  poll = window.setInterval(sync, 500);
  sync();
  window.addEventListener('beforeunload', () => {
    if (poll) window.clearInterval(poll);
    unmountEditor();
  }, { once: true });
}

export default null;
