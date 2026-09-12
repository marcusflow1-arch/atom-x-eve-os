import React, { useEffect, useRef } from 'react';
import DashboardAvatarFeaturePortal from './DashboardAvatarFeaturePortal';
import { UICustomizationControls } from '@/components/customization/UICustomizationSystem';
import UIMediaCustomization from '@/components/customization/UIMediaCustomization';

function overlaps(a, b, pad = 6) {
  return !(
    a.right + pad <= b.left
    || a.left >= b.right + pad
    || a.bottom + pad <= b.top
    || a.top >= b.bottom + pad
  );
}

export default function LunaLeftRail() {
  const controlsRef = useRef(null);
  const collisionHiddenRef = useRef([]);

  useEffect(() => {
    const hidden = [];
    let frame = 0;

    const hideLegacyWidget = (title) => {
      const placeholder = document.querySelector(`[title="${title}"]`);
      if (!placeholder) return;
      const group = placeholder.closest('.group') || placeholder.parentElement;
      if (!group || hidden.some((entry) => entry.element === group)) return;
      hidden.push({ element: group, display: group.style.display });
      group.style.display = 'none';
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hideLegacyWidget('Top Widget Placeholder');
        hideLegacyWidget('Bottom Widget Placeholder');
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
  }, []);

  useEffect(() => {
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
        const stack = controlsRef.current?.querySelector('[data-atom-customization-midpoint="true"]');
        if (!stack) return;
        const stackRect = stack.getBoundingClientRect();
        Array.from(document.querySelectorAll('button,[role="button"]')).forEach((element) => {
          if (!element.isConnected || element.closest('[data-atom-customization-midpoint="true"]') || element.closest('[data-ui-editor-ignore="true"]')) return;
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height || !overlaps(rect, stackRect, 8)) return;
          collisionHiddenRef.current.push({ element, visibility: element.style.visibility, pointerEvents: element.style.pointerEvents });
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
  }, []);

  return (
    <>
      <aside
        data-ui-editor-ignore="true"
        className="relative z-40 flex h-full w-[5%] min-w-[80px] flex-shrink-0 flex-col overflow-hidden border-r border-white/20 bg-black/20 px-2 py-4 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      >
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-8">
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

        <div ref={controlsRef} className="relative z-20 flex shrink-0 items-center justify-center py-2">
          <UICustomizationControls className="gap-1.5" />
        </div>
        <div className="h-2 shrink-0" aria-hidden="true" />
      </aside>
      <DashboardAvatarFeaturePortal />
      <UIMediaCustomization />
    </>
  );
}
