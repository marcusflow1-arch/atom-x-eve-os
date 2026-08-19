import React from 'react';
import { createRoot } from 'react-dom/client';
import GameWorldEditDock from './GameWorldEditDock';

let root = null;
let host = null;
let poll = null;

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
}

function unmountEditor() {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
}

if (typeof window !== 'undefined') {
  const sync = () => {
    if (window.__gw3dScene) mountEditor();
    else if (root) unmountEditor();
  };
  poll = window.setInterval(sync, 500);
  sync();
  window.addEventListener('beforeunload', () => {
    if (poll) window.clearInterval(poll);
    unmountEditor();
  }, { once: true });
}

export default null;
