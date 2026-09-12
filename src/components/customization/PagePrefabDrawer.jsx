import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

export default function PagePrefabDrawer({ scope, preset, presets, onSelect, onClose }) {
  const [bounds, setBounds] = useState({ top: 64, bottom: 48 });
  useEffect(() => {
    const measure = () => {
      const visible = (selector) => [...document.querySelectorAll(selector)].map(el => el.getBoundingClientRect()).filter(r => r.width && r.height);
      const tops = visible('.glass-page-top-bar,.aura-family-header');
      const bottoms = visible('.glass-page-bottom-bar');
      setBounds({ top: tops.length ? Math.max(...tops.map(r => r.bottom)) : 0, bottom: bottoms.length ? Math.max(...bottoms.map(r => window.innerHeight - r.top)) : 0 });
    };
    const key = (event) => { if (event.key === 'Escape') onClose(); };
    measure();
    const observer = new ResizeObserver(measure);
    document.querySelectorAll('.glass-page-top-bar,.glass-page-bottom-bar,.aura-family-header').forEach(el => observer.observe(el));
    window.addEventListener('resize', measure);
    window.addEventListener('keydown', key);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('keydown', key); };
  }, [onClose]);
  return createPortal(
    <div data-ui-editor-ignore="true" className="page-prefab-overlay" style={bounds}>
      <button type="button" aria-label="Close prefab backdrop" className="page-prefab-backdrop" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Page UI Theme" className="page-prefab-drawer">
        <div className="flex items-start justify-between gap-4">
          <div><p className="page-prefab-muted text-xs uppercase tracking-widest">UI Prefabs · {scope.replace(':', ' / ')}</p><h2 className="mt-2 text-xl font-bold">Page UI Theme</h2></div>
          <button type="button" aria-label="Close UI prefabs" onClick={onClose} className="page-prefab-option rounded-full p-2"><X className="h-4 w-4" /></button>
        </div>
        <p className="page-prefab-muted mt-4 text-sm leading-6">Apply a preset to this page’s background and content panels. Your navigation bars stay unchanged; Layout Edit keeps individual adjustments.</p>
        <div className="mt-6 space-y-3">
          {presets.map(item => <button key={item.id} type="button" aria-pressed={preset.id === item.id} onClick={() => onSelect(item.id)} className="page-prefab-option flex w-full items-center gap-3 rounded-xl p-4 text-left">
            <span className="h-10 w-10 shrink-0 rounded-lg" style={{ backgroundColor: item.pageBackground, backgroundImage: item.ambient, border: `1px solid ${item.border}` }} />
            <span className="flex-1"><strong className="block text-sm">{item.name}</strong><small className="page-prefab-muted mt-1 block text-xs">{item.hint}</small></span>
            {preset.id === item.id && <Sparkles className="h-4 w-4" />}
          </button>)}
        </div>
      </aside>
    </div>, document.body
  );
}