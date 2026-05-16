import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suppress harmless Three.js WebGL shader warnings that don't affect gameplay
const origError = console.error;
const origWarn = console.warn;
console.error = function(...args) {
  const msg = String(args[0] || '');
  if (msg.includes('trim') || msg.includes('shader') || msg.includes('WebGL')) return;
  origError.apply(console, args);
};
console.warn = function(...args) {
  const msg = String(args[0] || '');
  if (msg.includes('trim') || msg.includes('shader') || msg.includes('WebGL')) return;
  origWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}