import React from 'react';
import { createRoot } from 'react-dom/client';
import GameWorldEditDock from './GameWorldEditDock';

let root = null;
let host = null;

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

if (typeof window !== 'undefined') {
  const start = () => mountEditor();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else setTimeout(start, 0);
  window.addEventListener('beforeunload', () => {
    root?.unmount();
    root = null;
    host?.remove();
    host = null;
  }, { once: true });
}

export default null;
