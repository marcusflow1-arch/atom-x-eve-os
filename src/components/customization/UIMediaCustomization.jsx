import React, { useEffect } from 'react';
import { Image, RotateCcw, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useUICustomization } from '@/components/customization/UICustomizationSystem';

const MEDIA_LAYER = 'data-atom-ui-media-layer';
const MEDIA_DEFAULTS = {
  mediaUrl: '',
  mediaOpacity: 0.5,
  mediaScale: 1.08,
  mediaPosition: 'center',
  mediaFit: 'cover',
  mediaMotion: 'depth',
};

const css = `
@keyframes atomMediaDrift {
  0%,100% { transform: translate3d(-1.5%, -1%, 0) scale(var(--atom-media-scale,1.08)); }
  50% { transform: translate3d(1.5%, 1%, 0) scale(calc(var(--atom-media-scale,1.08) + .035)); }
}
@keyframes atomMediaPulse {
  0%,100% { transform: scale(var(--atom-media-scale,1.08)); filter: saturate(1.02) contrast(1.02); }
  50% { transform: scale(calc(var(--atom-media-scale,1.08) + .05)); filter: saturate(1.18) contrast(1.07); }
}
.atom-ui-media-layer {
  position:absolute;
  inset:-4%;
  z-index:0;
  pointer-events:none;
  background-repeat:no-repeat;
  will-change:transform,opacity;
  transition:opacity .22s ease, transform .22s ease;
}
.atom-ui-media-host > :not(.atom-ui-media-layer) { position:relative; z-index:1; }
.atom-ui-media-motion-drift { animation:atomMediaDrift 11s ease-in-out infinite; }
.atom-ui-media-motion-pulse { animation:atomMediaPulse 7s ease-in-out infinite; }
.atom-ui-media-motion-depth { transform:translate3d(var(--atom-media-x,0px),var(--atom-media-y,0px),0) scale(var(--atom-media-scale,1.08)); }
@media (prefers-reduced-motion: reduce) {
  .atom-ui-media-motion-drift,.atom-ui-media-motion-pulse { animation:none; }
  .atom-ui-media-motion-depth { transform:scale(var(--atom-media-scale,1.08)); }
}
`;

function clearLayer(element) {
  const layer = element?.querySelector?.(`:scope > [${MEDIA_LAYER}]`);
  if (layer) layer.remove();
  element?.classList?.remove('atom-ui-media-host');
  if (element?.dataset?.atomMediaPositionOwned === 'true') {
    element.style.position = '';
    delete element.dataset.atomMediaPositionOwned;
  }
}

function applyMedia(element, rawSetting) {
  if (!element) return;
  const setting = { ...MEDIA_DEFAULTS, ...(rawSetting || {}) };
  const url = String(setting.mediaUrl || '').trim();
  if (!url) {
    clearLayer(element);
    return;
  }

  const computed = window.getComputedStyle(element);
  if (computed.position === 'static') {
    element.style.position = 'relative';
    element.dataset.atomMediaPositionOwned = 'true';
  }
  element.classList.add('atom-ui-media-host');
  element.style.overflow = 'hidden';

  let layer = element.querySelector(`:scope > [${MEDIA_LAYER}]`);
  if (!layer) {
    layer = document.createElement('span');
    layer.setAttribute(MEDIA_LAYER, 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.className = 'atom-ui-media-layer';
    element.prepend(layer);
  }

  layer.className = `atom-ui-media-layer atom-ui-media-motion-${setting.mediaMotion || 'depth'}`;
  layer.style.backgroundImage = `linear-gradient(rgba(4,8,14,.12), rgba(4,8,14,.34)), url("${url.replace(/"/g, '%22')}")`;
  layer.style.backgroundSize = setting.mediaFit === 'contain' ? 'contain' : 'cover';
  layer.style.backgroundPosition = setting.mediaPosition || 'center';
  layer.style.opacity = String(Number(setting.mediaOpacity ?? .5));
  layer.style.setProperty('--atom-media-scale', String(Number(setting.mediaScale ?? 1.08)));
}

export default function UIMediaCustomization() {
  const { selected, config, updateElement } = useUICustomization();
  const setting = selected?.key
    ? { ...MEDIA_DEFAULTS, ...(config.elementSettings?.[selected.key] || {}) }
    : MEDIA_DEFAULTS;

  useEffect(() => {
    const root = document.querySelector('.atom-ui-customization-root');
    if (!root) return undefined;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.querySelectorAll('[data-ui-editable-runtime]').forEach((element) => {
          const key = element.dataset.uiEditableRuntime;
          applyMedia(element, config.elementSettings?.[key]);
        });
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [config.elementSettings]);

  useEffect(() => {
    const root = document.querySelector('.atom-ui-customization-root');
    if (!root) return undefined;
    const onMove = (event) => {
      const host = event.target.closest?.('.atom-ui-media-host');
      if (!host || !root.contains(host)) return;
      const key = host.dataset.uiEditableRuntime;
      const item = config.elementSettings?.[key];
      if (!item?.mediaUrl || (item.mediaMotion || 'depth') !== 'depth') return;
      const rect = host.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - .5) * 10;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - .5) * 10;
      const layer = host.querySelector(`:scope > [${MEDIA_LAYER}]`);
      if (layer) {
        layer.style.setProperty('--atom-media-x', `${x}px`);
        layer.style.setProperty('--atom-media-y', `${y}px`);
      }
    };
    const onLeave = (event) => {
      const host = event.target.closest?.('.atom-ui-media-host');
      const layer = host?.querySelector?.(`:scope > [${MEDIA_LAYER}]`);
      if (layer) {
        layer.style.setProperty('--atom-media-x', '0px');
        layer.style.setProperty('--atom-media-y', '0px');
      }
    };
    root.addEventListener('pointermove', onMove, true);
    root.addEventListener('pointerleave', onLeave, true);
    return () => {
      root.removeEventListener('pointermove', onMove, true);
      root.removeEventListener('pointerleave', onLeave, true);
    };
  }, [config.elementSettings]);

  if (!selected) return <style>{css}</style>;

  const panel = (
    <>
      <style>{css}</style>
      <div data-ui-editor-ignore="true" className="fixed inset-0 z-[299] pointer-events-none">
        <aside className="pointer-events-auto absolute bottom-5 left-[96px] w-[min(330px,calc(100vw-120px))] rounded-[24px] bg-[#11161d]/95 p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-3xl">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-cyan-200"><Image className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.18em] text-white/35"><Sparkles className="h-3 w-3" /> Media / 3D backdrop</div>
              <p className="mt-1 text-[10px] leading-4 text-white/40">Put artwork, an animated GIF/WebP, or a depth-style image inside this button, card, or full panel.</p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-[8px] font-black uppercase tracking-[.16em] text-white/35">Image / animation URL</span>
            <input
              type="url"
              value={setting.mediaUrl}
              onChange={(event) => updateElement({ mediaUrl: event.target.value })}
              placeholder="https://.../artwork.webp"
              className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-[10px] text-white/80 outline-none placeholder:text-white/20 focus:border-cyan-300/35"
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">Motion
              <select value={setting.mediaMotion} onChange={(event) => updateElement({ mediaMotion: event.target.value })} className="mt-1.5 h-9 w-full rounded-xl border border-white/10 bg-[#171d25] px-2 text-[10px] normal-case text-white/75 outline-none">
                <option value="depth">3D depth</option><option value="drift">Cinematic drift</option><option value="pulse">Animated pulse</option><option value="none">Still</option>
              </select>
            </label>
            <label className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">Fit
              <select value={setting.mediaFit} onChange={(event) => updateElement({ mediaFit: event.target.value })} className="mt-1.5 h-9 w-full rounded-xl border border-white/10 bg-[#171d25] px-2 text-[10px] normal-case text-white/75 outline-none">
                <option value="cover">Fill box</option><option value="contain">Show full image</option>
              </select>
            </label>
          </div>

          <label className="mt-3 block text-[8px] font-black uppercase tracking-[.14em] text-white/35">Artwork opacity <span className="float-right text-white/55">{Math.round(setting.mediaOpacity * 100)}%</span>
            <input className="mt-2 w-full accent-white" type="range" min="0.08" max="1" step="0.01" value={setting.mediaOpacity} onChange={(event) => updateElement({ mediaOpacity: Number(event.target.value) })} />
          </label>
          <label className="mt-3 block text-[8px] font-black uppercase tracking-[.14em] text-white/35">Depth / zoom <span className="float-right text-white/55">{Number(setting.mediaScale).toFixed(2)}×</span>
            <input className="mt-2 w-full accent-white" type="range" min="1" max="1.35" step="0.01" value={setting.mediaScale} onChange={(event) => updateElement({ mediaScale: Number(event.target.value) })} />
          </label>

          <button type="button" onClick={() => updateElement({ mediaUrl: '' })} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] text-[8px] font-black uppercase tracking-[.14em] text-white/45 hover:bg-white/[0.08] hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" /> Remove artwork
          </button>
        </aside>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(panel, document.body) : panel;
}
