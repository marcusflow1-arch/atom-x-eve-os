import React, { useEffect, useRef, useState } from 'react';
import { UICustomizationControls, UICustomizationProvider } from '@/components/customization/UICustomizationSystem';
import UIMediaCustomization from '@/components/customization/UIMediaCustomization';

const STORAGE_KEY = 'atom_eve_left_rail_visible';

function overlaps(a, b, pad = 6) {
  return !(
    a.right + pad <= b.left
    || a.left >= b.right + pad
    || a.bottom + pad <= b.top
    || a.top >= b.bottom + pad
  );
}

export default function UniversalPageRail({ children, pathname }) {
  const lowerPath = pathname.toLowerCase();
  const isLunaHome = lowerPath.includes('/lunatemplate');
  const midpointRef = useRef(null);
  const collisionHiddenRef = useRef([]);
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; }
    catch { return true; }
  });

  useEffect(() => {
    const handleCollapse = (event) => setVisible(!event.detail);
    window.addEventListener('sidebarCollapseChange', handleCollapse);
    return () => window.removeEventListener('sidebarCollapseChange', handleCollapse);
  }, []);

  useEffect(() => {
    if (isLunaHome) return undefined;
    const hidden = [];
    let frame = 0;

    const hide = (element) => {
      if (!element || element.closest('[data-atom-customization-midpoint="true"]')) return;
      if (hidden.some((entry) => entry.element === element)) return;
      hidden.push({ element, display: element.style.display });
      element.style.display = 'none';
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (lowerPath.includes('/clan')) {
          hide(document.querySelector('button[title="Roster"]'));
        }
        if (lowerPath.includes('/community') || lowerPath.includes('/forum')) {
          hide(document.querySelector('button[title="Forum Quick Menu"]'));
        }
        if (lowerPath.includes('/aura') || lowerPath.includes('/streaminghome') || lowerPath.includes('/discover')) {
          hide(document.querySelector('button[title="Recently Streamed"]'));
        }
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      hidden.forEach(({ element, display }) => {
        if (element?.isConnected) element.style.display = display;
      });
    };
  }, [isLunaHome, lowerPath]);

  // Defensive collision pass: older page-specific rails can still render icon-only
  // controls in the same physical slot. Anything that actually intersects the
  // shared action stack is temporarily hidden rather than allowed to overlap it.
  useEffect(() => {
    if (isLunaHome || !visible) return undefined;
    let frame = 0;

    const restore = () => {
      collisionHiddenRef.current.forEach(({ element, visibility, pointerEvents }) => {
        if (element?.isConnected) {
          element.style.visibility = visibility;
          element.style.pointerEvents = pointerEvents;
        }
      });
      collisionHiddenRef.current = [];
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        restore();
        const stack = midpointRef.current?.querySelector('[data-atom-customization-midpoint="true"]');
        if (!stack) return;
        const stackRect = stack.getBoundingClientRect();
        const candidates = Array.from(document.querySelectorAll('button,[role="button"]'));
        candidates.forEach((element) => {
          if (!element.isConnected || element.closest('[data-atom-customization-midpoint="true"]') || element.closest('[data-ui-editor-ignore="true"]')) return;
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height || !overlaps(rect, stackRect, 8)) return;
          collisionHiddenRef.current.push({
            element,
            visibility: element.style.visibility,
            pointerEvents: element.style.pointerEvents,
          });
          element.style.visibility = 'hidden';
          element.style.pointerEvents = 'none';
        });
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    window.addEventListener('resize', sync);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', sync);
      restore();
    };
  }, [isLunaHome, visible, lowerPath]);

  return (
    <UICustomizationProvider pathname={pathname}>
      {isLunaHome ? children : (
        <div className="flex h-full w-full overflow-hidden bg-black/20">
          {visible && (
            <aside
              data-ui-editor-ignore="true"
              className="relative z-30 mt-16 mb-[53px] flex h-[calc(100%-117px)] w-[5%] min-w-[80px] flex-shrink-0 self-start flex-col overflow-hidden border-r border-white/20 bg-black/20 px-2 py-4 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            >
              <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-2">
                <span className="mb-1 shrink-0 text-center text-[9px] font-bold uppercase leading-3 tracking-wider text-white/50">Recently<br />Played</span>
                <div className="mb-2 h-px w-8 shrink-0 bg-white/20" />
                <div className="flex min-h-0 w-full flex-col items-center gap-1.5 overflow-hidden">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="grid aspect-square w-[clamp(30px,4.5vh,40px)] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                      <span className="text-base font-bold text-white/30">?</span>
                    </div>
                  ))}
                </div>
              </div>

              <div ref={midpointRef} className="relative z-20 flex shrink-0 items-center justify-center py-2">
                <UICustomizationControls className="gap-1.5" />
              </div>

              <div className="h-2 shrink-0" aria-hidden="true" />
            </aside>
          )}
          <div className="universal-page-rail-content relative h-full min-w-0 flex-1 overflow-hidden bg-black/10">{children}</div>
          <UIMediaCustomization />
        </div>
      )}
    </UICustomizationProvider>
  );
}
